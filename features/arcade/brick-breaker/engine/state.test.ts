import { describe, expect, it } from "vitest";
import { BALL, EXPLOSION_DURATION, GRID, H, PADDLE, POINTS_PER_BLOCK, START_LIVES, W } from "@/features/arcade/brick-breaker/engine/constants";
import {
  brickBreakerStats,
  createBrickBreakerState,
  stepBrickBreaker,
  type BrickBreakerInput,
  type BrickBreakerState,
} from "@/features/arcade/brick-breaker/engine/state";

const IDLE: BrickBreakerInput = { left: false, right: false, pointerX: null };
const LEFT: BrickBreakerInput = { ...IDLE, left: true };
const RIGHT: BrickBreakerInput = { ...IDLE, right: true };

const CENTER_X = (W - PADDLE.w) / 2;
/** Ball resting on the paddle at the given paddle x. */
const ballOn = (paddleX: number) => ({ x: paddleX + (PADDLE.w - BALL.size) / 2, y: PADDLE.y - BALL.size });

/** A fresh game with the given overrides. */
function game(overrides: Partial<BrickBreakerState> = {}): BrickBreakerState {
  return { ...createBrickBreakerState(), ...overrides };
}

/** A ball in open space (between the blocks and the paddle) with the given overrides. */
function ball(overrides: Partial<BrickBreakerState["ball"]> = {}): BrickBreakerState["ball"] {
  return { x: 400, y: 400, vx: 0, vy: -300, ...overrides };
}

/** A live block at grid cell (col, row). */
function block(col: number, row: number, color: BrickBreakerState["blocks"][number]["color"] = "red") {
  return { x: GRID.originX + col * GRID.blockW, y: GRID.originY + row * GRID.blockH, color, alive: true };
}

describe("createBrickBreakerState", () => {
  it("starts on level 1 with 60 blocks, 3 lives, score 0 and the ball on the centered paddle", () => {
    const state = createBrickBreakerState();
    expect(state).toMatchObject({ score: 0, lives: START_LIVES, level: 1, phase: "playing", events: [], explosions: [] });
    expect(state.paddleX).toBe(CENTER_X);
    expect(state.ball).toEqual({ ...ballOn(CENTER_X), vx: BALL.baseVx, vy: BALL.baseVy });
    expect(state.blocks).toHaveLength(60);
    expect(state.blocks[0]).toEqual({ x: 80, y: 80, color: "red", alive: true });
    expect(state.blocks[59]).toEqual({ x: 80 + 9 * 64, y: 80 + 5 * 24, color: "green", alive: true });
  });
});

describe("paddle", () => {
  it("moves left and right at 400 px/s", () => {
    const state = game({ ball: ball() });
    expect(stepBrickBreaker(state, LEFT, 0.05).paddleX).toBeCloseTo(CENTER_X - 20);
    expect(stepBrickBreaker(state, RIGHT, 0.05).paddleX).toBeCloseTo(CENTER_X + 20);
    expect(stepBrickBreaker(state, IDLE, 0.05).paddleX).toBe(CENTER_X);
  });

  it("stays inside [0, 800 − 81]", () => {
    expect(stepBrickBreaker(game({ ball: ball(), paddleX: 5 }), LEFT, 0.05).paddleX).toBe(0);
    expect(stepBrickBreaker(game({ ball: ball(), paddleX: W - PADDLE.w - 5 }), RIGHT, 0.05).paddleX).toBe(W - PADDLE.w);
  });

  it("centers on pointerX, with the same limit", () => {
    const state = game({ ball: ball() });
    expect(stepBrickBreaker(state, { ...IDLE, pointerX: 200 }, 0.016).paddleX).toBe(200 - PADDLE.w / 2);
    expect(stepBrickBreaker(state, { ...IDLE, pointerX: 10 }, 0.016).paddleX).toBe(0);
    expect(stepBrickBreaker(state, { ...IDLE, pointerX: 790 }, 0.016).paddleX).toBe(W - PADDLE.w);
  });
});

