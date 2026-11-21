import { Leaderboard } from "@/features/game-detail/components/Leaderboard";
import { detailSeed, seededScores } from "@/features/games/lib/seeded-scores";
import { getLeaderboard } from "@/features/leaderboard/lib/get-leaderboard";

export const DETAIL_LEADERBOARD_SIZE = 10;

/** Seeded rows of the detail leaderboard: simulated games, Suspense fallback and Supabase unavailable. */
export function SeededLeaderboard({ gameId }: { gameId: string }) {
  return <Leaderboard rows={seededScores(detailSeed(gameId), DETAIL_LEADERBOARD_SIZE)} />;
}

/** Real top 10 of a playable game (server only, request time); seeded rows when Supabase is unavailable. */
export async function GameLeaderboard({ gameId }: { gameId: string }) {
  const rows = await getLeaderboard(gameId, DETAIL_LEADERBOARD_SIZE);
  return rows ? <Leaderboard rows={rows} /> : <SeededLeaderboard gameId={gameId} />;
}
