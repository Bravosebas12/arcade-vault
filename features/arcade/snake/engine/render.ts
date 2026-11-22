// Drawing of references/started-games/05-snake/game.js in the app's neon palette. No title screen,
// own pause text or "ESPACIO PARA REINTENTAR": the container owns those.
import {
  BONUS_BLINK,
  CELL,
  COLS,
  DIRS,
  FRUITS_PER_MAP,
  H,
  HUD_H,
  ROWS,
  W,
  type FruitType,
} from "@/features/arcade/snake/engine/constants";
import { mapFor, wallsOf } from "@/features/arcade/snake/engine/maps";
import { FRUIT_PALETTE, FRUIT_PIXELS, FRUIT_SIZE } from "@/features/arcade/snake/engine/sprites";
import { snakeStats, type SnakeState } from "@/features/arcade/snake/engine/state";
import type { ArcadePalette } from "@/features/arcade/lib/palette";

/** Same family stack as the --pixel token. */
const PIXEL = '"Press Start 2P", system-ui, monospace';
const GOLD = "#ffcf3a";
const HEAD = "#b6ffd9";
const HURT_HEAD = "#ffb3cf";
/** Largest HUD font: keeps the texts inside the 40 px strip when the HUD is magnified. */
const MAX_HUD_FONT = 18;

export type FruitAtlas = { image: CanvasImageSource; crops: Record<FruitType, { x: number; y: number; w: number; h: number }> };

/** Paints the 12×12 fruit pixel maps side by side on an offscreen canvas (call after mounting). */
export function buildFruitAtlas(): FruitAtlas {
  const names = Object.keys(FRUIT_PIXELS) as FruitType[];
  const image = document.createElement("canvas");
  image.width = names.length * FRUIT_SIZE;
  image.height = FRUIT_SIZE;
  const ctx = image.getContext("2d");
  const crops = {} as FruitAtlas["crops"];
  names.forEach((name, i) => {
    FRUIT_PIXELS[name].forEach((row, y) => {
      [...row].forEach((ch, x) => {
        const color = FRUIT_PALETTE[ch];
        if (!ctx || !color) return;
        ctx.fillStyle = color;
        ctx.fillRect(i * FRUIT_SIZE + x, y, 1, 1);
      });
    });
    crops[name] = { x: i * FRUIT_SIZE, y: 0, w: FRUIT_SIZE, h: FRUIT_SIZE };
  });
  return { image, crops };
}

type DrawOptions = { paused: boolean; hudScale: number };

const px = (x: number) => x * CELL;
const py = (y: number) => HUD_H + y * CELL;

function drawFruit(ctx: CanvasRenderingContext2D, atlas: FruitAtlas, type: FruitType, x: number, y: number, size: number) {
  const c = atlas.crops[type];
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(atlas.image, c.x, c.y, c.w, c.h, x, y, size, size);
}

/** Sets the pixel font at `size`, shrinking it so `text` fits in `maxWidth`. */
function fitFont(ctx: CanvasRenderingContext2D, text: string, size: number, maxWidth: number) {
  ctx.font = `${size}px ${PIXEL}`;
  const width = ctx.measureText(text).width;
  if (width > maxWidth) ctx.font = `${Math.floor((size * maxWidth) / width)}px ${PIXEL}`;
}

function glowText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string, glow: number) {
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = glow;
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

function drawHud(ctx: CanvasRenderingContext2D, s: SnakeState, atlas: FruitAtlas, palette: ArcadePalette, scale: number) {
  // Same GameStats the canvas notifies to React, so both HUDs always match.
  const { score, lives, level } = snakeStats(s);
  const font = Math.min(10 * scale, MAX_HUD_FONT);
  const mid = HUD_H / 2;

  ctx.fillStyle = "#0f0f18";
  ctx.fillRect(0, 0, W, HUD_H);
  ctx.fillStyle = palette.line;
  ctx.fillRect(0, HUD_H - 2, W, 2);
  ctx.textBaseline = "middle";

  // Laid out by measured widths so the magnified HUD (phones) never overlaps:
  // score on the left, lives on the right, fruit counter before the lives, map name in between.
  const MARGIN = 12;
  const SPACING = 16;
  ctx.textAlign = "left";

  const scoreText = "PUNTOS " + String(score).padStart(6, "0");
  fitFont(ctx, scoreText, font, W * 0.32);
  glowText(ctx, scoreText, MARGIN, mid, palette.yellow, 6);
  const scoreEnd = MARGIN + ctx.measureText(scoreText).width;

  // One green square per life (room for START_LIVES), right-aligned, then the "VIDAS" label.
  const box = Math.min(10 * scale, 16);
  const gap = box * 0.4;
  for (let i = 0; i < (lives ?? 0); i++) {
    ctx.fillStyle = palette.green;
    ctx.fillRect(W - MARGIN - (i + 1) * box - i * gap, mid - box / 2, box, box);
  }
  const livesText = "VIDAS";
  ctx.font = `${font}px ${PIXEL}`;
  const livesLabelEnd = W - MARGIN - 3 * (box + gap) - 4;
  const livesStart = livesLabelEnd - ctx.measureText(livesText).width;
  glowText(ctx, livesText, livesStart, mid, palette.inkDim, 0);

  const fruitsText = `${s.fruitsInMap}/${FRUITS_PER_MAP}`;
  const icon = Math.min(16 * Math.max(1, scale * 0.8), 24);
  const fruitsWidth = icon + 4 + ctx.measureText(fruitsText).width;
  const fruitsStart = livesStart - SPACING - fruitsWidth;
  drawFruit(ctx, atlas, "apple", fruitsStart, mid - icon / 2, icon);
  glowText(ctx, fruitsText, fruitsStart + icon + 4, mid, palette.ink, 0);

  // The map name is dropped ("MAPA N") when the full text does not fit the space left.
  const room = fruitsStart - scoreEnd - 2 * SPACING;
  const fullMap = `MAPA ${level} · ${mapFor(level).name}`;
  const mapText = ctx.measureText(fullMap).width <= room ? fullMap : `MAPA ${level}`;
  ctx.textAlign = "center";
  fitFont(ctx, mapText, font, room);
  glowText(ctx, mapText, (scoreEnd + fruitsStart) / 2, mid, palette.cyan, 6);
}

function drawBoard(ctx: CanvasRenderingContext2D, s: SnakeState, palette: ArcadePalette) {
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, HUD_H, W, H - HUD_H);
  ctx.strokeStyle = "rgba(0, 245, 255, 0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = 1; x < COLS; x++) {
    ctx.moveTo(px(x) + 0.5, HUD_H);
    ctx.lineTo(px(x) + 0.5, H);
  }
  for (let y = 1; y < ROWS; y++) {
    ctx.moveTo(0, py(y) + 0.5);
    ctx.lineTo(W, py(y) + 0.5);
  }
  ctx.stroke();

  const walls = wallsOf(s.level);
  ctx.fillStyle = palette.magenta;
  ctx.shadowColor = palette.magenta;
  ctx.shadowBlur = 8;
  for (const k of walls) ctx.fillRect(px(k % COLS) + 2, py(Math.floor(k / COLS)) + 2, CELL - 4, CELL - 4);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(10, 10, 15, 0.55)";
  for (const k of walls) ctx.fillRect(px(k % COLS) + 7, py(Math.floor(k / COLS)) + 7, CELL - 14, CELL - 14);
}

