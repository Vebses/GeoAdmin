import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendPasswordResetEmail } from '@/lib/email/auth';
import { checkRateLimitAsync, getClientIp } from '@/lib/rate-limit';
import { hashToken, generateSecureToken } from '@/lib/token-utils';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 reset requests per 15 minutes per IP
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimitAsync(`reset:${ip}`, { limit: 5, windowSec: 900 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'ძალიან ბევრი მოთხოვნა. სცადეთ მოგვიანებით.' },
        { status: 429 }
      );
    }

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
    const resetToken = generateSecureToken(32);
    const resetTokenHash = hashToken(resetToken);
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
      // Clear the token since email wasn't sent
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase
        .from('users') as any)
        .update({
          reset_token: null,
          reset_token_expires_at: null,
        })
        .eq('id', user.id);

      return NextResponse.json(
        { success: false, error: { code: 'EMAIL_FAILED', message: 'ელ-ფოსტის გაგზავნა ვერ მოხერხდა. სცადეთ მოგვიანებით.' } },
        { status: 500 }
      );
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
