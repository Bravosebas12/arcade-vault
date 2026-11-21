import { AsteroidsPlayer } from "@/features/arcade/asteroids/components/AsteroidsPlayer";
import { getGameById } from "@/features/games/lib/game-params";

export default function AsteroidsPlayerPage() {
  return <AsteroidsPlayer game={getGameById("asteroids")} />;
}
