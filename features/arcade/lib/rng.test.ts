import { describe, expect, it } from "vitest";
import { createRng } from "@/features/arcade/lib/rng";

const take = (rng: () => number, n: number) => Array.from({ length: n }, () => rng());

describe("createRng", () => {
  it("returns the same sequence for the same seed", () => {
    expect(take(createRng(42), 20)).toEqual(take(createRng(42), 20));
  });

  it("returns a different sequence for a different seed", () => {
    expect(take(createRng(1), 5)).not.toEqual(take(createRng(2), 5));
  });

  it("returns values in [0, 1)", () => {
    for (const value of take(createRng(123456789), 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
