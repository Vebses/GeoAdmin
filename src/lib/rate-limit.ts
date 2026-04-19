/**
 * Rate limiter with Postgres-backed persistence + in-memory fallback.
 *
 * Why both: Postgres ensures consistency across Vercel instances; if the DB call
 * fails we fall back to in-memory so auth endpoints degrade gracefully rather
 * than locking everyone out. In-memory is best-effort only.
 */
import { createClient } from '@supabase/supabase-js';

// ─── In-memory fallback ─────────────────────────────────────────────────

interface MemEntry {
  count: number;
  resetAt: number;
}
const memStore = new Map<string, MemEntry>();
let lastCleanup = Date.now();

function memoryCleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  memStore.forEach((entry, key) => {
    if (entry.resetAt < now) memStore.delete(key);
  });
}

function memoryCheck(key: string, limit: number, windowSec: number): RateLimitResult {
  memoryCleanup();
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry || entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + windowSec * 1000 });
    return { success: true, remaining: limit - 1, resetAt: now + windowSec * 1000 };
  }
  if (entry.count >= limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return { success: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// ─── Postgres-backed limiter ────────────────────────────────────────────

// Lazy service-role client. Only used by rate limit (never for user queries).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedAdminClient: any = null;
function getAdminClient() {
  if (cachedAdminClient) return cachedAdminClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  cachedAdminClient = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return cachedAdminClient;
}

// ─── Public API ─────────────────────────────────────────────────────────

export interface RateLimitOptions {
  /** Maximum hits allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number; // ms epoch
}

/**
 * Check rate limit for a key (e.g. `"login:${ip}"`).
 * Returns { success: false } if the limit has been exceeded.
 *
 * Synchronous signature preserved for backward compatibility with existing call sites.
 * The Postgres-backed variant is exposed as `checkRateLimitAsync` below.
 */
export function checkRateLimit(key: string, options: RateLimitOptions): RateLimitResult {
  // Synchronous path — uses in-memory only.
  // Call sites that want cross-instance consistency should migrate to checkRateLimitAsync.
  return memoryCheck(key, options.limit, options.windowSec);
}

/**
 * Async variant that uses Postgres as the source of truth, with in-memory fallback.
 * Use this for security-critical endpoints (login, password reset, invite accept).
 */
export async function checkRateLimitAsync(
  key: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const admin = getAdminClient();
  if (!admin) {
    // No service role key — use in-memory fallback
    return memoryCheck(key, options.limit, options.windowSec);
  }
  try {
    const { data, error } = await admin.rpc('check_rate_limit', {
      p_key: key,
      p_window_sec: options.windowSec,
      p_max_hits: options.limit,
    });
    if (error || !data) throw error || new Error('empty response');
    return {
      success: data.allowed === true,
      remaining: typeof data.remaining === 'number' ? data.remaining : 0,
      resetAt: data.reset_at ? new Date(data.reset_at).getTime() : Date.now() + options.windowSec * 1000,
    };
  } catch (e) {
    // Degrade gracefully — don't lock users out if DB is briefly unavailable
    console.warn('Postgres rate limit unavailable, falling back to in-memory', e);
    return memoryCheck(key, options.limit, options.windowSec);
  }
}

/**
 * Extract client IP from request headers (works behind proxies).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') || 'unknown';
}
