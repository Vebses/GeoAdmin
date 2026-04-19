import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import { hashToken, timingSafeEqualHex, randomResponseDelay } from '@/lib/token-utils';
import { revokeAllUserSessions } from '@/lib/sessions';

// Create admin client for password update
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json(
        { error: 'ტოკენი და პაროლი აუცილებელია' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'პაროლი უნდა იყოს მინიმუმ 8 სიმბოლო' },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();
    const tokenHash = hashToken(token);

    // Find user with this token — we still need DB lookup, but then verify
    // the hash in constant time and always equalize response times.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error: findError } = await (supabase
      .from('users') as any)
      .select('id, email, reset_token, reset_token_expires_at')
      .eq('reset_token', tokenHash)
      .single();

    const userFound = !findError && !!user;
    const hashMatches = userFound && timingSafeEqualHex(user.reset_token || '', tokenHash);
    const notExpired = userFound && new Date(user.reset_token_expires_at) >= new Date();

    if (!userFound || !hashMatches || !notExpired) {
      // Equalize response time with the success path to prevent timing enumeration
      await randomResponseDelay();
      return NextResponse.json(
        { error: 'არასწორი ან ვადაგასული ბმული' },
        { status: 400 }
      );
    }

    // Update password using admin client
    const adminClient = getAdminClient();
    
    // First, find the auth user by email
    const { data: authUsers, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error('List users error:', listError);
      return NextResponse.json(
        { error: 'პაროლის შეცვლა ვერ მოხერხდა' },
        { status: 500 }
      );
    }

    const authUser = authUsers.users.find(u => u.email === user.email);
    
    if (!authUser) {
      return NextResponse.json(
        { error: 'მომხმარებელი ვერ მოიძებნა' },
        { status: 404 }
      );
    }

    // Update the password
    const { error: updateError } = await adminClient.auth.admin.updateUserById(
      authUser.id,
      { password }
    );

    if (updateError) {
      console.error('Update password error:', updateError);
      return NextResponse.json(
        { error: 'პაროლის შეცვლა ვერ მოხერხდა' },
        { status: 500 }
      );
    }

    // Clear the reset token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase
      .from('users') as any)
      .update({
        reset_token: null,
        reset_token_expires_at: null,
      })
      .eq('id', user.id);

    // Force logout of all existing sessions — password change should invalidate everywhere
    await revokeAllUserSessions(supabase, user.id).catch(err =>
      console.error('Session revoke after reset failed:', err)
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'პაროლის შეცვლა ვერ მოხერხდა' },
      { status: 500 }
    );
  }
}
