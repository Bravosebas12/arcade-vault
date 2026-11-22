// SERPENTINA — playable prototype for Arcade Vault (vanilla JS, single canvas).
// Structure mirrors the future TypeScript port: constants → pure-ish state + update → render.
(() => {
  // ── Constants ────────────────────────────────────────────────────────────
  const COLS = 28, ROWS = 20, CELL = 24, HUD = 40;
  const W = COLS * CELL;          // 672
  const H = ROWS * CELL + HUD;    // 520
  const START_LIVES = 3, START_LENGTH = 4;
  const FRUITS_PER_MAP = 10;      // normal fruits to clear a map
  const BONUS_EVERY = 5;          // a bonus appears every 5 normal fruits (once per map)
  const BONUS_TIME = 5, BONUS_BLINK = 1.5;
  const NORMAL_POINTS = 10, BONUS_POINTS = 50; // × level
  const BASE_SPEED = 6, SPEED_PER_LEVEL = 1, MAX_SPEED = 16; // cells per second
  const LEVEL_BANNER = 1.5, DEATH_PAUSE = 1.0, INPUT_QUEUE = 2, MAX_DT = 0.05;
  const NORMAL_TYPES = ["apple", "cherry", "grape", "lemon", "watermelon", "strawberry"];
  const BONUS_TYPE = "pineapple";

  const DIRS = { up: { x: 0, y: -1 }, down: { x: 0, y: 1 }, left: { x: -1, y: 0 }, right: { x: 1, y: 0 } };
  const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
  const C = { bg: "#0a0a0f", grid: "rgba(0,245,255,0.06)", wall: "#ff006e", snake: "#00ff88", head: "#b6ffd9",
    cyan: "#00f5ff", yellow: "#f5ff00", magenta: "#ff006e", ink: "#e6e9ff", dim: "#8a8fb5" };
  const FONT = '"Press Start 2P", monospace';

  const MAPS = window.SNAKE_MAPS;
  const ATLAS = window.SPRITE_ATLAS;

  // ── State ────────────────────────────────────────────────────────────────
  const key = (x, y) => y * COLS + x;
  const speedFor = (level) => Math.min(BASE_SPEED + level * SPEED_PER_LEVEL, MAX_SPEED);
  const mapFor = (level) => MAPS[(level - 1) % MAPS.length];

  function buildWalls(map) {
    const walls = new Set();
    for (let x = 0; x < COLS; x++) { walls.add(key(x, 0)); walls.add(key(x, ROWS - 1)); }
    for (let y = 0; y < ROWS; y++) { walls.add(key(0, y)); walls.add(key(COLS - 1, y)); }
    for (const r of map.walls) for (let y = r.y; y < r.y + r.h; y++) for (let x = r.x; x < r.x + r.w; x++) walls.add(key(x, y));
    return walls;
  }

  function createState(rng) {
    const s = { phase: "title", score: 0, lives: START_LIVES, level: 1, fruitsInMap: 0, totalFruits: 0, clock: 0, timer: 0 };
    enterMap(s, rng);
    return s;
  }

  function enterMap(s, rng) {
    s.map = mapFor(s.level);
    s.walls = buildWalls(s.map);
    resetSnake(s);
    s.bonus = null;
    s.fruit = placeItem(s, rng, NORMAL_TYPES[Math.floor(rng() * NORMAL_TYPES.length)]);
  }

  function resetSnake(s) {
    const { x, y, dir } = s.map.spawn;
    const d = DIRS[dir];
    s.snake = Array.from({ length: START_LENGTH }, (_, i) => ({ x: x - d.x * i, y: y - d.y * i }));
    s.dir = dir;
    s.queue = [];
    s.grow = 0;
    s.acc = 0;
  }

  function placeItem(s, rng, type) {
    const taken = new Set(s.walls);
    for (const c of s.snake) taken.add(key(c.x, c.y));
    if (s.fruit) taken.add(key(s.fruit.x, s.fruit.y));
    if (s.bonus) taken.add(key(s.bonus.x, s.bonus.y));
    const free = [];
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (!taken.has(key(x, y))) free.push({ x, y });
    const cell = free[Math.floor(rng() * free.length)];
    return { ...cell, type };
  }

  function turn(s, dir) {
    const last = s.queue.length ? s.queue[s.queue.length - 1] : s.dir;
    if (dir === last || dir === OPPOSITE[last] || s.queue.length >= INPUT_QUEUE) return;
    s.queue.push(dir);
  }

  function update(s, dt, rng, events) {
    s.clock += dt;
    if (s.phase === "levelup" || s.phase === "dying") {
      s.timer -= dt;
      if (s.timer > 0) return;
      if (s.phase === "dying") { resetSnake(s); s.bonus = null; }
      s.phase = "playing";
    }
    if (s.phase !== "playing") return;

    if (s.bonus && (s.bonus.t -= dt) <= 0) s.bonus = null;

    s.acc += dt;
    const stepTime = 1 / speedFor(s.level);
    while (s.acc >= stepTime && s.phase === "playing") {
      s.acc -= stepTime;
      move(s, rng, events);
    }
  }

  function move(s, rng, events) {
    if (s.queue.length) s.dir = s.queue.shift();
    const d = DIRS[s.dir];
    const next = { x: s.snake[0].x + d.x, y: s.snake[0].y + d.y };
    // The tail leaves its cell this step unless the snake is growing.
    const body = s.grow > 0 ? s.snake : s.snake.slice(0, -1);
    if (s.walls.has(key(next.x, next.y)) || body.some((c) => c.x === next.x && c.y === next.y)) return die(s, events);

    s.snake.unshift(next);
    if (s.grow > 0) s.grow--; else s.snake.pop();

    if (s.fruit && next.x === s.fruit.x && next.y === s.fruit.y) {
      s.score += NORMAL_POINTS * s.level;
      s.grow += 1;
      s.fruitsInMap++;
      s.totalFruits++;
      events.push("eat");
      if (s.fruitsInMap >= FRUITS_PER_MAP) {
        s.level++;
        s.fruitsInMap = 0;
        s.phase = "levelup";
        s.timer = LEVEL_BANNER;
        enterMap(s, rng);
        events.push("level");
        return;
      }
      s.fruit = null;
      s.fruit = placeItem(s, rng, NORMAL_TYPES[Math.floor(rng() * NORMAL_TYPES.length)]);
      if (s.totalFruits % BONUS_EVERY === 0 && !s.bonus) s.bonus = { ...placeItem(s, rng, BONUS_TYPE), t: BONUS_TIME };
    } else if (s.bonus && next.x === s.bonus.x && next.y === s.bonus.y) {
      s.score += BONUS_POINTS * s.level;
      s.grow += 1;
      s.bonus = null;
      events.push("bonus");
    }
  }

  function die(s, events) {
    s.lives--;
    events.push("die");
    if (s.lives <= 0) s.phase = "gameover";
    else { s.phase = "dying"; s.timer = DEATH_PAUSE; }
  }

  // ── Sound (WebAudio beeps, created on the first key press) ───────────────
  let actx = null;
  function beep(freq, dur, type = "square", vol = 0.05, slideTo = null, delay = 0) {
    if (!actx) return;
    const t0 = actx.currentTime + delay;
    const osc = actx.createOscillator(), gain = actx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(actx.destination);
    osc.start(t0);
    osc.stop(t0 + dur);
  }
  const SFX = {
    eat: () => beep(660, 0.07),
    bonus: () => { beep(784, 0.08); beep(1046, 0.12, "square", 0.05, null, 0.08); },
    die: () => beep(300, 0.4, "sawtooth", 0.06, 60),
    level: () => [523, 659, 784, 1046].forEach((f, i) => beep(f, 0.09, "square", 0.05, null, i * 0.09)),
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const canvas = document.getElementById("game");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const px = (x) => x * CELL;
  const py = (y) => HUD + y * CELL;

  function text(str, x, y, size, color, align = "center", glow = 0) {
    ctx.font = `${size}px ${FONT}`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = glow;
    ctx.fillText(str, x, y);
    ctx.shadowBlur = 0;
  }

  function drawSprite(name, x, y, size) {
    const f = ATLAS.fruits[name];
    ctx.drawImage(ATLAS.image, f.x, f.y, f.w, f.h, x, y, size, size);
  }

  function drawHud(s) {
    ctx.fillStyle = "#0f0f18";
    ctx.fillRect(0, 0, W, HUD);
    ctx.fillStyle = "rgba(0,245,255,0.35)";
    ctx.fillRect(0, HUD - 2, W, 2);
    text("PUNTOS " + String(s.score).padStart(6, "0"), 14, HUD / 2, 11, C.yellow, "left", 6);
    text(`MAPA ${s.level} · ${s.map.name}`, 300, HUD / 2, 10, C.cyan, "center", 6);
    drawSprite("apple", 448, 10, 20);
    text(`${s.fruitsInMap}/${FRUITS_PER_MAP}`, 474, HUD / 2, 10, C.ink, "left");
    text("VIDAS", 566, HUD / 2, 10, C.dim, "left");
    for (let i = 0; i < s.lives; i++) {
      ctx.fillStyle = C.snake;
      ctx.fillRect(626 + i * 14, 14, 10, 10);
    }
  }

  function drawBoard(s) {
    ctx.fillStyle = C.bg;
    ctx.fillRect(0, HUD, W, H - HUD);
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 1;
    for (let x = 1; x < COLS; x++) { ctx.beginPath(); ctx.moveTo(px(x) + 0.5, HUD); ctx.lineTo(px(x) + 0.5, H); ctx.stroke(); }
    for (let y = 1; y < ROWS; y++) { ctx.beginPath(); ctx.moveTo(0, py(y) + 0.5); ctx.lineTo(W, py(y) + 0.5); ctx.stroke(); }

    ctx.shadowColor = C.wall;
    ctx.shadowBlur = 8;
    for (const k of s.walls) {
      const x = k % COLS, y = Math.floor(k / COLS);
      ctx.fillStyle = C.wall;
      ctx.fillRect(px(x) + 2, py(y) + 2, CELL - 4, CELL - 4);
    }
    ctx.shadowBlur = 0;
    for (const k of s.walls) {
      const x = k % COLS, y = Math.floor(k / COLS);
      ctx.fillStyle = "rgba(10,10,15,0.55)";
      ctx.fillRect(px(x) + 7, py(y) + 7, CELL - 14, CELL - 14);
    }
  }

  function drawItems(s) {
    if (s.fruit) drawSprite(s.fruit.type, px(s.fruit.x), py(s.fruit.y), CELL);
    if (s.bonus) {
      const blinking = s.bonus.t < BONUS_BLINK && Math.floor(s.clock * 8) % 2 === 0;
      if (!blinking) {
        ctx.shadowColor = "#ffcf3a";
        ctx.shadowBlur = 14;
        drawSprite(s.bonus.type, px(s.bonus.x) - 3, py(s.bonus.y) - 3, CELL + 6);
        ctx.shadowBlur = 0;
      }
    }
  }

  function drawSnake(s) {
    const hurt = s.phase === "dying" || s.phase === "gameover";
    if (s.phase === "dying" && Math.floor(s.clock * 10) % 2 === 0) return;
    ctx.shadowColor = hurt ? C.magenta : C.snake;
    ctx.shadowBlur = 10;
    s.snake.forEach((c, i) => {
      ctx.fillStyle = i === 0 ? (hurt ? "#ffb3cf" : C.head) : hurt ? C.magenta : C.snake;
      const inset = i === 0 ? 1 : 3;
      ctx.fillRect(px(c.x) + inset, py(c.y) + inset, CELL - inset * 2, CELL - inset * 2);
    });
    ctx.shadowBlur = 0;
    // Eyes on the head, facing the current direction.
    const h = s.snake[0], d = DIRS[s.dir];
    const cx = px(h.x) + CELL / 2, cy = py(h.y) + CELL / 2;
    const ox = d.y !== 0 ? 5 : 0, oy = d.x !== 0 ? 5 : 0;
    ctx.fillStyle = "#0a0a0f";
    for (const sign of [-1, 1]) ctx.fillRect(cx + d.x * 4 + sign * ox - 2, cy + d.y * 4 + sign * oy - 2, 4, 4);
  }

  function overlay(alpha = 0.6) {
    ctx.fillStyle = `rgba(10,10,15,${alpha})`;
    ctx.fillRect(0, HUD, W, H - HUD);
  }

  function render(s, paused) {
    drawHud(s);
    drawBoard(s);
    if (s.phase !== "title") drawItems(s);
    drawSnake(s);
    const mid = HUD + (H - HUD) / 2;
    const blinkOn = Math.floor(s.clock * 2) % 2 === 0;

    if (s.phase === "title") {
      overlay(0.75);
      text("SERPENTINA", W / 2, mid - 60, 36, C.magenta, "center", 18);
      text("COME FRUTAS · CRECE · NO CHOQUES", W / 2, mid - 6, 10, C.ink);
      NORMAL_TYPES.concat(BONUS_TYPE).forEach((t, i) => drawSprite(t, W / 2 - 7 * 18 + i * 36, mid + 18, 24));
      if (blinkOn) text("PULSA ESPACIO", W / 2, mid + 80, 14, C.yellow, "center", 10);
      text("FLECHAS / WASD · P PAUSA", W / 2, mid + 120, 9, C.dim);
    } else if (s.phase === "levelup") {
      overlay(0.45);
      text(`MAPA ${s.level}`, W / 2, mid - 20, 28, C.cyan, "center", 16);
      text(s.map.name, W / 2, mid + 24, 14, C.yellow, "center", 8);
    } else if (s.phase === "gameover") {
      overlay(0.65);
      text("GAME OVER", W / 2, mid - 30, 34, C.magenta, "center", 18);
      text("PUNTOS " + String(s.score).padStart(6, "0"), W / 2, mid + 20, 14, C.yellow, "center", 8);
      if (blinkOn) text("ESPACIO PARA REINTENTAR", W / 2, mid + 64, 10, C.ink);
    }
    if (paused) {
      overlay(0.55);
      text("EN PAUSA", W / 2, mid, 24, C.yellow, "center", 12);
    }
  }

  // ── Loop and input ───────────────────────────────────────────────────────
  const rng = Math.random;
  let state = createState(rng);
  let paused = false;
  let last = performance.now();

  const KEY_DIRS = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right", w: "up", s: "down", a: "left", d: "right", W: "up", S: "down", A: "left", D: "right" };

  window.addEventListener("keydown", (e) => {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (KEY_DIRS[e.key] || e.key === " ") e.preventDefault();
    if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      if (["playing", "levelup", "dying"].includes(state.phase)) paused = !paused;
      return;
    }
    if (paused) return;
    if (e.key === " " || e.key === "Enter") {
      if (state.phase === "title") state.phase = "playing";
      else if (state.phase === "gameover") { state = createState(rng); state.phase = "playing"; }
      return;
    }
    if (KEY_DIRS[e.key] && state.phase === "playing") turn(state, KEY_DIRS[e.key]);
  });

  function frame(now) {
    const dt = Math.min((now - last) / 1000, MAX_DT);
    last = now;
    if (!paused) {
      const events = [];
      update(state, dt, rng, events);
      for (const ev of events) SFX[ev]();
    }
    render(state, paused);
    requestAnimationFrame(frame);
  }

  // Debug handle for automated checks (prototype only; the port has no globals).
  window.__serpentina = { get state() { return state; }, enterMap: (level) => { state.level = level; state.fruitsInMap = 0; enterMap(state, rng); } };

  document.fonts.ready.then(() => requestAnimationFrame(frame));
})();
