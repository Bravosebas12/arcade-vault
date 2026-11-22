# Evidence: Home texts and activity from the real games

The Home still showed prototype content: "12+ JUEGOS", "Arkanoid, Tetris, Snake…", and an invented "ACTIVIDAD EN VIVO" (NEONFOX, Glotón, Rocas, Serpentina…).

What it shows now:

- **Game count:** taken from the catalog (`3 JUEGOS`).
- **Feature text:** names the real games.
- **ACTIVIDAD EN VIVO:** reads Supabase, streamed inside `<Suspense>`:
  - ÚLTIMAS PUNTUACIONES lists the 7 newest scores of every real game.
  - TOP JUGADORES lists each player's best score, top 5. The title dropped "· HOY" because the list is not limited to today.
  - Without scores, or without Supabase, each list shows "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA".

Leaderboard state at capture time: one score (INVITADO, Falling Blocks, 98).

| Capture | What it shows | Verdict |
| --- | --- | --- |
| `home/desktop-1440/features.png` | "Brick Breaker, Falling Blocks y Asteroides…" | OK |
| `home/desktop-1440/stats.png` | `3 JUEGOS · Y CONTANDO` | OK |
| `home/desktop-1440/activity.png` | Ticker `INVITADO ▸ FALLING BLOCKS +98 hace 23 h`; top `#01 INVITADO 98` | OK |
| `home/mobile-390/*.png` | Same content in the mobile layout | OK, see finding |

Scripted checks (Playwright, `next start`):

- None of the removed names appear (Arkanoid, Tetris, Snake, Glotón, Invasores, Rocas, Bloque Buster, Serpentina, Ranaria, NEONFOX, 12+).
- No console errors on desktop or mobile.
- Lint clean, 211/211 tests (6 new in `features/home/lib/activity.test.ts`), build OK; `/` is now ◐.

Finding (pre-existing, not fixed here): at 390 px the "TOP JUGADORES" title is cut with an ellipsis next to VER SALÓN, as the longer prototype title already was.
