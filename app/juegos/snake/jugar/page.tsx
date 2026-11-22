import { SnakePlayer } from "@/features/arcade/snake/components/SnakePlayer";
import { getGameById } from "@/features/games/lib/game-params";

export default function SnakePlayerPage() {
  return <SnakePlayer game={getGameById("snake")} />;
}
