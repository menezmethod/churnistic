import { createServerClient } from '@supabase/ssr';
import { CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { Database } from '@/types/supabase';

// Define the storage key consistently across all client instances
const STORAGE_KEY = 'sb-upumyguwlzscczhanlhd-auth-token';

export async function createClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        async get(name: string) {
          const cookieStore = await cookies();
          const cookie = cookieStore.get(name);
          return cookie?.value;
        },
        async set(name: string, value: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value, ...options });
        },
        async remove(name: string, options: CookieOptions) {
          const cookieStore = await cookies();
          cookieStore.set({ name, value: '', ...options });
        },
      },
      auth: {
        storageKey: STORAGE_KEY,
      }
    }
  );
}
