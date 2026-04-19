import crypto from 'crypto';

/**
 * Hash a plaintext token with SHA-256, returning hex.
 * Used everywhere tokens are stored at rest (reset tokens, invite tokens, etc).
 */
export function hashToken(plaintext: string): string {
  return crypto.createHash('sha256').update(plaintext).digest('hex');
}

/**
 * Constant-time comparison of two hex strings of the same length.
 * Returns false (not an exception) on any mismatch including length mismatch.
 *
 * Always use this when comparing a token hash sent by the user against
 * a hash stored in the database — prevents timing-based side channels.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  try {
    const bufA = Buffer.from(a, 'hex');
    const bufB = Buffer.from(b, 'hex');
    if (bufA.length !== bufB.length || bufA.length === 0) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Generate a cryptographically-strong random token (hex string).
 * Default 32 bytes = 64 hex chars = 256 bits of entropy.
 */
export function generateSecureToken(bytes: number = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Add a small random delay (50–150ms) to a response branch to help equalize
 * response times between "found" and "not found" cases. Not a substitute for
 * timingSafeEqualHex but defense in depth.
 */
export async function randomResponseDelay(): Promise<void> {
  const ms = 50 + Math.floor(Math.random() * 100);
  return new Promise(resolve => setTimeout(resolve, ms));
}
