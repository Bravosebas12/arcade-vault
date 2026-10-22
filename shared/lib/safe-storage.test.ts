import { beforeEach, describe, expect, it } from "vitest";
import { readJson, readRaw, removeKey, writeJson } from "@/shared/lib/safe-storage";

describe("safe-storage", () => {
  beforeEach(() => localStorage.clear());

  it("returns the fallback when the key is missing", () => {
    expect(readJson("missing", [])).toEqual([]);
    expect(readRaw("missing")).toBeNull();
  });

  it("round-trips JSON values", () => {
    writeJson("k", { a: 1 });
    expect(readJson("k", null)).toEqual({ a: 1 });
    expect(readRaw("k")).toBe('{"a":1}');
  });

  it("returns the fallback for invalid JSON instead of throwing", () => {
    localStorage.setItem("k", "{not json");
    expect(readJson("k", null)).toBeNull();
  });

  it("removes keys", () => {
    writeJson("k", 1);
    removeKey("k");
    expect(localStorage.getItem("k")).toBeNull();
  });
});
