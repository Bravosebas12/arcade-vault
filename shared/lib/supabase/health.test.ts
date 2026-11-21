import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkSupabaseHealth, HEALTH_TIMEOUT_MS } from "@/shared/lib/supabase/health";

const URL_VALUE = "https://abc.supabase.co";
const KEY_VALUE = "sb_publishable_test";

const fetchMock = vi.fn<typeof fetch>();

describe("checkSupabaseHealth", () => {
  let logError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", URL_VALUE);
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", KEY_VALUE);
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockReset();
    logError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
    logError.mockRestore();
  });

  const loggedText = () => JSON.stringify(logError.mock.calls);

  it("reports missing_env without calling fetch when the variables are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");

    await expect(checkSupabaseHealth()).resolves.toEqual({ supabase: "error", reason: "missing_env" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests the auth health endpoint with the apikey header", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await checkSupabaseHealth();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${URL_VALUE}/auth/v1/health`);
    expect(new Headers(init?.headers).get("apikey")).toBe(KEY_VALUE);
    expect(init?.cache).toBe("no-store");
  });

  it("does not duplicate the slash when the url ends with one", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", `${URL_VALUE}/`);
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await checkSupabaseHealth();

    expect(fetchMock.mock.calls[0][0]).toBe(`${URL_VALUE}/auth/v1/health`);
  });

  it("reports ok when Supabase answers 200", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    await expect(checkSupabaseHealth()).resolves.toEqual({ supabase: "ok" });
  });

  it("reports unreachable when Supabase answers a non-2xx status", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));

    await expect(checkSupabaseHealth()).resolves.toEqual({ supabase: "error", reason: "unreachable" });
  });

  it("reports unreachable when fetch throws", async () => {
    fetchMock.mockRejectedValue(new TypeError("fetch failed"));

    await expect(checkSupabaseHealth()).resolves.toEqual({ supabase: "error", reason: "unreachable" });
  });

  it("reports unreachable when Supabase takes longer than the timeout", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_, init) =>
        new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(new DOMException("aborted", "AbortError")));
        }),
    );

    const result = checkSupabaseHealth();
    await vi.advanceTimersByTimeAsync(HEALTH_TIMEOUT_MS);

    await expect(result).resolves.toEqual({ supabase: "error", reason: "unreachable" });
    expect(HEALTH_TIMEOUT_MS).toBe(5000);
  });

  it("never logs the url or the key", async () => {
    fetchMock.mockRejectedValue(new TypeError(`fetch failed for ${URL_VALUE}`));

    await checkSupabaseHealth();

    expect(logError).toHaveBeenCalled();
    expect(loggedText()).not.toContain(KEY_VALUE);
    expect(loggedText()).not.toContain("abc.supabase.co");
  });
});
