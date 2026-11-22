import { describe, expect, it } from "vitest";
import { createRng } from "@/features/arcade/lib/rng";
import { BONUS_TIME, COLS, DEATH_PAUSE, LEVEL_BANNER, ROWS, type Direction } from "@/features/arcade/snake/engine/constants";
import { cellKey, wallsOf } from "@/features/arcade/snake/engine/maps";
import {
  createSnakeState,
  randomFreeCell,
  snakeStats,
  speedFor,
  stepSnake,
  type Cell,
  type SnakeState,
} from "@/features/arcade/snake/engine/state";

const rng = createRng(7);
const at = (x: number, y: number): Cell => ({ x, y });

/** A game already playing on ARENA, with the fruit parked far from the snake. */
function playing(patch: Partial<SnakeState> = {}): SnakeState {
  return { ...createSnakeState(rng), phase: "playing", timer: 0, fruit: { x: 20, y: 3, type: "apple" }, ...patch };
}

/** Exactly one cell move per call at the state's speed. */
function steps(state: SnakeState, n: number, turns: Direction[] = []): SnakeState {
  let s = state;
  for (let i = 0; i < n; i++) s = stepSnake(s, { turns: i === 0 ? turns : [] }, 1 / speedFor(s.level), rng);
  return s;
}

const occupies = (cells: readonly Cell[], c: Cell) => cells.some((p) => p.x === c.x && p.y === c.y);

describe("createSnakeState", () => {
  it("starts on ARENA with the MAPA 1 intro, 3 lives and length 4 heading right", () => {
    const s = createSnakeState(rng);
    expect(s.phase).toBe("intro");
    expect(s.timer).toBe(LEVEL_BANNER);
    expect(snakeStats(s)).toEqual({ score: 0, lives: 3, level: 1 });
    expect(s.snake).toEqual([at(5, 10), at(4, 10), at(3, 10), at(2, 10)]);
    expect(s.dir).toBe("right");
    expect(s.bonus).toBeNull();
  });

  it("never places the first fruit on a wall or on the snake", () => {
    for (let seed = 0; seed < 50; seed++) {
      const s = createSnakeState(createRng(seed));
      expect(s.fruit).not.toBeNull();
      expect(wallsOf(1).has(cellKey(s.fruit!.x, s.fruit!.y))).toBe(false);
      expect(occupies(s.snake, s.fruit!)).toBe(false);
    }
  });
});

describe("intro", () => {
  it("keeps the snake still for 1.5 s, then plays", () => {
    let s = createSnakeState(rng);
    s = stepSnake(s, { turns: [] }, 1.4, rng);
    expect(s.phase).toBe("intro");
    expect(s.snake[0]).toEqual(at(5, 10));
    s = stepSnake(s, { turns: [] }, 0.2, rng);
    expect(s.phase).toBe("playing");
    expect(s.snake[0]).toEqual(at(5, 10));
  });
});

describe("speed and movement", () => {
  it("moves 6 + level cells per second, capped at 16", () => {
    expect(speedFor(1)).toBe(7);
    expect(speedFor(2)).toBe(8);
    expect(speedFor(10)).toBe(16);
    expect(speedFor(25)).toBe(16);
  });

  it("advances 7 cells in one second at level 1 without growing", () => {
    const s = steps(playing(), 7);
    expect(s.snake[0]).toEqual(at(12, 10));
    expect(s.snake).toHaveLength(4);
  });

  it("does not move until a whole cell time has passed", () => {
    const s = stepSnake(playing(), { turns: [] }, 0.1, rng);
    expect(s.snake[0]).toEqual(at(5, 10));
  });
});

describe("turns", () => {
  it("ignores reversing", () => {
    const s = steps(playing(), 1, ["left"]);
    expect(s.dir).toBe("right");
    expect(s.snake[0]).toEqual(at(6, 10));
  });

  it("queues up to two turns and applies one per step", () => {
    let s = steps(playing(), 1, ["up", "left", "down"]);
    expect(s.snake[0]).toEqual(at(5, 9));
    s = steps(s, 1);
    expect(s.dir).toBe("left");
    expect(s.snake[0]).toEqual(at(4, 9));
    s = steps(s, 1);
    expect(s.dir).toBe("left"); // "down" was dropped: the queue was full
  });

  it("drops a turn that reverses the last queued one", () => {
    let s = steps(playing(), 1, ["up", "down"]);
    s = steps(s, 1);
    expect(s.dir).toBe("up");
    expect(s.snake[0]).toEqual(at(5, 8));
  });
});

describe("fruits", () => {
  it("scores 10 × level, counts the fruit and grows on the next step", () => {
    let s = steps(playing({ fruit: { x: 6, y: 10, type: "cherry" } }), 1);
    expect(s.score).toBe(10);
    expect(s.fruitsInMap).toBe(1);
    expect(s.totalFruits).toBe(1);
    expect(s.events).toEqual(["eat"]);
    expect(s.snake).toHaveLength(4);
    s = steps(s, 1);
    expect(s.snake).toHaveLength(5);
  });

  it("places the next fruit off walls, snake and bonus", () => {
    for (let seed = 0; seed < 30; seed++) {
      const r = createRng(seed);
      const s = stepSnake(playing({ fruit: { x: 6, y: 10, type: "apple" }, totalFruits: 4 }), { turns: [] }, 1 / 7, r);
      const items = [s.fruit!, s.bonus!];
      for (const item of items) {
        expect(wallsOf(1).has(cellKey(item.x, item.y))).toBe(false);
        expect(occupies(s.snake, item)).toBe(false);
      }
      expect(occupies([s.fruit!], s.bonus!)).toBe(false);
    }
  });

  it("scales the points with the level", () => {
    const s = steps(playing({ level: 3, fruit: { x: 6, y: 10, type: "grape" } }), 1);
    expect(s.score).toBe(30);
  });
});

