import type { LeaderboardRow } from "@/features/games/model/game";
import type { SavedScore } from "@/features/player/model/score-entry";

/** "TU MEJOR" row: rank is null when the score falls outside the visible top. */
export type PlayerBest = { name: string; rank: number | null; score: number; date: string };

const formatDate = (ms: number) => {
  const d = new Date(ms);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
};

/** This browser's best local score placed against the visible top `limit` rows. */
export function toPlayerBest(best: SavedScore, rows: readonly LeaderboardRow[], limit: number): PlayerBest {
  const rank = rows.filter((r) => r.score > best.score).length + 1;
  return { name: best.name, score: best.score, rank: rank > limit ? null : rank, date: formatDate(best.at) };
}
