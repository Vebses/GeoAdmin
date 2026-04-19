/**
 * Safely resolve a user-supplied `next` / `redirectTo` parameter to a same-origin path.
 *
 * Rules:
 *   1. Must start with a single `/` (relative path).
 *   2. Must NOT start with `//` (protocol-relative — redirects off-origin).
 *   3. Must NOT contain a scheme (`http:`, `javascript:`, `data:`, `vbscript:`).
 *   4. Fall back to a safe default when invalid.
 *
 * Returns a guaranteed safe path string, never an absolute URL.
 */
export function safeInternalPath(input: string | null | undefined, fallback = '/dashboard'): string {
  if (!input || typeof input !== 'string') return fallback;

  const trimmed = input.trim();
  if (trimmed.length === 0) return fallback;

  // Reject obvious external / protocol-relative URLs
  if (trimmed.startsWith('//')) return fallback;

  // Reject any scheme-like prefix (http:, javascript:, data:, vbscript:, file:, ftp:)
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return fallback;

  // Reject encoded variants of the above (%2F%2F, %3A, etc.)
  const decoded = (() => {
    try { return decodeURIComponent(trimmed); } catch { return trimmed; }
  })();
  if (decoded.startsWith('//') || /^[a-z][a-z0-9+.-]*:/i.test(decoded)) return fallback;

  // Must start with single /
  if (!trimmed.startsWith('/')) return fallback;

  // Reject backslash tricks that some browsers interpret as forward slash
  if (trimmed.includes('\\')) return fallback;

  return trimmed;
}

/**
 * The canonical app origin, sourced strictly from server configuration.
 * Never trust the request Origin header — a malicious client can set it
 * to anything. Used to build outgoing URLs (password reset, invitations).
 */
export function getCanonicalOrigin(): string {
  const url = process.env.NEXT_PUBLIC_APP_URL;
  if (!url) {
    // In development only, default to localhost
    if (process.env.NODE_ENV !== 'production') {
      return 'http://localhost:3000';
    }
    throw new Error('NEXT_PUBLIC_APP_URL is not configured');
  }
  // Strip trailing slash for predictable concatenation
  return url.replace(/\/+$/, '');
}
