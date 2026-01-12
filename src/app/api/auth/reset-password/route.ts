import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';
import crypto from 'crypto';

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
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user, error: findError } = await (supabase
      .from('users') as any)
      .select('id, email, reset_token_expires_at')
      .eq('reset_token', tokenHash)
      .single();

    if (findError || !user) {
      return NextResponse.json(
        { error: 'არასწორი ან ვადაგასული ბმული' },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date(user.reset_token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'ბმულის ვადა ამოიწურა' },
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'პაროლის შეცვლა ვერ მოხერხდა' },
      { status: 500 }
    );
  }
}
