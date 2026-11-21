// The 5 patterns of references/started-games/04-arkanoid/levels.js, generated with the same rules.
import type { BlockColor } from "@/features/arcade/brick-breaker/engine/constants";

export type LevelBlock = { col: number; row: number; color: BlockColor };
export type Level = { speed: number; blocks: readonly LevelBlock[] };

const ROWS = 6, COLS = 10;

function grid(pick: (col: number, row: number) => BlockColor | null): LevelBlock[] {
  const blocks: LevelBlock[] = [];
  for (let row = 0; row < ROWS; row++)
    for (let col = 0; col < COLS; col++) {
      const color = pick(col, row);
      if (color) blocks.push({ col, row, color });
    }
  return blocks;
}

const ROW_COLORS_1: readonly BlockColor[] = ["red", "yellow", "cyan", "magenta", "hotpink", "green"];
const ROW_COLORS_2: readonly BlockColor[] = ["gray", "cyan", "hotpink", "yellow", "magenta", "green"];
const ROW_COLORS_4: readonly BlockColor[] = ["cyan", "magenta", "green", "yellow", "hotpink", "red"];

/** Level 2 pyramid: first and last column of each row. */
const PYRAMID_START = [4, 3, 2, 1, 0, 0];
const PYRAMID_END = [5, 6, 7, 8, 9, 9];

/** Level 4: empty columns of each row. */
const GAPS_4: readonly (readonly number[])[] = [
  [2, 5, 8], [0, 4, 7, 9], [1, 3, 6],
  [2, 5, 8, 9], [0, 4, 7], [1, 3, 6, 9],
];

/** Full grid (60 blocks). */
const full = grid((_, row) => ROW_COLORS_1[row]);

/** Pyramid (40 blocks). */
const pyramid = grid((col, row) => (col >= PYRAMID_START[row] && col <= PYRAMID_END[row] ? ROW_COLORS_2[row] : null));

/** Checkerboard (30 blocks). */
const checkerboard = grid((col, row) => ((col + row) % 2 === 0 ? (row < 3 ? "yellow" : "magenta") : null));

/** Grid with gaps (39 blocks). */
const gaps = grid((col, row) => (GAPS_4[row].includes(col) ? null : ROW_COLORS_4[row]));

/** Frame with a cross (39 blocks). */
const frameAndCross = grid((col, row) => {
  const isFrame = col === 0 || col === 9 || row === 0 || row === 5;
  const isCross = col === 4 || row === 2;
  if (!isFrame && !isCross) return null;
  return isCross && !isFrame ? "hotpink" : "cyan";
});

export const LEVELS: readonly Level[] = [
  { speed: 1.0, blocks: full },
  { speed: 1.1, blocks: pyramid },
  { speed: 1.21, blocks: checkerboard },
  { speed: 1.33, blocks: gaps },
  { speed: 1.46, blocks: frameAndCross },
];
