# Evidence — SPEC 07 (Caída + leaderboard)

Playwright (Chromium 1243) against `next start` and the remote Supabase project, 2026-11-21. Spec: [`specs/07-falling-blocks-game.md`](../../../specs/07-falling-blocks-game.md).
Scripted checks: 20/22 passed. The 2 failures were not product bugs:

- **Hard drop:** the script's threshold was wrong. The drop added 28, which is 2 points × 14 rows, as the spec says.
- **`/juegos/caida`:** it always renders the not-found page with `noindex`, but the HTTP status alternates between 404 and 200 because of Next streaming. `/juegos/zzz` and `/juegos/rocas` behave the same way.

Every capture was reviewed by eye.

| Capture | What it shows | Verdict |
| --- | --- | --- |
| [`player/desktop-1440/app.png`](player/desktop-1440/app.png) / [`playing.png`](player/desktop-1440/playing.png) | Canvas 420×600 (7:10). The board shows the ghost piece and the original piece colours. The column shows SCORE 29, LINES 0, LEVEL 1, NEXT (L) and CONTROLS, and the player HUD matches (29, "—", 01). The whole player fits the 900 px viewport. | ✅ |
| [`player/desktop-1280/app.png`](player/desktop-1280/app.png) | At 1280×720 the canvas is 294×420 and fits. Asteroides keeps 560×420. | ✅ / ⚠️ footer |
| [`player/desktop-1440/paused.png`](player/desktop-1440/paused.png) | P: the canvas "PAUSA" (upper quarter) and the CRT "EN PAUSA" over a frozen frame. | ✅ |
| [`player/desktop-1440/game-over-before-modal.png`](player/desktop-1440/game-over-before-modal.png) | The stack topped out: "GAME OVER / Puntuación: 193" on the canvas, with the nut piece in NEXT. The modal opens after the delay. The page is scrolled, so the player HUD is off-screen. | ✅ / ⚠️ scroll |
| [`player/desktop-1440/saved-modal.png`](player/desktop-1440/saved-modal.png) | GUARDAR as "qa_caida" (stored as QA_CAIDA, 193). | ✅ |
| [`player/mobile-390/crt-zoom.png`](player/mobile-390/crt-zoom.png) | At 390 px the column is readable and the footer is stacked. | ✅ |
| [`hall-of-fame/desktop-1440/salon-caida.png`](hall-of-fame/desktop-1440/salon-caida.png) | The tabs are ASTEROIDES then CAÍDA. CAÍDA shows champion QA_CAIDA · 193 and "TU MEJOR MARCA EN CAÍDA". | ✅ / ⚠️ glyph |
| [`game-detail/desktop-1440/detail.png`](game-detail/desktop-1440/detail.png) | `/juegos/falling-blocks`: real top #01 QA_CAIDA · 193, and MEJOR GLOBAL 193. | ✅ / ⚠️ glyph |

Supabase: the `falling-blocks` row has `max_score` 10 000 000 and `sort_order` 2, and its texts match `catalog.ts`. The advisors show no new warnings (only the intentional `submit_score` and the pre-existing `rls_auto_enable`).

## Findings

1. ✅ **Fixed in this PR.** **The CRT footer crowded on the narrow Caída CRT.** At 1440 px its items run together ("SEÑAL OK CAÍDA · CRT-83 · 60 HZ CARGA · 1MB"). At 1280 px they wrap into ragged two-line blocks. The mobile stacking rule depends on the viewport width, not on the CRT width. Introduced by this spec.
2. ✅ **Fixed in this PR.** **Space scrolled the page during the 1.5 s game-over delay.** The keyboard listener is disabled once the game ends, so Space and the arrows reach the page (see the game-over capture). This also applies to Asteroides.
3. **"Í" renders as a wrong glyph in the pixel font** ("CAÍDA" shows as "CA‡DA" in the Salón tab, the detail title and the CRT footer). The pinned Press Start 2P subset lacks the glyph. This is pre-existing: the catalog title already rendered this way before this spec.
4. When FIN is pressed during play, the canvas also shows "PAUSA" behind the modal, because it only receives `paused`. This is cosmetic.

## Fixes verified (Playwright 10/10)

- **Footer:** `.crt` is now a container (`@container`), and the footer stacks below 560 px of **CRT** width (`@max-[560px]:`) instead of viewport width.
  - Caída: 2 rows at 1440 px, 3 rows at 1280 and 390 px, with no overlap ([`player/desktop-1440/app.png`](player/desktop-1440/app.png), [`player/desktop-1280/app.png`](player/desktop-1280/app.png)).
  - Asteroides (848 / 608 px) and the simulated games (1052 px) keep the single 12 px prototype row.
- **Scroll:** `useBlockGameKeys` (in `use-keys.ts`) prevents arrows/Space from scrolling while `gameOverPending`. Pressing Space and ↓ during the delay keeps `scrollY` at 0 in both games, and typing a space in the modal still works.
