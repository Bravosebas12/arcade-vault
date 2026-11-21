// Drawing of references/started-games/03-tetris/ with the app's neon palette: the board keeps the
// original piece colors, and its HTML side panel and overlay are drawn inside the canvas.
import { BLOCK, COLS, GHOST_ALPHA, H, PIECE_COLORS, ROWS, W } from "@/features/arcade/falling-blocks/engine/constants";
import { fallingBlocksStats, ghostY, type FallingBlocksState } from "@/features/arcade/falling-blocks/engine/state";
import type { ArcadePalette } from "@/features/arcade/lib/palette";

/** Same family stacks as the --mono and --pixel tokens. */
const MONO = '"JetBrains Mono", "Courier Prime", "Courier New", monospace';
const PIXEL = '"Press Start 2P", system-ui, monospace';

const BOARD_W = COLS * BLOCK;
const BOARD_H = ROWS * BLOCK;

/** Side column layout (logical px): padding, NEXT preview block size and grid (4×4, as the original). */
const PANEL_PAD = 10;
const PANEL_X = BOARD_W + PANEL_PAD;
const PANEL_INNER = W - BOARD_W - 2 * PANEL_PAD;
const NEXT_BLOCK = 24;
const NEXT_GRID = 4;

/** The column is 120 px wide and 600 px tall: beyond this scale its texts would not fit. */
const MAX_PANEL_SCALE = 1.7;

/** Original top highlight of each block. */
const HIGHLIGHT = "rgba(255,255,255,0.12)";

const CONTROLS: readonly [keys: string, label: string][] = [
  ["← →", "mover"],
  ["↑", "rotar"],
  ["↓", "bajar"],
  ["Space", "caída"],
  ["P", "pausa"],
];

