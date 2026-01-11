import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string; docId: string }>;
}

// GET /api/cases/[id]/documents/[docId] - Get single document
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: caseId, docId } = await params;
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    const { data, error } = await supabase
      .from('case_documents')
      .select(`
        *,
        uploader:users!case_documents_uploaded_by_fkey(id, full_name)
      `)
      .eq('id', docId)
      .eq('case_id', caseId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'დოკუმენტი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Case document GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}

// DELETE /api/cases/[id]/documents/[docId] - Delete document
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: caseId, docId } = await params;
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Get document to get file_url for storage deletion
    const { data: document, error: findError } = await supabase
      .from('case_documents')
      .select('id, file_url, case_id')
      .eq('id', docId)
      .eq('case_id', caseId)
      .single();

    if (findError || !document) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'დოკუმენტი ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Get case for document count update
    const { data: caseData } = await supabase
      .from('cases')
      .select('documents_count')
      .eq('id', caseId)
      .single();

    // Delete from storage
    try {
      const fileUrl = (document as any).file_url;
      const urlParts = fileUrl.split('/geoadmin-files/');
      if (urlParts[1]) {
        await supabase.storage
          .from('geoadmin-files')
          .remove([urlParts[1]]);
      }
    } catch (storageError) {
      console.error('Storage delete error:', storageError);
      // Continue with database deletion even if storage fails
    }

    // Delete document record
    const { error } = await supabase
      .from('case_documents')
      .delete()
      .eq('id', docId);

    if (error) throw error;

    // Update case document count
    await (supabase.from('cases') as any)
      .update({ 
        documents_count: Math.max(((caseData as any)?.documents_count || 1) - 1, 0),
        updated_at: new Date().toISOString() 
      })
      .eq('id', caseId);

    return NextResponse.json({
      success: true,
      message: 'დოკუმენტი წაიშალა',
    });
  } catch (error) {
    console.error('Case document DELETE error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
