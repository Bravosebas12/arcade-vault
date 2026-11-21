// Drawing of references/started-games/04-arkanoid/game.js: original sprites on the app's neon
// background, with the HUD and overlay texts in the neon palette. The level-jump buttons of the
// original pause screen are not drawn (the container owns the pause).
import { BALL, EXPLOSION_DURATION, GRID, H, PADDLE, W } from "@/features/arcade/brick-breaker/engine/constants";
import { EXPLOSION_FRAMES, SPRITES, type SpriteFrame } from "@/features/arcade/brick-breaker/engine/sprites";
import { brickBreakerStats, type BrickBreakerState } from "@/features/arcade/brick-breaker/engine/state";
import type { ArcadePalette } from "@/features/arcade/lib/palette";

/** Same family stacks as the --mono and --pixel tokens. */
const MONO = '"JetBrains Mono", "Courier Prime", "Courier New", monospace';
const PIXEL = '"Press Start 2P", system-ui, monospace';

/** Original HUD layout (logical px at scale 1). */
const HUD_MARGIN = 10;
const HUD_FONT = 18;
const LIFE_SIZE = 16;
const LIFE_GAP = 4;
const TEXT_MARGIN = 24;

function drawFrame(ctx: CanvasRenderingContext2D, sheet: CanvasImageSource, f: SpriteFrame, x: number, y: number, w: number, h: number) {
  ctx.drawImage(sheet, f.sx, f.sy, f.sw, f.sh, x, y, w, h);
}

/** Sets the font, shrinking it so `text` fits in `maxWidth`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, size: number, family: string, maxWidth: number, weight = "") {
  const font = (px: number) => `${weight ? weight + " " : ""}${px}px ${family}`;
  ctx.font = font(size);
  const width = ctx.measureText(text).width;
  if (width > maxWidth) ctx.font = font(Math.floor((size * maxWidth) / width));
}

function drawHud(ctx: CanvasRenderingContext2D, state: BrickBreakerState, sheet: CanvasImageSource, s: number, palette: ArcadePalette) {
  // Same GameStats the canvas notifies to React, so both HUDs always match.
  const { score, lives, level } = brickBreakerStats(state);
  const life = LIFE_SIZE * s;
  const livesWidth = (lives ?? 0) * (life + LIFE_GAP * s);
  const columnWidth = (W - 2 * HUD_MARGIN) / 3;

  ctx.fillStyle = palette.ink;
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  fitFont(ctx, `Score: ${score}`, HUD_FONT * s, MONO, columnWidth, "bold");
  ctx.fillText(`Score: ${score}`, HUD_MARGIN, HUD_MARGIN);
  ctx.textAlign = "center";
  fitFont(ctx, `Nivel: ${level}`, HUD_FONT * s, MONO, columnWidth, "bold");
  ctx.fillText(`Nivel: ${level}`, W / 2, HUD_MARGIN);

  // One ball per life, right-aligned.
  for (let i = 0; i < (lives ?? 0); i++) {
    const x = W - HUD_MARGIN - livesWidth + i * (life + LIFE_GAP * s);
    drawFrame(ctx, sheet, SPRITES.ball, x, HUD_MARGIN, life, life);
  }
}

/** Dims the canvas and shows a centered title. */
function drawOverlay(ctx: CanvasRenderingContext2D, title: string, centerY: number, s: number, palette: ArcadePalette) {
  ctx.fillStyle = "rgba(10, 10, 20, 0.7)";
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, title, 32 * s, PIXEL, W - 2 * TEXT_MARGIN);
  ctx.fillStyle = palette.ink;
  ctx.fillText(title, W / 2, centerY);
}

/**
 * Draws the blocks, explosions, paddle, ball and HUD ("Score: X", "Nivel: N", one ball per life),
 * and the "PAUSA", "GAME OVER" or "¡Completaste el juego!" screens. `hudScale` (see
 * features/arcade/lib/hud-scale.ts) only enlarges the texts and the lives.
 */
export function drawBrickBreaker(
  ctx: CanvasRenderingContext2D,
  state: BrickBreakerState,
  sheet: CanvasImageSource,
  palette: ArcadePalette,
  options: { paused: boolean; hudScale?: number },
) {
  const s = options.hudScale ?? 1;
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);

  for (const block of state.blocks) {
    if (block.alive) drawFrame(ctx, sheet, SPRITES.blocks[block.color], block.x, block.y, GRID.blockW, GRID.blockH);
  }

  for (const exp of state.explosions) {
    const frames = EXPLOSION_FRAMES[exp.color];
    const index = Math.min(Math.floor((exp.elapsed / EXPLOSION_DURATION) * frames.length), frames.length - 1);
    drawFrame(ctx, sheet, frames[index], exp.x, exp.y, GRID.blockW, GRID.blockH);
  }

  drawFrame(ctx, sheet, SPRITES.paddle, state.paddleX, PADDLE.y, PADDLE.w, PADDLE.h);
  drawFrame(ctx, sheet, SPRITES.ball, state.ball.x, state.ball.y, BALL.size, BALL.size);

  if (state.phase === "playing") drawHud(ctx, state, sheet, s, palette);

  if (state.phase === "gameover") drawOverlay(ctx, "GAME OVER", H / 2, s, palette);
  else if (state.phase === "win") drawOverlay(ctx, "¡Completaste el juego!", H / 2, s, palette);
  // Above the center, so the CRT "EN PAUSA" shown over the canvas does not cover it.
  else if (options.paused) drawOverlay(ctx, "PAUSA", H / 4, s, palette);
}
