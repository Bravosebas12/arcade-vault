"use client";

import { BrickBreakerCanvas } from "@/features/arcade/brick-breaker/components/BrickBreakerCanvas";
import { ArcadePlayer } from "@/features/arcade/components/ArcadePlayer";
import type { Game } from "@/features/games/model/game";

/** Default arena (800×600), the size of the original canvas. */
export function BrickBreakerPlayer({ game }: { game: Game }) {
  return <ArcadePlayer game={game} Canvas={BrickBreakerCanvas} />;
}
