# Evidence — fixes for the SPEC 05/06 review findings

Playwright (Chromium 1243) against `next start` and the remote Supabase project, 2026-11-21. Scripted checks: 10/10 passed. Each capture was reviewed by eye.
Findings come from [`spec-05/README.md`](../spec-05/README.md) and [`spec-06/README.md`](../spec-06/README.md), whose captures are the "before".

| # | Finding | After | Verdict |
| --- | --- | --- | --- |
| 1 | Asteroides arena taller than a 1440×900 viewport ([before](../spec-05/player/desktop-1440/paused.png)) | [`player/desktop-1440/app.png`](player/desktop-1440/app.png): the HUD (top 102 px) and the whole CRT (bottom 867 px) fit; canvas 800×600. [`player/desktop-1280/app.png`](player/desktop-1280/app.png): at 1280×720 the canvas is 560×420 and the CRT ends at 702 px. Simulated games keep their full-width CRT. | ✅ |
| 2 | Canvas "GAME OVER" hidden behind the modal ([before](../spec-05/player/desktop-1440/natural-game-over.png)) | [`player/desktop-1440/game-over-before-modal.png`](player/desktop-1440/game-over-before-modal.png): "GAME OVER / PUNTAJE: 0" is visible, with lives "—". The modal opens about 1.4–1.5 s later ([`game-over-modal.png`](player/desktop-1440/game-over-modal.png)), and P is ignored during the delay. FIN still opens it immediately. | ✅ |
| 3 | CRT footer overlapping at 390 px ([before](../spec-05/player/mobile-390/app.png)) | [`player/mobile-390/crt-zoom.png`](player/mobile-390/crt-zoom.png): three centred lines ("SEÑAL OK", "ASTEROIDES · CRT-83 · 60 HZ", "CARGA · 1MB") with no overlap. The desktop footer is unchanged, and `globals.css` is untouched. | ✅ |
| 4 | Canvas HUD tiny at 390 px | Same capture: "SCORE 0", "NIVEL 1" and the life icons are readable. Only the HUD and GAME OVER texts scale; gameplay drawing does not. | ✅ |
| 5 | "MEJOR GLOBAL 41.200" next to a real top of 20 ([before](../spec-06/hall-of-fame/desktop-1440/detail.png)) | [`game-detail/desktop-1440/asteroids-detail.png`](game-detail/desktop-1440/asteroids-detail.png): MEJOR GLOBAL shows **20**, the same as the #01 row. The initial HTML never contains 41.200 (the fallback is "—"), and simulated games keep the catalog figure. | ✅ |

## Notes

- Returning to a hidden player route during the 1.5 s delay restarts the timer, and the modal then opens. The game over itself is not cancelled, to avoid opening the modal instantly in dev StrictMode.
- The arena fit reserves a measured 300 px for the nav bar, the HUD and margins. If the HUD wraps (narrow desktop windows), it may need adjusting.
- At 1280 px, the navigation bar already wrapped its labels before these changes; that is not part of these fixes.
- Not verified at runtime: the catalog fallback for MEJOR GLOBAL when Supabase is unavailable. It is covered by a unit test.
