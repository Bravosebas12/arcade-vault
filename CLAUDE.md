# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

Arcade Vault is a retro arcade game portal (Spanish UI). The visual MVP (SPEC 01, `specs/01-mvp-pantallas.md`) ports every screen of the prototype in `references/templates/` to Next.js with its simulated behavior; SPEC 02 (`specs/02-home-acerca-de.md`) adds the Home landing and Acerca de screens from `references/home-about/`; SPEC 03 (`specs/03-envio-contacto-resend.md`) makes the Acerca de contact form send a real email with Resend; SPEC 04 (`specs/04-integracion-supabase.md`) connects the app to the remote Supabase project (typed clients, session refresh in `proxy.ts`, CLI, `/api/health`) without changing any visible behavior, as the base for future auth, data, Realtime and Edge Functions specs; SPEC 05 (`specs/05-asteroids-game.md`) ports the first real game, `asteroids` (formerly the simulated `rocas`), from `references/started-games/02-asteroids/`. The other catalog games are still simulated. SPEC 06 (`specs/06-leaderboard.md`) adds the Supabase `games` and `scores` tables and connects the Salón de la Fama (global leaderboard) and the real games' detail page to real scores. Work is spec-driven: specs live in `specs/NN-slug.md` (see Project skills).

## Architecture

- **Routes** (`app/`): `/` Home, `/biblioteca` Biblioteca, `/juegos/[id]` Detalle, `/juegos/[id]/jugar` Reproductor (simulated games), `/juegos/asteroids/jugar` (real game, its own route), `/acceso` Acceso, `/salon` Salón de la Fama, `/acerca` Acerca de. Pages only resolve params and compose a screen; the `/juegos/[id]` routes use `resolveGame` (`features/games/lib/game-params.ts`) and call `notFound()` for unknown ids; the detail prerenders every game (`allGameStaticParams`) and the generic player every simulated one (`gameStaticParams`). `params` is a Promise in Next 16.
- **Code by feature** (`features/<feature>/` with `model/`, `lib/`, `components/`, and `actions/` for Server Actions only): `games` (catalog copied verbatim from the prototype, `seededScores`, filtering), `session`, `home` (landing; fixed content in `data/home-content.ts`), `library`, `game-detail`, `player`, `auth`, `hall-of-fame`, `about` (contact form sent by the `sendContact` Server Action in `actions/send-contact.ts` via Resend; `validateContactForm` and `CONTACT_LIMITS` are shared by client and server, `buildContactEmail` builds the plain-text email). Cross-feature UI and helpers live in `shared/` (`Nav`, `MobileMenu`, `Footer`, `format`, `safe-storage`, `use-reveal` for the `.reveal` scroll-in animation, scoped to a screen container). Containers holding state/effects are `"use client"`; presentational components only take props.
- **Prototype parity**: screens reuse the global prototype classes and keep its inline styles and texts. `seededScores` keeps the prototype's LCG and seeds (`detailSeed`, `hallSeed`) so leaderboards show the same rows as the prototype.
- **Session and persistence**: `SessionProvider` (mounted in `app/layout.tsx`) exposes `useSession()` → `{ user, login, signOut }`. It reads `localStorage["av_user"]` via `useSyncExternalStore` with a `null` server snapshot, so SSR/hydration always start signed out; never read `localStorage` during render elsewhere. Saved scores are appended to `localStorage["av_scores"]` (`features/player/lib/score-storage.ts`). Keys and formats match the prototype; all storage access goes through `shared/lib/safe-storage.ts`, which tolerates corrupt JSON.
- **Real games** (`features/arcade/`): each playable game lives in `features/arcade/<id>/` (`engine/` pure TypeScript state + rules with tests and injected `rng`, `engine/render.ts` canvas drawing, `components/<Name>Canvas.tsx` + `<Name>Player.tsx`) and never imports another game. Each has its own static route `app/juegos/<id>/jugar/page.tsx`, which wins over `[id]`; the generic `app/juegos/[id]/jugar` route and `PlayerScreen` stay the simulated player and contain no game-specific conditional (its `gameStaticParams` excludes `PLAYABLE_GAME_IDS` in `features/arcade/playable.ts`; the detail page uses `allGameStaticParams`). Contract (`features/arcade/model/arcade-game.ts`): `ArcadePlayer` owns the play state (`lib/play-state.ts` reducer) and controls the canvas through props — `paused` (HUD button, P and Escape; the canvas has no pause of its own), `runId` (JUGAR DE NUEVO restarts) — while the canvas notifies React through `onStats` (only when score/lives/level change) and `onGameOver` (once). The canvas keeps its original in-canvas HUD and controls, so both HUDs show the same `GameStats`. Shared helpers: `use-game-loop` (rAF, `dt` capped at 0.05 s, first frame after resume is `dt = 0`, cancelled on pause/unmount), `use-keys` (ignores inputs, `preventDefault` on arrows/Space), `palette` (reads the neon tokens after mount). **To add a game**: create its folder and route, add its id to `PLAYABLE_GAME_IDS`. `references/started-games/` keeps the original vanilla-JS games the ports come from (OS/tool metadata git-ignored).
- **Leaderboard** (`features/leaderboard/`, SPEC 06): Supabase tables `games` and `scores` (migration in `supabase/migrations/`).
  - **`games`:** mirrors the catalog fields (`short_description`, `long_description`, `category`, `cover`, `color`, plus `max_score` and `sort_order`) for real games only (today `asteroids`). It is **read-only for the app**: only `select` is granted, and it changes only through migrations. The catalog is hybrid — `catalog.ts` still drives Biblioteca, Home, Detalle and prerendering; the direction is to load games only from Supabase and delete the local data in a later spec.
  - **`scores`:** `id, game_id, player_name, score, created_at, user_id` (nullable, filled by `auth.uid()`; null while there is no login). Public `select` is granted only on the columns without `user_id`. There is **no direct insert**: the only write path is the `security definer` RPC `public.submit_score(p_game_id, p_player_name, p_score)`, which validates the game, `0..max_score`, a name of 1–10 characters without surrounding spaces, and one score per name+game every 10 s. It raises `unknown_game` / `score_out_of_range` / `invalid_name` / `too_soon`. The Supabase advisor flags it as anon-executable; that is intentional.
  - **Saving:** the `submitScore` Server Action (`actions/submit-score.ts`) calls the RPC and then `revalidatePath`. It never logs the name or score.
  - **Reading:** `get-leaderboard.ts` (`getLeaderboardGames`, `getLeaderboard`) runs `await connection()` and returns `null` without Supabase. Callers then fall back to `seededScores` and to the catalog filtered by `PLAYABLE_GAME_IDS`; `[]` renders "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA".
  - **Screens:** in `ArcadePlayer`, GUARDAR stores the exact name from the box (only trimmed) and the exact score, writes `av_scores` plus `localStorage["av_player_name"]` (the remembered name that pre-fills the box, read after mount), and calls `submitScore` without blocking the modal. The Salón only has tabs for real games and shows "TU MEJOR" from `av_scores`. The real games' detail streams its top 10 inside `<Suspense>`, keeping the page prerendered (◐). Simulated games keep `seededScores` and never query Supabase.
  - **Adding a real game:** add a new migration that inserts its `games` row, add its id to `PLAYABLE_GAME_IDS`, and give it its own route.