describe("walls", () => {
  it("bounces off the left wall: x = 0 and vx positive", () => {
    const next = stepBrickBreaker(game({ ball: ball({ x: 5, vx: -200 }) }), IDLE, 0.05);
    expect(next.ball.x).toBe(0);
    expect(next.ball.vx).toBe(200);
    expect(next.events).toEqual(["bounce"]);
  });

  it("bounces off the right wall: x = 800 − 16 and vx negative", () => {
    const next = stepBrickBreaker(game({ ball: ball({ x: W - BALL.size - 5, vx: 200 }) }), IDLE, 0.05);
    expect(next.ball.x).toBe(W - BALL.size);
    expect(next.ball.vx).toBe(-200);
    expect(next.events).toEqual(["bounce"]);
  });

  it("bounces off the top wall: y = 0 and vy positive", () => {
    const next = stepBrickBreaker(game({ blocks: [], ball: ball({ x: 20, y: 5, vy: -300 }) }), IDLE, 0.05);
    expect(next.ball.y).toBe(0);
    expect(next.ball.vy).toBe(300);
    expect(next.events).toEqual(["bounce"]);
  });
});

describe("paddle and ball", () => {
  const overPaddle = (y: number, vy: number) => game({ ball: ball({ x: CENTER_X + 30, y, vy }) });

  it("bounces when falling onto the paddle: the ball sits on it and vy becomes negative", () => {
    const next = stepBrickBreaker(overPaddle(PADDLE.y - BALL.size + 2, 300), IDLE, 0);
    expect(next.ball.y).toBe(PADDLE.y - BALL.size);
    expect(next.ball.vy).toBe(-300);
    expect(next.events).toEqual(["bounce"]);
  });

  it("still catches the ball up to 8 px below the paddle's bottom edge", () => {
    const next = stepBrickBreaker(overPaddle(PADDLE.y + PADDLE.h + PADDLE.catchTolerance - BALL.size, 300), IDLE, 0);
    expect(next.ball.vy).toBe(-300);
  });

  it("does not catch it beyond the 8 px tolerance", () => {
    const next = stepBrickBreaker(overPaddle(PADDLE.y + PADDLE.h + PADDLE.catchTolerance - BALL.size + 1, 300), IDLE, 0);
    expect(next.ball.vy).toBe(300);
    expect(next.events).toEqual([]);
  });

  it("ignores the paddle while the ball goes up", () => {
    const next = stepBrickBreaker(overPaddle(PADDLE.y - BALL.size + 2, -300), IDLE, 0);
    expect(next.ball.vy).toBe(-300);
    expect(next.events).toEqual([]);
  });

  it("ignores it when there is no horizontal overlap", () => {
    const next = stepBrickBreaker(game({ ball: ball({ x: CENTER_X - BALL.size, y: PADDLE.y - BALL.size + 2, vy: 300 }) }), IDLE, 0);
    expect(next.ball.vy).toBe(300);
  });

  it("only flips the vertical sign, never the angle", () => {
    const next = stepBrickBreaker(game({ ball: ball({ x: CENTER_X + 2, y: PADDLE.y - BALL.size + 2, vx: -200, vy: 300 }) }), IDLE, 0);
    expect(next.ball).toMatchObject({ vx: -200, vy: -300 });
  });
});

describe("blocks", () => {
  it("breaking a block adds 10, flips vy and creates an explosion", () => {
    const target = block(2, 5, "cyan");
    const state = game({ blocks: [target, block(8, 0)], ball: ball({ x: target.x + 10, y: target.y + 10, vy: -300 }) });
    const next = stepBrickBreaker(state, IDLE, 0);
    expect(next.blocks[0].alive).toBe(false);
    expect(next.blocks[1].alive).toBe(true);
    expect(next.score).toBe(POINTS_PER_BLOCK);
    expect(next.ball.vy).toBe(300);
    expect(next.explosions).toEqual([{ x: target.x, y: target.y, color: "cyan", elapsed: 0 }]);
    expect(next.events).toEqual(["break"]);
  });

  it("breaks only one block per step when the ball touches two", () => {
    const left = block(2, 5);
    const right = block(3, 5);
    const state = game({ blocks: [left, right, block(8, 0)], ball: ball({ x: right.x - 8, y: left.y + 4, vy: -300 }) });
    const next = stepBrickBreaker(state, IDLE, 0);
    expect(next.blocks.filter((b) => !b.alive)).toHaveLength(1);
    expect(next.score).toBe(10);
  });

  it("does not mutate the previous state", () => {
    const target = block(2, 5);
    const state = game({ blocks: [target, block(8, 0)], ball: ball({ x: target.x + 10, y: target.y + 10 }) });
    stepBrickBreaker(state, IDLE, 0);
    expect(state.blocks[0].alive).toBe(true);
    expect(state.score).toBe(0);
  });
});

