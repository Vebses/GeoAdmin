import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { hashToken, timingSafeEqualHex, randomResponseDelay } from '@/lib/token-utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      await randomResponseDelay();
      return NextResponse.json({ valid: false });
    }

    const supabase = await createClient();
    const tokenHash = hashToken(token);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: user } = await (supabase
      .from('users') as any)
      .select('id, reset_token, reset_token_expires_at')
      .eq('reset_token', tokenHash)
      .single();

    const valid =
      !!user &&
      timingSafeEqualHex(user.reset_token || '', tokenHash) &&
      new Date(user.reset_token_expires_at) >= new Date();

    if (!valid) {
      await randomResponseDelay();
      return NextResponse.json({ valid: false });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error('Validate reset token error:', error);
    await randomResponseDelay();
    return NextResponse.json({ valid: false });
  }
}
