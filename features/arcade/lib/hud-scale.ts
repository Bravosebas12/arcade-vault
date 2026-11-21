/** Largest HUD magnification: keeps the texts inside the canvas on the narrowest screens. */
export const MAX_HUD_SCALE = 2.4;

/**
 * Factor for the in-canvas HUD and texts so they keep their logical size on screen when the
 * canvas is displayed smaller than its logical width. Never shrinks them (minimum 1).
 */
export function hudScale(logicalWidth: number, displayedWidth: number): number {
  if (!(displayedWidth > 0)) return 1;
  return Math.min(MAX_HUD_SCALE, Math.max(1, logicalWidth / displayedWidth));
}
