# Evidence — only real games in the catalog + "FALLING BLOCKS" title

Playwright (Chromium 1243) against `next start` and Supabase, 2026-11-21. Scripted checks: 13/14. The only failure was the browser logging the expected 404s of the removed URLs, which the script visits on purpose. Every capture was reviewed by eye.

| Capture | What it shows | Verdict |
| --- | --- | --- |
| [`library/desktop-1440/library.png`](library/desktop-1440/library.png) | The Biblioteca shows only FALLING BLOCKS (PUZZLE) and ASTEROIDES (SHOOTER), with the chips TODOS · PUZZLE · SHOOTER. | ✅ / ⚠️ see 1 |
| [`home/desktop-1440/home.png`](home/desktop-1440/home.png) | "JUEGOS DISPONIBLES AHORA" shows the 2 real games. | ✅ / ⚠️ see 2 |
| [`hall-of-fame/desktop-1440/salon-falling-blocks.png`](hall-of-fame/desktop-1440/salon-falling-blocks.png) | The Salón has the tabs ASTEROIDES and FALLING BLOCKS. | ✅ |
| [`game-detail/desktop-1440/falling-blocks.png`](game-detail/desktop-1440/falling-blocks.png) | The detail is titled FALLING BLOCKS and shows the real leaderboard. | ✅ |
| [`player/desktop-1440/falling-blocks.png`](player/desktop-1440/falling-blocks.png) | The CRT footer reads "FALLING BLOCKS · CRT-83 · 60 HZ", and the pixel-font "Í" glyph issue is gone. | ✅ |

`/juegos/{bloque-buster,serpentina,duelo-pixel}` and their `/jugar` routes render the not-found page (`noindex`); the simulated player no longer exists. Supabase `games.title` for `falling-blocks` is "FALLING BLOCKS" (migration `rename_falling_blocks_title`).

## Findings (not fixed here)

1. Library cards still show "MEJOR PUNTUACIÓN" from the catalog's fake `best` (184.220 / 41.200), while the detail page shows the real top score.
2. Prototype fixed texts still mention removed games: the Home stats "12+ JUEGOS" and the ticker rows Glotón, Invasores, Bloque Buster, Serpentina and Ranaria (`features/home/data/home-content.ts`).
