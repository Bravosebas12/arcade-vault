# Evidence: SPEC 09 prototype (SERPENTINA)

Captures of the playable prototype `references/started-games/05-snake/index.html`, taken with Playwright at 1000×760. They were captured before the implementation, to review the design. The implementation evidence will be added here by `/spec-impl`.

| Capture | What it shows | Verdict |
| --- | --- | --- |
| `prototype/title.png` | Prototype title screen, the 7 original fruits and the gallery | OK |
| `prototype/playing.png` | ARENA after 3 fruits: score 30, counter 3/10, snake grown | OK |
| `prototype/paused.png` | EN PAUSA; the head does not move while paused | OK |
| `prototype/map-2.png` … `map-5.png` | "MAPA N" banner with PILARES, PASILLOS, CRUZ and LABERINTO | OK |
| `prototype/game-over.png` | GAME OVER after the last life (wall crash) | OK |

Scripted checks: the autopilot ate 3 fruits (+10 each at level 1), the pause froze the head, a wall crash with 1 life gave `gameover`, Space restarted with 3 lives and score 0, and there were no console errors or warnings.
