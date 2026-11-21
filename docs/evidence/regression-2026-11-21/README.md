# Evidence — regression of `main` (2026-11-21)

`main` at `53145fa` (after PR #16), Playwright (Chromium 1243) against `next start` and the remote Supabase project. Scripted checks: **24/24 passed**. Every capture was reviewed by eye.

## Per game (Asteroides and Falling Blocks)

Each game went through the same checks; all passed in both:

- real canvas; HUD and CRT fit 1440×900
- a single rAF loop (62/s)
- the original controls move the game, with no page scroll
- P freezes the canvas with "EN PAUSA", and Escape resumes
- natural game over: the canvas end screen shows first, then the modal with the HUD score, and Space/↓ during the delay do not scroll
- GUARDAR stores the exact score in Supabase (`QA_REG`)
- JUGAR DE NUEVO resets the score
- the remembered name survives a reload
- no console errors.

| Capture | What it shows |
| --- | --- |
| [`asteroids/desktop-1440/start.png`](asteroids/desktop-1440/start.png), [`playing.png`](asteroids/desktop-1440/playing.png) | Start and play: rotated ship, bullets, both HUDs at 0 / 3 lives / level 01. |
| [`asteroids/desktop-1440/paused.png`](asteroids/desktop-1440/paused.png), [`game-over-before-modal.png`](asteroids/desktop-1440/game-over-before-modal.png), [`saved.png`](asteroids/desktop-1440/saved.png) | Pause, the canvas GAME OVER, and the saved modal. |
| [`falling-blocks/desktop-1440/playing.png`](falling-blocks/desktop-1440/playing.png), [`paused.png`](falling-blocks/desktop-1440/paused.png) | Board, ghost piece and side panel; the pause. |
| [`falling-blocks/desktop-1440/game-over-before-modal.png`](falling-blocks/desktop-1440/game-over-before-modal.png) | "GAME OVER / Puntuación: 127" on the canvas, with the player HUD at 127, before the modal. |
| [`*/mobile-390/crt.png`](falling-blocks/mobile-390/crt.png) | Both CRTs at 390 px: the canvas HUD is readable and the footer is stacked. |

## Catalog and leaderboard

| Capture | What it shows |
| --- | --- |
| [`catalog/desktop-1440/library.png`](catalog/desktop-1440/library.png) | The Biblioteca shows only FALLING BLOCKS and ASTEROIDES. |
| [`catalog/desktop-1440/salon.png`](catalog/desktop-1440/salon.png) | The Salón tabs are ASTEROIDES and FALLING BLOCKS; the ASTEROIDES podium shows PX_KAI 20 and QA_REG 0. |
| [`catalog/desktop-1440/detail-asteroids.png`](catalog/desktop-1440/detail-asteroids.png), [`detail-falling-blocks.png`](catalog/desktop-1440/detail-falling-blocks.png) | Real leaderboard and MEJOR GLOBAL (20 and 193). |

## Findings

1. **Test rows are visible in the production leaderboard:** `PX_KAI` (asteroids 20), `QA_REG` (asteroids 0, falling-blocks 127) and `QA_CAIDA` (falling-blocks 193). They come from the verifications of SPEC 06, SPEC 07 and this regression.
2. **Still pending from PR #16:** the Library cards show the catalog's fake "MEJOR PUNTUACIÓN", and the Home has fixed texts that mention removed games.
