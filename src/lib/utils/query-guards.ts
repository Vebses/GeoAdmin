/**
 * Shared guards for list/query endpoints.
 *
 * - sanitizeSearchTerm: neutralises PostgREST filter-injection in values that get
 *   interpolated into `.or()` / `.ilike` strings (a raw comma/dot/paren can add or
 *   re-target OR branches and widen disclosure).
 * - clampPagination: bounds page/limit so a client can't request a huge range
 *   (resource exhaustion) or a negative offset.
 * - stripSensitiveUserFields: removes never-should-leave-the-server columns from a
 *   users row before returning it to the client.
 */

/**
 * Sanitise a free-text search term before it is interpolated into a PostgREST
 * `.or()` / `.ilike` filter string.
 *
 * PostgREST parses `,` (branch separator) and `.` (column.op.value separator) and
 * `()` as filter structure, so leaving them in a user value allows injecting extra
 * OR conditions on other columns. We strip those structural characters and escape
 * the LIKE wildcards (`% _ \`). Ordinary identifiers used in this app
 * (e.g. case numbers `M-621070`, `52863/26/2/21151`, names) are preserved.
 */
export function sanitizeSearchTerm(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw
    .replace(/[,.()*:]/g, ' ') // PostgREST filter structural chars
    .replace(/[%_\\]/g, '\\$&') // escape LIKE wildcards
    .replace(/\s+/g, ' ')
    .trim();
}

export interface Pagination {
  page: number;
  limit: number;
  offset: number;
}

/**
 * Clamp pagination query params to safe bounds.
 * Defaults: limit 10, max 100, page >= 1. Non-numeric/negative inputs fall back to safe values.
 */
export function clampPagination(
  pageRaw: string | null | undefined,
  limitRaw: string | null | undefined,
  opts: { defaultLimit?: number; maxLimit?: number } = {}
): Pagination {
  const defaultLimit = opts.defaultLimit ?? 10;
  const maxLimit = opts.maxLimit ?? 100;

  const pageNum = parseInt(pageRaw || '1', 10);
  const limitNum = parseInt(limitRaw || String(defaultLimit), 10);

  const page = Number.isFinite(pageNum) && pageNum > 0 ? pageNum : 1;
  const limit = Number.isFinite(limitNum)
    ? Math.min(Math.max(limitNum, 1), maxLimit)
    : defaultLimit;

  return { page, limit, offset: (page - 1) * limit };
}

const SENSITIVE_USER_FIELDS = [
  'reset_token',
  'reset_token_expires_at',
  'invitation_token',
  'invitation_token_expires_at',
];

/**
 * Remove sensitive columns from a users row before sending it to the client.
 * Safe to call on null.
 */
export function stripSensitiveUserFields<T extends object>(user: T | null): T | null {
  if (!user) return user;
  const clone = { ...user };
  for (const field of SENSITIVE_USER_FIELDS) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (clone as any)[field];
  }
  return clone;
}
