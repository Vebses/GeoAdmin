/**
 * Simple in-memory rate limiter for API routes.
 * Uses a sliding window approach. Not suitable for multi-instance deployments.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  store.forEach((entry, key) => {
    if (entry.resetAt < now) {
      store.delete(key);
    }
  });
}

interface RateLimitOptions {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * Check rate limit for a given key (typically IP or email).
 * Returns { success: true } if under limit, { success: false } if exceeded.
 */
export function checkRateLimit(
  key: string,
  options: RateLimitOptions
): RateLimitResult {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    // First request or window expired
    store.set(key, { count: 1, resetAt: now + options.windowSec * 1000 });
    return { success: true, remaining: options.limit - 1, resetAt: now + options.windowSec * 1000 };
  }

  if (entry.count >= options.limit) {
    return { success: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count += 1;
  return { success: true, remaining: options.limit - entry.count, resetAt: entry.resetAt };
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
