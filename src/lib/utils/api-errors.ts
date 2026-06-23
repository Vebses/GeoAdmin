import { NextResponse } from 'next/server';
import type { ZodError } from 'zod';

/**
 * Turn a Zod validation error into a SPECIFIC, human-readable Georgian message
 * (not a generic "validation error"), plus the per-field details for the form.
 *
 * The schema already carries good per-field messages (e.g. "აირჩიეთ ქეისი",
 * "მინიმუმ 1 სერვისი აუცილებელია") — this surfaces them to the user instead of
 * swallowing them.
 */
export function zodErrorResponse(error: ZodError, status = 400) {
  const flat = error.flatten();
  const fieldErrors = flat.fieldErrors as Record<string, string[]>;
  const parts: string[] = [];
  for (const msgs of Object.values(fieldErrors)) {
    if (msgs && msgs.length && msgs[0]) parts.push(msgs[0]);
  }
  if (flat.formErrors?.length) parts.push(...flat.formErrors);
  const message = parts.length ? parts.join('; ') : 'შევსებული მონაცემები არასწორია';
  return NextResponse.json(
    { success: false, error: { code: 'VALIDATION_ERROR', message, details: fieldErrors } },
    { status }
  );
}

/**
 * Map a Postgres/PostgREST constraint error to a specific labeled message.
 * Returns null when the error isn't a recognised constraint violation
 * (caller should then fall back to a generic 500).
 */
export function describeDbError(err: unknown): { code: string; message: string } | null {
  const e = err as { code?: string } | null;
  switch (e?.code) {
    case '23505': // unique_violation
      return { code: 'DUPLICATE', message: 'ასეთი ჩანაწერი უკვე არსებობს (დუბლირებული მნიშვნელობა).' };
    case '23503': // foreign_key_violation
      return {
        code: 'INVALID_REFERENCE',
        message: 'მითითებული დაკავშირებული ჩანაწერი ვერ მოიძებნა (ქეისი, მიმღები ან გამგზავნი — შესაძლოა წაშლილია).',
      };
    case '23502': // not_null_violation
      return { code: 'MISSING_FIELD', message: 'ერთ-ერთი სავალდებულო ველი შევსებული არ არის.' };
    case '23514': // check_violation
      return { code: 'INVALID_VALUE', message: 'მნიშვნელობა არ აკმაყოფილებს წესებს (მაგ. თანხა უარყოფითია).' };
    default:
      return null;
  }
}
