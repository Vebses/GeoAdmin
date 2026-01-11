import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
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
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single();

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
      await supabase
        .from('users')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id);
    }

    return NextResponse.json({
      user: {
        id: data.user.id,
        email: data.user.email,
        ...userProfile,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'სერვერის შეცდომა' },
      { status: 500 }
    );
  }
}
