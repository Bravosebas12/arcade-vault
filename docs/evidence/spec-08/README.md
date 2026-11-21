# Evidence — SPEC 08 (Brick Breaker + leaderboard)

Playwright (Chromium 1243) against `next start` and the remote Supabase project, 2026-11-21. Spec: [`specs/08-brick-breaker-game.md`](../../../specs/08-brick-breaker-game.md).
Scripted checks: **19/20**. The one failure was a timing issue in the script: the ball hits a block within ~1 s, so the score was no longer 0 when it was read. A separate probe confirmed that leaving and returning restarts at 0 points / 3 lives with a single 60/s loop. Every capture was reviewed by eye.

| Capture | What it shows | Verdict |
| --- | --- | --- |
| [`player/desktop-1440/start.png`](player/desktop-1440/start.png), [`playing.png`](player/desktop-1440/playing.png) | Canvas 800×600 with the original sprites (paddle, ball, 6×10 blocks). One block is broken. The canvas HUD reads "Score: 10 · Nivel: 1" with 2 life balls, the same as the player HUD (10, ♥♥, 01). | ✅ |
| [`player/desktop-1440/paused.png`](player/desktop-1440/paused.png) | The canvas "PAUSA" with **no level-jump buttons**, the CRT "EN PAUSA", and a frozen frame. | ✅ |
| [`player/desktop-1440/game-over-before-modal.png`](player/desktop-1440/game-over-before-modal.png) | After losing 3 balls, the canvas shows "GAME OVER" (the original hides its HUD at the end), the player HUD shows 30 and "—", and the modal opens after the delay. | ✅ |
| [`player/mobile-390/crt.png`](player/mobile-390/crt.png) | At 390 px the canvas HUD is readable and the footer is stacked. | ✅ |
| [`catalog/desktop-1440/library.png`](catalog/desktop-1440/library.png) | The Biblioteca shows BRICK BREAKER, FALLING BLOCKS and ASTEROIDES, with the chips TODOS · ARCADE · PUZZLE · SHOOTER. | ✅ / ⚠️ see 1 |
| [`catalog/desktop-1440/salon-brick-breaker.png`](catalog/desktop-1440/salon-brick-breaker.png), [`detail.png`](catalog/desktop-1440/detail.png) | The Salón tabs are ASTEROIDES · FALLING BLOCKS · BRICK BREAKER, with QA_BRICK 30. The detail shows the real top and MEJOR GLOBAL. | ✅ |

Scripted checks that are not visible in the captures:

- ← moves the paddle 200 px in 0.5 s (400 px/s).
- The mouse centres the paddle on the pointer at 1440 px (640) and at 390 px (199 ≈ 200 logical), and is ignored while paused.
- The break and bounce sounds play.
- GUARDAR stores 30 for `brick-breaker`.
- `submit_score` rejects 2090 (HTTP 400), because `max_score` is 2080.
- No console errors, and no "Arkanoid" or "Breakout" in the page.

Supabase: the `brick-breaker` row has `max_score` 2080 and `sort_order` 3. The advisors show no new warnings.

## Findings

1. **Still pending (PR #16/#17):** the Library cards show the fake catalog "MEJOR PUNTUACIÓN" (28.450 for Brick Breaker).
2. **Block colours follow the original spritesheet.** The sprite regions labelled cyan, magenta, hotpink and green render as teal, purple, orange and blue. That is how the original looked too, because the coordinates are copied verbatim.
3. **A test row was added in production:** `QA_BRICK` (30).
