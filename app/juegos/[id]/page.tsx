import { GameDetailScreen } from "@/features/game-detail/components/GameDetailScreen";
import { gameStaticParams, resolveGame } from "@/features/games/lib/game-params";

export const generateStaticParams = gameStaticParams;

export default async function GameDetailPage({ params }: PageProps<"/juegos/[id]">) {
  const game = await resolveGame(params);
  return <GameDetailScreen game={game} />;
}
