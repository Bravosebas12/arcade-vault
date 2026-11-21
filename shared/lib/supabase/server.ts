import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import type { Database } from "@/shared/lib/supabase/database.types";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 * Returns null when the Supabase environment variables are not configured.
 */
export async function createClient(): Promise<SupabaseClient<Database> | null> {
  const env = getSupabaseEnv();
  if (!env) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies. proxy.ts refreshes the
          // session on every request, so this can be safely ignored.
        }
      },
    },
  });
}
