# English game titles

Renames ASTEROIDES to METEOR STORM and SERPENTINA to NEON SNAKE, so all four titles are in English. Ids and routes are unchanged.

Checked with Playwright on `next start` (1440×900): no page shows the old titles.

| Capture | What it shows | Verdict |
|---|---|---|
| `library.png` | Biblioteca cards: BRICK BREAKER, FALLING BLOCKS, METEOR STORM, NEON SNAKE | OK |
| `home.png` | Home features text and activity lists with the new names | OK |
| `salon.png` | Salón de la Fama tabs read from the `games` table | OK |
| `detail-asteroids.png` | `/juegos/asteroids` titled METEOR STORM | OK |
| `detail-snake.png` | `/juegos/snake` titled NEON SNAKE | OK |
