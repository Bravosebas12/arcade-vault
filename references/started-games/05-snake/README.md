# SERPENTINA — playable prototype

Original Snake-genre game designed for Arcade Vault (not a port of an existing game). It is the source the `snake` spec extracts its mechanics, constants and texts from.

Open `index.html` directly in a browser (no server needed). Use the arrows or WASD to move, P or Escape to pause, and Space to start or retry.

## Files

| File | Content |
| --- | --- |
| `game.js` | Constants, state, `update`, render, WebAudio sounds and input |
| `maps.js` | `SNAKE_MAPS`: 5 maps (wall rectangles in cells + snake spawn) |
| `sprites.js` | `SPRITE_ATLAS`: 7 original 12×12 pixel-art fruits painted on an offscreen canvas, with `{ x, y, w, h }` crops |
| `index.html` | Canvas plus a fruit gallery under it |

## Rules

- **Board:** 28×20 cells of 24 px, with a 40 px HUD on top (672×520 canvas) and a border wall on every map.
- **Snake:** starts with length 4 at the map's spawn. It moves `min(6 + level, 16)` cells per second. A turn queue holds up to 2 turns, and reversing is ignored.
- **Fruits:**
  - One normal fruit at a time: apple, cherry, grape, lemon, watermelon or strawberry, picked at random. It is worth 10 × level and grows the snake by 1.
  - Every 5 normal fruits a golden pineapple bonus appears for 5 s, blinking in its last 1.5 s. It is worth 50 × level and grows the snake by 1.
- **Maps:** 10 normal fruits clear a map. A "MAPA N" banner shows for 1.5 s, the snake respawns with length 4, and the next map loads:
  1. ARENA
  2. PILARES
  3. PASILLOS
  4. CRUZ
  5. LABERINTO

  After map 5 the maps repeat, faster.
- **Lives:** 3. Hitting a wall or the snake's own body costs a life. The snake blinks for 1 s and respawns on the same map with length 4, keeping the score and the map's fruit count. The bonus is removed. At 0 lives the game shows GAME OVER.
- **Sounds:** synthesized beeps for eating, bonus, crash and next map. Nothing sounds while paused.

`window.__serpentina` exposes the state for automated checks; the port must not keep it.

The fruit art is original and drawn for this project. The `sprites.js` handed in with the request (crops of a third-party sheet) was used only as a reference for the atlas format.
