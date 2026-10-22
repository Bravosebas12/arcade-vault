# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

Arcade Vault is a retro arcade game portal (Spanish UI). The visual MVP (SPEC 01, `specs/01-mvp-pantallas.md`) ports every screen of the prototype in `references/templates/` to Next.js with its simulated behavior; SPEC 02 (`specs/02-home-acerca-de.md`) adds the Home landing and Acerca de screens from `references/home-about/`. No real games exist yet. Work is spec-driven: specs live in `specs/NN-slug.md` (see Project skills).

## Architecture

- **Routes** (`app/`): `/` Home, `/biblioteca` Biblioteca, `/juegos/[id]` Detalle, `/juegos/[id]/jugar` Reproductor, `/acceso` Acceso, `/salon` Salón de la Fama, `/acerca` Acerca de. Pages only resolve params and compose a screen; both `/juegos/[id]` routes use `gameStaticParams` / `resolveGame` (`features/games/lib/game-params.ts`) to prerender every game and call `notFound()` for unknown ids. `params` is a Promise in Next 16.
- **Code by feature** (`features/<feature>/` with `model/`, `lib/`, `components/`): `games` (catalog copied verbatim from the prototype, `seededScores`, filtering), `session`, `home` (landing; fixed content in `data/home-content.ts`), `library`, `game-detail`, `player`, `auth`, `hall-of-fame`, `about` (simulated contact form, `isContactFormComplete`). Cross-feature UI and helpers live in `shared/` (`Nav`, `MobileMenu`, `Footer`, `format`, `safe-storage`, `use-reveal` for the `.reveal` scroll-in animation, scoped to a screen container). Containers holding state/effects are `"use client"`; presentational components only take props.
- **Prototype parity**: screens reuse the global prototype classes and keep its inline styles and texts. `seededScores` keeps the prototype's LCG and seeds (`detailSeed`, `hallSeed`) so leaderboards show the same rows as the prototype.
- **Session and persistence**: `SessionProvider` (mounted in `app/layout.tsx`) exposes `useSession()` → `{ user, login, signOut }`. It reads `localStorage["av_user"]` via `useSyncExternalStore` with a `null` server snapshot, so SSR/hydration always start signed out; never read `localStorage` during render elsewhere. Saved scores are appended to `localStorage["av_scores"]` (`features/player/lib/score-storage.ts`). Keys and formats match the prototype; all storage access goes through `shared/lib/safe-storage.ts`, which tolerates corrupt JSON.
- **Cache Components keeps route state alive** after navigating away (React `<Activity>`), so screens that must start fresh reset their state: the player before navigating, the Acerca de contact form in an effect cleanup (effects unmount when the route is hidden).

## Design reference prototype (`references/templates/`, `references/home-about/`)

`references/home-about/` is the newer version of the prototype: it adds `home.jsx` (landing, default route `home`), `about.jsx` (Acerca de + contact), `nav.jsx` with the Inicio and Acerca de links, and `styles.css` with the HOME/ABOUT and GAMEPAD blocks; `arcade-vault-standalone.html` bundles it into a single file. Its other screens and `data.jsx` are identical to `references/templates/`, which keeps the original multi-file prototype described below.

A standalone, in-browser-Babel React 18 prototype (`Arcade Vault.html` loads each `.jsx` via `<script type="text/babel">`). It is a visual and behavioral spec, not code to import:

- **Globals instead of modules**: each file attaches its component/data to `window` (`window.GAMES`, `window.Library`, ...) and aliases React hooks with per-file suffixes (`useStateApp`, `useStateB`, ...) to avoid collisions in the shared global scope. When porting, convert these to ES modules and plain hook names.
- **Routing**: `app.jsx` keeps a `route` object (`{ name, id? }`) in state, serialized as JSON into `location.hash`, and switches screens manually. Route names map to screens: `home` (Home, `references/home-about/` only), `biblioteca` (Library, game grid with category filter), `detalle` (GameDetail), `player` (GamePlayer), `auth` (Auth), `salon` (HallOfFame leaderboard), `about` (About, `references/home-about/` only). The Next.js app maps them to the App Router routes listed under Architecture.
- **Data and persistence are mocked**: `data.jsx` holds the `GAMES` catalog, `CATS` categories, and `seededScores()` for deterministic fake leaderboards. Auth accepts any input and stores `{ name }` in `localStorage["av_user"]`; saved scores go to `localStorage["av_scores"]`. The player screen simulates scoring with a timer; no actual games are implemented.
- **Theme**: `styles.css` defines the neon/CRT design tokens on `:root` (`--bg*`, `--ink*`, `--cyan`, `--magenta`, `--yellow`, `--green`, medal colors, `--pixel` = Press Start 2P, `--mono` = JetBrains Mono) plus the `av-*` component classes. It is ported verbatim into `app/globals.css` from `references/home-about/styles.css` (see Non-obvious configuration).

## Commands

```bash
npm run dev     # dev server at http://localhost:3000 (Turbopack)
npm run build   # production build
npm run start   # serve the production build
npm run lint    # ESLint 9 flat config (eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit  # type-check (no dedicated script; run after a build if route types are stale)
npm test        # Vitest, single run (jsdom environment)
npm run test:watch
npx vitest run features/games/lib/seeded-scores.test.ts -t "is deterministic"  # single file / single test
```

Tests cover pure logic only and sit next to the code they test (`*.test.ts` under `features/` and `shared/`, the only folders `vitest.config.ts` includes). There are no component or end-to-end tests yet.

## Stack and versions

