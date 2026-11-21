import { describe, expect, it } from "vitest";
import { COLS, PIECES, ROWS } from "@/features/arcade/falling-blocks/engine/constants";
import {
  applyFallingBlocksAction,
  createFallingBlocksState,
  fallingBlocksStats,
  ghostY,
  stepFallingBlocks,
  type FallingBlocksPiece,
  type FallingBlocksState,
} from "@/features/arcade/falling-blocks/engine/state";

const I = 1, O = 2, T = 3, TUERCA = 8;

/** rng that always picks the O piece: floor(0.15 × 8) + 1 = 2. */
const pickO = () => 0.15;

/** A piece of the given type at (x, y), with the original matrix. */
function piece(type: number, x: number, y: number, shape?: number[][]): FallingBlocksPiece {
  return { type, shape: shape ?? PIECES[type]!.map((row) => [...row]), x, y };
}

/** The vertical I (the horizontal one rotated clockwise): column 2 of a 4×4 matrix. */
const VERTICAL_I = [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]];

function emptyBoard() {
  return Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
}

/** Board with the given rows filled (value 1) except the listed columns. */
function boardWith(rows: number[], holes: number[] = []) {
  const board = emptyBoard();
  for (const r of rows) for (let c = 0; c < COLS; c++) if (!holes.includes(c)) board[r][c] = 1;
  return board;
}

/** Fresh game whose next pieces are always O, with the given overrides. */
function game(overrides: Partial<FallingBlocksState> = {}): FallingBlocksState {
  return { ...createFallingBlocksState(pickO), ...overrides };
}

describe("createFallingBlocksState", () => {
  it("starts with an empty 10×20 board, score 0, level 1 and a 1 s drop interval", () => {
    const state = createFallingBlocksState(pickO);
    expect(state.board).toEqual(emptyBoard());
    expect(state).toMatchObject({ score: 0, lines: 0, level: 1, dropAccum: 0, dropInterval: 1, phase: "playing" });
  });

  it("draws the current piece first and then the next one, centered at the top", () => {
    const values = [0, 0.15];
    const state = createFallingBlocksState(() => values.shift() ?? 0);
    expect(state.current).toEqual(piece(I, 3, 0));
    expect(state.next).toEqual(piece(O, 4, 0));
  });

  it("floor(rng() × 8) + 1 can give the tuerca (type 8)", () => {
    const state = createFallingBlocksState(() => 0.99);
    expect(state.current).toEqual(piece(TUERCA, 4, 0, [[8, 8, 8], [8, 0, 8], [8, 8, 8]]));
  });
});

describe("movement and collisions", () => {
  it("moves left and right on a free board", () => {
    const state = game({ current: piece(O, 4, 5) });
    expect(applyFallingBlocksAction(state, "left", pickO).current.x).toBe(3);
    expect(applyFallingBlocksAction(state, "right", pickO).current.x).toBe(5);
  });

  it("does not go through the walls", () => {
    expect(applyFallingBlocksAction(game({ current: piece(O, 0, 5) }), "left", pickO).current.x).toBe(0);
    expect(applyFallingBlocksAction(game({ current: piece(O, 8, 5) }), "right", pickO).current.x).toBe(8);
    expect(applyFallingBlocksAction(game({ current: piece(I, 6, 5) }), "right", pickO).current.x).toBe(6);
  });

  it("does not go through blocks", () => {
    const board = emptyBoard();
    board[5][6] = 4;
    const state = game({ board, current: piece(O, 4, 5) });
    expect(applyFallingBlocksAction(state, "right", pickO).current.x).toBe(4);
  });

  it("ghostY stops on the floor and on blocks", () => {
    expect(ghostY(game({ current: piece(O, 4, 0) }))).toBe(18);
    const board = emptyBoard();
    board[10][5] = 4;
    expect(ghostY(game({ board, current: piece(O, 4, 0) }))).toBe(8);
  });

  it("does not mutate the given state", () => {
    const state = game({ current: piece(O, 4, 5) });
    const copy = structuredClone(state);
    applyFallingBlocksAction(state, "hardDrop", pickO);
    applyFallingBlocksAction(state, "rotate", pickO);
    stepFallingBlocks(state, 5, pickO);
    expect(state).toEqual(copy);
  });
});

describe("rotation", () => {
  it("rotates clockwise in place when the spot is free", () => {
    const rotated = applyFallingBlocksAction(game({ current: piece(T, 3, 0) }), "rotate", pickO);
    expect(rotated.current).toEqual(piece(T, 3, 0, [[0, 3, 0], [0, 3, 3], [0, 3, 0]]));
  });

  it("applies the first free offset of [0, -1, 1, -2, 2]", () => {
    // Offset 0 hits the block below the T stem; -1 and 1 are both free, -1 comes first.
    const board = emptyBoard();
    board[2][4] = 1;
    const rotated = applyFallingBlocksAction(game({ board, current: piece(T, 3, 0) }), "rotate", pickO);
    expect(rotated.current).toMatchObject({ x: 2, shape: [[0, 3, 0], [0, 3, 3], [0, 3, 0]] });

    // A vertical I against the left wall only fits horizontally with the +2 offset.
    const fromWall = applyFallingBlocksAction(game({ current: piece(I, -2, 5, VERTICAL_I) }), "rotate", pickO);
    expect(fromWall.current).toMatchObject({ x: 0, shape: [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]] });
  });

  it("leaves the piece unchanged when no offset is free", () => {
    const state = game({ board: boardWith([2]), current: piece(T, 3, 0) });
    expect(applyFallingBlocksAction(state, "rotate", pickO).current).toEqual(piece(T, 3, 0));
  });
});

