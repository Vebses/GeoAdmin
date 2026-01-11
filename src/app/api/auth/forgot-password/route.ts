import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

    // Get the site URL from environment or request
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?type=recovery`,
    });

    if (error) {
      console.error('Password reset error:', error);
      
      // Don't reveal if email exists or not for security
      // Just return success regardless
      return NextResponse.json({ success: true });
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
