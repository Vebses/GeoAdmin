import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { revokeAllUserSessions } from '@/lib/sessions';

export async function POST() {
  try {
    const supabase = await createClient();

    // Capture user BEFORE sign-out so we can clean up their session rows
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return NextResponse.json(
        { error: 'გამოსვლა ვერ მოხერხდა' },
        { status: 500 }
      );
    }

    // Remove server-side session rows (best-effort, not part of response contract)
    if (user?.id) {
      revokeAllUserSessions(supabase, user.id).catch(err =>
        console.error('Session revoke failed:', err)
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'სერვერის შეცდომა' },
      { status: 500 }
    );
  }
}
