"use client";

import { ArcadePlayer } from "@/features/arcade/components/ArcadePlayer";
import { FallingBlocksCanvas } from "@/features/arcade/falling-blocks/components/FallingBlocksCanvas";
import { H, W } from "@/features/arcade/falling-blocks/engine/constants";
import type { Game } from "@/features/games/model/game";

/** The CRT takes the canvas proportion (420 / 600, 7:10). */
const ARENA = { width: W, height: H };

export function FallingBlocksPlayer({ game }: { game: Game }) {
  return <ArcadePlayer game={game} Canvas={FallingBlocksCanvas} arena={ARENA} />;
}
