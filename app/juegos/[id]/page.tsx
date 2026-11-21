import { GameDetailScreen } from "@/features/game-detail/components/GameDetailScreen";
import { allGameStaticParams, resolveGame } from "@/features/games/lib/game-params";

export const generateStaticParams = allGameStaticParams;

export default async function GameDetailPage({ params }: PageProps<"/juegos/[id]">) {
  const game = await resolveGame(params);
  return <GameDetailScreen game={game} />;
}