- **Next.js 16.4.2** (App Router), **React 19.3**, TypeScript strict, Tailwind CSS v4.
- These versions are newer than most training data. Per `AGENTS.md`, read the bundled docs in `node_modules/next/dist/docs/` (`01-app/`, `03-architecture/`, `index.md`) before using any Next.js API, and heed deprecation notices.

## Non-obvious configuration

- `next.config.ts` enables `cacheComponents`, `partialPrefetching`, and `experimental.agentFeedback`. `cacheComponents` changes data-fetching/caching semantics (Cache Components / `"use cache"` model), so check the bundled docs before writing data-fetching code.
- Tailwind v4 is wired through a Turbopack loader rule (`@tailwindcss/turbopack` on `*.css`), not PostCSS. There is no `tailwind.config` file; theme tokens live in `app/globals.css`.
- **Global styles**: `app/globals.css` holds the Arcade Vault tokens ported from the prototype (`--bg*`, `--ink*`, `--cyan`, `--magenta`, ... on `:root`), mapped to Tailwind utilities via `@theme inline` (`bg-bg-2`, `text-ink-dim`, `border-line`, `font-pixel`, ...). The entire prototype stylesheet (`references/home-about/styles.css`, including its unused GAMEPAD block) is ported verbatim (only `#root` was renamed to `.av-app`) inside `@layer components`, so every prototype class (`av-nav`, `card`, `cover-*`, `crt`, `hall-table`, `btn`, ...) is available globally and Tailwind utilities can still override them. The app must look exactly like the prototype: reuse these classes when building screens instead of re-styling. Tailwind **preflight is deliberately not imported** (only `theme.css` + `utilities.css`) because it would alter the prototype's rendering (heading weights, margins); do not switch back to `@import "tailwindcss"`. `app/layout.tsx` also renders the backdrop layers and the `.av-app` wrapper.
- **Fonts are pinned for pixel parity**: `app/fonts/*.woff2` are the exact latin-subset files Google Fonts serves to Chrome for the prototype's stylesheet link, loaded with `next/font/local` and `declarations` that keep the real family names (`Press Start 2P`, `JetBrains Mono` (variable, 400–700), `Courier Prime`). `--pixel` / `--mono` in `globals.css` name those families literally, matching the prototype's stacks. Do not switch back to `next/font/google`: it downloads different font builds (half-pixel antialiasing shifts) and, under Turbopack, always appends an Arial-based "Fallback" face (`adjustFontFallback: false` is ignored) that renders glyphs missing from the fonts (▲ ★ ▸) differently. To update a font, re-download the latin woff2 from the Google Fonts CSS2 URL in `references/templates/Arcade Vault.html` using a Chrome user agent.
- Route types are generated: layouts/pages use global helpers like `LayoutProps<"/">` from `.next/types`. Run `npm run dev` or `npm run build` to regenerate them if types are missing.
- Path alias `@/*` maps to the repo root.
- `AGENTS.md` is regenerated by `next dev`; do not delete its managed block.

## Project skills (`.claude/skills/`)

Installed with the `skills` CLI (`npx skills@latest add ...`); versions are pinned in `skills-lock.json`. Use them as follows:

- **UI design and implementation** — use `frontend-design` (aesthetic direction, typography, distinctive visual choices) together with `ui-ux-pro-max` (UX guidelines, accessibility, palettes, font pairings, stack-specific rules) whenever designing, building, reviewing, or restyling user interfaces. Keep the neon/CRT identity defined in `references/templates/styles.css`.
  - `ui-ux-pro-max` relies on a local Python 3 search script. Its SKILL.md references `${CLAUDE_PLUGIN_ROOT}`, which is not set for a project-level install; run it from the repo root as `python .claude/skills/ui-ux-pro-max/scripts/search.py "<query>" --stack nextjs` (or `--domain <domain>`, `--design-system`).
- **Specifications** — use `spec` to create feature specifications (spec-driven, section by section, before writing code), and `spec-impl` to implement a spec once its status is approved (it creates a `spec-NN-slug` branch and never commits on its own).

## Visual verification (Playwright MCP)

The Playwright MCP server is registered for this project (local scope). Compare the app (`npm run build && npx next start`) against the prototype, which must be served over HTTP (Babel loads the `.jsx` files with XHR, so `file://` fails).

**Screenshot rule — always organize captures by screen and feature, never dump them flat:**

```
.playwright-screenshots/
  <screen>/              home (Home landing) | library (Biblioteca) | game-detail | player | auth | hall-of-fame | about | shared (nav, footer, mobile menu)
    <feature>/           kebab-case: visual-parity, search-filter, card-tilt, mobile-menu, pause, game-over-modal, login, ...
      <viewport>/        desktop-1440 | mobile-390 | <device>-<width>
        reference.png    prototype capture
        app.png          Next.js capture
        diff.png         pixel diff (when comparing)
        <state>.png      extra states, e.g. hover.png, menu-open.png, no-results.png
        *.styles.json    computed-style probes, named like the capture they describe
```

- Pass these paths explicitly as `filename` to `browser_take_screenshot` / `browser_evaluate`; the MCP only writes inside the repo, and anything without a filename lands in `.playwright-mcp/` (transient snapshots and console logs, git-ignored).
- `.playwright-screenshots/` is git-ignored except its `.gitkeep`; captures are local evidence, not committed.
- For parity captures, inject a style that disables animations/transitions, wait for `document.fonts.ready`, and `scrollTo(0, 0)` before shooting, on both pages.

## Repository notes

- `.atl/` holds the gentle-ai skill registry (tooling metadata, not app code).
- `logs/` contains local MCP server logs and is not part of the app.
