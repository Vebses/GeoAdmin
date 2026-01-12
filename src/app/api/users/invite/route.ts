import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendInvitationEmail } from '@/lib/email/auth';
import crypto from 'crypto';

// Generate UUID v4
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, full_name, role } = body;

    console.log('Invite request:', { email, full_name, role });

    // Validate input
    if (!email) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'ელ-ფოსტა აუცილებელია' } },
        { status: 400 }
      );
    }

    if (!role || !['manager', 'assistant', 'accountant'].includes(role)) {
      return NextResponse.json(
        { success: false, error: { code: 'VALIDATION_ERROR', message: 'როლი აუცილებელია' } },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if current user is a manager
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: { code: 'AUTH_ERROR', message: 'ავტორიზაციის შეცდომა' } },
        { status: 401 }
      );
    }
    
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    console.log('Current user:', currentUser.id);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentUserData, error: userError } = await (supabase
      .from('users') as any)
      .select('id, full_name, role')
      .eq('id', currentUser.id)
      .single();

    if (userError) {
      console.error('User lookup error:', userError);
    }

    console.log('Current user data:', currentUserData);

    // Allow if user is manager OR if there are no users yet (first setup)
    if (currentUserData && currentUserData.role !== 'manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ მენეჯერს შეუძლია მომხმარებლების მოწვევა' } },
        { status: 403 }
      );
    }

    // Check if user already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingUser } = await (supabase
      .from('users') as any)
      .select('id')
      .eq('email', email.toLowerCase())
      .single();

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_EXISTS', message: 'ამ ელ-ფოსტით მომხმარებელი უკვე არსებობს' } },
        { status: 400 }
      );
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Generate a temporary UUID for the pending user
    const pendingUserId = generateUUID();

    console.log('Creating user with ID:', pendingUserId);

    // Create pending user record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newUser, error: createError } = await (supabase
      .from('users') as any)
      .insert({
        id: pendingUserId,
        email: email.toLowerCase(),
        full_name: full_name || null,
        role,
        invitation_token: inviteTokenHash,
        invitation_sent_at: new Date().toISOString(),
        invitation_expires_at: expiresAt.toISOString(),
        invited_by: currentUserData?.id || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create user error:', createError);
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_ERROR', message: createError.message || 'მომხმარებლის შექმნა ვერ მოხერხდა' } },
        { status: 500 }
      );
    }

    console.log('User created:', newUser);

    // Build invitation URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const inviteUrl = `${origin}/accept-invite?token=${inviteToken}`;

    // Send invitation email
    const result = await sendInvitationEmail({
      inviteUrl,
      email: email.toLowerCase(),
      role,
      inviterName: currentUserData?.full_name || 'GeoAdmin',
    });

    if (!result.success) {
      console.error('Failed to send invitation email:', result.error);
      // Don't fail the request, just log the error
    }

    return NextResponse.json({
      success: true,
      data: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Invite user error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: error instanceof Error ? error.message : 'მოწვევა ვერ მოხერხდა' } },
      { status: 500 }
    );
  }
}

// GET - List pending invitations
export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Get pending invitations (users with invitation_token set)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: invitations, error } = await (supabase
      .from('users') as any)
      .select('id, email, full_name, role, invitation_sent_at, invitation_expires_at')
      .not('invitation_token', 'is', null)
      .order('invitation_sent_at', { ascending: false });

    if (error) {
      console.error('Get invitations error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: 'მოწვევების ჩატვირთვა ვერ მოხერხდა' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: invitations || [],
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'შეცდომა' } },
      { status: 500 }
    );
  }
}
