"use client";

import { useEffect, useEffectEvent } from "react";

/** Same cap as the original games: a long frame never advances more than 50 ms. */
export const MAX_DT = 0.05;

/**
 * Runs `onFrame(dt)` on every animation frame while not paused, with `dt` in seconds capped at MAX_DT.
 * The first frame after starting or resuming gets dt = 0, so paused time never counts.
 * The frame is cancelled when pausing or unmounting.
 */
export function useGameLoop(onFrame: (dt: number) => void, paused: boolean) {
  const frame = useEffectEvent(onFrame);

  useEffect(() => {
    if (paused) return;
    let last: number | null = null;
    let id = requestAnimationFrame(function loop(ts: number) {
      const dt = last === null ? 0 : Math.min((ts - last) / 1000, MAX_DT);
      last = ts;
      frame(dt);
      id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [paused]);
}
