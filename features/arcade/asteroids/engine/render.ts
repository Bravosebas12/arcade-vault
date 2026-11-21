// Drawing of references/started-games/02-asteroids/game.js with the app's neon palette.
// Uses state.time instead of the clock or Math.random, so a paused game keeps its last frame.
import { H, POWERUP_BODY, W } from "@/features/arcade/asteroids/engine/constants";
import { asteroidsStats, type Asteroid, type AsteroidsState, type Bullet, type Particle, type PowerUp, type Ship } from "@/features/arcade/asteroids/engine/state";
import type { ArcadePalette } from "@/features/arcade/lib/palette";

/** Same family stack as the --mono token. */
const MONO = '"JetBrains Mono", "Courier Prime", "Courier New", monospace';

/** Deterministic noise in [0, 1) for the thruster flicker (the original used Math.random). */
function noise(seed: number) {
  const n = Math.sin(seed * 12.9898) * 43758.5453;
  return n - Math.floor(n);
}

function drawParticle(ctx: CanvasRenderingContext2D, p: Particle, palette: ArcadePalette) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, p.ttl / p.life);
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x - p.vx * 0.05, p.y - p.vy * 0.05);
  ctx.stroke();
  ctx.restore();
}

function drawAsteroid(ctx: CanvasRenderingContext2D, a: Asteroid, palette: ArcadePalette) {
  ctx.save();
  ctx.translate(a.x, a.y);
  ctx.rotate(a.rot);
  ctx.strokeStyle = palette.magenta;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(a.verts[0][0], a.verts[0][1]);
  for (let i = 1; i < a.verts.length; i++) ctx.lineTo(a.verts[i][0], a.verts[i][1]);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawPowerUp(ctx: CanvasRenderingContext2D, p: PowerUp, time: number, palette: ArcadePalette) {
  if (p.ttl < 2 && Math.floor(p.ttl * 8) % 2 === 0) return;
  const pulse = 0.85 + Math.sin((time * 1000) / 150) * 0.15;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(Math.PI / 4);
  ctx.strokeStyle = palette.cyan;
  ctx.lineWidth = 2;
  const r = POWERUP_BODY.radius * pulse;
  ctx.strokeRect(-r, -r, r * 2, r * 2);
  ctx.restore();
  ctx.fillStyle = palette.cyan;
  ctx.font = `bold 12px ${MONO}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("3x", p.x, p.y);
}

function drawBullet(ctx: CanvasRenderingContext2D, b: Bullet, palette: ArcadePalette) {
  ctx.fillStyle = palette.yellow;
  ctx.beginPath();
  ctx.arc(b.x, b.y, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawShip(ctx: CanvasRenderingContext2D, ship: Ship, time: number, palette: ArcadePalette) {
  if (ship.dead) return;
  // Blinks during the respawn invincibility.
  if (ship.invincible > 0 && Math.floor(ship.invincible * 8) % 2 === 0) return;

  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.strokeStyle = palette.cyan;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = "round";

  // Classic silhouette: triangle with a rear notch.
  ctx.beginPath();
  ctx.moveTo(20, 0);
  ctx.lineTo(-12, -9);
  ctx.lineTo(-7, 0);
  ctx.lineTo(-12, 9);
  ctx.closePath();
  ctx.stroke();

  // Thruster flame.
  const frame = Math.floor(time * 60);
  if (ship.thrusting && noise(frame) > 0.35) {
    ctx.beginPath();
    ctx.moveTo(-8, -4);
    ctx.lineTo(-8 - (6 + noise(frame + 0.5) * 8), 0);
    ctx.lineTo(-8, 4);
    ctx.strokeStyle = palette.yellow;
    ctx.stroke();
  }

  ctx.restore();
}

function drawLifeIcon(ctx: CanvasRenderingContext2D, x: number, y: number, scale: number, palette: ArcadePalette) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.rotate(-Math.PI / 2);
  ctx.strokeStyle = palette.ink;
  ctx.lineWidth = 1.2;
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(9, 0);
  ctx.lineTo(-6, -5);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

// The HUD and overlay sizes and offsets below are the original ones at scale 1; `s` (hudScale)
// enlarges them when the canvas is displayed narrower than W, so they stay readable on phones.

function drawHud(ctx: CanvasRenderingContext2D, state: AsteroidsState, s: number, palette: ArcadePalette) {
  // Same GameStats the canvas notifies to React, so both HUDs always match.
  const { score, lives, level } = asteroidsStats(state);
  ctx.fillStyle = palette.ink;
  ctx.font = `${15 * s}px ${MONO}`;
  ctx.textBaseline = "alphabetic";

  ctx.textAlign = "left";
  ctx.fillText(`SCORE  ${score}`, 14 * s, 26 * s);

  ctx.textAlign = "center";
  ctx.fillText(`NIVEL ${level}`, W / 2, 26 * s);

  for (let i = 0; i < (lives ?? 0); i++) drawLifeIcon(ctx, W - (16 + i * 22) * s, 18 * s, s, palette);

  if (state.ship.tripleShot > 0) {
    ctx.textAlign = "left";
    ctx.fillStyle = palette.cyan;
    ctx.fillText(`3x  ${state.ship.tripleShot.toFixed(1)}s`, 14 * s, 46 * s);
  }
}

function drawOverlay(ctx: CanvasRenderingContext2D, title: string, sub: string, s: number, palette: ArcadePalette) {
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = palette.ink;
  ctx.font = `bold ${46 * s}px ${MONO}`;
  ctx.fillText(title, W / 2, H / 2 - 18 * s);
  ctx.font = `${18 * s}px ${MONO}`;
  ctx.fillStyle = palette.inkDim;
  ctx.fillText(sub, W / 2, H / 2 + 22 * s);
}

/**
 * Draws the game, the original HUD and, after the last life, "GAME OVER" / "PUNTAJE: X".
 * `hudScale` (see features/arcade/lib/hud-scale.ts) only enlarges the HUD and overlay texts.
 */
export function drawAsteroids(ctx: CanvasRenderingContext2D, state: AsteroidsState, palette: ArcadePalette, hudScale = 1) {
  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);

  state.particles.forEach((p) => drawParticle(ctx, p, palette));
  state.asteroids.forEach((a) => drawAsteroid(ctx, a, palette));
  state.powerUps.forEach((p) => drawPowerUp(ctx, p, state.time, palette));
  state.bullets.forEach((b) => drawBullet(ctx, b, palette));
  drawShip(ctx, state.ship, state.time, palette);

  drawHud(ctx, state, hudScale, palette);

  if (state.phase === "gameover") drawOverlay(ctx, "GAME OVER", `PUNTAJE: ${state.score}`, hudScale, palette);
}
