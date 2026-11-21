// Pure port of references/started-games/02-asteroids/game.js: no DOM, window, clock or Math.random.
import {
  ASTEROID,
  BULLET,
  H,
  INITIAL_ASTEROIDS,
  INITIAL_LIVES,
  PARTICLE,
  POINTS,
  POWERUP,
  POWERUP_BODY,
  RADII,
  RESPAWN_DELAY,
  SAFE_SPAWN_DIST,
  SHIP,
  SHIP_HIT_FACTOR,
  SPEEDS,
  W,
} from "@/features/arcade/asteroids/engine/constants";
import type { GameStats } from "@/features/arcade/model/arcade-game";

export type AsteroidsInput = { left: boolean; right: boolean; thrust: boolean; fire: boolean }; // fire: just pressed
export type AsteroidsPhase = "playing" | "dead" | "gameover";

type Rng = () => number;

export type Ship = {
  x: number;
  y: number;
  angle: number;
  vx: number;
  vy: number;
  thrusting: boolean;
  /** Seconds of invincibility left. */
  invincible: number;
  shootCooldown: number;
  /** Seconds of triple shot left. */
  tripleShot: number;
  dead: boolean;
};

export type Bullet = { x: number; y: number; vx: number; vy: number; ttl: number };

export type AsteroidSize = 1 | 2 | 3;

export type Asteroid = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: AsteroidSize;
  radius: number;
  rot: number;
  rotSpeed: number;
  /** Irregular polygon, relative to the centre. */
  verts: [number, number][];
};

export type PowerUp = { x: number; y: number; vx: number; vy: number; ttl: number };

export type Particle = { x: number; y: number; vx: number; vy: number; life: number; ttl: number };

export type AsteroidsState = {
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  powerUps: PowerUp[];
  particles: Particle[];
  score: number;
  lives: number;
  level: number;
  phase: AsteroidsPhase;
  /** Seconds left in the "dead" phase. */
  deadTimer: number;
  powerUpSpawned: boolean;
  killsSinceSpawn: number;
  /** Seconds of game time, used by the renderer for blinking and pulses instead of the clock. */
  time: number;
};

// ── Utils ────────────────────────────────────────────────────────────────────
const wrap = (v: number, max: number) => ((v % max) + max) % max;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) => Math.hypot(a.x - b.x, a.y - b.y);
const rand = (rng: Rng, min: number, max: number) => min + rng() * (max - min);
const randInt = (rng: Rng, min: number, max: number) => Math.floor(rand(rng, min, max + 1));

// ── Factories (same random draws, in the same order, as the original constructors) ──
function createShip(tripleShot = 0): Ship {
  return {
    x: W / 2,
    y: H / 2,
    angle: -Math.PI / 2,
    vx: 0,
    vy: 0,
    thrusting: false,
    invincible: SHIP.invincible,
    shootCooldown: 0,
    tripleShot,
    dead: false,
  };
}

/** Ship.reset() of the original: keeps the triple shot timer. */
const resetShip = (ship: Ship): Ship => createShip(ship.tripleShot);

function createBullet(x: number, y: number, angle: number): Bullet {
  return { x, y, vx: Math.cos(angle) * BULLET.speed, vy: Math.sin(angle) * BULLET.speed, ttl: BULLET.ttl };
}

function createAsteroid(x: number, y: number, size: AsteroidSize, rng: Rng): Asteroid {
  const radius = RADII[size];
  const angle = rand(rng, 0, Math.PI * 2);
  const speed = SPEEDS[size] + rand(rng, -ASTEROID.speedJitter, ASTEROID.speedJitter);
  const rotSpeed = rand(rng, -ASTEROID.maxRotSpeed, ASTEROID.maxRotSpeed);
  const rot = rand(rng, 0, Math.PI * 2);
  const n = randInt(rng, ASTEROID.minVerts, ASTEROID.maxVerts);
  const verts: [number, number][] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = radius * rand(rng, ASTEROID.minVertRadius, 1.0);
    verts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size, radius, rot, rotSpeed, verts };
}

function splitAsteroid(a: Asteroid, rng: Rng): Asteroid[] {
  if (a.size <= 1) return [];
  const size = (a.size - 1) as AsteroidSize;
  return [createAsteroid(a.x, a.y, size, rng), createAsteroid(a.x, a.y, size, rng)];
}

