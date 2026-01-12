import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/profile/avatar - Upload avatar
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: { code: 'NO_FILE', message: 'No file uploaded' } },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TYPE', message: 'Invalid file type. Use JPEG, PNG, or WebP' } },
        { status: 400 }
      );
    }

    // Validate file size (2MB max)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: { code: 'FILE_TOO_LARGE', message: 'File too large. Max 2MB' } },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg';
    const fileName = `${user.id}.${ext}`;
    const filePath = `avatars/${fileName}`;

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Delete old avatar if exists
    await supabase.storage.from('avatars').remove([filePath]);

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return NextResponse.json(
        { success: false, error: { code: 'UPLOAD_FAILED', message: 'Failed to upload avatar' } },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    const avatarUrl = urlData.publicUrl;

    // Update user profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error: updateError } = await (supabase
      .from('users') as any)
      .update({ avatar_url: avatarUrl })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update profile' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: { avatar_url: avatarUrl, user: updated } });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to upload avatar' } },
      { status: 500 }
    );
  }
}

// DELETE /api/profile/avatar - Remove avatar
export async function DELETE() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Get current avatar path
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (supabase
      .from('users') as any)
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (profile?.avatar_url) {
      // Extract filename from URL
      const urlParts = profile.avatar_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = `avatars/${fileName}`;

      // Delete from storage
      await supabase.storage.from('avatars').remove([filePath]);
    }

    // Update user profile
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase
      .from('users') as any)
      .update({ avatar_url: null })
      .eq('id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Profile update error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update profile' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to delete avatar' } },
      { status: 500 }
    );
  }
}
