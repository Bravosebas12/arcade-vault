"use client";

import { useEffect, useEffectEvent, useRef } from "react";
import { hudScale } from "@/features/arcade/lib/hud-scale";
import { DEFAULT_ARCADE_PALETTE, readArcadePalette } from "@/features/arcade/lib/palette";
import { useGameLoop } from "@/features/arcade/lib/use-game-loop";
import { createRng } from "@/features/arcade/lib/rng";
import { useKeyDown } from "@/features/arcade/lib/use-keys";
import type { ArcadeCanvasProps, GameStats } from "@/features/arcade/model/arcade-game";
import { H, W, type Direction } from "@/features/arcade/snake/engine/constants";
import { buildFruitAtlas, drawSnakeGame, type FruitAtlas } from "@/features/arcade/snake/engine/render";
import { createSnakeState, snakeStats, stepSnake, type SnakeEvent, type SnakeState } from "@/features/arcade/snake/engine/state";

type Run = {
  state: SnakeState;
  rng: () => number;
  /** Last stats notified to React. */
  stats: GameStats;
  /** onGameOver already sent: the game no longer advances. */
  over: boolean;
};

const KEY_DIRS: Record<string, Direction> = {
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowLeft: "left",
  ArrowRight: "right",
  KeyW: "up",
  KeyS: "down",
  KeyA: "left",
  KeyD: "right",
};

const sameStats = (a: GameStats, b: GameStats) => a.score === b.score && a.lives === b.lives && a.level === b.level;

/** Synthesized beeps of the prototype: frequency (Hz), duration (s), wave, volume, slide target and delay. */
type Beep = [freq: number, dur: number, type?: OscillatorType, vol?: number, slideTo?: number | null, delay?: number];
const SOUNDS: Record<SnakeEvent, Beep[]> = {
  eat: [[660, 0.07]],
  bonus: [[784, 0.08], [1046, 0.12, "square", 0.05, null, 0.08]],
  die: [[300, 0.4, "sawtooth", 0.06, 60]],
  level: [523, 659, 784, 1046].map((f, i): Beep => [f, 0.09, "square", 0.05, null, i * 0.09]),
};

function playBeep(actx: AudioContext, [freq, dur, type = "square", vol = 0.05, slideTo = null, delay = 0]: Beep) {
  const t0 = actx.currentTime + delay;
  const osc = actx.createOscillator();
  const gain = actx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  gain.gain.setValueAtTime(vol, t0);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(gain).connect(actx.destination);
  osc.start(t0);
  osc.stop(t0 + dur);
}

/**
 * Serpentina canvas: owns the game state, loop, keyboard and WebAudio beeps; obeys the container
 * through ArcadeCanvasProps. P and Escape belong to the container's pause.
 */
export function SnakeCanvas({ paused, runId, onStats, onGameOver }: ArcadeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run | null>(null);
  const paletteRef = useRef(DEFAULT_ARCADE_PALETTE);
  /** Enlarges the in-canvas texts when the canvas is displayed narrower than W (phones). */
  const hudScaleRef = useRef(1);
  const pausedRef = useRef(paused);
  const atlasRef = useRef<FruitAtlas | null>(null);
  /** Turn presses since the last frame, consumed by the next step. */
  const turnsRef = useRef<Direction[]>([]);
  const audioRef = useRef<AudioContext | null>(null);

  const paint = (state: SnakeState) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    // The fruit atlas is painted on the first frame drawn (always after mounting).
    const atlas = (atlasRef.current ??= buildFruitAtlas());
    if (atlas) drawSnakeGame(ctx, state, atlas, paletteRef.current, { paused: pausedRef.current, hudScale: hudScaleRef.current });
  };

  const repaint = useEffectEvent(() => {
    if (runRef.current) paint(runRef.current.state);
  });

  // The AudioContext is created on the first key press (autoplay policy) and closed on unmount.
  useEffect(() => {
    return () => {
      audioRef.current?.close().catch(() => {});
      audioRef.current = null;
    };
  }, []);

  const playSounds = (events: readonly SnakeEvent[]) => {
    const actx = audioRef.current;
    if (!actx) return;
    for (const event of events) for (const beep of SOUNDS[event]) playBeep(actx, beep);
  };

  useKeyDown(!paused, (code) => {
    if (!audioRef.current && typeof AudioContext !== "undefined") audioRef.current = new AudioContext();
    const dir = KEY_DIRS[code];
    if (dir) turnsRef.current.push(dir);
  });

  // Follows the displayed width; repaints so a paused or finished game also updates its texts.
  const onResize = useEffectEvent((displayedWidth: number) => {
    const scale = hudScale(W, displayedWidth);
    if (scale === hudScaleRef.current) return;
    hudScaleRef.current = scale;
    repaint();
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
  useEffect(() => {
    paletteRef.current = readArcadePalette();
    repaint();
  }, []);

  // The loop is frozen while paused, so the dimmed board is painted (and removed) here.
  // Presses made while paused are dropped.
  useEffect(() => {
    pausedRef.current = paused;
    turnsRef.current = [];
    repaint();
  }, [paused]);

  // A new game on mount (also when the route is shown again) and on every "JUGAR DE NUEVO".
  const startRun = useEffectEvent((seed: number) => {
    const rng = createRng(seed);
    const state = createSnakeState(rng);
    const stats = snakeStats(state);
    runRef.current = { state, rng, stats, over: false };
    turnsRef.current = [];
    paint(state);
    onStats(stats);
  });

  useEffect(() => {
    startRun(Date.now() + runId);
  }, [runId]);

  useGameLoop((dt) => {
    const run = runRef.current;
    if (!run || run.over) return;
    const turns = turnsRef.current;
    turnsRef.current = [];
    run.state = stepSnake(run.state, { turns }, dt, run.rng);
    paint(run.state);
    playSounds(run.state.events);

    const stats = snakeStats(run.state);
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
