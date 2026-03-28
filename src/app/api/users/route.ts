import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError, ADMIN_ROLES } from '@/lib/auth-utils';

export async function GET() {
  try {
    const auth = await requireAuth(ADMIN_ROLES);
    if (isAuthError(auth)) return auth.response;

    const supabase = await createClient();

    // Fetch active users
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data: data || [],
    });
  } catch (error) {
    console.error('Users GET error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'სერვერის შეცდომა' } },
      { status: 500 }
    );
  }
}