function createPowerUp(x: number, y: number, rng: Rng): PowerUp {
  const angle = rand(rng, 0, Math.PI * 2);
  const speed = rand(rng, POWERUP_BODY.minSpeed, POWERUP_BODY.maxSpeed);
  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, ttl: POWERUP.ttl };
}

function createParticle(x: number, y: number, rng: Rng): Particle {
  const angle = rand(rng, 0, Math.PI * 2);
  const speed = rand(rng, PARTICLE.minSpeed, PARTICLE.maxSpeed);
  const life = rand(rng, PARTICLE.minLife, PARTICLE.maxLife);
  return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, life, ttl: life };
}

function spawnAsteroids(count: number, rng: Rng): Asteroid[] {
  const spawned: Asteroid[] = [];
  for (let i = 0; i < count; i++) {
    let x: number, y: number;
    do {
      x = rand(rng, 0, W);
      y = rand(rng, 0, H);
    } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_SPAWN_DIST);
    spawned.push(createAsteroid(x, y, 3, rng));
  }
  return spawned;
}

function explode(x: number, y: number, count: number, rng: Rng): Particle[] {
  return Array.from({ length: count }, () => createParticle(x, y, rng));
}

// ── Movement ─────────────────────────────────────────────────────────────────
const moveWrapped = <T extends { x: number; y: number; vx: number; vy: number }>(o: T, dt: number): T => ({
  ...o,
  x: wrap(o.x + o.vx * dt, W),
  y: wrap(o.y + o.vy * dt, H),
});

const updateBullets = (bullets: Bullet[], dt: number) =>
  bullets.map((b) => ({ ...moveWrapped(b, dt), ttl: b.ttl - dt })).filter((b) => b.ttl > 0);

const updateAsteroids = (asteroids: Asteroid[], dt: number) =>
  asteroids.map((a) => ({ ...moveWrapped(a, dt), rot: a.rot + a.rotSpeed * dt }));

const updatePowerUps = (powerUps: PowerUp[], dt: number) =>
  powerUps.map((p) => ({ ...moveWrapped(p, dt), ttl: p.ttl - dt })).filter((p) => p.ttl > 0);

/** Particles do not wrap. */
const updateParticles = (particles: Particle[], dt: number) =>
  particles.map((p) => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, ttl: p.ttl - dt })).filter((p) => p.ttl > 0);

function updateShip(ship: Ship, input: AsteroidsInput, dt: number): Ship {
  const s = { ...ship };
  if (s.invincible > 0) s.invincible -= dt;
  if (s.shootCooldown > 0) s.shootCooldown -= dt;
  if (s.tripleShot > 0) s.tripleShot -= dt;

  if (input.left) s.angle -= SHIP.rot * dt;
  if (input.right) s.angle += SHIP.rot * dt;

  s.thrusting = input.thrust;
  if (s.thrusting) {
    s.vx += Math.cos(s.angle) * SHIP.thrust * dt;
    s.vy += Math.sin(s.angle) * SHIP.thrust * dt;
  }

  s.vx *= SHIP.drag;
  s.vy *= SHIP.drag;
  s.x = wrap(s.x + s.vx * dt, W);
  s.y = wrap(s.y + s.vy * dt, H);
  return s;
}

/** Ship.tryShoot(): mutates the cooldown of the given ship copy and returns the new bullets. */
function tryShoot(ship: Ship): Bullet[] {
  if (ship.shootCooldown > 0 || ship.dead) return [];
  ship.shootCooldown = SHIP.cooldown;
  const ox = ship.x + Math.cos(ship.angle) * SHIP.nose;
  const oy = ship.y + Math.sin(ship.angle) * SHIP.nose;
  if (ship.tripleShot > 0) {
    return [
      createBullet(ox, oy, ship.angle - POWERUP.tripleSpread),
      createBullet(ox, oy, ship.angle),
      createBullet(ox, oy, ship.angle + POWERUP.tripleSpread),
    ];
  }
  return [createBullet(ox, oy, ship.angle)];
}

