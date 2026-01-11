import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cases/[id]/documents - Get all documents for a case
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: caseId } = await params;
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Check if case exists
    const { data: caseExists, error: caseError } = await supabase
      .from('cases')
      .select('id')
      .eq('id', caseId)
      .is('deleted_at', null)
      .single();

    if (caseError || !caseExists) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ქეისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Optional type filter
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    // Get documents
    let query = supabase
      .from('case_documents')
      .select(`
        *,
        uploader:users!case_documents_uploaded_by_fkey(id, full_name)
      `)
      .eq('case_id', caseId)
      .order('created_at', { ascending: false });

    if (type && ['patient', 'original', 'medical'].includes(type)) {
      query = query.eq('type', type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Case documents GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

// POST /api/cases/[id]/documents - Upload a document
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: caseId } = await params;
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Check if case exists
    const { data: caseData, error: caseError } = await supabase
      .from('cases')
      .select('id, documents_count')
      .eq('id', caseId)
      .is('deleted_at', null)
      .single();

    if (caseError || !caseData) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'ქეისი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Handle file upload
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ფაილი აუცილებელია' } },
        { status: 400 }
      );
    }

    if (!type || !['patient', 'original', 'medical'].includes(type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ტიპი აუცილებელია (patient, original, medical)' } },
        { status: 400 }
      );
    }

    // Check file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ფაილი ძალიან დიდია (მაქს. 10MB)' } },
        { status: 400 }
      );
    }

    // Generate unique filename - sanitize to remove non-ASCII characters
    const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const timestamp = Date.now();
    // Get base name without extension
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    // Sanitize: replace ALL non-ASCII chars (including Georgian), keep only alphanumeric and -_
    const sanitizedName = baseName
      .normalize('NFD') // Normalize unicode
      .replace(/[\u0080-\uFFFF]/g, '') // Remove all non-ASCII characters
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Keep only safe characters
      .replace(/_+/g, '_') // Collapse multiple underscores
      .replace(/^_|_$/g, '') // Trim leading/trailing underscores
      .substring(0, 50) || 'file'; // Limit length, default to 'file' if empty
    const uniqueName = `${caseId}/${type}/${timestamp}_${sanitizedName}.${ext}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('geoadmin-files')
      .upload(uniqueName, fileBuffer, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error details:', {
        error: uploadError,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        path: uniqueName
      });
      return NextResponse.json(
        { 
          success: false, 
          error: { 
            code: 'UPLOAD_ERROR', 
            message: `ფაილის ატვირთვა ვერ მოხერხდა: ${uploadError.message}` 
          } 
        },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('geoadmin-files')
      .getPublicUrl(uniqueName);

    // Create document record
    const insertData = {
      case_id: caseId,
      type,
      file_name: file.name,
      file_url: urlData.publicUrl,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: user.id,
    };

    const { data: newDocument, error } = await supabase
      .from('case_documents')
      .insert(insertData as any)
      .select(`
        *,
        uploader:users!case_documents_uploaded_by_fkey(id, full_name)
      `)
      .single();

    if (error) throw error;

    // Update case document count
    await (supabase.from('cases') as any)
      .update({ 
        documents_count: (caseData as any).documents_count + 1,
        updated_at: new Date().toISOString() 
      })
      .eq('id', caseId);

    return NextResponse.json({
      success: true,
      data: newDocument,
    }, { status: 201 });
  } catch (error) {
    console.error('Case documents POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'SERVER_ERROR', 
          message: `სერვერის შეცდომა: ${errorMessage}` 
        } 
      },
      { status: 500 }
    );
  }
}
