import { describe, expect, it } from "vitest";
import { timeAgo, toRecentScores, toTopPlayers } from "@/features/home/lib/activity";
import type { ScoreRow } from "@/features/leaderboard/lib/leaderboard-rows";

const NOW = Date.parse("2026-11-21T12:00:00Z");

const row = (id: number, game_id: string, player_name: string, score: number, created_at = "2026-11-21T11:58:00Z"): ScoreRow => ({
  id,
  game_id,
  player_name,
  score,
  created_at,
});

describe("timeAgo", () => {
  it("says 'ahora' under a minute, also for clock skew into the future", () => {
    expect(timeAgo("2026-11-21T11:59:30Z", NOW)).toBe("ahora");
    expect(timeAgo("2026-11-21T12:00:20Z", NOW)).toBe("ahora");
  });

  it("uses minutes, hours and days, rounding down", () => {
    expect(timeAgo("2026-11-21T11:58:00Z", NOW)).toBe("hace 2 min");
    expect(timeAgo("2026-11-21T11:00:01Z", NOW)).toBe("hace 59 min");
    expect(timeAgo("2026-11-21T09:30:00Z", NOW)).toBe("hace 2 h");
    expect(timeAgo("2026-11-18T11:00:00Z", NOW)).toBe("hace 3 d");
  });
});

describe("toRecentScores", () => {
  const games = [
    { id: "asteroids", title: "METEOR STORM", color: "yellow" as const },
    { id: "falling-blocks", title: "FALLING BLOCKS", color: "magenta" as const },
  ];

  it("keeps the received order and takes title and color from the game", () => {
    expect(toRecentScores([row(2, "falling-blocks", "QA", 98), row(1, "asteroids", "KAI", 20, "2026-11-21T09:00:00Z")], games, NOW)).toEqual([
      { player: "QA", game: "FALLING BLOCKS", score: 98, ago: "hace 2 min", color: "magenta" },
      { player: "KAI", game: "METEOR STORM", score: 20, ago: "hace 3 h", color: "yellow" },
    ]);
  });

  it("falls back to the id and cyan for a game missing from the catalog", () => {
    expect(toRecentScores([row(1, "ghost", "QA", 5)], games, NOW)[0]).toMatchObject({ game: "ghost", color: "cyan" });
  });
});

describe("toTopPlayers", () => {
  it("keeps each player's first (highest) row and ranks from 1", () => {
    const rows = [row(1, "falling-blocks", "NEON", 900), row(2, "asteroids", "NEON", 500), row(3, "asteroids", "KAI", 400), row(4, "asteroids", "LU", 100)];
    expect(toTopPlayers(rows, 5)).toEqual([
      { rank: 1, player: "NEON", score: 900 },
      { rank: 2, player: "KAI", score: 400 },
      { rank: 3, player: "LU", score: 100 },
    ]);
  });

  it("stops at the limit and returns [] without rows", () => {
    expect(toTopPlayers([row(1, "a", "A", 3), row(2, "a", "B", 2), row(3, "a", "C", 1)], 2)).toHaveLength(2);
    expect(toTopPlayers([], 5)).toEqual([]);
  });
});
