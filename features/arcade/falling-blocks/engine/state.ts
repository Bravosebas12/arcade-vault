// Rules of references/started-games/03-tetris/game.js as pure functions: no DOM, clock or Math.random
// (the rng is injected) and times in seconds. Every function returns a new state.
import {
  COLS,
  DROP,
  HARD_DROP_POINTS,
  KICKS,
  LINE_SCORES,
  LINES_PER_LEVEL,
  PIECE_COUNT,
  PIECES,
  ROWS,
  SOFT_DROP_POINTS,
} from "@/features/arcade/falling-blocks/engine/constants";
import type { GameStats } from "@/features/arcade/model/arcade-game";

export type FallingBlocksPiece = { type: number; shape: number[][]; x: number; y: number };
export type FallingBlocksPhase = "playing" | "gameover";
export type FallingBlocksAction = "left" | "right" | "rotate" | "softDrop" | "hardDrop";

export type FallingBlocksState = {
  /** ROWS×COLS; 0 empty, 1–8 piece index. */
  board: number[][];
  current: FallingBlocksPiece;
  next: FallingBlocksPiece;
  score: number;
  lines: number;
  level: number;
  /** Seconds accumulated towards the next automatic drop. */
  dropAccum: number;
  /** Seconds between automatic drops: max(0.1, 1.0 − (level − 1) × 0.09). */
  dropInterval: number;
  phase: FallingBlocksPhase;
};

const emptyRow = () => new Array<number>(COLS).fill(0);

const dropIntervalFor = (level: number) => Math.max(DROP.min, DROP.base - (level - 1) * DROP.stepPerLevel);

/** Uniformly random piece, centered at the top of the board. */
function randomPiece(rng: () => number): FallingBlocksPiece {
  const type = Math.floor(rng() * PIECE_COUNT) + 1;
  const shape = PIECES[type]!.map((row) => [...row]);
  return { type, shape, x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2), y: 0 };
}

function collides(board: number[][], shape: number[][], ox: number, oy: number): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const x = ox + c;
      const y = oy + r;
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && board[y][x]) return true;
    }
  }
  return false;
}

/** Clockwise rotation: transpose and reverse. */
function rotateCW(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const result = Array.from({ length: cols }, () => new Array<number>(rows).fill(0));
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

const canMove = (state: FallingBlocksState, dx: number, dy: number) =>
  !collides(state.board, state.current.shape, state.current.x + dx, state.current.y + dy);

const moveBy = (state: FallingBlocksState, dx: number, dy: number): FallingBlocksState => ({
  ...state,
  current: { ...state.current, x: state.current.x + dx, y: state.current.y + dy },
});

/** Merges the current piece, clears full lines from the bottom up and spawns the next piece. */
function lockPiece(state: FallingBlocksState, rng: () => number): FallingBlocksState {
  const { current } = state;
  const merged = state.board.map((row) => [...row]);
  current.shape.forEach((row, r) =>
    row.forEach((cell, c) => {
      if (cell) merged[current.y + r][current.x + c] = cell;
    }),
  );

  const kept = merged.filter((row) => row.some((cell) => cell === 0));
  const cleared = ROWS - kept.length;
  const board = [...Array.from({ length: cleared }, emptyRow), ...kept];

  let { score, lines, level, dropInterval } = state;
  if (cleared) {
    // Scored with the level before the clear, as the original.
    score += (LINE_SCORES[cleared] ?? 0) * level;
    lines += cleared;
    level = Math.floor(lines / LINES_PER_LEVEL) + 1;
    dropInterval = dropIntervalFor(level);
  }

  const next = state.next;
  return {
    ...state,
    board,
    score,
    lines,
    level,
    dropInterval,
    current: next,
    next: randomPiece(rng),
    phase: collides(board, next.shape, next.x, next.y) ? "gameover" : state.phase,
  };
}

export function createFallingBlocksState(rng: () => number): FallingBlocksState {
  const current = randomPiece(rng);
  const next = randomPiece(rng);
  return {
    board: Array.from({ length: ROWS }, emptyRow),
    current,
    next,
    score: 0,
    lines: 0,
    level: 1,
    dropAccum: 0,
    dropInterval: dropIntervalFor(1),
    phase: collides(Array.from({ length: ROWS }, emptyRow), current.shape, current.x, current.y) ? "gameover" : "playing",
  };
}

/** Row where the current piece would land if dropped straight down. */
export function ghostY(state: FallingBlocksState): number {
  const { board, current } = state;
  let y = current.y;
  while (!collides(board, current.shape, current.x, y + 1)) y++;
  return y;
}

/** One player action (each keydown, including the OS auto-repeat). Does nothing after game over. */
export function applyFallingBlocksAction(state: FallingBlocksState, action: FallingBlocksAction, rng: () => number): FallingBlocksState {
  if (state.phase === "gameover") return state;
  switch (action) {
    case "left":
      return canMove(state, -1, 0) ? moveBy(state, -1, 0) : state;
    case "right":
      return canMove(state, 1, 0) ? moveBy(state, 1, 0) : state;
    case "rotate": {
      const rotated = rotateCW(state.current.shape);
      for (const kick of KICKS) {
        if (!collides(state.board, rotated, state.current.x + kick, state.current.y)) {
          return { ...state, current: { ...state.current, shape: rotated, x: state.current.x + kick } };
        }
      }
      return state;
    }
    case "softDrop":
      return canMove(state, 0, 1) ? { ...moveBy(state, 0, 1), score: state.score + SOFT_DROP_POINTS } : lockPiece(state, rng);
    case "hardDrop": {
      const y = ghostY(state);
      const dropped = { ...moveBy(state, 0, y - state.current.y), score: state.score + (y - state.current.y) * HARD_DROP_POINTS };
      return lockPiece(dropped, rng);
    }
  }
}

/** Automatic drop: once `dropInterval` seconds accumulate, the piece goes down one row or locks. */
export function stepFallingBlocks(state: FallingBlocksState, dt: number, rng: () => number): FallingBlocksState {
  if (state.phase === "gameover") return state;
  const dropAccum = state.dropAccum + dt;
  if (dropAccum < state.dropInterval) return { ...state, dropAccum };
  const reset = { ...state, dropAccum: 0 };
  return canMove(reset, 0, 1) ? moveBy(reset, 0, 1) : lockPiece(reset, rng);
}

export function fallingBlocksStats(state: FallingBlocksState): GameStats {
  return { score: state.score, lives: null, level: state.level };
}
