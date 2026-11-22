// Pure game state and rules of references/started-games/05-snake/game.js (SPEC 09).
// The prototype's title screen, own pause and Space retry belong to the container (ArcadePlayer);
// the game starts with the "MAPA 1" intro banner instead.
import {
  BASE_SPEED,
  BONUS_EVERY,
  BONUS_FRUIT,
  BONUS_POINTS,
  BONUS_TIME,
  COLS,
  DEATH_PAUSE,
  DIRS,
  FRUITS_PER_MAP,
  INPUT_QUEUE,
  LEVEL_BANNER,
  MAX_SPEED,
  NORMAL_FRUITS,
  NORMAL_POINTS,
  OPPOSITE,
  ROWS,
  SPEED_PER_LEVEL,
  START_LENGTH,
  START_LIVES,
  type Direction,
  type FruitType,
} from "@/features/arcade/snake/engine/constants";
import { cellKey, mapFor, wallsOf } from "@/features/arcade/snake/engine/maps";
import type { GameStats } from "@/features/arcade/model/arcade-game";

export type SnakePhase = "intro" | "playing" | "levelup" | "dying" | "gameover";
/** Turn key presses since the previous step, in order. */
export type SnakeInput = { turns: readonly Direction[] };
export type Cell = { x: number; y: number };
export type SnakeEvent = "eat" | "bonus" | "die" | "level";

export type SnakeState = {
  phase: SnakePhase;
  /** Seconds left of intro / levelup / dying. */
  timer: number;
  /** Seconds since the game started, for blinking. */
  clock: number;
  /** 1, 2, 3…; the map is mapFor(level). */
  level: number;
  score: number;
  lives: number;
  fruitsInMap: number;
  totalFruits: number;
  /** [0] is the head. */
  snake: Cell[];
  dir: Direction;
  queue: Direction[];
  grow: number;
  /** Accumulated seconds towards the next cell move. */
  acc: number;
  /** null only if no free cell is left. */
  fruit: (Cell & { type: FruitType }) | null;
  bonus: (Cell & { type: typeof BONUS_FRUIT; t: number }) | null;
  /** Sounds to play for this step. */
  events: SnakeEvent[];
};

/** Cells per second: 6 + level, capped at 16. */
export const speedFor = (level: number) => Math.min(BASE_SPEED + level * SPEED_PER_LEVEL, MAX_SPEED);

/** A random cell of the level's map that is neither a wall nor in `taken`; null if none is left. */
export function randomFreeCell(level: number, taken: readonly Cell[], rng: () => number): Cell | null {
  const walls = wallsOf(level);
  const used = new Set(taken.map((c) => cellKey(c.x, c.y)));
  const free: Cell[] = [];
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const k = cellKey(x, y);
      if (!walls.has(k) && !used.has(k)) free.push({ x, y });
    }
  }
  return free.length ? free[Math.floor(rng() * free.length)] : null;
}

function spawnSnake(level: number): Pick<SnakeState, "snake" | "dir" | "queue" | "grow" | "acc"> {
  const { x, y, dir } = mapFor(level).spawn;
  const d = DIRS[dir];
  return {
    snake: Array.from({ length: START_LENGTH }, (_, i) => ({ x: x - d.x * i, y: y - d.y * i })),
    dir,
    queue: [],
    grow: 0,
    acc: 0,
  };
}

const takenCells = (s: SnakeState): Cell[] => [...s.snake, ...(s.fruit ? [s.fruit] : []), ...(s.bonus ? [s.bonus] : [])];

function newFruit(s: SnakeState, rng: () => number): SnakeState["fruit"] {
  const type = NORMAL_FRUITS[Math.floor(rng() * NORMAL_FRUITS.length)];
  const cell = randomFreeCell(s.level, takenCells(s), rng);
  return cell && { ...cell, type };
}

/** Loads the state's level map: snake at the spawn, a new fruit and no bonus. */
function enterMap(s: SnakeState, rng: () => number) {
  Object.assign(s, spawnSnake(s.level));
  s.bonus = null;
  s.fruit = null;
  s.fruit = newFruit(s, rng);
}

