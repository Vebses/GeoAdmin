import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPasswordResetEmail } from '@/lib/email/auth';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: 'ელ-ფოსტა აუცილებელია' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user exists (but don't reveal this to the client)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase
      .from('users') as any)
      .select('id, email')
      .eq('email', email.toLowerCase())
      .single();

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({ success: true });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store reset token in database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase
      .from('users') as any)
      .update({
        reset_token: resetTokenHash,
        reset_token_expires_at: expiresAt.toISOString(),
      })
      .eq('id', user.id);

    // Build reset URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const resetUrl = `${origin}/reset-password?token=${resetToken}`;

    // Send styled email
    const result = await sendPasswordResetEmail(email, resetUrl);
    
    if (!result.success) {
      console.error('Failed to send password reset email:', result.error);
      // Still return success to prevent enumeration
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'მოთხოვნა ვერ შესრულდა' },
      { status: 500 }
    );
  }
}
