# Evidence — SPEC 06 (leaderboard)

Playwright (Chromium 1243) against `next start` and the remote Supabase project, 2026-11-21. Spec: [`specs/06-leaderboard.md`](../../../specs/06-leaderboard.md).
Scripted checks: 15/15 passed, including REST checks with the publishable key. Each capture was reviewed by eye.

| Capture | What it shows | Verdict |
| --- | --- | --- |
| [`hall-of-fame/desktop-1440/saved-modal.png`](hall-of-fame/desktop-1440/saved-modal.png) | After typing "px_kai" and pressing GUARDAR: "PUNTUACIÓN GUARDADA" right away, final score 20. The player HUD shows the name PX_KAI. | ✅ |
| [`hall-of-fame/desktop-1440/salon.png`](hall-of-fame/desktop-1440/salon.png) | Salón de la Fama: one tab only (ASTEROIDES). Podium with PX_KAI · 20 · 21/11/2026 and empty "---" slots. The table row matches, and the "TU MEJOR MARCA EN ASTEROIDES" row shows the local best. | ✅ |
| [`hall-of-fame/desktop-1440/detail.png`](hall-of-fame/desktop-1440/detail.png) | `/juegos/asteroids`: "MEJORES PUNTUACIONES" shows the real row #01 PX_KAI · 20 · 21/11/2026. Title ASTEROIDES. | ✅ / ⚠️ see below |

## Findings to follow up

1. **"MEJOR GLOBAL 41.200" contradicts the real leaderboard** on the same page, whose top score is 20. `best` and `plays` stay as prototype figures by decision (out of scope in SPEC 06), but the inconsistency is visible.
2. The test row `PX_KAI` (20) remains in the production `scores` table.
