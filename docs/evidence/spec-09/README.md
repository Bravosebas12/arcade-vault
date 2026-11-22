# Evidence: SPEC 09 — Serpentina (snake)

Verified on 2026-11-22 with Playwright against `next start` and Supabase: **23/23 checks**, plus a probe of the empty leaderboard. Every capture below was reviewed. An in-page autopilot read the canvas cell by cell and steered to the fruit, so eating, the bonus and the map change happen in real play.

## Prototype (before implementation)

| Capture | What it shows | Verdict |
| --- | --- | --- |
| `prototype/title.png` | Prototype title screen, the 7 original fruits and the gallery | OK |
| `prototype/playing.png`, `paused.png` | ARENA after 3 fruits; pause | OK |
| `prototype/map-2.png` … `map-5.png` | PILARES, PASILLOS, CRUZ and LABERINTO | OK |
| `prototype/game-over.png` | GAME OVER after the last life | OK |

## Game (`/juegos/snake/jugar`)

| Capture | What it shows | Verdict |
| --- | --- | --- |
| `game/desktop-1440/intro.png` | "MAPA 1 · ARENA" intro banner; both HUDs show 0 points, 3 lives and level 01 | OK |
| `game/desktop-1440/paused.png` | EN PAUSA on the CRT, the board dimmed and frozen | OK |
| `game/desktop-1440/playing.png` | Snake grown after 3 fruits, score 30 in both HUDs | OK |
| `game/desktop-1440/bonus.png` | Golden pineapple bonus at 5/10, next to a normal fruit | OK |
| `game/desktop-1440/map-2-banner.png` | 10th fruit: "MAPA 2 · PILARES", snake back at the spawn with length 4, level 02 | OK |
| `game/desktop-1440/map-2-playing.png` | PILARES walls while playing | OK |
| `game/desktop-1440/crash.png` | After a crash: 2 lives in both HUDs, snake respawned | OK |
| `game/desktop-1440/game-over-before-modal.png` | Canvas "GAME OVER · PUNTOS 000150", bright, before the modal | OK (fixed: it was dimmed by the pause layer) |
| `game/desktop-1440/game-over-modal.png`, `saved.png` | Modal with 150, then saved | OK |
| `game/desktop-1280/intro.png` | Fits 1280×720 | OK |
| `game/mobile-390/intro.png`, `playing.png` | 390 px: the in-canvas HUD shortens the map to "MAPA 1" and nothing overlaps | OK (fixed: it overlapped) |

## Leaderboard

| Capture | What it shows | Verdict |
| --- | --- | --- |
| `leaderboard/desktop-1440/salon.png` | Tabs ASTEROIDES, FALLING BLOCKS, BRICK BREAKER, SERPENTINA; QA_SNAKE rows | OK |
| `leaderboard/desktop-1440/detail.png` | Top 10 and MEJOR GLOBAL 150 | OK |
| `leaderboard/desktop-1440/library.png` | SERPENTINA card with MEJOR PUNTUACIÓN 150 | OK, see finding |
| `leaderboard/desktop-1440/salon-empty.png`, `detail-empty.png` | After deleting the test rows: "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA" and MEJOR GLOBAL "—" | OK |

## Scripted checks

- **Loop and controls:** one rAF loop (60/s), also after leaving and returning; arrows and WASD steer without scrolling; P and Escape pause and resume.
- **Score and maps:** the first fruit adds 10, the bonus adds 50, and the 10th fruit loads level 02.
- **Game over:** the natural game over shows the canvas end screen first, then the modal with the HUD score; FIN opens the modal at once.
- **Saving:** GUARDAR stores the exact name and score. `submit_score` rejects a second submit within 10 s (`too_soon`) and 1000010 (`score_out_of_range`).
- **Console:** no errors.

## Findings

- **Fixed during verification:**
  - the in-canvas HUD overlapped at 390 px; it now uses a measured layout
  - "GAME OVER" was dimmed, because the container pauses the canvas during the game-over delay.
- **Pre-existing, not fixed:** the `cover-snake` cover shows only its gradient. Its `::after` sets positions and sizes inside `background-image`, which invalidates the declaration. It comes from the prototype CSS, which is ported unchanged.
- **Test data:** the `QA_SNAKE` rows (0, 120 and 150) were deleted after the checks.
