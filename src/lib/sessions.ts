import type { SupabaseClient } from '@supabase/supabase-js';
import { hashToken, generateSecureToken } from '@/lib/token-utils';

/**
 * Server-side session tracking.
 *
 * Supabase Auth handles the JWT lifecycle (issue/refresh/revoke-via-signOut),
 * but we mirror session state in `user_sessions` so we can:
 *   1. Show the user a list of active sessions (parity with major SaaS apps).
 *   2. Forcibly revoke sessions when an admin disables an account.
 *   3. Track last-active time and IP for security review.
 */

const SESSION_DURATION_DAYS = 30;

export interface SessionCreateInput {
  userId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Insert a new session row. Returns the plaintext session token (save once, can't be recovered).
 */
export async function createSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  input: SessionCreateInput
): Promise<string | null> {
  const plaintextToken = generateSecureToken(32);
  const tokenHash = hashToken(plaintextToken);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('user_sessions') as any).insert({
    user_id: input.userId,
    session_token: tokenHash,
    ip_address: input.ipAddress || null,
    user_agent: input.userAgent || null,
    last_active_at: new Date().toISOString(),
    expires_at: expiresAt.toISOString(),
  });

  if (error) {
    console.error('Failed to create session row:', error);
    return null;
  }
  return plaintextToken;
}

/**
 * Delete all sessions for a user (force logout-everywhere).
 * Used on password change, role demotion, or admin-triggered account lock.
 */
export async function revokeAllUserSessions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  userId: string
): Promise<number> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error, count } = await (supabase.from('user_sessions') as any)
    .delete({ count: 'exact' })
    .eq('user_id', userId);

  if (error) {
    console.error('Failed to revoke sessions:', error);
    return 0;
  }
  return count || 0;
}

/**
 * Update last_active_at for a session. Best-effort; don't block on failure.
 */
export async function touchSession(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  userId: string
): Promise<void> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('user_sessions') as any)
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', userId)
      .gte('expires_at', new Date().toISOString());
  } catch (e) {
    // Silent — touching is not critical path
  }
}

/**
 * Extract client info from a Next.js request for session logging.
 */
export function extractSessionInfo(request: Request): { ipAddress: string | null; userAgent: string | null } {
  const forwarded = request.headers.get('x-forwarded-for');
  const ipAddress = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip');
  const userAgent = request.headers.get('user-agent');
  return {
    ipAddress: ipAddress || null,
    userAgent: userAgent ? userAgent.substring(0, 500) : null,
  };
}
