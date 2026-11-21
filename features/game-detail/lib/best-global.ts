import type { LeaderboardRow } from "@/features/games/model/game";
import { formatScore } from "@/shared/lib/format";

/** Shown while a real game has no scores (and while its leaderboard streams in). */
export const NO_BEST_SCORE = "—";

/**
 * "MEJOR GLOBAL" of a real game: the top row of its leaderboard (rows come sorted by score desc),
 * "—" without scores, and the catalog figure only when Supabase is unavailable (null).
 */
export function bestGlobalScore(rows: readonly LeaderboardRow[] | null, catalogBest: number): string {
  if (rows === null) return formatScore(catalogBest);
  return rows.length > 0 ? formatScore(rows[0].score) : NO_BEST_SCORE;
}