// ── Public API ───────────────────────────────────────────────────────────────
/** initGame() of the original. */
export function createAsteroidsState(rng: () => number): AsteroidsState {
  return {
    ship: createShip(),
    bullets: [],
    asteroids: spawnAsteroids(INITIAL_ASTEROIDS, rng),
    powerUps: [],
    particles: [],
    score: 0,
    lives: INITIAL_LIVES,
    level: 1,
    phase: "playing",
    deadTimer: 0,
    powerUpSpawned: false,
    killsSinceSpawn: 0,
    time: 0,
  };
}

/** update(dt) of the original, without the restart on space after "GAME OVER". */
export function stepAsteroids(state: AsteroidsState, input: AsteroidsInput, dt: number, rng: () => number): AsteroidsState {
  const time = state.time + dt;

  if (state.phase === "gameover") {
    return { ...state, time, particles: updateParticles(state.particles, dt) };
  }

  if (state.phase === "dead") {
    const deadTimer = state.deadTimer - dt;
    const next = {
      ...state,
      time,
      deadTimer,
      particles: updateParticles(state.particles, dt),
      asteroids: updateAsteroids(state.asteroids, dt),
    };
    return deadTimer <= 0 ? { ...next, phase: "playing", ship: resetShip(state.ship) } : next;
  }

  // Fire (before moving, as in the original).
  const firing = { ...state.ship };
  const fired = input.fire ? tryShoot(firing) : [];

  let ship = updateShip(firing, input, dt);
  let bullets = updateBullets([...state.bullets, ...fired], dt);
  let asteroids = updateAsteroids(state.asteroids, dt);
  let particles = updateParticles(state.particles, dt);
  let powerUps = updatePowerUps(state.powerUps, dt);
  let { score, lives, level, deadTimer, powerUpSpawned, killsSinceSpawn } = state;
  let phase: AsteroidsPhase = state.phase;

  // Power-up pickup.
  powerUps = powerUps.filter((p) => {
    if (dist(ship, p) < SHIP.radius + POWERUP_BODY.radius) {
      ship = { ...ship, tripleShot: POWERUP.duration };
      return false;
    }
    return true;
  });

  // Bullet vs asteroid.
  const deadBullets = new Set<Bullet>();
  const deadAsteroids = new Set<Asteroid>();
  const newAsteroids: Asteroid[] = [];
  for (const b of bullets) {
    for (const a of asteroids) {
      if (!deadAsteroids.has(a) && !deadBullets.has(b) && dist(b, a) < a.radius) {
        deadBullets.add(b);
        deadAsteroids.add(a);
        score += POINTS[a.size];
        particles = [...particles, ...explode(a.x, a.y, a.size * PARTICLE.perAsteroidSize, rng)];
        newAsteroids.push(...splitAsteroid(a, rng));
        if (!powerUpSpawned) {
          killsSinceSpawn++;
          const guaranteed = killsSinceSpawn >= POWERUP.guaranteedAfterKills;
          if (guaranteed || rng() < POWERUP.dropChance) {
            powerUps = [...powerUps, createPowerUp(a.x, a.y, rng)];
            powerUpSpawned = true;
          }
        }
      }
    }
  }
  asteroids = asteroids.filter((a) => !deadAsteroids.has(a)).concat(newAsteroids);
  bullets = bullets.filter((b) => !deadBullets.has(b));

  // Ship vs asteroid.
  if (ship.invincible <= 0) {
    const hit = asteroids.some((a) => dist(ship, a) < SHIP.radius + a.radius * SHIP_HIT_FACTOR);
    if (hit) {
      particles = [...particles, ...explode(ship.x, ship.y, PARTICLE.ship, rng)];
      ship = { ...ship, dead: true };
      lives--;
      if (lives <= 0) {
        phase = "gameover";
      } else {
        phase = "dead";
        deadTimer = RESPAWN_DELAY;
      }
    }
  }

  // Level complete.
  if (asteroids.length === 0) {
    level++;
    bullets = [];
    particles = [];
    powerUps = [];
    powerUpSpawned = false;
    killsSinceSpawn = 0;
    ship = resetShip(ship);
    asteroids = spawnAsteroids(3 + level, rng);
  }

  return { ship, bullets, asteroids, powerUps, particles, score, lives, level, phase, deadTimer, powerUpSpawned, killsSinceSpawn, time };
}

export function asteroidsStats(state: AsteroidsState): GameStats {
  return { score: state.score, lives: state.lives, level: state.level };
}
