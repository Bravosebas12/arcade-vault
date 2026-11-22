"use client";

import { ArcadePlayer } from "@/features/arcade/components/ArcadePlayer";
import { H, W } from "@/features/arcade/snake/engine/constants";
import { SnakeCanvas } from "@/features/arcade/snake/components/SnakeCanvas";
import type { Game } from "@/features/games/model/game";

/** Logical size of the prototype canvas: 28×20 cells of 24 px plus the 40 px HUD. */
const ARENA = { width: W, height: H };

export function SnakePlayer({ game }: { game: Game }) {
  return <ArcadePlayer game={game} Canvas={SnakeCanvas} arena={ARENA} />;
}
