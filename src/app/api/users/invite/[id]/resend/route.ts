import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendInvitationEmail } from '@/lib/email/auth';
import crypto from 'crypto';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { source } = body; // 'new' or 'old'

    const supabase = await createClient();

    // Check auth
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'არაავტორიზებული' } },
        { status: 401 }
      );
    }

    // Check if user is manager
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentUserData } = await (supabase
      .from('users') as any)
      .select('id, full_name, role')
      .eq('id', user.id)
      .single();

    if (currentUserData && currentUserData.role !== 'manager') {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'მხოლოდ მენეჯერს შეუძლია მოწვევის ხელახლა გაგზავნა' } },
        { status: 403 }
      );
    }

    let email: string;
    let role: string;
    let fullName: string | null = null;

    if (source === 'new') {
      // Get invitation from user_invitations table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: invitation, error } = await (supabase
        .from('user_invitations') as any)
        .select('email, role, full_name')
        .eq('id', id)
        .is('accepted_at', null)
        .single();

      if (error || !invitation) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'მოწვევა ვერ მოიძებნა' } },
          { status: 404 }
        );
      }

      email = invitation.email;
      role = invitation.role;
      fullName = invitation.full_name;

      // Generate new token and update expiration
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase
        .from('user_invitations') as any)
        .update({
          invitation_token: inviteTokenHash,
          expires_at: expiresAt.toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update invitation error:', updateError);
        return NextResponse.json(
          { success: false, error: { code: 'UPDATE_ERROR', message: 'მოწვევის განახლება ვერ მოხერხდა' } },
          { status: 500 }
        );
      }

      // Build invitation URL and send email
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const inviteUrl = `${origin}/accept-invite?token=${inviteToken}`;

      await sendInvitationEmail({
        inviteUrl,
        email,
        role,
        inviterName: currentUserData?.full_name || 'GeoAdmin',
      });

    } else {
      // Old format - get from users table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: invitation, error } = await (supabase
        .from('users') as any)
        .select('email, role, full_name, invitation_token')
        .eq('id', id)
        .not('invitation_token', 'is', null)
        .single();

      if (error || !invitation) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'მოწვევა ვერ მოიძებნა' } },
          { status: 404 }
        );
      }

      email = invitation.email;
      role = invitation.role;
      fullName = invitation.full_name;

      // Generate new token and update expiration
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
      const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase
        .from('users') as any)
        .update({
          invitation_token: inviteTokenHash,
          invitation_expires_at: expiresAt.toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('Update old invitation error:', updateError);
        return NextResponse.json(
          { success: false, error: { code: 'UPDATE_ERROR', message: 'მოწვევის განახლება ვერ მოხერხდა' } },
          { status: 500 }
        );
      }

      // Build invitation URL and send email
      const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const inviteUrl = `${origin}/accept-invite?token=${inviteToken}`;

      await sendInvitationEmail({
        inviteUrl,
        email,
        role,
        inviterName: currentUserData?.full_name || 'GeoAdmin',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'მოწვევა ხელახლა გაიგზავნა',
    });
  } catch (error) {
    console.error('Resend invitation error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'შეცდომა' } },
      { status: 500 }
    );
  }
}
