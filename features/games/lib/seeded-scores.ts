import { PLAYERS } from "@/features/games/data/catalog";
import type { LeaderboardRow } from "@/features/games/model/game";

/**
 * Deterministic fake leaderboard. Same LCG and draw order as the prototype
 * (references/templates/data.jsx), so a given seed yields the same rows.
 */
export function seededScores(seed: number, count = 12): LeaderboardRow[] {
  let s = seed;
  const rand = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const used = new Set<string>();
  const rows: LeaderboardRow[] = [];

  for (let i = 0; i < count; i++) {
    let name: string;
    do {
      name = PLAYERS[Math.floor(rand() * PLAYERS.length)];
    } while (used.has(name) && used.size < PLAYERS.length);
    used.add(name);

    const base = Math.floor(50000 + rand() * 250000);
    const score = base - i * Math.floor(2000 + rand() * 4000);
    const day = String(1 + Math.floor(rand() * 28)).padStart(2, "0");
    const mon = String(1 + Math.floor(rand() * 12)).padStart(2, "0");
    rows.push({ rank: i + 1, name, score: Math.max(score, 1000), date: `${day}/${mon}/2026` });
  }

  return rows.sort((a, b) => b.score - a.score).map((r, i) => ({ ...r, rank: i + 1 }));
}

/** Seed used by the game detail leaderboard (10 rows). */
export const detailSeed = (gameId: string) => gameId.length * 17 + 3;

/** Seed used by the hall of fame table (12 rows). */
export const hallSeed = (gameId: string) => gameId.length * 23 + 7;
