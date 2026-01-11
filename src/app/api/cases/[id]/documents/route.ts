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

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const timestamp = Date.now();
    const uniqueName = `${caseId}/${type}/${timestamp}_${file.name}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('geoadmin-files')
      .upload(uniqueName, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: { code: 'UPLOAD_ERROR', message: 'ფაილის ატვირთვა ვერ მოხერხდა' } },
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
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
