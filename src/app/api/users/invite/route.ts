import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendInvitationEmail } from '@/lib/email/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, full_name, role } = body;

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
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentUserData } = await (supabase
      .from('users') as any)
      .select('id, full_name, role')
      .eq('id', currentUser.id)
      .single();

    // Check if user is manager
    if (currentUserData && currentUserData.role !== 'manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ მენეჯერს შეუძლია მომხმარებლების მოწვევა' } },
        { status: 403 }
      );
    }

    // Check if user already exists in users table
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

    // Check if invitation already exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existingInvite } = await (supabase
      .from('user_invitations') as any)
      .select('id')
      .eq('email', email.toLowerCase())
      .is('accepted_at', null)
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { success: false, error: { code: 'INVITE_EXISTS', message: 'ამ ელ-ფოსტაზე მოწვევა უკვე გაგზავნილია' } },
        { status: 400 }
      );
    }

    // Generate invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

    // Create invitation record
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newInvite, error: createError } = await (supabase
      .from('user_invitations') as any)
      .insert({
        email: email.toLowerCase(),
        full_name: full_name || null,
        role,
        invitation_token: inviteTokenHash,
        expires_at: expiresAt.toISOString(),
        invited_by: currentUserData?.id || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Create invitation error:', createError);
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_ERROR', message: createError.message || 'მოწვევის შექმნა ვერ მოხერხდა' } },
        { status: 500 }
      );
    }

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
        id: newInvite.id,
        email: newInvite.email,
        role: newInvite.role,
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

// GET - List pending invitations (checks BOTH old format and new format)
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

    const allInvitations: Array<{
      id: string;
      email: string;
      full_name: string | null;
      role: string;
      created_at: string;
      expires_at: string;
      source: 'new' | 'old';
    }> = [];

    // FIRST: Get from NEW user_invitations table
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newInvitations, error: newError } = await (supabase
        .from('user_invitations') as any)
        .select('id, email, full_name, role, created_at, expires_at')
        .is('accepted_at', null)
        .order('created_at', { ascending: false });

      if (!newError && newInvitations) {
        for (const inv of newInvitations) {
          allInvitations.push({
            ...inv,
            source: 'new',
          });
        }
      }
    } catch (e) {
      // Table might not exist
      console.log('user_invitations table not found');
    }

    // SECOND: Get from OLD users table (pending invitations with invitation_token)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: oldInvitations, error: oldError } = await (supabase
        .from('users') as any)
        .select('id, email, full_name, role, created_at, invitation_expires_at, invitation_token')
        .not('invitation_token', 'is', null)
        .order('created_at', { ascending: false });

      if (!oldError && oldInvitations) {
        for (const inv of oldInvitations) {
          // Only add if not already in the list (by email)
          if (!allInvitations.find(i => i.email === inv.email)) {
            allInvitations.push({
              id: inv.id,
              email: inv.email,
              full_name: inv.full_name,
              role: inv.role,
              created_at: inv.created_at,
              expires_at: inv.invitation_expires_at,
              source: 'old',
            });
          }
        }
      }
    } catch (e) {
      // Column might not exist
      console.log('Old invitation columns not found');
    }

    return NextResponse.json({
      success: true,
      data: allInvitations,
    });
  } catch (error) {
    console.error('Get invitations error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'შეცდომა' } },
      { status: 500 }
    );
  }
}
