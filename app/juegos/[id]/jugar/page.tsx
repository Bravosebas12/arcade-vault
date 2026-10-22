import { gameStaticParams, resolveGame } from "@/features/games/lib/game-params";
import { PlayerScreen } from "@/features/player/components/PlayerScreen";

export const generateStaticParams = gameStaticParams;

export default async function PlayerPage({ params }: PageProps<"/juegos/[id]/jugar">) {
  const game = await resolveGame(params);
  return <PlayerScreen game={game} />;
}
