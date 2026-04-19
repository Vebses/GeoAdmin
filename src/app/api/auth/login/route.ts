import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimitAsync, getClientIp } from '@/lib/rate-limit';
import { createSession, extractSessionInfo } from '@/lib/sessions';
import type { User } from '@/types';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 login attempts per minute per IP (Postgres-backed, consistent across instances)
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimitAsync(`login:${ip}`, { limit: 10, windowSec: 60 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: 'ძალიან ბევრი მოთხოვნა. სცადეთ მოგვიანებით.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'ელ-ფოსტა და პაროლი აუცილებელია' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Attempt sign in
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      // Map common error messages to Georgian
      let errorMessage = 'შესვლა ვერ მოხერხდა';
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'არასწორი ელ-ფოსტა ან პაროლი';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'ელ-ფოსტა დაუდასტურებელია';
      } else if (error.message.includes('Too many requests')) {
        errorMessage = 'ძალიან ბევრი მცდელობა. სცადეთ მოგვიანებით';
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 401 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'შესვლა ვერ მოხერხდა' },
        { status: 401 }
      );
    }

    // Get user profile from our users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

    const userProfile = profileData as User | null;

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
    }

    // Check if user is active
    if (userProfile && !userProfile.is_active) {
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: 'თქვენი ანგარიში დეაქტივირებულია' },
        { status: 403 }
      );
    }

    // Update last login timestamp
    if (userProfile) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);

      // Create a server-side session row for audit + forced revocation
      const sessionInfo = extractSessionInfo(request);
      // Fire and forget — session tracking should never block login
      createSession(supabase, {
        userId: data.user.id,
        ipAddress: sessionInfo.ipAddress,
        userAgent: sessionInfo.userAgent,
      }).catch(err => console.error('Session create failed:', err));
    }

    return NextResponse.json({
      user: userProfile,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'სერვერის შეცდომა' },
      { status: 500 }
    );
  }
}
