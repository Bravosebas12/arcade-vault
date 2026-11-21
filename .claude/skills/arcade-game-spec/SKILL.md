---
name: arcade-game-spec
description: "Trigger: game spec, spec juego, new game, port game, started-games, leaderboard. Write one spec covering a playable Arcade Vault game and its leaderboard."
license: Apache-2.0
metadata:
  author: "Bravosebas12"
  version: "1.0"
---

## Activation Contract

Load when the user wants a spec for ONE playable game, either ported from `references/started-games/` or designed from scratch. Scope is the spec document only.

## Hard Rules

- Produce only `specs/NN-<id>-game.md`. Never write code, migrations, routes or tests; implementation happens later with `/spec-impl`.
- Follow the project spec method: read `.claude/skills/spec/SKILL.md` and its `template.md`, ask question blocks before writing, and save with status `Borrador`.
- One game per spec. Spec prose in Spanish; ids, files and identifiers in English; no trademarked names in visible text.
- The reference source is `references/started-games/`. If the game exists there, every mechanic, constant, control and text in the spec must come from its code. If not, define them in the spec so the game can be written from scratch.
- The spec must describe the canvas from scratch (sizes, layers, HUD, screens) and the engine as pure state + step functions; never "wrap the original JS".
- The spec always covers the game AND its leaderboard as one deliverable. The game part reuses `ArcadePlayer` and its contract, an own route and `PLAYABLE_GAME_IDS`. The leaderboard part defines the new migration with its `games` row (`max_score`, `sort_order`), saving through `submit_score`, the Salón tab, the detail top 10, MEJOR GLOBAL and its acceptance criteria. Never split the leaderboard into another spec.

## Decision Gates

| Source | Action |
| --- | --- |
| Folder in `references/started-games/` | Extract it with [references/extraction.md](references/extraction.md), then ask only about the gaps and the behaviors to remove. |
| No folder (new game) | Ask for genre, rules, scoring, lives, levels, controls and HUD before writing; fill the same sections. |
| Catalog has a simulated equivalent | Propose reusing it and the English id; ask before renaming. |
| Game needs assets | Specify their files under `public/games/<id>/` and when they load. |

## Execution Steps

1. Read `CLAUDE.md`, `specs/05-asteroids-game.md` (canonical example), `specs/06-leaderboard.md` and `features/arcade/model/arcade-game.ts`.
2. Choose the next spec number from `specs/`.
3. Extract the source or interview the user; ask in blocks of up to 4 questions, with the recommended option first.
4. Fill [assets/game-spec-template.md](assets/game-spec-template.md) completely; every section is mandatory.
5. Save the file, check that its dependencies exist, and stop.

## Output Contract

Return: spec path, status `Borrador`, the game + leaderboard scope (`max_score` and `sort_order` chosen), source used (`references/started-games/NN-x` or "desde cero"), the decisions taken, any open risks, and the next step `/spec-impl NN-<id>-game` once the user approves it.

## References

- [references/extraction.md](references/extraction.md) — what to read from a started-games source and where it goes in the spec.
- [assets/game-spec-template.md](assets/game-spec-template.md) — spec skeleton for a game.
- `specs/05-asteroids-game.md` — complete example of a game spec.
- `features/arcade/asteroids/` — reference implementation the spec targets.
