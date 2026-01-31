import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';

// Singleton pattern to ensure only one client instance
let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function createClient() {
  if (client) return client;

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          if (typeof document === 'undefined') return undefined;
          const value = document.cookie
            .split('; ')
            .find((row) => row.startsWith(`${name}=`))
            ?.split('=')[1];
          return value ? decodeURIComponent(value) : undefined;
        },
        set(name: string, value: string, options: { path?: string; maxAge?: number; domain?: string; sameSite?: string; secure?: boolean }) {
          if (typeof document === 'undefined') return;
          let cookie = `${name}=${encodeURIComponent(value)}`;
          if (options.path) cookie += `; path=${options.path}`;
          if (options.maxAge) cookie += `; max-age=${options.maxAge}`;
          if (options.domain) cookie += `; domain=${options.domain}`;
          if (options.sameSite) cookie += `; samesite=${options.sameSite}`;
          if (options.secure) cookie += `; secure`;
          document.cookie = cookie;
        },
        remove(name: string, options: { path?: string; domain?: string }) {
          if (typeof document === 'undefined') return;
          document.cookie = `${name}=; path=${options.path || '/'}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
        },
      },
    }
  );

  return client;
}
