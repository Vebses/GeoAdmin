/**
 * Magic-byte based file-content validation.
 * MIME type from the client is spoofable — this checks the first few bytes
 * against known file signatures to verify the actual content type.
 */

// Magic byte signatures. Each entry: (declared MIME) -> array of valid signatures.
// Each signature is a byte array that must appear at the start of the file.
const SIGNATURES: Record<string, number[][]> = {
  'image/png': [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  ],
  'image/jpeg': [
    [0xff, 0xd8, 0xff],
  ],
  'image/jpg': [
    [0xff, 0xd8, 0xff],
  ],
  'image/webp': [
    // "RIFF....WEBP" — first 4 bytes are RIFF; WEBP appears at offset 8
    [0x52, 0x49, 0x46, 0x46],
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
  'application/msword': [
    [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], // OLE CFBF
  ],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [
    [0x50, 0x4b, 0x03, 0x04], // ZIP (docx is a zip)
    [0x50, 0x4b, 0x05, 0x06], // empty ZIP
  ],
  'application/vnd.ms-excel': [
    [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1], // OLE CFBF
  ],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
    [0x50, 0x4b, 0x03, 0x04], // ZIP (xlsx is a zip)
    [0x50, 0x4b, 0x05, 0x06],
  ],
  // text/plain has no magic bytes — we accept based on absence of binary content
  'text/plain': [],
};

/**
 * Verify that a file's actual bytes match its declared MIME type.
 * Returns true if they match, false if it's a spoof (or an unknown type).
 *
 * For text/plain we check that the file contains no NUL bytes in the first 1KB
 * (a cheap heuristic that rejects typical binary payloads).
 */
export async function verifyFileMagicBytes(file: File, declaredMime: string): Promise<boolean> {
  try {
    // Read up to first 1024 bytes
    const head = await file.slice(0, Math.min(1024, file.size)).arrayBuffer();
    const bytes = new Uint8Array(head);

    if (declaredMime === 'text/plain') {
      // Reject if we find any NUL bytes in first 1KB
      for (let i = 0; i < bytes.length; i++) {
        if (bytes[i] === 0) return false;
      }
      return true;
    }

    const sigs = SIGNATURES[declaredMime];
    if (!sigs || sigs.length === 0) return false;

    for (const sig of sigs) {
      if (bytes.length < sig.length) continue;
      let match = true;
      for (let i = 0; i < sig.length; i++) {
        if (bytes[i] !== sig[i]) { match = false; break; }
      }
      if (match) return true;
    }
    return false;
  } catch (e) {
    console.error('Magic byte check failed:', e);
    return false;
  }
}

/**
 * Validate a UUID string. Returns true if it looks like a valid UUID.
 */
export function isUuid(value: string | null | undefined): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
