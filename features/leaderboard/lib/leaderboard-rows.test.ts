import { describe, expect, it } from "vitest";
import { toGameRecord, toLeaderboardRows, type GameRow, type ScoreRow } from "@/features/leaderboard/lib/leaderboard-rows";

const score = (id: number, player_name: string, value: number, created_at: string): ScoreRow => ({
  id,
  game_id: "asteroids",
  player_name,
  score: value,
  created_at,
});

describe("toLeaderboardRows", () => {
  it("ranks from 1 in the received order and takes the name from player_name", () => {
    const rows = toLeaderboardRows([
      score(7, "PX_KAI", 900, "2026-11-20T10:00:00+00:00"),
      score(3, "Ñandú", 900, "2026-11-21T10:00:00+00:00"),
      score(9, "ZED", 1200, "2026-11-22T10:00:00+00:00"),
    ]);
    expect(rows.map((r) => [r.rank, r.name, r.score])).toEqual([
      [1, "PX_KAI", 900],
      [2, "Ñandú", 900],
      [3, "ZED", 1200],
    ]);
  });

  it("formats created_at as zero-padded dd/mm/yyyy in UTC", () => {
    const rows = toLeaderboardRows([
      score(1, "A", 1, "2026-01-05T08:00:00.123456+00:00"),
      score(2, "B", 1, "2026-11-20T23:30:00+00:00"),
      score(3, "C", 1, "2026-03-01T00:30:00+02:00"),
    ]);
    expect(rows.map((r) => r.date)).toEqual(["05/01/2026", "20/11/2026", "28/02/2026"]);
  });

  it("returns an empty list for no rows", () => {
    expect(toLeaderboardRows([])).toEqual([]);
  });
});

describe("toGameRecord", () => {
  it("maps the games columns to the catalog field names", () => {
    const row: GameRow = {
      id: "asteroids",
      title: "ASTEROIDES",
      short_description: "Short text",
      long_description: "Long text",
      category: "SHOOTER",
      cover: "cover-rocas",
      color: "yellow",
      max_score: 1000000,
      sort_order: 1,
      created_at: "2026-11-20T10:00:00+00:00",
    };
    expect(toGameRecord(row)).toEqual({
      id: "asteroids",
      title: "ASTEROIDES",
      short: "Short text",
      long: "Long text",
      cat: "SHOOTER",
      cover: "cover-rocas",
      color: "yellow",
      maxScore: 1000000,
      sortOrder: 1,
    });
  });
});