function drawItems(ctx: CanvasRenderingContext2D, s: SnakeState, atlas: FruitAtlas) {
  if (s.fruit) drawFruit(ctx, atlas, s.fruit.type, px(s.fruit.x), py(s.fruit.y), CELL);
  if (!s.bonus) return;
  const hidden = s.bonus.t < BONUS_BLINK && Math.floor(s.clock * 8) % 2 === 0;
  if (hidden) return;
  ctx.shadowColor = GOLD;
  ctx.shadowBlur = 14;
  drawFruit(ctx, atlas, s.bonus.type, px(s.bonus.x) - 3, py(s.bonus.y) - 3, CELL + 6);
  ctx.shadowBlur = 0;
}

function drawSnake(ctx: CanvasRenderingContext2D, s: SnakeState, palette: ArcadePalette) {
  const hurt = s.phase === "dying" || s.phase === "gameover";
  if (s.phase === "dying" && Math.floor(s.clock * 10) % 2 === 0) return;
  const body = hurt ? palette.magenta : palette.green;
  ctx.shadowColor = body;
  ctx.shadowBlur = 10;
  s.snake.forEach((c, i) => {
    const inset = i === 0 ? 1 : 3;
    ctx.fillStyle = i === 0 ? (hurt ? HURT_HEAD : HEAD) : body;
    ctx.fillRect(px(c.x) + inset, py(c.y) + inset, CELL - inset * 2, CELL - inset * 2);
  });
  ctx.shadowBlur = 0;

  // Eyes on the head, facing the current direction.
  const head = s.snake[0];
  const d = DIRS[s.dir];
  const cx = px(head.x) + CELL / 2;
  const cy = py(head.y) + CELL / 2;
  const ox = d.y !== 0 ? 5 : 0;
  const oy = d.x !== 0 ? 5 : 0;
  ctx.fillStyle = palette.bg;
  for (const sign of [-1, 1]) ctx.fillRect(cx + d.x * 4 + sign * ox - 2, cy + d.y * 4 + sign * oy - 2, 4, 4);
}

function dim(ctx: CanvasRenderingContext2D, alpha: number) {
  ctx.fillStyle = `rgba(10, 10, 15, ${alpha})`;
  ctx.fillRect(0, HUD_H, W, H - HUD_H);
}

function drawBanner(ctx: CanvasRenderingContext2D, title: string, subtitle: string, titleColor: string, subColor: string, scale: number) {
  const mid = HUD_H + (H - HUD_H) / 2;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, title, 30 * Math.min(scale, 1.6), W - 48);
  glowText(ctx, title, W / 2, mid - 24, titleColor, 16);
  fitFont(ctx, subtitle, 14 * Math.min(scale, 1.8), W - 48);
  glowText(ctx, subtitle, W / 2, mid + 24 * Math.min(scale, 1.4), subColor, 8);
}

export function drawSnakeGame(ctx: CanvasRenderingContext2D, s: SnakeState, atlas: FruitAtlas, palette: ArcadePalette, opts: DrawOptions) {
  drawHud(ctx, s, atlas, palette, opts.hudScale);
  drawBoard(ctx, s, palette);
  drawItems(ctx, s, atlas);
  drawSnake(ctx, s, palette);

  if (s.phase === "intro" || s.phase === "levelup") {
    dim(ctx, 0.45);
    drawBanner(ctx, `MAPA ${s.level}`, mapFor(s.level).name, palette.cyan, palette.yellow, opts.hudScale);
  } else if (s.phase === "gameover") {
    dim(ctx, 0.65);
    drawBanner(ctx, "GAME OVER", "PUNTOS " + String(s.score).padStart(6, "0"), palette.magenta, palette.yellow, opts.hudScale);
  }
  // The container shows "EN PAUSA" on the CRT; the canvas only dims the board. The container also
  // pauses during the game-over delay, when "GAME OVER" must stay bright.
  if (opts.paused && s.phase !== "gameover") dim(ctx, 0.5);
}
