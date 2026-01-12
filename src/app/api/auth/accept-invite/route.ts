import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { notifyUserRegistered } from '@/lib/notifications';
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

    let invitation: { id: string; email: string; role: string; expires_at: string; accepted_at?: string | null } | null = null;
    let isOldFormat = false;

    // FIRST: Try to find invitation in NEW user_invitations table
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newInvitation, error: newError } = await (supabase
        .from('user_invitations') as any)
        .select('id, email, role, expires_at, accepted_at')
        .eq('invitation_token', tokenHash)
        .single();

      if (!newError && newInvitation) {
        invitation = newInvitation;
      }
    } catch (e) {
      // Table might not exist, continue to old format
      console.log('user_invitations table not found, trying old format');
    }

    // SECOND: If not found, try OLD format in users table
    if (!invitation) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: oldInvitation, error: oldError } = await (supabase
        .from('users') as any)
        .select('id, email, role, invitation_expires_at, invitation_token')
        .eq('invitation_token', tokenHash)
        .single();

      if (!oldError && oldInvitation && oldInvitation.invitation_token) {
        invitation = {
          id: oldInvitation.id,
          email: oldInvitation.email,
          role: oldInvitation.role,
          expires_at: oldInvitation.invitation_expires_at,
          accepted_at: null, // Old format doesn't track this
        };
        isOldFormat = true;
      }
    }

    if (!invitation) {
      return NextResponse.json(
        { success: false, error: { code: 'INVALID_TOKEN', message: 'არასწორი ან ვადაგასული მოწვევა' } },
        { status: 400 }
      );
    }

    // Check if already accepted (new format only)
    if (invitation.accepted_at) {
      return NextResponse.json(
        { success: false, error: { code: 'ALREADY_ACCEPTED', message: 'მოწვევა უკვე გამოყენებულია' } },
        { status: 400 }
      );
    }

    // Check if invitation has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
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

    if (isOldFormat) {
      // OLD FORMAT: 
      // 1. The auth user creation trigger already created a new users record with the auth user's ID
      // 2. We need to DELETE the old pending invitation record (the one with invitation_token)
      // 3. And UPDATE the new user record with full_name and role
      
      // First, update the new user record created by trigger
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase
        .from('users') as any)
        .update({
          full_name,
          role: invitation.role,
        })
        .eq('id', authData.user.id);
      
      // Then, delete the old pending invitation record
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase
        .from('users') as any)
        .delete()
        .eq('id', invitation.id);
    } else {
      // NEW FORMAT: Update user record created by trigger with role
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
    }

    // NOTIFY MANAGERS that a new user has registered
    try {
      await notifyUserRegistered(
        authData.user.id,
        full_name,
        invitation.role
      );
    } catch (e) {
      console.error('Failed to notify managers:', e);
    }

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

    let invitation: { email: string; role: string; expires_at?: string; accepted_at?: string | null } | null = null;

    // FIRST: Try to find invitation in NEW user_invitations table
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newInvitation } = await (supabase
        .from('user_invitations') as any)
        .select('email, role, expires_at, accepted_at')
        .eq('invitation_token', tokenHash)
        .single();

      if (newInvitation) {
        invitation = newInvitation;
      }
    } catch (e) {
      // Table might not exist, continue to old format
    }

    // SECOND: If not found, try OLD format in users table
    if (!invitation) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: oldInvitation } = await (supabase
        .from('users') as any)
        .select('email, role, invitation_expires_at, invitation_token')
        .eq('invitation_token', tokenHash)
        .single();

      if (oldInvitation && oldInvitation.invitation_token) {
        invitation = {
          email: oldInvitation.email,
          role: oldInvitation.role,
          expires_at: oldInvitation.invitation_expires_at,
          accepted_at: null,
        };
      }
    }

    if (!invitation) {
      return NextResponse.json({ valid: false, email: null, role: null });
    }

    // Check if already accepted
    if (invitation.accepted_at) {
      return NextResponse.json({ valid: false, email: null, role: null });
    }

    // Check if token has expired
    if (invitation.expires_at && new Date(invitation.expires_at) < new Date()) {
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
