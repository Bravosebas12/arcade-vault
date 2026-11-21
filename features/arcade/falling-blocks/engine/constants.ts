// Constants copied from references/started-games/03-tetris/game.js (milliseconds converted to seconds).

export const COLS = 10, ROWS = 20, BLOCK = 30; // board 300×600
export const PANEL_WIDTH = 120; // canvas 420×600
export const W = COLS * BLOCK + PANEL_WIDTH, H = ROWS * BLOCK;

/** Index 0 is empty; 1–8: I, O, T, S, Z, J, L and the "tuerca" (a 3×3 ring). Cells hold the piece index. */
export const PIECES: readonly (readonly (readonly number[])[] | null)[] = [
  null,
  [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]], // I
  [[2, 2], [2, 2]], // O
  [[0, 3, 0], [3, 3, 3], [0, 0, 0]], // T
  [[0, 4, 4], [4, 4, 0], [0, 0, 0]], // S
  [[5, 5, 0], [0, 5, 5], [0, 0, 0]], // Z
  [[6, 0, 0], [6, 6, 6], [0, 0, 0]], // J
  [[0, 0, 7], [7, 7, 7], [0, 0, 0]], // L
  [[8, 8, 8], [8, 0, 8], [8, 8, 8]], // tuerca
];
export const PIECE_COUNT = 8;

export const PIECE_COLORS = [null, "#4dd0e1", "#ffd54f", "#ba68c8", "#81c784", "#e57373", "#90caf9", "#ffb74d", "#9e9e9e"] as const;
export const LINE_SCORES = [0, 100, 300, 500, 800]; // × level
export const KICKS = [0, -1, 1, -2, 2];
export const SOFT_DROP_POINTS = 1; // per row
export const HARD_DROP_POINTS = 2; // per row
export const LINES_PER_LEVEL = 10;
export const DROP = { base: 1.0, stepPerLevel: 0.09, min: 0.1 }; // seconds
export const GHOST_ALPHA = 0.2;
