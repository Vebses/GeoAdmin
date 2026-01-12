import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ valid: false });
    }

    const supabase = await createClient();
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with this token that hasn't expired
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase
      .from('users') as any)
      .select('id, reset_token_expires_at')
      .eq('reset_token', tokenHash)
      .single();

    if (!user) {
      return NextResponse.json({ valid: false });
    }

    // Check if token has expired
    if (new Date(user.reset_token_expires_at) < new Date()) {
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Validate reset token error:', error);
    return NextResponse.json({ valid: false });
  }
}
