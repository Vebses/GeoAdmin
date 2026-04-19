import type { SupabaseClient } from '@supabase/supabase-js';

const BUCKET = 'geoadmin-files';
const DEFAULT_EXPIRY_SECONDS = 60 * 60; // 1 hour

/**
 * Extract the storage path from either a raw path or a legacy public URL.
 * Legacy records may contain `https://…/storage/v1/object/public/geoadmin-files/<path>`;
 * new records store just `<path>`. Both forms are handled here.
 */
export function extractStoragePath(fileUrlOrPath: string | null | undefined): string | null {
  if (!fileUrlOrPath) return null;
  // Legacy full URL
  const marker = `/${BUCKET}/`;
  const idx = fileUrlOrPath.indexOf(marker);
  if (idx !== -1) {
    return fileUrlOrPath.substring(idx + marker.length);
  }
  // Already a path
  return fileUrlOrPath;
}

/**
 * Generate a short-lived signed URL for a single storage object.
 * Returns null on failure (caller should handle gracefully).
 */
export async function getSignedFileUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  fileUrlOrPath: string | null | undefined,
  expiresIn: number = DEFAULT_EXPIRY_SECONDS
): Promise<string | null> {
  const path = extractStoragePath(fileUrlOrPath);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data) {
    console.error('createSignedUrl failed:', error);
    return null;
  }
  return data.signedUrl;
}

/**
 * Batch signed URL generation. Accepts an array of paths, returns a map.
 */
export async function getSignedFileUrls(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, 'public', any>,
  paths: (string | null | undefined)[],
  expiresIn: number = DEFAULT_EXPIRY_SECONDS
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  const unique = Array.from(
    new Set(paths.map(extractStoragePath).filter((p): p is string => !!p))
  );
  if (unique.length === 0) return map;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(unique, expiresIn);

  if (error || !data) {
    console.error('createSignedUrls failed:', error);
    return map;
  }

  for (const item of data) {
    if (item.signedUrl && item.path) {
      map.set(item.path, item.signedUrl);
    }
  }
  return map;
}
