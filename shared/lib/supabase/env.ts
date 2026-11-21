export type SupabaseEnv = { url: string; publishableKey: string };

/**
 * Reads the public Supabase configuration, or returns null when either value
 * is missing or blank so callers can degrade gracefully.
 *
 * Both variables must be referenced literally: Next only inlines
 * `process.env.NEXT_PUBLIC_*` into the browser bundle when written this way.
 */
export function getSupabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) return null;

  return { url, publishableKey };
}
