"use client";

import { AsteroidsCanvas } from "@/features/arcade/asteroids/components/AsteroidsCanvas";
import { ArcadePlayer } from "@/features/arcade/components/ArcadePlayer";
import type { Game } from "@/features/games/model/game";

export function AsteroidsPlayer({ game }: { game: Game }) {
  return <ArcadePlayer game={game} Canvas={AsteroidsCanvas} />;
}
