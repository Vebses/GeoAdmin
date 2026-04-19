/**
 * Email input sanitization helpers.
 *
 * Prevents header injection (newlines), BCC smuggling, and excessively long values
 * from reaching the email provider. Always call these on user-controlled values
 * BEFORE passing to Resend / any email SDK.
 */

/**
 * Strip CR/LF/tab/null, collapse whitespace, trim, and cap length.
 * Use for subject lines and anywhere a single-line header value is expected.
 */
export function sanitizeHeaderLine(input: string | null | undefined, maxLen = 200): string {
  if (!input) return '';
  return String(input)
    .replace(/[\r\n\t\0]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, maxLen);
}

/**
 * Sanitize multi-line body text. Keeps newlines (emails may legitimately contain them)
 * but strips null bytes and caps length.
 */
export function sanitizeBodyText(input: string | null | undefined, maxLen = 10000): string {
  if (!input) return '';
  return String(input)
    .replace(/[\0]/g, '')
    .substring(0, maxLen);
}

/**
 * Validate an email address and reject anything that looks like a header-injection attempt.
 * Returns true only if the email is plausibly valid AND safe to pass to the SMTP layer.
 */
export function isSafeEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const trimmed = String(email).trim();
  if (trimmed.length === 0 || trimmed.length > 254) return false;

  // Reject any CR/LF/null/tab — classic header injection vectors
  if (/[\r\n\t\0]/.test(trimmed)) return false;

  // Reject header names appearing inside the value (BCC: smuggling attempts)
  if (/\b(bcc|cc|from|to|reply-to|subject|content-type)\s*:/i.test(trimmed)) return false;

  // Basic shape check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Filter an array of email addresses down to the safe ones, deduplicated, length-capped.
 */
export function sanitizeEmailList(
  emails: unknown,
  maxCount = 10
): string[] {
  if (!Array.isArray(emails)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of emails) {
    if (typeof raw !== 'string') continue;
    const trimmed = raw.trim().toLowerCase();
    if (!isSafeEmail(trimmed)) continue;
    if (seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
    if (result.length >= maxCount) break;
  }
  return result;
}

/**
 * Sanitize a display name used in email templates (from names, inviter names, etc).
 * HTML-escapes content for use inside HTML email bodies.
 */
export function sanitizeDisplayName(input: string | null | undefined, maxLen = 100): string {
  if (!input) return '';
  return String(input)
    .replace(/[\r\n\t\0]/g, ' ')
    .replace(/[<>&"']/g, c => ({
      '<': '&lt;',
      '>': '&gt;',
      '&': '&amp;',
      '"': '&quot;',
      "'": '&#39;',
    }[c]!))
    .trim()
    .substring(0, maxLen);
}
