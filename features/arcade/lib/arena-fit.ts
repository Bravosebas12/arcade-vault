import type { CSSProperties } from "react";

// Real games render their canvas inside the prototype CRT, whose .crt-screen is 4:3 and as wide as
// the player (up to 1004px), so the arena outgrew the viewport. ArcadePlayer narrows the CRT frame
// to the game's canvas proportion instead, so every real game inherits the fit; the simulated
// player keeps the prototype size.

/** Logical canvas size of a real game: the screen keeps its proportion and is never upscaled past it. */
export type ArenaSize = { width: number; height: number };

/** Logical canvas size of the first real game (Asteroids, 4:3); the default proportion. */
export const DEFAULT_ARENA_SIZE: ArenaSize = { width: 800, height: 600 };

/**
 * Vertical space around the CRT screen on desktop: nav (70 at 1440px, 85 at 1280px) + player top
 * margin (32) + player HUD (73) + HUD margin (18) + CRT padding (2 × 24) + bottom bar margin and
 * line (14 + 12) + the CRT outer shadow (7) and a little slack.
 */
const CHROME_HEIGHT_PX = 300;

/** Smallest screen height, so very short viewports (landscape phones) keep a playable arena. */
const MIN_SCREEN_HEIGHT_PX = 240;

/** CRT padding on each side (.crt in globals.css). */
const CRT_PADDING_PX = 24;

/**
 * Screen size for a viewport, with the same formula as the CSS of arcadeArenaFit: as tall as the
 * viewport height minus the chrome allows (at least MIN_SCREEN_HEIGHT_PX), never wider than the
 * available width nor larger than the logical canvas. `available.width` is the room for the screen
 * (inside the CRT padding) and `available.height` the viewport height.
 */
export function fitArenaScreen(arena: ArenaSize, available: ArenaSize): ArenaSize {
  const heightFit = (Math.max(MIN_SCREEN_HEIGHT_PX, available.height - CHROME_HEIGHT_PX) * arena.width) / arena.height;
  const width = Math.min(arena.width, heightFit, available.width);
  return { width, height: (width * arena.height) / arena.width };
}

/**
 * Inline styles for the real games' CRT: the frame is centered and as wide as the fitted screen
 * plus its padding (a block element, so the available width limits it too), and the screen takes
 * the canvas proportion instead of the prototype 4:3.
 */
export function arcadeArenaFit(arena: ArenaSize): { frame: CSSProperties; screen: CSSProperties } {
  const minWidth = (MIN_SCREEN_HEIGHT_PX * arena.width) / arena.height;
  const screenWidth = `min(${arena.width}px, max(${minWidth}px, calc((100dvh - ${CHROME_HEIGHT_PX}px) * ${arena.width} / ${arena.height})))`;
  return {
    frame: { maxWidth: `calc(${screenWidth} + ${2 * CRT_PADDING_PX}px)`, marginInline: "auto" },
    screen: { aspectRatio: `${arena.width} / ${arena.height}` },
  };
}
