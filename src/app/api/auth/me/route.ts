import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { User } from '@/types';

export async function GET() {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'არაავტორიზებული' },
        { status: 401 }
      );
    }

    // Get user profile from our users table
    const { data: profileData, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    const userProfile = profileData as User | null;

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'მომხმარებელი ვერ მოიძებნა' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      user: userProfile,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: 'სერვერის შეცდომა' },
      { status: 500 }
    );
  }
}
