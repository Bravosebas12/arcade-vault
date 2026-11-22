import { connection } from "next/server";
import { cache } from "react";
import type { LeaderboardRow } from "@/features/games/model/game";
import { type ScoreRow, toGameRecord, toLeaderboardRows } from "@/features/leaderboard/lib/leaderboard-rows";
import type { GameRecord } from "@/features/leaderboard/model/game-row";
import { createClient } from "@/shared/lib/supabase/server";

// Server-only reads (createClient uses next/headers). Both run at request time, so the
// leaderboards are never prerendered: callers render them inside <Suspense>.

/** Public columns of scores: anon has no privilege on user_id, so selecting it would fail. */
const SCORE_COLUMNS = "id, game_id, player_name, score, created_at";

const logFailure = (reason: string, detail = "") => console.error("[leaderboard] Read failed:", reason, detail);

/** Real games ordered by sort_order. null → no Supabase or error: use catalog.ts + PLAYABLE_GAME_IDS. */
export async function getLeaderboardGames(): Promise<GameRecord[] | null> {
  await connection();
  const supabase = await createClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from("games").select("*").order("sort_order", { ascending: true });
    if (error) {
      logFailure("games query failed", `${error.code}: ${error.message}`);
      return null;
    }
    return data.map(toGameRecord);
  } catch (e) {
    logFailure("games query threw", e instanceof Error ? `${e.name}: ${e.message}` : "UnknownError");
    return null;
  }
}

/**
 * Top `limit` scores of a game: highest first, oldest first on ties.
 * null → use seededScores. [] → "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA".
 * Memoized per request with React.cache, so the detail page's leaderboard and "MEJOR GLOBAL"
 * share one query.
 */
export const getLeaderboard = cache(async function getLeaderboard(gameId: string, limit: number): Promise<LeaderboardRow[] | null> {
  await connection();
  const supabase = await createClient();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("scores")
      .select(SCORE_COLUMNS)
      .eq("game_id", gameId)
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(limit);
    if (error) {
      logFailure("scores query failed", `${error.code}: ${error.message}`);
      return null;
    }
    return toLeaderboardRows(data);
  } catch (e) {
    logFailure("scores query threw", e instanceof Error ? `${e.name}: ${e.message}` : "UnknownError");
    return null;
  }
});

/** Ordering of a cross-game score read: newest first, or highest first (oldest first on ties). */
type ScoreOrder = "recent" | "top";

/**
 * Raw score rows across every game for the Home activity: the `limit` newest ("recent") or highest
 * ("top"). null → Supabase unavailable or error.
 */
export async function getScores(order: ScoreOrder, limit: number): Promise<ScoreRow[] | null> {
  await connection();
  const supabase = await createClient();
  if (!supabase) return null;

  try {
    const query = supabase.from("scores").select(SCORE_COLUMNS);
    const sorted =
      order === "recent"
        ? query.order("created_at", { ascending: false })
        : query.order("score", { ascending: false }).order("created_at", { ascending: true });
    const { data, error } = await sorted.limit(limit);
    if (error) {
      logFailure(`${order} scores query failed`, `${error.code}: ${error.message}`);
      return null;
    }
    return data;
  } catch (e) {
    logFailure(`${order} scores query threw`, e instanceof Error ? `${e.name}: ${e.message}` : "UnknownError");
    return null;
  }
}
