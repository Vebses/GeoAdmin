import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    return NextResponse.json({ success: true, data: profile });
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
    const { full_name, phone, preferences } = body;

    if (full_name !== undefined && (typeof full_name !== 'string' || full_name.length < 2)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Name must be at least 2 characters' } },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (full_name !== undefined) updateData.full_name = full_name;
    if (phone !== undefined) updateData.phone = phone;
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
