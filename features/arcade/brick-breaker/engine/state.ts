// Rules of references/started-games/04-arkanoid/game.js as pure functions: no DOM, clock or
// Math.random (the original has no randomness) and times in seconds. Every function returns a new state.
import {
  BALL,
  EXPLOSION_DURATION,
  GRID,
  H,
  PADDLE,
  POINTS_PER_BLOCK,
  START_LIVES,
  W,
  type BlockColor,
} from "@/features/arcade/brick-breaker/engine/constants";
import { LEVELS } from "@/features/arcade/brick-breaker/engine/levels";
import type { GameStats } from "@/features/arcade/model/arcade-game";

export type BrickBreakerPhase = "playing" | "gameover" | "win";
/** pointerX in logical canvas coordinates; null when the pointer did not move. */
export type BrickBreakerInput = { left: boolean; right: boolean; pointerX: number | null };

export type BrickBreakerBall = { x: number; y: number; vx: number; vy: number };
export type BrickBreakerBlock = { x: number; y: number; color: BlockColor; alive: boolean };
export type BrickBreakerExplosion = { x: number; y: number; color: BlockColor; elapsed: number };
export type BrickBreakerEvent = "bounce" | "break";

export type BrickBreakerState = {
  paddleX: number;
  ball: BrickBreakerBall;
  blocks: BrickBreakerBlock[];
  explosions: BrickBreakerExplosion[];
  score: number;
  lives: number;
  /** 1–5. */
  level: number;
  phase: BrickBreakerPhase;
  /** Sounds the canvas plays for this step. */
  events: BrickBreakerEvent[];
};

const MAX_PADDLE_X = W - PADDLE.w;
const clampPaddle = (x: number) => Math.max(0, Math.min(MAX_PADDLE_X, x));

/** Ball resting on the paddle, with the base velocity × the level speed. */
function ballOnPaddle(paddleX: number, level: number): BrickBreakerBall {
  const { speed } = LEVELS[level - 1];
  return {
    x: paddleX + (PADDLE.w - BALL.size) / 2,
    y: PADDLE.y - BALL.size,
    vx: BALL.baseVx * speed,
    vy: BALL.baseVy * speed,
  };
}

function levelBlocks(level: number): BrickBreakerBlock[] {
  return LEVELS[level - 1].blocks.map((b) => ({
    x: GRID.originX + b.col * GRID.blockW,
    y: GRID.originY + b.row * GRID.blockH,
    color: b.color,
    alive: true,
  }));
}

function hits(ball: BrickBreakerBall, block: BrickBreakerBlock) {
  return (
    ball.x < block.x + GRID.blockW &&
    ball.x + BALL.size > block.x &&
    ball.y < block.y + GRID.blockH &&
    ball.y + BALL.size > block.y
  );
}

export function createBrickBreakerState(): BrickBreakerState {
  const paddleX = (W - PADDLE.w) / 2;
  return {
    paddleX,
    ball: ballOnPaddle(paddleX, 1),
    blocks: levelBlocks(1),
    explosions: [],
    score: 0,
    lives: START_LIVES,
    level: 1,
    phase: "playing",
    events: [],
  };
}

/** Advances the game `dt` seconds, in the original order: paddle, ball, walls, paddle bounce, blocks, explosions, lost ball. */
export function stepBrickBreaker(state: BrickBreakerState, input: BrickBreakerInput, dt: number): BrickBreakerState {
  if (state.phase !== "playing") return state;

  const events: BrickBreakerEvent[] = [];
  let { score, lives, level } = state;
  let phase: BrickBreakerPhase = state.phase;
  let blocks = state.blocks;
  let explosions = state.explosions;

  // Paddle
  let paddleX = state.paddleX;
  if (input.left) paddleX = Math.max(0, paddleX - PADDLE.speed * dt);
  if (input.right) paddleX = Math.min(MAX_PADDLE_X, paddleX + PADDLE.speed * dt);
  if (input.pointerX !== null) paddleX = clampPaddle(input.pointerX - PADDLE.w / 2);

  // Ball movement
  let ball: BrickBreakerBall = { ...state.ball, x: state.ball.x + state.ball.vx * dt, y: state.ball.y + state.ball.vy * dt };

  // Wall bounces (left, right, top)
  if (ball.x <= 0) {
    ball = { ...ball, x: 0, vx: Math.abs(ball.vx) };
    events.push("bounce");
  }
  if (ball.x + BALL.size >= W) {
    ball = { ...ball, x: W - BALL.size, vx: -Math.abs(ball.vx) };
    events.push("bounce");
  }
  if (ball.y <= 0) {
    ball = { ...ball, y: 0, vy: Math.abs(ball.vy) };
    events.push("bounce");
  }

  // Paddle bounce: only while falling, with a tolerance below the paddle.
  if (
    ball.vy > 0 &&
    ball.x + BALL.size > paddleX &&
    ball.x < paddleX + PADDLE.w &&
    ball.y + BALL.size >= PADDLE.y &&
    ball.y + BALL.size <= PADDLE.y + PADDLE.h + PADDLE.catchTolerance
  ) {
    ball = { ...ball, y: PADDLE.y - BALL.size, vy: -Math.abs(ball.vy) };
    events.push("bounce");
  }

  // Block collisions: one block per step.
  const hitIndex = blocks.findIndex((b) => b.alive && hits(ball, b));
  if (hitIndex >= 0) {
    const hit = blocks[hitIndex];
    blocks = blocks.map((b, i) => (i === hitIndex ? { ...b, alive: false } : b));
    explosions = [...explosions, { x: hit.x, y: hit.y, color: hit.color, elapsed: 0 }];
    score += POINTS_PER_BLOCK;
    ball = { ...ball, vy: -ball.vy };
    events.push("break");
    if (blocks.every((b) => !b.alive)) {
      if (level < LEVELS.length) {
        level += 1;
        blocks = levelBlocks(level);
        explosions = [];
        ball = ballOnPaddle(paddleX, level);
      } else {
        phase = "win";
      }
    }
  }

  // Explosions
  explosions = explosions.map((e) => ({ ...e, elapsed: e.elapsed + dt })).filter((e) => e.elapsed < EXPLOSION_DURATION);

  // Ball lost
  if (phase === "playing" && ball.y > H) {
    lives -= 1;
    if (lives <= 0) {
      lives = 0;
      phase = "gameover";
    } else {
      ball = ballOnPaddle(paddleX, level);
    }
  }

  return { paddleX, ball, blocks, explosions, score, lives, level, phase, events };
}

export function brickBreakerStats(state: BrickBreakerState): GameStats {
  return { score: state.score, lives: state.lives, level: state.level };
}