describe("drops", () => {
  it("soft drop moves down one row and adds 1", () => {
    const next = applyFallingBlocksAction(game({ current: piece(O, 4, 0) }), "softDrop", pickO);
    expect(next.current.y).toBe(1);
    expect(next.score).toBe(1);
  });

  it("soft drop locks the piece right away when it cannot go down", () => {
    const state = game({ current: piece(T, 0, 18), next: piece(O, 4, 0), score: 7 });
    const next = applyFallingBlocksAction(state, "softDrop", pickO);
    expect(next.board[18].slice(0, 3)).toEqual([0, T, 0]);
    expect(next.board[19].slice(0, 3)).toEqual([T, T, T]);
    expect(next.current).toEqual(piece(O, 4, 0));
    expect(next.score).toBe(7);
  });

  it("hard drop adds 2 per row and locks the piece", () => {
    const next = applyFallingBlocksAction(game({ current: piece(O, 4, 0), next: piece(T, 3, 0) }), "hardDrop", pickO);
    expect(next.score).toBe(36);
    expect(next.board[18].slice(4, 6)).toEqual([O, O]);
    expect(next.board[19].slice(4, 6)).toEqual([O, O]);
    expect(next.current).toEqual(piece(T, 3, 0));
    expect(next.next.type).toBe(O);
  });
});

describe("line clears", () => {
  /** Locks an O on the right edge of the bottom row (1 line). */
  const oneLine = (overrides: Partial<FallingBlocksState>) =>
    applyFallingBlocksAction(game({ board: boardWith([19], [8, 9]), current: piece(O, 8, 18), ...overrides }), "softDrop", pickO);
  /** Locks a vertical I in the right column of the 4 bottom rows (4 lines). */
  const fourLines = (overrides: Partial<FallingBlocksState>) =>
    applyFallingBlocksAction(game({ board: boardWith([16, 17, 18, 19], [9]), current: piece(I, 7, 16, VERTICAL_I), ...overrides }), "softDrop", pickO);

  it("clears 1 line for 100 and 4 lines for 800 at level 1", () => {
    const one = oneLine({});
    expect(one).toMatchObject({ score: 100, lines: 1, level: 1 });
    expect(one.board[19]).toEqual([0, 0, 0, 0, 0, 0, 0, 0, O, O]);
    expect(one.board[18]).toEqual(new Array(COLS).fill(0));

    const four = fourLines({});
    expect(four).toMatchObject({ score: 800, lines: 4, level: 1 });
    expect(four.board).toEqual(emptyBoard());
  });

  it("multiplies by the level before the clear: 300 and 2400 at level 3", () => {
    expect(oneLine({ level: 3, lines: 20 })).toMatchObject({ score: 300, lines: 21, level: 3 });
    expect(fourLines({ level: 3, lines: 20 })).toMatchObject({ score: 2400, lines: 24, level: 3 });
  });

  it("reaches level 2 with 10 lines and the interval drops to 0.91 s", () => {
    const next = oneLine({ lines: 9 });
    expect(next).toMatchObject({ score: 100, lines: 10, level: 2 });
    expect(next.dropInterval).toBeCloseTo(0.91);
  });

  it("never drops the interval below 0.1 s", () => {
    expect(oneLine({ level: 11, lines: 109 }).dropInterval).toBeCloseTo(0.1);
    expect(oneLine({ level: 30, lines: 299 })).toMatchObject({ level: 31, dropInterval: 0.1 });
  });
});

describe("stepFallingBlocks (automatic drop)", () => {
  it("moves the piece down one row once the interval is accumulated", () => {
    const half = stepFallingBlocks(game({ current: piece(O, 4, 0) }), 0.5, pickO);
    expect(half.current.y).toBe(0);
    expect(half.dropAccum).toBeCloseTo(0.5);
    const full = stepFallingBlocks(half, 0.5, pickO);
    expect(full.current.y).toBe(1);
    expect(full.dropAccum).toBe(0);
    expect(full.score).toBe(0);
  });

  it("locks the piece when it cannot go down", () => {
    const next = stepFallingBlocks(game({ current: piece(O, 4, 18), next: piece(T, 3, 0) }), 1, pickO);
    expect(next.board[19].slice(4, 6)).toEqual([O, O]);
    expect(next.current).toEqual(piece(T, 3, 0));
  });
});

describe("game over", () => {
  /** The next O spawns over blocks at the top: locking the current piece ends the game. */
  function lost() {
    const board = emptyBoard();
    for (let c = 3; c <= 6; c++) board[0][c] = board[1][c] = 1;
    const state = game({ board, current: piece(O, 0, 18), next: piece(O, 4, 0), score: 50 });
    return applyFallingBlocksAction(state, "softDrop", pickO);
  }

  it("a piece that does not fit when spawning ends the game", () => {
    expect(lost().phase).toBe("gameover");
  });

  it("the score no longer changes after game over", () => {
    const over = lost();
    for (const action of ["left", "right", "rotate", "softDrop", "hardDrop"] as const) {
      expect(applyFallingBlocksAction(over, action, pickO)).toEqual(over);
    }
    expect(stepFallingBlocks(over, 5, pickO)).toEqual(over);
    expect(fallingBlocksStats(over).score).toBe(50);
  });
});

describe("fallingBlocksStats", () => {
  it("returns { score, lives: null, level }", () => {
    expect(fallingBlocksStats(game({ score: 1234, level: 4, lines: 35 }))).toEqual({ score: 1234, lives: null, level: 4 });
  });
});
