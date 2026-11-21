"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { H, W } from "@/features/arcade/asteroids/engine/constants";
import { drawAsteroids } from "@/features/arcade/asteroids/engine/render";
import { asteroidsStats, createAsteroidsState, stepAsteroids, type AsteroidsState } from "@/features/arcade/asteroids/engine/state";
import { DEFAULT_ARCADE_PALETTE, readArcadePalette } from "@/features/arcade/lib/palette";
import { createRng } from "@/features/arcade/lib/rng";
import { useGameLoop } from "@/features/arcade/lib/use-game-loop";
import { useKeys } from "@/features/arcade/lib/use-keys";
import type { ArcadeCanvasProps, GameStats } from "@/features/arcade/model/arcade-game";

type Run = {
  state: AsteroidsState;
  rng: () => number;
  /** Last stats notified to React. */
  stats: GameStats;
  /** onGameOver already sent: the game no longer advances. */
  over: boolean;
};

const sameStats = (a: GameStats, b: GameStats) => a.score === b.score && a.lives === b.lives && a.level === b.level;

/** Asteroids canvas: owns the game state, loop and keyboard; obeys the container through ArcadeCanvasProps. */
export function AsteroidsCanvas({ paused, runId, onStats, onGameOver }: ArcadeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run | null>(null);
  const paletteRef = useRef(DEFAULT_ARCADE_PALETTE);
  const keys = useKeys(!paused);

  const paint = (state: AsteroidsState) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawAsteroids(ctx, state, paletteRef.current);
  };

  // The CSS tokens are only reliable after mounting.
  useEffect(() => {
    paletteRef.current = readArcadePalette();
  }, []);

  // A new game on mount (also when the route is shown again) and on every "JUGAR DE NUEVO".
  const startRun = useEffectEvent((seed: number) => {
    const rng = createRng(seed);
    const state = createAsteroidsState(rng);
    const stats = asteroidsStats(state);
    runRef.current = { state, rng, stats, over: false };
    paint(state);
    onStats(stats);
  });

  useEffect(() => {
    startRun(Date.now() + runId);
  }, [runId]);

  useGameLoop((dt) => {
    const run = runRef.current;
    if (!run || run.over) return;
    const input = {
      left: keys.isDown("ArrowLeft"),
      right: keys.isDown("ArrowRight"),
      thrust: keys.isDown("ArrowUp"),
      fire: keys.consumePressed("Space"),
    };
    run.state = stepAsteroids(run.state, input, dt, run.rng);
    paint(run.state);

    const stats = asteroidsStats(run.state);
    if (!sameStats(stats, run.stats)) {
      run.stats = stats;
      onStats(stats);
    }
    if (run.state.phase === "gameover") {
      run.over = true;
      onGameOver(stats);
    }
  }, paused);

  return (
    <canvas
      ref={canvasRef}
      width={W}
      height={H}
      aria-label="Partida en curso"
      style={{ display: "block", width: "100%", height: "auto" }}
    />
  );
}
