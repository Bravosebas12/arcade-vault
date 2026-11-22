import { describe, expect, it } from "vitest";
import { FRUIT_PALETTE, FRUIT_PIXELS, FRUIT_SIZE } from "@/features/arcade/snake/engine/sprites";

describe("fruit sprites", () => {
  it("has the six normal fruits and the pineapple bonus", () => {
    expect(Object.keys(FRUIT_PIXELS)).toEqual(["apple", "cherry", "grape", "lemon", "watermelon", "strawberry", "pineapple"]);
  });

  it.each(Object.entries(FRUIT_PIXELS))("%s is 12×12 and only uses palette letters", (_, rows) => {
    expect(rows).toHaveLength(FRUIT_SIZE);
    for (const row of rows) {
      expect(row).toHaveLength(FRUIT_SIZE);
      for (const ch of row) expect(ch === "." || ch in FRUIT_PALETTE).toBe(true);
    }
  });
});
