import { describe, expect, it } from "vitest";
import { GRID } from "@/features/arcade/brick-breaker/engine/constants";
import { LEVELS } from "@/features/arcade/brick-breaker/engine/levels";

const colorAt = (level: number, col: number, row: number) =>
  LEVELS[level - 1].blocks.find((b) => b.col === col && b.row === row)?.color;

describe("LEVELS", () => {
  it("has the 5 original patterns with 60, 40, 30, 39 and 39 blocks (208 in total)", () => {
    expect(LEVELS.map((l) => l.blocks.length)).toEqual([60, 40, 30, 39, 39]);
    expect(LEVELS.reduce((sum, l) => sum + l.blocks.length, 0)).toBe(208);
  });

  it("speeds the ball up level by level: 1.00, 1.10, 1.21, 1.33 and 1.46", () => {
    expect(LEVELS.map((l) => l.speed)).toEqual([1.0, 1.1, 1.21, 1.33, 1.46]);
  });

  it("keeps every block inside the 10×6 grid, without duplicates", () => {
    for (const level of LEVELS) {
      const cells = new Set(level.blocks.map((b) => `${b.col},${b.row}`));
      expect(cells.size).toBe(level.blocks.length);
      for (const b of level.blocks) {
        expect(b.col).toBeGreaterThanOrEqual(0);
        expect(b.col).toBeLessThan(GRID.cols);
        expect(b.row).toBeGreaterThanOrEqual(0);
        expect(b.row).toBeLessThan(GRID.rows);
      }
    }
  });

  it("level 1 is the full grid with one color per row", () => {
    expect([0, 1, 2, 3, 4, 5].map((row) => colorAt(1, 3, row))).toEqual(["red", "yellow", "cyan", "magenta", "hotpink", "green"]);
  });

  it("level 2 is a pyramid whose top row is gray", () => {
    expect(LEVELS[1].blocks.filter((b) => b.row === 0).map((b) => b.col)).toEqual([4, 5]);
    expect(colorAt(2, 4, 0)).toBe("gray");
    expect(LEVELS[1].blocks.filter((b) => b.row === 5)).toHaveLength(10);
  });

  it("level 3 is a checkerboard, yellow on top and magenta below", () => {
    expect(LEVELS[2].blocks.every((b) => (b.col + b.row) % 2 === 0)).toBe(true);
    expect(colorAt(3, 0, 0)).toBe("yellow");
    expect(colorAt(3, 1, 3)).toBe("magenta");
  });

  it("level 4 leaves the original gaps", () => {
    expect(colorAt(4, 2, 0)).toBeUndefined();
    expect(colorAt(4, 0, 0)).toBe("cyan");
    expect(colorAt(4, 9, 5)).toBeUndefined();
    expect(colorAt(4, 0, 5)).toBe("red");
  });

  it("level 5 is a cyan frame with a hotpink cross", () => {
    expect(colorAt(5, 0, 3)).toBe("cyan");
    expect(colorAt(5, 4, 0)).toBe("cyan");
    expect(colorAt(5, 4, 3)).toBe("hotpink");
    expect(colorAt(5, 7, 2)).toBe("hotpink");
    expect(colorAt(5, 2, 3)).toBeUndefined();
  });
});
