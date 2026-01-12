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

    // Find invitation with this token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitation, error: findError } = await (supabase
      .from('user_invitations') as any)
      .select('id, email, role, expires_at, accepted_at')
      .eq('invitation_token', tokenHash)
      .single();

    if (findError || !invitation) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'არასწორი ან ვადაგასული მოწვევა' } },
        { status: 400 }
      );
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_ACCEPTED', message: 'მოწვევა უკვე გამოყენებულია' } },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: { code: 'EXPIRED_TOKEN', message: 'მოწვევის ვადა ამოიწურა' } },
        { status: 400 }
      );
    }

    // Create auth user using admin client
    const adminClient = getAdminClient();
    
    const { data: authData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: invitation.email,
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

    // The user record should be auto-created by the trigger, but let's update it with the role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase
      .from('users') as any)
      .update({
        full_name,
        role: invitation.role,
      })
      .eq('id', authData.user.id);

    // Mark invitation as accepted
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase
      .from('user_invitations') as any)
      .update({
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    return NextResponse.json({
      success: true,
      data: {
        email: invitation.email,
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

    // Find invitation with this token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitation } = await (supabase
      .from('user_invitations') as any)
      .select('email, role, expires_at, accepted_at')
      .eq('invitation_token', tokenHash)
      .single();

    if (!invitation) {
      return NextResponse.json({ valid: false, email: null, role: null });
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json({ valid: false, email: null, role: null });
    }

    // Check if token has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, email: null, role: null });
    }

    return NextResponse.json({ 
      valid: true, 
      email: invitation.email,
      role: invitation.role,
    });
  } catch (error) {
    console.error('Validate invite token error:', error);
    return NextResponse.json({ valid: false, email: null, role: null });
  }
}
