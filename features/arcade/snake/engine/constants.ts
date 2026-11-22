// Constants of references/started-games/05-snake/game.js (SPEC 09).

export const COLS = 28;
export const ROWS = 20;
export const CELL = 24;
export const HUD_H = 40;
export const W = COLS * CELL; // 672
export const H = ROWS * CELL + HUD_H; // 520

export const START_LIVES = 3;
export const START_LENGTH = 4;
export const FRUITS_PER_MAP = 10;
/** A bonus appears every 5 normal fruits, counted over the whole game. */
export const BONUS_EVERY = 5;
export const BONUS_TIME = 5; // s
export const BONUS_BLINK = 1.5; // s, last part of BONUS_TIME
export const NORMAL_POINTS = 10; // × level
export const BONUS_POINTS = 50; // × level
export const BASE_SPEED = 6; // cells/s, plus SPEED_PER_LEVEL × level
export const SPEED_PER_LEVEL = 1;
export const MAX_SPEED = 16;
export const LEVEL_BANNER = 1.5; // s, "MAPA N" (also the intro)
export const DEATH_PAUSE = 1; // s
export const INPUT_QUEUE = 2;

export type Direction = "up" | "down" | "left" | "right";
export type FruitType = "apple" | "cherry" | "grape" | "lemon" | "watermelon" | "strawberry" | "pineapple";
export const NORMAL_FRUITS: readonly FruitType[] = ["apple", "cherry", "grape", "lemon", "watermelon", "strawberry"];
export const BONUS_FRUIT = "pineapple" satisfies FruitType;

export const DIRS: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};
export const OPPOSITE: Record<Direction, Direction> = { up: "down", down: "up", left: "right", right: "left" };
