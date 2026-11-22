# Evidence: SERPENTINA cover (`cover-snake`)

The prototype's `.cover-snake::after` used `background-image` with per-layer position, size and repeat. That is only valid in the `background` shorthand, so the browser dropped the whole declaration and the cover showed only its gradient (finding in SPEC 09). Once the rule was made valid, its percentage positions still left the pieces apart: a bar, a square and a dot.

The cover is now redrawn like the game:

- 9 green 14 px segments on a 16 px grid around the center, forming an L
- the light head (`#b6ffd9`, the in-game head color)
- a red fruit ahead of the head.

The layers all have the same size, so their `calc(50% ± n)` offsets stay aligned at any card size.

| Capture | What it shows | Verdict |
| --- | --- | --- |
| `desktop-1440/library-card.png` | SERPENTINA card in the Library with the snake and the fruit | OK |
| `desktop-1440/detail-cover.png` | Same cover on the detail page (larger box, drawing centered) | OK |
| `mobile-390/library-card.png` | Card at 390 px | OK |

Check: the computed `::after` background has 10 gradient layers (it had 0 before). Build OK.
