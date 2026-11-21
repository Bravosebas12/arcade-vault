// Constants copied from references/started-games/02-asteroids/game.js.

export const W = 800, H = 600;
export const RADII = [0, 16, 30, 50]; // by size 1, 2, 3
export const SPEEDS = [0, 85, 55, 32];
export const POINTS = [0, 100, 50, 20];
export const SHIP = { radius: 12, rot: 3.5, thrust: 260, drag: 0.987, nose: 21, cooldown: 0.2, invincible: 3 };
export const BULLET = { speed: 520, ttl: 1.1 };
export const POWERUP = { dropChance: 0.15, guaranteedAfterKills: 5, duration: 5, ttl: 12, tripleSpread: 0.18 };
export const RESPAWN_DELAY = 2; // s in the "dead" phase
export const SAFE_SPAWN_DIST = 130;

// Literal values of the original that the spec does not list, named here instead of inlined.
export const INITIAL_LIVES = 3;
export const INITIAL_ASTEROIDS = 4;
/** The ship collides when closer than SHIP.radius + asteroid radius × this factor. */
export const SHIP_HIT_FACTOR = 0.82;
export const ASTEROID = { speedJitter: 15, maxRotSpeed: 1.2, minVerts: 8, maxVerts: 13, minVertRadius: 0.6 };
export const POWERUP_BODY = { radius: 12, minSpeed: 20, maxSpeed: 40 };
export const PARTICLE = { minSpeed: 30, maxSpeed: 130, minLife: 0.4, maxLife: 1.1, ship: 14, perAsteroidSize: 5 };