describe("explosions", () => {
  it("advance with dt and disappear at 0.15 s", () => {
    const state = game({ ball: ball(), explosions: [{ x: 80, y: 80, color: "red", elapsed: 0 }] });
    const after100 = stepBrickBreaker(state, IDLE, 0.1);
    expect(after100.explosions).toHaveLength(1);
    expect(after100.explosions[0].elapsed).toBeCloseTo(0.1);
    expect(stepBrickBreaker(after100, IDLE, 0.04).explosions).toHaveLength(1);
    expect(stepBrickBreaker(after100, IDLE, 0.05).explosions).toHaveLength(0);
    expect(EXPLOSION_DURATION).toBe(0.15);
  });
});

describe("levels", () => {
  it("clearing level 1 loads level 2 with speed × 1.10 and the ball on the paddle", () => {
    const last = block(4, 5);
    const state = game({ paddleX: 100, blocks: [last], ball: ball({ x: last.x + 10, y: last.y + 10, vx: 200, vy: -300 }) });
    const next = stepBrickBreaker(state, IDLE, 0);
    expect(next.level).toBe(2);
    expect(next.blocks).toHaveLength(40);
    expect(next.blocks.every((b) => b.alive)).toBe(true);
    expect(next.ball.x).toBe(ballOn(100).x);
    expect(next.ball.y).toBe(ballOn(100).y);
    expect(next.ball.vx).toBeCloseTo(220);
    expect(next.ball.vy).toBeCloseTo(-330);
    expect(next.score).toBe(10);
    expect(next.phase).toBe("playing");
  });

  it("clearing level 5 wins the game", () => {
    const last = block(4, 5);
    const state = game({ level: 5, score: 2070, blocks: [last], ball: ball({ x: last.x + 10, y: last.y + 10 }) });
    const next = stepBrickBreaker(state, IDLE, 0);
    expect(next.phase).toBe("win");
    expect(next.score).toBe(2080);
    expect(next.level).toBe(5);
  });
});

describe("lives", () => {
  it("losing the ball takes a life and relaunches it from the paddle", () => {
    const state = game({ level: 3, paddleX: 300, ball: ball({ y: H - 2, vy: 300 }) });
    const next = stepBrickBreaker(state, IDLE, 0.05);
    expect(next.lives).toBe(2);
    expect(next.phase).toBe("playing");
    expect(next.ball.x).toBe(ballOn(300).x);
    expect(next.ball.y).toBe(ballOn(300).y);
    expect(next.ball.vx).toBeCloseTo(200 * 1.21);
    expect(next.ball.vy).toBeCloseTo(-300 * 1.21);
  });

  it("losing the last ball ends the game with 0 lives", () => {
    const next = stepBrickBreaker(game({ lives: 1, ball: ball({ y: H - 2, vy: 300 }) }), IDLE, 0.05);
    expect(next.phase).toBe("gameover");
    expect(next.lives).toBe(0);
  });

  it("after gameover or win the state no longer changes", () => {
    const over = stepBrickBreaker(game({ lives: 1, ball: ball({ y: H - 2, vy: 300 }) }), IDLE, 0.05);
    expect(stepBrickBreaker(over, RIGHT, 0.05)).toBe(over);
    const won = game({ phase: "win" });
    expect(stepBrickBreaker(won, { ...IDLE, pointerX: 100 }, 0.05)).toBe(won);
  });
});

describe("events", () => {
  it("only hold the sounds of the current step", () => {
    const bounced = stepBrickBreaker(game({ ball: ball({ x: 5, vx: -200 }) }), IDLE, 0.05);
    expect(bounced.events).toEqual(["bounce"]);
    expect(stepBrickBreaker(bounced, IDLE, 0.01).events).toEqual([]);
  });
});

describe("brickBreakerStats", () => {
  it("returns { score, lives, level }", () => {
    expect(brickBreakerStats(game({ score: 120, lives: 2, level: 4 }))).toEqual({ score: 120, lives: 2, level: 4 });
  });
});