describe("bonus", () => {
  it("appears when the 5th fruit is eaten, for 5 s", () => {
    const s = steps(playing({ totalFruits: 4, fruit: { x: 6, y: 10, type: "lemon" } }), 1);
    expect(s.bonus).toMatchObject({ type: "pineapple", t: BONUS_TIME });
  });

  it("does not appear on other fruits", () => {
    const s = steps(playing({ totalFruits: 2, fruit: { x: 6, y: 10, type: "lemon" } }), 1);
    expect(s.bonus).toBeNull();
  });

  it("disappears when its time runs out", () => {
    const s = steps(playing({ bonus: { x: 20, y: 15, type: "pineapple", t: 0.1 } }), 1);
    expect(s.bonus).toBeNull();
  });

  it("scores 50 × level and grows", () => {
    let s = steps(playing({ level: 2, bonus: { x: 6, y: 10, type: "pineapple", t: 3 } }), 1);
    expect(s.score).toBe(100);
    expect(s.bonus).toBeNull();
    expect(s.events).toEqual(["bonus"]);
    expect(s.fruitsInMap).toBe(0);
    s = steps(s, 1);
    expect(s.snake).toHaveLength(5);
  });
});

describe("next map", () => {
  it("the 10th fruit loads PILARES with a fresh snake and the MAPA banner", () => {
    let s = steps(playing({ fruitsInMap: 9, totalFruits: 9, score: 90, fruit: { x: 6, y: 10, type: "apple" } }), 1);
    expect(s.level).toBe(2);
    expect(s.fruitsInMap).toBe(0);
    expect(s.score).toBe(100);
    expect(s.phase).toBe("levelup");
    expect(s.timer).toBe(LEVEL_BANNER);
    expect(s.events).toEqual(["eat", "level"]);
    expect(s.snake).toEqual([at(5, 10), at(4, 10), at(3, 10), at(2, 10)]);
    expect(s.bonus).toBeNull();
    expect(wallsOf(2).has(cellKey(s.fruit!.x, s.fruit!.y))).toBe(false);

    s = stepSnake(s, { turns: [] }, LEVEL_BANNER, rng);
    expect(s.phase).toBe("playing");
    expect(speedFor(s.level)).toBe(8);
  });
});

describe("crashes and lives", () => {
  const nearWall = [at(26, 10), at(25, 10), at(24, 10), at(23, 10)];

  it("hitting a wall costs a life, then the snake respawns keeping score and map progress", () => {
    let s = steps(playing({ snake: nearWall, score: 40, fruitsInMap: 4, bonus: { x: 3, y: 3, type: "pineapple", t: 4 } }), 1);
    expect(s.lives).toBe(2);
    expect(s.phase).toBe("dying");
    expect(s.timer).toBe(DEATH_PAUSE);
    expect(s.events).toEqual(["die"]);

    s = stepSnake(s, { turns: [] }, DEATH_PAUSE, rng);
    expect(s.phase).toBe("playing");
    expect(s.snake).toEqual([at(5, 10), at(4, 10), at(3, 10), at(2, 10)]);
    expect(s.dir).toBe("right");
    expect(s.score).toBe(40);
    expect(s.fruitsInMap).toBe(4);
    expect(s.bonus).toBeNull();
  });

  it("hitting its own body costs a life", () => {
    const body = [at(10, 10), at(10, 11), at(11, 11), at(11, 10), at(11, 9)];
    const s = steps(playing({ snake: body, dir: "right" }), 1);
    expect(s.lives).toBe(2);
    expect(s.phase).toBe("dying");
  });

  it("can move into the cell its tail is leaving", () => {
    const square = [at(10, 10), at(10, 11), at(11, 11), at(11, 10)];
    const s = steps(playing({ snake: square, dir: "right" }), 1);
    expect(s.phase).toBe("playing");
    expect(s.snake[0]).toEqual(at(11, 10));
  });

  it("crashes into the tail cell while growing", () => {
    const square = [at(10, 10), at(10, 11), at(11, 11), at(11, 10)];
    const s = steps(playing({ snake: square, dir: "right", grow: 1 }), 1);
    expect(s.phase).toBe("dying");
  });

  it("ends the game on the last life and then stops changing", () => {
    const s = steps(playing({ snake: nearWall, lives: 1, score: 70 }), 1);
    expect(s.phase).toBe("gameover");
    expect(snakeStats(s)).toEqual({ score: 70, lives: 0, level: 1 });
    const after = stepSnake(s, { turns: ["up"] }, 2, rng);
    expect({ ...after, clock: 0 }).toEqual({ ...s, clock: 0, events: [] });
  });
});

describe("randomFreeCell", () => {
  it("returns null when every cell is taken", () => {
    const all: Cell[] = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) all.push(at(x, y));
    expect(randomFreeCell(1, all, rng)).toBeNull();
  });

  it("only returns cells that are not walls or taken", () => {
    const taken = [at(5, 5)];
    for (let i = 0; i < 100; i++) {
      const c = randomFreeCell(1, taken, rng)!;
      expect(wallsOf(1).has(cellKey(c.x, c.y))).toBe(false);
      expect(c).not.toEqual(at(5, 5));
    }
  });
});
