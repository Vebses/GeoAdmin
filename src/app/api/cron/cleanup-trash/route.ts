import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/cron/cleanup-trash — Permanently deletes soft-deleted items older than 30 days.
 *
 * Must be protected by CRON_SECRET env var. Intended to be called by a scheduler
 * (Vercel Cron, external cron, or Supabase pg_cron).
 *
 * Call with: Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get('authorization');

  if (!cronSecret) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_CONFIGURED', message: 'CRON_SECRET not set' } },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid cron secret' } },
      { status: 401 }
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      { success: false, error: { code: 'NOT_CONFIGURED', message: 'Supabase credentials missing' } },
      { status: 500 }
    );
  }

  // Use service role client to bypass RLS for cleanup
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('cleanup_old_trash');

    if (error) {
      console.error('Cleanup RPC error:', error);
      return NextResponse.json(
        { success: false, error: { code: 'CLEANUP_FAILED', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { success: false, error: { code: 'SERVER_ERROR', message: 'Cleanup failed' } },
      { status: 500 }
    );
  }
}
