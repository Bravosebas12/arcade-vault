"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { H, W } from "@/features/arcade/brick-breaker/engine/constants";
import { drawBrickBreaker } from "@/features/arcade/brick-breaker/engine/render";
import { SPRITESHEET_URL } from "@/features/arcade/brick-breaker/engine/sprites";
import {
  brickBreakerStats,
  createBrickBreakerState,
  stepBrickBreaker,
  type BrickBreakerEvent,
  type BrickBreakerState,
} from "@/features/arcade/brick-breaker/engine/state";
import { hudScale } from "@/features/arcade/lib/hud-scale";
import { DEFAULT_ARCADE_PALETTE, readArcadePalette } from "@/features/arcade/lib/palette";
import { useGameLoop } from "@/features/arcade/lib/use-game-loop";
import { useKeys } from "@/features/arcade/lib/use-keys";
import type { ArcadeCanvasProps, GameStats } from "@/features/arcade/model/arcade-game";

type Run = {
  state: BrickBreakerState;
  /** Last stats notified to React. */
  stats: GameStats;
  /** onGameOver already sent: the game no longer advances. */
  over: boolean;
};

const SOUND_URLS: Record<BrickBreakerEvent, string> = {
  bounce: "/games/brick-breaker/sounds/ball-bounce.mp3",
  break: "/games/brick-breaker/sounds/break-sound.mp3",
};

const sameStats = (a: GameStats, b: GameStats) => a.score === b.score && a.lives === b.lives && a.level === b.level;

/**
 * Brick breaker canvas: owns the game state, loop, keyboard, mouse and sounds; obeys the container
 * through ArcadeCanvasProps. P and Escape belong to the container's pause.
 */
export function BrickBreakerCanvas({ paused, runId, onStats, onGameOver }: ArcadeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const runRef = useRef<Run | null>(null);
  const paletteRef = useRef(DEFAULT_ARCADE_PALETTE);
  /** Enlarges the in-canvas texts when the canvas is displayed narrower than W (phones). */
  const hudScaleRef = useRef(1);
  const pausedRef = useRef(paused);
  const sheetRef = useRef<HTMLImageElement | null>(null);
  const soundsRef = useRef<Partial<Record<BrickBreakerEvent, HTMLAudioElement>>>({});
  /** Last mouse x in logical coordinates, consumed by the next step. */
  const pointerXRef = useRef<number | null>(null);
  const [sheetLoaded, setSheetLoaded] = useState(false);
  const keys = useKeys(!paused);

  const paint = (state: BrickBreakerState) => {
    const ctx = canvasRef.current?.getContext("2d");
    const sheet = sheetRef.current;
    if (ctx && sheet) drawBrickBreaker(ctx, state, sheet, paletteRef.current, { paused: pausedRef.current, hudScale: hudScaleRef.current });
  };

  const repaint = useEffectEvent(() => {
    if (runRef.current) paint(runRef.current.state);
  });

  /** A rejected play() (autoplay policy) is ignored. */
  const playSounds = (events: readonly BrickBreakerEvent[]) => {
    for (const event of events) {
      const audio = soundsRef.current[event];
      if (!audio) continue;
      const clone = audio.cloneNode() as HTMLAudioElement;
      clone.play().catch(() => {});
    }
  };

  // The loop does not start until the spritesheet has loaded.
  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      sheetRef.current = img;
      setSheetLoaded(true);
      repaint();
    };
    img.src = SPRITESHEET_URL;
    return () => {
      img.onload = null;
    };
  }, []);

  // Sounds are created on mount and released on unmount.
  useEffect(() => {
    const sounds = { bounce: new Audio(SOUND_URLS.bounce), break: new Audio(SOUND_URLS.break) };
    soundsRef.current = sounds;
    return () => {
      soundsRef.current = {};
      for (const audio of Object.values(sounds)) {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      }
    };
  }, []);

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

  // The loop is frozen while paused, so the "PAUSA" screen is painted (and removed) here.
  useEffect(() => {
    pausedRef.current = paused;
    pointerXRef.current = null;
    repaint();
  }, [paused]);

  // The mouse centers the paddle on the pointer, converted to logical coordinates; ignored while paused.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || paused) return;
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0) pointerXRef.current = ((e.clientX - rect.left) * W) / rect.width;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    return () => canvas.removeEventListener("mousemove", onMouseMove);
  }, [paused]);

  // A new game on mount (also when the route is shown again) and on every "JUGAR DE NUEVO".
  const startRun = useEffectEvent(() => {
    const state = createBrickBreakerState();
    const stats = brickBreakerStats(state);
    runRef.current = { state, stats, over: false };
    pointerXRef.current = null;
    paint(state);
    onStats(stats);
  });

  useEffect(() => {
    startRun();
  }, [runId]);

  useGameLoop((dt) => {
    const run = runRef.current;
    if (!run || run.over) return;
    const input = { left: keys.isDown("ArrowLeft"), right: keys.isDown("ArrowRight"), pointerX: pointerXRef.current };
    pointerXRef.current = null;
    run.state = stepBrickBreaker(run.state, input, dt);
    paint(run.state);
    playSounds(run.state.events);

    const stats = brickBreakerStats(run.state);
    if (!sameStats(stats, run.stats)) {
      run.stats = stats;
      onStats(stats);
    }
    if (run.state.phase !== "playing") {
      run.over = true;
      onGameOver(stats);
    }
  }, paused || !sheetLoaded);

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
