import { BrickBreakerPlayer } from "@/features/arcade/brick-breaker/components/BrickBreakerPlayer";
import { getGameById } from "@/features/games/lib/game-params";

export default function BrickBreakerPlayerPage() {
  return <BrickBreakerPlayer game={getGameById("brick-breaker")} />;
}
