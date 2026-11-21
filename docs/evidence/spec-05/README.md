# Evidence — SPEC 05 (Asteroides)

Playwright (Chromium 1243) against `next start`, 2026-11-20. Spec: [`specs/05-asteroids-game.md`](../../../specs/05-asteroids-game.md).
Each capture was reviewed by eye after the scripted checks (19/23 passed; the 4 failures were 2 script mistakes and 2 pre-existing issues, see the spec notes).

| Capture | What it shows | Verdict |
| --- | --- | --- |
| [`player/desktop-1440/app.png`](player/desktop-1440/app.png) | Start of a run. The canvas HUD ("SCORE 0", "NIVEL 1", 3 ship icons) and the player HUD (0, ♥♥♥, 01) show the same stats. Real canvas, no fake arena. | ✅ Both HUDs match |
| [`player/desktop-1440/paused.png`](player/desktop-1440/paused.png) | Paused with P: "EN PAUSA" over the frozen frame. The page is scrolled, so the navigation bar covers the top of the CRT and neither HUD is visible. | ⚠️ Arena taller than the viewport |
| [`player/desktop-1440/game-over-modal.png`](player/desktop-1440/game-over-modal.png) | FIN at 120 points: the modal shows 120, the same as both HUDs. The name box keeps the spaces typed during the test ("PX KA I"). | ✅ |
| [`player/desktop-1440/natural-game-over.png`](player/desktop-1440/natural-game-over.png) | Losing the 3 lives opens the modal by itself (score 0, lives "—"). The canvas "GAME OVER" text is drawn at the centre, so the modal covers it. | ✅ Modal / ⚠️ canvas text not visible |
| [`player/mobile-390/app.png`](player/mobile-390/app.png) | At 390 px the canvas keeps 4:3 inside the CRT. The canvas HUD text is very small, and the CRT footer ("SEÑAL OK · ASTEROIDES · CRT-83 · 60 HZ · CARGA · 1MB") wraps and overlaps. | ⚠️ Readability |

## Findings to follow up

1. **The arena does not fit a 1440×900 viewport.** The canvas renders at 1004×753 px; with the navigation bar and the player HUD it is taller than 900 px, so the player has to scroll and the HUD leaves the screen. The scripted check only asserted the 4:3 ratio inside the CRT, not that it fits the viewport.
2. **Canvas "GAME OVER" is hidden behind the modal.** The criterion was ticked from the code path, not from a visible capture.
3. **At 390 px**, the canvas HUD text is tiny and the CRT footer wraps over itself (the longer title "ASTEROIDES" makes it wrap more than the old "ROCAS").
