import { describe, expect, it } from "vitest";
import { BULLET, H, POINTS, POWERUP, RADII, SAFE_SPAWN_DIST, SHIP, W } from "@/features/arcade/asteroids/engine/constants";
import {
  asteroidsStats,
  createAsteroidsState,
  stepAsteroids,
  type Asteroid,
  type AsteroidsInput,
  type AsteroidsState,
} from "@/features/arcade/asteroids/engine/state";
import { createRng } from "@/features/arcade/lib/rng";

const IDLE: AsteroidsInput = { left: false, right: false, thrust: false, fire: false };
const FIRE: AsteroidsInput = { ...IDLE, fire: true };
// 0.99 never passes the 15% power-up drop chance, and spawns asteroids far from the centre.
const high = () => 0.99;

/** A still asteroid, so tests control every collision. */
function rock(x: number, y: number, size: 1 | 2 | 3): Asteroid {
  return { x, y, vx: 0, vy: 0, size, radius: RADII[size], rot: 0, rotSpeed: 0, verts: [[RADII[size], 0], [0, RADII[size]], [-RADII[size], 0]] };
}

/** Fresh game with the given asteroids plus one far, still asteroid that keeps the level from ending. */
function game(asteroids: Asteroid[] = [], keepLevel = true): AsteroidsState {
  const state = createAsteroidsState(createRng(7));
  return { ...state, asteroids: keepLevel ? [...asteroids, rock(80, 80, 1)] : asteroids };
}

function run(state: AsteroidsState, seconds: number, input: AsteroidsInput = IDLE, dt = 0.05): AsteroidsState {
  let s = state;
  for (let t = 0; t < seconds - 1e-9; t += dt) s = stepAsteroids(s, input, dt, high);
  return s;
}

describe("createAsteroidsState", () => {
  it("starts with score 0, level 1, 3 lives and 4 large asteroids away from the centre", () => {
    const state = createAsteroidsState(createRng(1));
    expect(asteroidsStats(state)).toEqual({ score: 0, lives: 3, level: 1 });
    expect(state.phase).toBe("playing");
    expect(state.asteroids).toHaveLength(4);
    for (const a of state.asteroids) {
      expect(a.size).toBe(3);
      expect(Math.hypot(a.x - W / 2, a.y - H / 2)).toBeGreaterThanOrEqual(SAFE_SPAWN_DIST);
    }
    expect(state.ship).toMatchObject({ x: W / 2, y: H / 2, angle: -Math.PI / 2, invincible: SHIP.invincible });
  });

  it("is deterministic for the same rng seed", () => {
    expect(createAsteroidsState(createRng(9))).toEqual(createAsteroidsState(createRng(9)));
  });
});

describe("stepAsteroids — ship", () => {
  it("rotates left and right", () => {
    const left = stepAsteroids(game(), { ...IDLE, left: true }, 0.1, high);
    expect(left.ship.angle).toBeCloseTo(-Math.PI / 2 - SHIP.rot * 0.1);
    const right = stepAsteroids(game(), { ...IDLE, right: true }, 0.1, high);
    expect(right.ship.angle).toBeCloseTo(-Math.PI / 2 + SHIP.rot * 0.1);
  });

  it("thrusts along its angle and keeps drifting with drag after releasing", () => {
    const thrusted = stepAsteroids(game(), { ...IDLE, thrust: true }, 0.05, high);
    expect(thrusted.ship.vx).toBeCloseTo(0);
    expect(thrusted.ship.vy).toBeCloseTo(-SHIP.thrust * 0.05 * SHIP.drag);
    expect(thrusted.ship.thrusting).toBe(true);

    const drifting = stepAsteroids(thrusted, IDLE, 0.05, high);
    expect(drifting.ship.thrusting).toBe(false);
    expect(drifting.ship.vy).toBeCloseTo(thrusted.ship.vy * SHIP.drag);
    expect(drifting.ship.y).toBeLessThan(thrusted.ship.y);
  });

  it("comes back on the opposite side when leaving the screen", () => {
    const state = game();
    const leaving = { ...state, ship: { ...state.ship, x: W - 1, y: 1, vx: 200, vy: -200 } };
    const next = stepAsteroids(leaving, IDLE, 0.05, high);
    expect(next.ship.x).toBeLessThan(20);
    expect(next.ship.y).toBeGreaterThan(H - 20);
  });
});

describe("stepAsteroids — bullets", () => {
  it("fires a single bullet when firing twice within the 0.2 s cooldown", () => {
    const once = stepAsteroids(game(), FIRE, 0.016, high);
    const twice = stepAsteroids(once, FIRE, 0.016, high);
    expect(twice.bullets).toHaveLength(1);
  });

  it("fires again once the cooldown is over", () => {
    const once = stepAsteroids(game(), FIRE, 0.05, high);
    const waited = run(once, SHIP.cooldown);
    expect(stepAsteroids(waited, FIRE, 0.05, high).bullets).toHaveLength(2);
  });

  it("removes the bullet after 1.1 s", () => {
    const fired = stepAsteroids(game(), FIRE, 0.05, high);
    expect(run(fired, 1.0).bullets).toHaveLength(1);
    expect(run(fired, BULLET.ttl).bullets).toHaveLength(0);
  });
});

