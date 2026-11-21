import { Suspense } from "react";
import { PLAYABLE_GAME_IDS } from "@/features/arcade/playable";
import { GameLeaderboard, SeededLeaderboard } from "@/features/game-detail/components/GameLeaderboard";
import { GameDetailScreen } from "@/features/game-detail/components/GameDetailScreen";
import { allGameStaticParams, resolveGame } from "@/features/games/lib/game-params";

export const generateStaticParams = allGameStaticParams;

const playable: readonly string[] = PLAYABLE_GAME_IDS;

export default async function GameDetailPage({ params }: PageProps<"/juegos/[id]">) {
  const game = await resolveGame(params);
  // Real games read their leaderboard at request time inside <Suspense>, so the rest of the page stays
  // prerendered; simulated games keep the seeded rows and never query Supabase.
  const leaderboard = playable.includes(game.id) ? (
    <Suspense fallback={<SeededLeaderboard gameId={game.id} />}>
      <GameLeaderboard gameId={game.id} />
    </Suspense>
  ) : undefined;
  return <GameDetailScreen game={game} leaderboard={leaderboard} />;
}
