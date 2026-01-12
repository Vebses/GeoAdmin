import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

// Create admin client for user creation
function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Supabase admin credentials not configured');
  }
  
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// POST - Accept invitation and create account
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, full_name, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ტოკენი და პაროლი აუცილებელია' } },
        { status: 400 }
      );
    }

    if (!full_name) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'სახელი აუცილებელია' } },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო' } },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this invitation token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: pendingUser, error: findError } = await (supabase
      .from('users') as any)
      .select('id, email, role, invitation_expires_at')
      .eq('invitation_token', tokenHash)
      .single();

    if (findError || !pendingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'არასწორი ან ვადაგასული მოწვევა' } },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (new Date(pendingUser.invitation_expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'EXPIRED_TOKEN', message: 'მოწვევის ვადა ამოიწურა' } },
        { status: 400 }
      );
    }

    // Create auth user using admin client
    const adminClient = getAdminClient();
    
    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: pendingUser.email,
      password,
      email_confirm: true, // Auto-confirm email since they got the invite
      user_metadata: {
        full_name,
      },
    });

    if (createAuthError) {
      console.error('Create auth user error:', createAuthError);
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_ERROR', message: 'ანგარიშის შექმნა ვერ მოხერხდა' } },
        { status: 500 }
      );
    }

    // Update the user record with the auth user id and clear invitation token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase
      .from('users') as any)
      .update({
        id: authData.user.id,
        full_name,
        invitation_token: null,
        invitation_sent_at: null,
        invitation_expires_at: null,
        invitation_accepted_at: new Date().toISOString(),
      })
      .eq('id', pendingUser.id);

    if (updateError) {
      console.error('Update user error:', updateError);
      // The auth user was created, so we should still return success
    }

    return NextResponse.json({
      success: true,
      data: {
        email: pendingUser.email,
      },
    });
  } catch (error) {
    console.error('Accept invite error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'ანგარიშის შექმნა ვერ მოხერხდა' } },
      { status: 500 }
    );
  }
}

// GET - Validate invitation token
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false, email: null, role: null });
    }

    const supabase = await createServerClient();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase
      .from('users') as any)
      .select('email, role, invitation_expires_at')
      .eq('invitation_token', tokenHash)
      .single();

    if (!user) {
      return NextResponse.json({ valid: false, email: null, role: null });
    }

    // Check if token has expired
    if (new Date(user.invitation_expires_at) < new Date()) {
      return NextResponse.json({ valid: false, email: null, role: null });
    }

    return NextResponse.json({ 
      valid: true, 
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    console.error('Validate invite token error:', error);
    return NextResponse.json({ valid: false, email: null, role: null });
  }
}