/** Sets the font, shrinking it so `text` fits in `maxWidth`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, size: number, family: string, maxWidth: number, weight = "") {
  const font = (px: number) => `${weight ? weight + " " : ""}${px}px ${family}`;
  ctx.font = font(size);
  const width = ctx.measureText(text).width;
  if (width > maxWidth) ctx.font = font(Math.floor((size * maxWidth) / width));
}

function drawBlock(ctx: CanvasRenderingContext2D, px: number, py: number, size: number, colorIndex: number, alpha = 1) {
  const color = PIECE_COLORS[colorIndex];
  if (!color) return;
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(px + 1, py + 1, size - 2, size - 2);
  ctx.fillStyle = HIGHLIGHT;
  ctx.fillRect(px + 1, py + 1, size - 2, Math.max(2, Math.round((size * 4) / BLOCK)));
  ctx.globalAlpha = 1;
}

function drawGrid(ctx: CanvasRenderingContext2D, palette: ArcadePalette) {
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  for (let c = 1; c < COLS; c++) {
    ctx.moveTo(c * BLOCK, 0);
    ctx.lineTo(c * BLOCK, BOARD_H);
  }
  for (let r = 1; r < ROWS; r++) {
    ctx.moveTo(0, r * BLOCK);
    ctx.lineTo(BOARD_W, r * BLOCK);
  }
  ctx.stroke();
}

function drawPiece(ctx: CanvasRenderingContext2D, shape: number[][], x: number, y: number, alpha = 1) {
  shape.forEach((row, r) => row.forEach((cell, c) => drawBlock(ctx, (x + c) * BLOCK, (y + r) * BLOCK, BLOCK, cell, alpha)));
}

function drawBoard(ctx: CanvasRenderingContext2D, state: FallingBlocksState, palette: ArcadePalette) {
  drawGrid(ctx, palette);
  state.board.forEach((row, r) => row.forEach((cell, c) => drawBlock(ctx, c * BLOCK, r * BLOCK, BLOCK, cell)));
  // After the game over the original kept the last frame, without the piece that did not fit.
  if (state.phase === "gameover") return;
  const { current } = state;
  drawPiece(ctx, current.shape, current.x, ghostY(state), GHOST_ALPHA);
  drawPiece(ctx, current.shape, current.x, current.y);
}

function drawLabel(ctx: CanvasRenderingContext2D, text: string, y: number, s: number, palette: ArcadePalette) {
  fitFont(ctx, text, 8 * s, PIXEL, PANEL_INNER);
  ctx.fillStyle = palette.inkDim;
  ctx.fillText(text, PANEL_X, y);
}

function drawNext(ctx: CanvasRenderingContext2D, state: FallingBlocksState, top: number, palette: ArcadePalette) {
  const size = NEXT_GRID * NEXT_BLOCK;
  const left = PANEL_X + (PANEL_INNER - size) / 2;
  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 1;
  ctx.strokeRect(left + 0.5, top + 0.5, size - 1, size - 1);
  const { shape } = state.next;
  const offX = Math.floor((NEXT_GRID - shape[0].length) / 2);
  const offY = Math.floor((NEXT_GRID - shape.length) / 2);
  shape.forEach((row, r) =>
    row.forEach((cell, c) => drawBlock(ctx, left + (offX + c) * NEXT_BLOCK, top + (offY + r) * NEXT_BLOCK, NEXT_BLOCK, cell)),
  );
  return size;
}

// The column sizes and offsets below are logical px at scale 1; `s` enlarges the texts when the
// canvas is displayed narrower than W (phones), up to what the 120×600 column can hold.

function drawPanel(ctx: CanvasRenderingContext2D, state: FallingBlocksState, hudScale: number, palette: ArcadePalette) {
  const s = Math.min(hudScale, MAX_PANEL_SCALE);
  // Same GameStats the canvas notifies to React, so the column and the player HUD always match.
  const { score, level } = fallingBlocksStats(state);

  ctx.strokeStyle = palette.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(BOARD_W + 1, 0);
  ctx.lineTo(BOARD_W + 1, H);
  ctx.stroke();

  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  let y = 14;

  for (const [label, value] of [["SCORE", score], ["LINES", state.lines], ["LEVEL", level]] as const) {
    y += 8 * s;
    drawLabel(ctx, label, y, s, palette);
    y += 24 * s;
    fitFont(ctx, String(value), 18 * s, MONO, PANEL_INNER, "bold");
    ctx.fillStyle = palette.cyan;
    ctx.fillText(String(value), PANEL_X, y);
    y += 16 * s;
  }

  y += 8 * s;
  drawLabel(ctx, "NEXT", y, s, palette);
  y += 8 * s;
  y += drawNext(ctx, state, y, palette) + 16 * s;

  y += 8 * s;
  drawLabel(ctx, "CONTROLS", y, s, palette);
  y += 6 * s;
  for (const [keys, label] of CONTROLS) {
    y += 16 * s;
    const text = `${keys} ${label}`;
    fitFont(ctx, text, 11 * s, MONO, PANEL_INNER);
    ctx.fillStyle = palette.magenta;
    ctx.fillText(keys, PANEL_X, y);
    ctx.fillStyle = palette.ink;
    ctx.fillText(` ${label}`, PANEL_X + ctx.measureText(keys).width, y);
  }
}

/** Original overlay: dims the board and shows a title and an optional line below it. */
function drawOverlay(ctx: CanvasRenderingContext2D, title: string, sub: string, centerY: number, s: number, palette: ArcadePalette) {
  ctx.fillStyle = "rgba(10, 10, 20, 0.75)";
  ctx.fillRect(0, 0, BOARD_W, BOARD_H);
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const maxWidth = BOARD_W - 2 * PANEL_PAD;
  fitFont(ctx, title, 22 * s, PIXEL, maxWidth);
  ctx.fillStyle = palette.magenta;
  ctx.fillText(title, BOARD_W / 2, centerY);
  if (sub) {
    fitFont(ctx, sub, 16 * s, MONO, maxWidth);
    ctx.fillStyle = palette.ink;
    ctx.fillText(sub, BOARD_W / 2, centerY + 32 * s);
  }
}

/**
 * Draws the board, the ghost and current piece, the side column (SCORE, LINES, LEVEL, NEXT,
 * CONTROLS) and the "PAUSA" or "GAME OVER" / "Puntuación: X" screens. `hudScale` (see
 * features/arcade/lib/hud-scale.ts) only enlarges the texts.
 */
export function drawFallingBlocks(
  ctx: CanvasRenderingContext2D,
  state: FallingBlocksState,
  palette: ArcadePalette,
  options: { paused: boolean; hudScale?: number },
) {
  const s = options.hudScale ?? 1;
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);

  drawBoard(ctx, state, palette);
  drawPanel(ctx, state, s, palette);

  if (state.phase === "gameover") drawOverlay(ctx, "GAME OVER", `Puntuación: ${state.score}`, BOARD_H / 2, s, palette);
  // Above the center, so the CRT "EN PAUSA" shown over the canvas does not cover it.
  else if (options.paused) drawOverlay(ctx, "PAUSA", "", BOARD_H / 4, s, palette);
}
