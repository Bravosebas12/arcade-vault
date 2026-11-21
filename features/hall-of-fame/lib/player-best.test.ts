import { describe, expect, it } from "vitest";
import type { LeaderboardRow } from "@/features/games/model/game";
import { toPlayerBest } from "@/features/hall-of-fame/lib/player-best";

const rows = (...scores: number[]): LeaderboardRow[] =>
  scores.map((score, i) => ({ rank: i + 1, name: `P${i}`, score, date: "01/01/2026" }));

const best = (score: number) => ({ game: "asteroids", score, name: "PX_KAI", at: Date.UTC(2026, 10, 5, 23, 30) });

describe("toPlayerBest", () => {
  it("keeps the name and score and formats the save date as dd/mm/yyyy (UTC)", () => {
    expect(toPlayerBest(best(500), rows(900, 400), 12)).toEqual({ name: "PX_KAI", score: 500, rank: 2, date: "05/11/2026" });
  });

  it("ranks first above every row and on an empty table", () => {
    expect(toPlayerBest(best(1000), rows(900), 12).rank).toBe(1);
    expect(toPlayerBest(best(10), [], 12).rank).toBe(1);
  });

  it("ranks after rows with a strictly higher score only", () => {
    expect(toPlayerBest(best(400), rows(900, 400, 100), 12).rank).toBe(2);
  });

  it("has no rank when the score falls outside the visible top", () => {
    expect(toPlayerBest(best(1), rows(9, 8, 7), 3).rank).toBeNull();
  });
});
