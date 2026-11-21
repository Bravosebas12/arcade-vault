"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { H, W } from "@/features/arcade/falling-blocks/engine/constants";
import { drawFallingBlocks } from "@/features/arcade/falling-blocks/engine/render";
import {
  applyFallingBlocksAction,
  createFallingBlocksState,
  fallingBlocksStats,
  stepFallingBlocks,
  type FallingBlocksAction,
  type FallingBlocksState,
} from "@/features/arcade/falling-blocks/engine/state";
import { hudScale } from "@/features/arcade/lib/hud-scale";
import { DEFAULT_ARCADE_PALETTE, readArcadePalette } from "@/features/arcade/lib/palette";
import { createRng } from "@/features/arcade/lib/rng";
import { useGameLoop } from "@/features/arcade/lib/use-game-loop";
import { useKeyDown } from "@/features/arcade/lib/use-keys";
import type { ArcadeCanvasProps, GameStats } from "@/features/arcade/model/arcade-game";

type Run = {
  state: FallingBlocksState;
  rng: () => number;
  /** Last stats notified to React. */
  stats: GameStats;
  /** onGameOver already sent: the game no longer advances. */
  over: boolean;
};

/** Original controls; P (and Escape) belong to the container's pause. */
const KEY_ACTIONS: Readonly<Record<string, FallingBlocksAction>> = {
  ArrowLeft: "left",
  ArrowRight: "right",
  ArrowDown: "softDrop",
  ArrowUp: "rotate",
  KeyX: "rotate",
  Space: "hardDrop",
};

const sameStats = (a: GameStats, b: GameStats) => a.score === b.score && a.lives === b.lives && a.level === b.level;

/** Falling blocks canvas: owns the game state, loop and keyboard; obeys the container through ArcadeCanvasProps. */
export function FallingBlocksCanvas({ paused, runId, onStats, onGameOver }: ArcadeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run | null>(null);
  const paletteRef = useRef(DEFAULT_ARCADE_PALETTE);
  /** Enlarges the in-canvas texts when the canvas is displayed narrower than W (phones). */
  const hudScaleRef = useRef(1);
  const pausedRef = useRef(paused);

  const paint = (state: FallingBlocksState) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (ctx) drawFallingBlocks(ctx, state, paletteRef.current, { paused: pausedRef.current, hudScale: hudScaleRef.current });
  };

  /** Stores a new state, paints it and notifies React only of what changed. */
  const commit = (run: Run, state: FallingBlocksState) => {
    run.state = state;
    paint(state);
    const stats = fallingBlocksStats(state);
    if (!sameStats(stats, run.stats)) {
      run.stats = stats;
      onStats(stats);
    }
    if (state.phase === "gameover") {
      run.over = true;
      onGameOver(stats);
    }
  };

  // Follows the displayed width; repaints so a paused or finished game also updates its texts.
  const onResize = useEffectEvent((displayedWidth: number) => {
    const scale = hudScale(W, displayedWidth);
    if (scale === hudScaleRef.current) return;
    hudScaleRef.current = scale;
    if (runRef.current) paint(runRef.current.state);
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onResize(canvas.getBoundingClientRect().width);
    const observer = new ResizeObserver(([entry]) => onResize(entry.contentRect.width));
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  // The CSS tokens are only reliable after mounting.
  const repaint = useEffectEvent(() => {
    if (runRef.current) paint(runRef.current.state);
  });

  useEffect(() => {
    paletteRef.current = readArcadePalette();
    repaint();
  }, []);

  // The loop is frozen while paused, so the "PAUSA" screen is painted (and removed) here.
  useEffect(() => {
    pausedRef.current = paused;
    repaint();
  }, [paused]);

  // A new game on mount (also when the route is shown again) and on every "JUGAR DE NUEVO".
  const startRun = useEffectEvent((seed: number) => {
    const rng = createRng(seed);
    const state = createFallingBlocksState(rng);
    const stats = fallingBlocksStats(state);
    runRef.current = { state, rng, stats, over: false };
    paint(state);
    onStats(stats);
  });

  useEffect(() => {
    startRun(Date.now() + runId);
  }, [runId]);

  // Every keydown, including the OS auto-repeat of a held key, is one action, as in the original.
  useKeyDown(!paused, (code) => {
    const run = runRef.current;
    const action = KEY_ACTIONS[code];
    if (!run || run.over || !action) return;
    commit(run, applyFallingBlocksAction(run.state, action, run.rng));
  });

  useGameLoop((dt) => {
    const run = runRef.current;
    if (!run || run.over) return;
    commit(run, stepFallingBlocks(run.state, dt, run.rng));
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
