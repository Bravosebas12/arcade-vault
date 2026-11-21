import { afterEach, describe, expect, it, vi } from "vitest";
import { getSupabaseEnv } from "@/shared/lib/supabase/env";

const URL_KEY = "NEXT_PUBLIC_SUPABASE_URL";
const KEY_KEY = "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY";

const setEnv = (url: string | undefined, key: string | undefined) => {
  vi.stubEnv(URL_KEY, url);
  vi.stubEnv(KEY_KEY, key);
};

describe("getSupabaseEnv", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the url and publishable key when both are set", () => {
    setEnv("https://abc.supabase.co", "sb_publishable_test");

    expect(getSupabaseEnv()).toEqual({
      url: "https://abc.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("returns the values trimmed", () => {
    setEnv("  https://abc.supabase.co ", " sb_publishable_test\n");

    expect(getSupabaseEnv()).toEqual({
      url: "https://abc.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it.each([
    ["the url is missing", undefined, "sb_publishable_test"],
    ["the key is missing", "https://abc.supabase.co", undefined],
    ["both are missing", undefined, undefined],
    ["the url is empty", "", "sb_publishable_test"],
    ["the key is empty", "https://abc.supabase.co", ""],
    ["the url is only spaces", "   ", "sb_publishable_test"],
    ["the key is only spaces", "https://abc.supabase.co", "  \t "],
  ])("returns null when %s", (_, url, key) => {
    setEnv(url, key);

    expect(getSupabaseEnv()).toBeNull();
  });
});
