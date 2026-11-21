import { getSupabaseEnv, type SupabaseEnv } from "@/shared/lib/supabase/env";

export type HealthResponse =
  | { supabase: "ok" }
  | { supabase: "error"; reason: "missing_env" | "unreachable" };

export const HEALTH_TIMEOUT_MS = 5000;

/** Removes the project url, host and key from a message before logging it. */
function redact(message: string, env: SupabaseEnv): string {
  let host = env.url;
  try {
    host = new URL(env.url).host;
  } catch {
    // Not a valid URL: redacting the raw value below is enough.
  }
  return [env.url, host, env.publishableKey].reduce(
    (text, secret) => (secret ? text.split(secret).join("<redacted>") : text),
    message,
  );
}

function logFailure(env: SupabaseEnv, detail: unknown): void {
  if (detail instanceof Error) {
    console.error("[health] supabase unreachable:", detail.name, redact(detail.message, env));
  } else {
    console.error("[health] supabase unreachable:", redact(String(detail), env));
  }
}

/**
 * Checks the connection with the Supabase project by calling its Auth health
 * endpoint. Never returns or logs the project url or key.
 */
export async function checkSupabaseHealth(): Promise<HealthResponse> {
  const env = getSupabaseEnv();
  if (!env) {
    console.error("[health] supabase not configured: missing_env");
    return { supabase: "error", reason: "missing_env" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const response = await fetch(`${env.url.replace(/\/+$/, "")}/auth/v1/health`, {
      headers: { apikey: env.publishableKey },
      cache: "no-store",
      signal: controller.signal,
    });

    if (!response.ok) {
      logFailure(env, `status ${response.status}`);
      return { supabase: "error", reason: "unreachable" };
    }

    return { supabase: "ok" };
  } catch (error) {
    logFailure(env, error);
    return { supabase: "error", reason: "unreachable" };
  } finally {
    clearTimeout(timer);
  }
}
