import { FallingBlocksPlayer } from "@/features/arcade/falling-blocks/components/FallingBlocksPlayer";
import { getGameById } from "@/features/games/lib/game-params";

export default function FallingBlocksPlayerPage() {
  return <FallingBlocksPlayer game={getGameById("falling-blocks")} />;
}
