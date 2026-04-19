import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth, isAuthError, ADMIN_ROLES } from '@/lib/auth-utils';
import { checkRateLimitAsync, getClientIp } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  try {
    // Rate limit to prevent user-directory scraping (30 requests per minute per IP)
    const ip = getClientIp(request);
    const rateCheck = await checkRateLimitAsync(`users-list:${ip}`, { limit: 30, windowSec: 60 });
    if (!rateCheck.success) {
      return NextResponse.json(
        { success: false, error: { code: 'RATE_LIMIT', message: 'ძალიან ბევრი მოთხოვნა' } },
        { status: 429 }
      );
    }

    const auth = await requireAuth(ADMIN_ROLES);
    if (isAuthError(auth)) return auth.response;

    const supabase = await createClient();

    // Fetch active users — DO NOT return internal tokens in the list
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, role, is_active, avatar_url, phone, last_login_at, created_at, updated_at')
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
