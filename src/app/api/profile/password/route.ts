import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/profile/password - Change password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { current_password, new_password } = body;

    // Validate input
    if (!current_password || !new_password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'Both passwords are required' } },
        { status: 400 }
      );
    }

    // Validate new password strength
    if (new_password.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 8 characters' } },
        { status: 400 }
      );
    }

    if (!/[A-Z]/.test(new_password)) {
      return NextResponse.json(
        { success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must contain uppercase letter' } },
        { status: 400 }
      );
    }

    if (!/[a-z]/.test(new_password)) {
      return NextResponse.json(
        { success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must contain lowercase letter' } },
        { status: 400 }
      );
    }

    if (!/[0-9]/.test(new_password)) {
      return NextResponse.json(
        { success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must contain a number' } },
        { status: 400 }
      );
    }

    if (current_password === new_password) {
      return NextResponse.json(
        { success: false, error: { code: 'SAME_PASSWORD', message: 'New password must be different' } },
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

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: current_password,
    });

    if (signInError) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' } },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: new_password,
    });

    if (updateError) {
      console.error('Password update error:', updateError);
      return NextResponse.json(
        { success: false, error: { code: 'UPDATE_FAILED', message: 'Failed to update password' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Failed to change password' } },
      { status: 500 }
    );
  }
}
