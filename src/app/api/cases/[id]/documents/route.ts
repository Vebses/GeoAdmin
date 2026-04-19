import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSignedFileUrls, extractStoragePath } from '@/lib/storage-urls';
import { canAccessCase } from '@/lib/case-access';
import { verifyFileMagicBytes, isUuid } from '@/lib/file-validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cases/[id]/documents - Get all documents for a case
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: caseId } = await params;

    if (!isUuid(caseId)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'არასწორი ქეისის ID' } },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Enforce case ownership — not just "case exists"
    const allowed = await canAccessCase(supabase, user.id, caseId);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'ქეისი ვერ მოიძებნა ან არ გაქვთ წვდომა' } },
        { status: 404 } // Use 404 (not 403) to avoid leaking existence
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

    // Replace stored path/URL with a short-lived signed URL for each document
    const docs = (data || []) as Array<{ file_url: string | null }>;
    const paths = docs.map(d => d.file_url);
    const signedMap = await getSignedFileUrls(supabase, paths);

    const withSignedUrls = docs.map(d => ({
      ...d,
      file_url: signedMap.get(extractStoragePath(d.file_url) || '') || d.file_url,
    }));

    return NextResponse.json({
      success: true,
      data: withSignedUrls,
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

    if (!isUuid(caseId)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'არასწორი ქეისის ID' } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Enforce case ownership
    const allowed = await canAccessCase(supabase, user.id, caseId);
    if (!allowed) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'ქეისი ვერ მოიძებნა ან არ გაქვთ წვდომა' } },
        { status: 404 }
      );
    }

    // Fetch current doc count for the counter update
    const { data: caseData } = await supabase
      .from('cases')
      .select('id, documents_count')
      .eq('id', caseId)
      .is('deleted_at', null)
      .single();

    if (!caseData) {
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

    // Validate file type — only allow safe document and image types
    const ALLOWED_MIME_TYPES = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'image/webp',
      'text/plain',
    ];
    const ALLOWED_EXTENSIONS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'webp', 'txt'];

    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ფაილის ტიპი დაუშვებელია. დაშვებულია: PDF, Word, Excel, სურათები' } },
        { status: 400 }
      );
    }
    if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ფაილის გაფართოება დაუშვებელია' } },
        { status: 400 }
      );
    }

    // Verify magic bytes match the declared MIME type (defeats Content-Type spoofing)
    const magicBytesValid = await verifyFileMagicBytes(file, file.type);
    if (!magicBytesValid) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ფაილის შიგთავსი არ ემთხვევა ტიპს (შესაძლო ყალბი ფაილი)' } },
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

    // Store the storage path only — signed URLs are generated at read time.
    // Bucket is private; we never expose a permanent public URL for patient documents.
    const insertData = {
      case_id: caseId,
      type,
      file_name: file.name,
      file_url: uniqueName,     // path within bucket, e.g. "{caseId}/{type}/{ts}_{name}.{ext}"
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

    // Return the newly-created document with a signed URL instead of the raw path
    const signedMap = await getSignedFileUrls(supabase, [uniqueName]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const docWithSignedUrl = {
      ...(newDocument as any),
      file_url: signedMap.get(uniqueName) || uniqueName,
    };

    return NextResponse.json({
      success: true,
      data: docWithSignedUrl,
    }, { status: 201 });
  } catch (error) {
    console.error('Case documents POST error:', error);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'SERVER_ERROR',
          message: 'სერვერის შეცდომა',
        }
      },
      { status: 500 }
    );
  }
}
