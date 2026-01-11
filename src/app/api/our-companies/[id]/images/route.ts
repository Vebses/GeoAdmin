import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/our-companies/[id]/images - Upload company image (logo, signature, stamp)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Check if company exists
    const { data: company, error: companyError } = await supabase
      .from('our_companies')
      .select('id, name')
      .eq('id', companyId)
      .is('deleted_at', null)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'კომპანია ვერ მოიძებნა' } },
        { status: 404 }
      );
    }

    // Handle file upload
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const imageType = formData.get('type') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ფაილი აუცილებელია' } },
        { status: 400 }
      );
    }

    if (!imageType || !['logo', 'signature', 'stamp'].includes(imageType)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ტიპი აუცილებელია (logo, signature, stamp)' } },
        { status: 400 }
      );
    }

    // Check file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'მხოლოდ PNG, JPG, WebP და SVG ფაილები' } },
        { status: 400 }
      );
    }

    // Check file size (2MB max for images)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ფაილი ძალიან დიდია (მაქს. 2MB)' } },
        { status: 400 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const timestamp = Date.now();
    const uniqueName = `companies/${companyId}/${imageType}_${timestamp}.${ext}`;

    // Upload to Supabase Storage
    const fileBuffer = await file.arrayBuffer();
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('geoadmin-files')
      .upload(uniqueName, fileBuffer, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: { code: 'UPLOAD_ERROR', message: `ფაილის ატვირთვა ვერ მოხერხდა: ${uploadError.message}` } },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('geoadmin-files')
      .getPublicUrl(uniqueName);

    // Update company with new image URL
    const updateField = `${imageType}_url`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('our_companies') as any)
      .update({ 
        [updateField]: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_ERROR', message: 'კომპანიის განახლება ვერ მოხერხდა' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        url: urlData.publicUrl,
        type: imageType,
      },
    });
  } catch (error) {
    console.error('Company images POST error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: `სერვერის შეცდომა: ${errorMessage}` } },
      { status: 500 }
    );
  }
}

// DELETE /api/our-companies/[id]/images - Delete company image
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: companyId } = await params;
    const supabase = await createClient();
    
    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Get image type from query
    const { searchParams } = new URL(request.url);
    const imageType = searchParams.get('type');

    if (!imageType || !['logo', 'signature', 'stamp'].includes(imageType)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ტიპი აუცილებელია (logo, signature, stamp)' } },
        { status: 400 }
      );
    }

    // Update company to remove image URL
    const updateField = `${imageType}_url`;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase.from('our_companies') as any)
      .update({ 
        [updateField]: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', companyId);

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_ERROR', message: 'წაშლა ვერ მოხერხდა' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { type: imageType },
    });
  } catch (error) {
    console.error('Company images DELETE error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
