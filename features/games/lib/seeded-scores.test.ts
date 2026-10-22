import { describe, expect, it } from "vitest";
import { PLAYERS } from "@/features/games/data/catalog";
import { seededScores } from "@/features/games/lib/seeded-scores";

describe("seededScores", () => {
  it("matches the prototype output for the CAÍDA detail seed", () => {
    // Expected values computed by running references/templates/data.jsx with seed "caida".length * 17 + 3.
    expect(seededScores(88, 10)).toEqual([
      { rank: 1, name: "ARKADYA", score: 278417, date: "19/12/2026" },
      { rank: 2, name: "MAGENTA88", score: 245157, date: "14/11/2026" },
      { rank: 3, name: "VECTORX", score: 179637, date: "19/07/2026" },
      { rank: 4, name: "NEONFOX", score: 177844, date: "01/08/2026" },
      { rank: 5, name: "DROID_X", score: 117367, date: "19/02/2026" },
      { rank: 6, name: "PIXEL_DAD", score: 95046, date: "21/03/2026" },
      { rank: 7, name: "BIT_LORD", score: 52806, date: "01/03/2026" },
      { rank: 8, name: "SCANLINE", score: 41242, date: "14/03/2026" },
      { rank: 9, name: "RGB_QUEEN", score: 39706, date: "28/07/2026" },
      { rank: 10, name: "M00NRYU", score: 21307, date: "10/04/2026" },
    ]);
  });

  it("is deterministic for the same seed", () => {
    expect(seededScores(42, 12)).toEqual(seededScores(42, 12));
  });

  it("returns 12 rows by default", () => {
    expect(seededScores(7)).toHaveLength(12);
  });

  it("sorts rows by score descending with consecutive ranks", () => {
    const rows = seededScores(161, 12);
    rows.forEach((row, i) => {
      expect(row.rank).toBe(i + 1);
      if (i > 0) expect(rows[i - 1].score).toBeGreaterThanOrEqual(row.score);
    });
  });

  it("does not repeat player names", () => {
    const names = seededScores(161, 12).map((r) => r.name);
    expect(new Set(names).size).toBe(names.length);
    names.forEach((name) => expect(PLAYERS).toContain(name));
  });

  it("never returns a score below 1000", () => {
    seededScores(3, 12).forEach((row) => expect(row.score).toBeGreaterThanOrEqual(1000));
  });
});
