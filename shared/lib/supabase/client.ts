import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/shared/lib/supabase/database.types";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";

/**
 * Supabase client for Client Components ("use client").
 * Returns null when the Supabase environment variables are not configured.
 */
export function createClient(): SupabaseClient<Database> | null {
  const env = getSupabaseEnv();
  if (!env) return null;

  return createBrowserClient<Database>(env.url, env.publishableKey);
}
