import { Suspense } from "react";
import { PLAYABLE_GAME_IDS } from "@/features/arcade/playable";
import { BestScoreSlot, GameLeaderboard, SeededLeaderboard } from "@/features/game-detail/components/GameLeaderboard";
import { GameDetailScreen } from "@/features/game-detail/components/GameDetailScreen";
import { allGameStaticParams, resolveGame } from "@/features/games/lib/game-params";

export const generateStaticParams = allGameStaticParams;

const playable: readonly string[] = PLAYABLE_GAME_IDS;

export default async function GameDetailPage({ params }: PageProps<"/juegos/[id]">) {
  const game = await resolveGame(params);
  // Real games read their leaderboard (and its top score for "MEJOR GLOBAL", same memoized query) at
  // request time inside <Suspense>, so the rest of the page stays prerendered; simulated games keep the
  // seeded rows and the catalog figure and never query Supabase.
  if (!playable.includes(game.id)) return <GameDetailScreen game={game} />;
  return (
    <GameDetailScreen
      game={game}
      // "—" while streaming, never the catalog figure, which only stands in when Supabase is unavailable.
      best={<BestScoreSlot game={game} />}
      leaderboard={
        <Suspense fallback={<SeededLeaderboard gameId={game.id} />}>
          <GameLeaderboard gameId={game.id} />
        </Suspense>
      }
    />
  );
}
