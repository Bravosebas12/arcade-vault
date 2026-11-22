# Evidence: real "MEJOR PUNTUACIÓN" on Library cards

Before this change the Library cards showed the catalog's invented figures (28.450, 184.220, 41.200). Each card now streams its game's top Supabase score through `BestScoreSlot` (shared with the detail page's "MEJOR GLOBAL"), shows "—" while loading or with no scores, and falls back to the catalog figure only when Supabase is unavailable.

Leaderboard state at capture time: Falling Blocks has one score (98); Asteroides and Brick Breaker have none.

| Capture | What it shows | Verdict |
| --- | --- | --- |
| `library/desktop-1440/cards.png` | BRICK BREAKER —, FALLING BLOCKS 98, ASTEROIDES — | OK |
| `library/mobile-390/cards.png` | Same values in the single-column layout | OK |

Scripted checks (Playwright, `next start`):

- Cards: `—`, `98`, `—`, matching each detail page's MEJOR GLOBAL (`—`, `98`, `—`).
- Searching "falling" keeps the real value (`98`) on the filtered card.
- No console errors.
- Build: `/biblioteca` is now ◐ (static shell plus streamed scores). Lint clean, 205/205 tests.