- **Supabase** (`shared/lib/supabase/`): `getSupabaseEnv()` (`env.ts`) reads `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` written literally (Next only inlines `NEXT_PUBLIC_*` into the browser bundle that way; never read them as `process.env[name]`) and returns `null` when either is missing. Use `createClient()` from `server.ts` (async, calls `cookies()` itself) in Server Components, Server Actions and Route Handlers, and `createClient()` from `client.ts` in `"use client"` components; both are typed with `Database` and return `null` without the variables, so callers must handle that case. The root `proxy.ts` (Next 16's replacement for `middleware.ts`) calls `updateSession` (`proxy.ts` in the same folder) to refresh the auth session on every page request, skipping static assets via its `matcher`; it passes requests through untouched without the variables. `GET /api/health` (`app/api/health/route.ts`, logic in `health.ts`) calls `<url>/auth/v1/health` with a 5 s timeout and answers `200 {"supabase":"ok"}` or `503` with `reason` `missing_env` / `unreachable`; it calls `await connection()` so Cache Components never prerenders it, and never returns or logs the URL or key. Nothing visible uses Supabase yet: `/acceso` login, scores and sessions are still simulated in `localStorage`. Only the publishable key is used; never add an `sb_secret_` / `service_role` key to the app.
- **Cache Components keeps route state alive** after navigating away (React `<Activity>`), so screens that must start fresh reset their state: the player before navigating, the Acerca de contact form in an effect cleanup (effects unmount when the route is hidden), by remounting its inner form with an incremental `key` because `useActionState` cannot be reset directly.

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
npm run db:types  # regenerate shared/lib/supabase/database.types.ts from the linked project (never edit that file by hand)
```

**Supabase**: add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Supabase dashboard → Project Settings → API Keys) to `.env.local`; both are optional and the app runs unchanged without them (`/api/health` then answers 503). Restart `next dev` / `next start` after changing `.env.local`. The Supabase CLI is a pinned `devDependency`; `supabase/` holds `config.toml` and `migrations/` (empty until the first data spec), and `supabase/.temp/` is git-ignored. To use `npm run db:types`, link once from a real interactive terminal (PowerShell, not Claude Code's `!` shell, which is non-TTY): `npx supabase login`, then `npx supabase link --project-ref <project-ref>` (the subdomain of `NEXT_PUBLIC_SUPABASE_URL`; an empty database password is fine). The project is remote only: no local Docker stack (`supabase start`). Schema changes go in a migration created with `npx supabase migration new <name>` and applied with `npx supabase db push --linked --yes` (non-interactive once linked), followed by `npm run db:types`; then check the Supabase security advisors.

**Contact email (Resend)**: copy `.env.example` to `.env.local` (git-ignored) and fill `RESEND_API_KEY` and `CONTACT_TO_EMAIL`; `CONTACT_FROM_EMAIL` is optional. They are server-only variables (never `NEXT_PUBLIC_`), read inside the Server Action at request time. Without a verified domain the sender is `onboarding@resend.dev` (the default) and Resend only delivers to the Resend account owner's email, so `CONTACT_TO_EMAIL` must be that address. A missing variable or a Resend error shows the error terminal and logs only the reason to the server console.

Tests cover pure logic only and sit next to the code they test (`*.test.ts` under `features/` and `shared/`, the only folders `vitest.config.ts` includes); the contact Server Action test mocks `resend` with `vi.mock` and never reads `.env.local`; the Supabase tests stub variables with `vi.stubEnv` and the network with `vi.stubGlobal("fetch", ...)`. There are no component or end-to-end tests yet.

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
- **Supabase** — use `supabase` for any Supabase work (Auth, `@supabase/ssr`, CLI, RLS, Realtime, Edge Functions, debugging) and `supabase-postgres-best-practices` before writing or changing anything in the database (tables, migrations, RLS policies, indexes, functions). Installed from `supabase/agent-skills` as copies (`--copy`), pinned by commit in `skills-lock.json`.
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
