import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripSensitiveUserFields } from '@/lib/utils/query-guards';

// GET /api/profile - Get current user profile
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Get user profile from users table
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile, error } = await (supabase
      .from('users') as any)
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Profile fetch error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Profile not found' } },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: stripSensitiveUserFields(profile) });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch profile' } },
      { status: 500 }
    );
  }
}

// PUT /api/profile - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = await createClient();
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Validate input
    const { full_name, phone, job_title, email_signature, preferences } = body;

    if (full_name !== undefined && (typeof full_name !== 'string' || full_name.length < 2)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name must be at least 2 characters' } },
        { status: 400 }
      );
    }

    if (job_title !== undefined && job_title !== null && (typeof job_title !== 'string' || job_title.length > 100)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Job title must be 100 characters or fewer' } },
        { status: 400 }
      );
    }

    if (email_signature !== undefined && email_signature !== null && (typeof email_signature !== 'string' || email_signature.length > 2000)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Signature must be 2000 characters or fewer' } },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};

    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
    // Normalise blank strings to NULL so an empty signature/title falls back to
    // the auto-composed default rather than persisting an empty override.
    if (job_title !== undefined) updateData.job_title = (typeof job_title === 'string' && job_title.trim() === '') ? null : job_title;
    if (email_signature !== undefined) updateData.email_signature = (typeof email_signature === 'string' && email_signature.trim() === '') ? null : email_signature;
    if (preferences !== undefined) updateData.preferences = preferences;

    // Update user
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: updated, error } = await (supabase
      .from('users') as any)
      .update(updateData)
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
    console.error('Profile PUT error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to update profile' } },
      { status: 500 }
    );
  }
}