describe("stepAsteroids — asteroids", () => {
  it("splits a size 3 asteroid hit by a bullet into two of size 2 and adds 20", () => {
    const next = stepAsteroids(game([rock(W / 2, 250, 3)]), FIRE, 0.016, high);
    expect(next.score).toBe(POINTS[3]);
    expect(next.score).toBe(20);
    expect(next.asteroids.filter((a) => a.size === 2)).toHaveLength(2);
    expect(next.asteroids.filter((a) => a.size === 3)).toHaveLength(0);
    expect(next.bullets).toHaveLength(0);
    expect(next.particles.length).toBeGreaterThan(0);
  });

  it("removes a size 1 asteroid hit by a bullet and adds 100", () => {
    const next = stepAsteroids(game([rock(W / 2, 270, 1)]), FIRE, 0.016, high);
    expect(next.score).toBe(100);
    expect(next.asteroids).toHaveLength(1); // only the far one that keeps the level
  });
});

describe("stepAsteroids — power-up", () => {
  function killOne(state: AsteroidsState): AsteroidsState {
    const ready = { ...state, asteroids: [rock(W / 2, 270, 1), rock(80, 80, 1)], ship: { ...state.ship, shootCooldown: 0 } };
    return stepAsteroids(ready, FIRE, 0.016, high);
  }

  it("drops a power-up after 5 kills without one, and picking it up gives a triple shot for 5 s", () => {
    let state = game();
    for (let i = 0; i < POWERUP.guaranteedAfterKills - 1; i++) state = killOne(state);
    expect(state.powerUps).toHaveLength(0);
    state = killOne(state);
    expect(state.powerUps).toHaveLength(1);

    const onShip = { ...state, powerUps: [{ ...state.powerUps[0], x: state.ship.x, y: state.ship.y, vx: 0, vy: 0 }] };
    const picked = stepAsteroids(onShip, IDLE, 0.016, high);
    expect(picked.powerUps).toHaveLength(0);
    expect(picked.ship.tripleShot).toBeCloseTo(POWERUP.duration);

    const triple = stepAsteroids({ ...picked, bullets: [], ship: { ...picked.ship, shootCooldown: 0 } }, FIRE, 0.016, high);
    expect(triple.bullets).toHaveLength(3);

    const expired = run(picked, POWERUP.duration + 0.05);
    expect(expired.ship.tripleShot).toBeLessThanOrEqual(0);
    const single = stepAsteroids({ ...expired, bullets: [], ship: { ...expired.ship, shootCooldown: 0 } }, FIRE, 0.016, high);
    expect(single.bullets).toHaveLength(1);
  });
});

describe("stepAsteroids — lives and phases", () => {
  function vulnerable(state: AsteroidsState): AsteroidsState {
    return { ...state, ship: { ...state.ship, invincible: 0 } };
  }

  it("loses a life and goes to dead when hitting an asteroid without invincibility", () => {
    const next = stepAsteroids(vulnerable(game([rock(W / 2, H / 2, 2)])), IDLE, 0.016, high);
    expect(next.lives).toBe(2);
    expect(next.phase).toBe("dead");
    expect(next.ship.dead).toBe(true);
  });

  it("respawns at the centre after 2 s with 3 s of invincibility", () => {
    const hit = stepAsteroids(vulnerable(game([rock(W / 2 + 30, H / 2, 2)])), IDLE, 0.016, high);
    expect(hit.phase).toBe("dead");
    let back = run(hit, 1.9);
    expect(back.phase).toBe("dead");
    // The respawn happens on the frame that reaches 2 s (2.05 s here).
    back = stepAsteroids(back, IDLE, 0.15, high);
    expect(back.phase).toBe("playing");
    expect(back.deadTimer).toBeLessThanOrEqual(0);
    expect(back.ship).toMatchObject({ x: W / 2, y: H / 2, dead: false, invincible: SHIP.invincible });
    expect(back.lives).toBe(2);
  });

  it("does not lose a life while invincible", () => {
    const state = game([rock(W / 2, H / 2, 2)]);
    expect(state.ship.invincible).toBeGreaterThan(0);
    const next = stepAsteroids(state, IDLE, 0.016, high);
    expect(next.lives).toBe(3);
    expect(next.phase).toBe("playing");
  });

  it("goes to gameover with 0 lives, and then stepping no longer changes the score", () => {
    const last = { ...vulnerable(game([rock(W / 2, H / 2, 2), rock(W / 2, 270, 1)])), lives: 1, score: 340 };
    const over = stepAsteroids(last, IDLE, 0.016, high);
    expect(over.lives).toBe(0);
    expect(over.phase).toBe("gameover");
    const after = run(over, 2, FIRE);
    expect(after.score).toBe(340);
    expect(after.phase).toBe("gameover");
    expect(after.bullets).toHaveLength(0);
  });
});

describe("stepAsteroids — levels", () => {
  it("goes up a level when no asteroids are left and spawns 3 + level away from the centre", () => {
    const next = stepAsteroids(game([], false), IDLE, 0.016, createRng(3));
    expect(next.level).toBe(2);
    expect(next.asteroids).toHaveLength(3 + 2);
    for (const a of next.asteroids) {
      expect(a.size).toBe(3);
      expect(Math.hypot(a.x - W / 2, a.y - H / 2)).toBeGreaterThanOrEqual(SAFE_SPAWN_DIST);
    }
  });
});

describe("asteroidsStats", () => {
  it("returns score, lives and level from the state", () => {
    expect(asteroidsStats({ ...game(), score: 1234, lives: 2, level: 4 })).toEqual({ score: 1234, lives: 2, level: 4 });
  });
});