export function createSnakeState(rng: () => number): SnakeState {
  const s: SnakeState = {
    phase: "intro",
    timer: LEVEL_BANNER,
    clock: 0,
    level: 1,
    score: 0,
    lives: START_LIVES,
    fruitsInMap: 0,
    totalFruits: 0,
    ...spawnSnake(1),
    fruit: null,
    bonus: null,
    events: [],
  };
  enterMap(s, rng);
  return s;
}

function queueTurn(s: SnakeState, dir: Direction) {
  const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
  if (dir === last || dir === OPPOSITE[last] || s.queue.length >= INPUT_QUEUE) return;
  s.queue.push(dir);
}

const same = (a: Cell, b: Cell | null) => b !== null && a.x === b.x && a.y === b.y;

function crash(s: SnakeState) {
  s.lives--;
  s.events.push("die");
  if (s.lives <= 0) {
    s.phase = "gameover";
  } else {
    s.phase = "dying";
    s.timer = DEATH_PAUSE;
  }
}

/** One cell move: turn, crash check, grow or keep length, then fruit and bonus. */
function move(s: SnakeState, rng: () => number) {
  const turn = s.queue.shift();
  if (turn) s.dir = turn;
  const d = DIRS[s.dir];
  const next = { x: s.snake[0].x + d.x, y: s.snake[0].y + d.y };
  // The tail leaves its cell in this same move unless the snake is growing.
  const body = s.grow > 0 ? s.snake : s.snake.slice(0, -1);
  if (wallsOf(s.level).has(cellKey(next.x, next.y)) || body.some((c) => same(c, next))) {
    crash(s);
    return;
  }

  s.snake.unshift(next);
  if (s.grow > 0) s.grow--;
  else s.snake.pop();

  if (same(next, s.fruit)) {
    s.score += NORMAL_POINTS * s.level;
    s.grow++;
    s.fruitsInMap++;
    s.totalFruits++;
    s.events.push("eat");
    if (s.fruitsInMap >= FRUITS_PER_MAP) {
      s.level++;
      s.fruitsInMap = 0;
      s.phase = "levelup";
      s.timer = LEVEL_BANNER;
      enterMap(s, rng);
      s.events.push("level");
      return;
    }
    s.fruit = null;
    s.fruit = newFruit(s, rng);
    if (s.totalFruits % BONUS_EVERY === 0 && !s.bonus) {
      const cell = randomFreeCell(s.level, takenCells(s), rng);
      s.bonus = cell && { ...cell, type: BONUS_FRUIT, t: BONUS_TIME };
    }
  } else if (s.bonus && same(next, s.bonus)) {
    s.score += BONUS_POINTS * s.level;
    s.grow++;
    s.bonus = null;
    s.events.push("bonus");
  }
}

/** Advances the game by `dt` seconds. Never mutates `state`. */
export function stepSnake(state: SnakeState, input: SnakeInput, dt: number, rng: () => number): SnakeState {
  const s: SnakeState = {
    ...state,
    clock: state.clock + dt,
    snake: [...state.snake],
    queue: [...state.queue],
    fruit: state.fruit && { ...state.fruit },
    bonus: state.bonus && { ...state.bonus },
    events: [],
  };
  if (s.phase === "gameover") return s;

  if (s.phase !== "playing") {
    s.timer -= dt;
    if (s.timer > 0) return s;
    if (s.phase === "dying") {
      Object.assign(s, spawnSnake(s.level));
      s.bonus = null;
    }
    s.phase = "playing";
    s.timer = 0;
    return s;
  }

  for (const turn of input.turns) queueTurn(s, turn);

  if (s.bonus) {
    s.bonus.t -= dt;
    if (s.bonus.t <= 0) s.bonus = null;
  }

  s.acc += dt;
  const cellTime = 1 / speedFor(s.level);
  while (s.acc >= cellTime && s.phase === "playing") {
    s.acc -= cellTime;
    move(s, rng);
  }
  return s;
}

export function snakeStats(state: SnakeState): GameStats {
  return { score: state.score, lives: state.lives, level: state.level };
}
