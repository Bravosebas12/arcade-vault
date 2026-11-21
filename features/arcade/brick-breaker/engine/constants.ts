// Constants copied from references/started-games/04-arkanoid/ (milliseconds converted to seconds).

export const W = 800, H = 600;
export const PADDLE = { y: 560, w: 81, h: 14, speed: 400, catchTolerance: 8 };
export const BALL = { size: 16, baseVx: 200, baseVy: -300 };
/** originX centers the 10 × 64 px grid in the 800 px canvas. */
export const GRID = { cols: 10, rows: 6, blockW: 64, blockH: 24, originX: 80, originY: 80 };
export const POINTS_PER_BLOCK = 10;
export const START_LIVES = 3;
export const EXPLOSION_DURATION = 0.15; // s (150 ms), 4 frames
export type BlockColor = "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";
