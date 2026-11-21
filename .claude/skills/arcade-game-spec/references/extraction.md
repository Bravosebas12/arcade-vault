# Extracting a game from `references/started-games/`

Each folder `references/started-games/NN-name/` is a vanilla-JS canvas game: `index.html`, `game.js`, and sometimes `style.css`, `levels.js`, `assets/`, `README.md`, `CLAUDE.md` and `specs/`. Read all of them, ignoring `.github`, `.agents`, `.claude` and `.DS_Store`.

| Read in the source | Where it goes in the spec |
| --- | --- |
| `const` values (sizes, speeds, points, cooldowns, probabilities) | Data model → `engine/constants.ts`, copied verbatim. |
| Classes and global state (`let score, lives, level`, entities, phases) | Data model → state type and phases. |
| `update()` / collisions / spawn / level change | Plan → engine step, and engine test cases with the exact numbers. |
| `Math.random` calls | The `rng` injected into the engine, with the same draws in the same order. |
| Key handlers (`e.code` / `e.key`), mouse, buttons | Controls. P/Escape/pause and restart move to the container; list them as removed. |
| Drawing code and HUD texts (`fillText`, DOM panels) | Canvas section: logical size, layers, in-canvas HUD and end screens. DOM panels are redrawn inside the canvas. |
| `canvas.width/height` | Logical size; the CRT scales it at 4:3 or its own ratio. |
| Images, sounds, fonts | Assets in `public/games/<id>/`, absolute paths, loaded before the loop starts. |
| `localStorage` keys, theme toggles, cheats (level jump) | List them as removed or out of scope; scores go through the leaderboard. |
| Top-level code, listeners never removed, unbounded rAF | Section "Por qué existe" (why it cannot be imported as-is). |

## Questions to always ask

1. Catalog entry and English id (reuse a simulated game or add a new one), and the Spanish title.
2. Behaviors to keep versus drop (extra pieces, power-ups, cheats, restart keys).
3. Colors: the original palette or the neon tokens (`--cyan`, `--magenta`, `--yellow`, `--green`).
4. `max_score` for the `games` row: a generous upper bound of a real run.

## Platform facts the spec must state

- Contract: `ArcadeCanvasProps` (`paused`, `runId`, `onStats`, `onGameOver`); stats are `{ score, lives | null, level }`.
- `ArcadePlayer` already provides the player HUD, the CRT fitted to the viewport, pause (button/P/Escape), FIN, the 1.5 s game-over delay, the modal, the remembered name, and `av_scores` + `submitScore`.
- Shared helpers in `features/arcade/lib/`: `use-game-loop`, `use-keys`, `palette`, `rng`, `hud-scale`.
- Leaderboard: a new migration inserts the `games` row; the game then gets its Salón tab, detail top 10 and MEJOR GLOBAL automatically.
