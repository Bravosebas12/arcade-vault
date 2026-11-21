import type { CSSProperties } from "react";

// Real games render their canvas inside the prototype CRT, whose .crt-screen is 4:3 and as wide as
// the player (up to 1004px), so the arena outgrew the viewport. ArcadePlayer narrows the CRT frame
// instead, so every real game inherits the fit; the simulated player keeps the prototype size.

/** Logical canvas width shared by the real games: the screen is never upscaled past it. */
export const ARCADE_LOGICAL_WIDTH = 800;

/**
 * Vertical space around the CRT screen on desktop: nav (70 at 1440px, 85 at 1280px) + player top
 * margin (32) + player HUD (73) + HUD margin (18) + CRT padding (2 × 24) + bottom bar margin and
 * line (14 + 12) + the CRT outer shadow (7) and a little slack.
 */
const CHROME_HEIGHT_PX = 300;

/** Smallest screen width, so very short viewports (landscape phones) keep a playable arena. */
const MIN_SCREEN_WIDTH_PX = 320;

/** CRT padding on each side (.crt in globals.css). */
const CRT_PADDING_PX = 24;

/** 4:3 screen width that fits the viewport height, capped at the logical canvas width. */
const SCREEN_WIDTH = `min(${ARCADE_LOGICAL_WIDTH}px, max(${MIN_SCREEN_WIDTH_PX}px, calc((100dvh - ${CHROME_HEIGHT_PX}px) * 4 / 3)))`;

/** Inline style for the real games' CRT frame: centered, as wide as the fitted screen plus its padding. */
export const ARCADE_CRT_FIT_STYLE: CSSProperties = {
  maxWidth: `calc(${SCREEN_WIDTH} + ${2 * CRT_PADDING_PX}px)`,
  marginInline: "auto",
};
