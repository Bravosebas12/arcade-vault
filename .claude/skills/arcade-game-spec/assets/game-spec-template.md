# SPEC NN — Juego y leaderboard: <TÍTULO>

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** <AAAA-MM-DD>
> **Objetivo:** <Una frase: portar/crear `<id>` aislado en `features/arcade/<id>/`, con su ruta `/juegos/<id>/jugar`, su canvas y su HUD, y con su leaderboard en Supabase (Salón, Detalle y MEJOR GLOBAL).>

## Por qué existe este spec
<Origen: `references/started-games/NN-x/` o "desde cero". Qué impide importarlo tal cual. Relación con el catálogo y con el leaderboard (hoy sin fila en `games`).>

## Alcance
**Entra:**
- **Juego:**
  - **Mecánica:** <reglas completas: entidades, movimiento, colisiones, puntuación, vidas, niveles, fin>.
  - **Controles:** <teclas y ratón; lo que pasa al contenedor>.
  - **Canvas:** <tamaño lógico, capas de dibujo, HUD interno, pantallas de pausa y de fin>.
  - **Integración:** ruta propia, `PLAYABLE_GAME_IDS`, `ArcadePlayer` y la entrada del catálogo.
  - **Tests del motor.**
- **Leaderboard:**
  - Migración `add_<id>_game` con la fila de `games`: los mismos textos que el catálogo, `max_score` <valor y motivo> y `sort_order` <posición>.
  - GUARDAR envía la puntuación y el nombre exactos por `submit_score`, y escribe `av_scores` y `av_player_name`.
  - Pestaña propia en el Salón de la Fama (top 12), top 10 en el Detalle y MEJOR GLOBAL real.
  - Vacío: "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA". Sin Supabase: filas simuladas y guardado solo local.

**Fuera de alcance (para specs futuros):** <comportamientos eliminados, táctil, sonido si no aplica, antitrampas fuerte, etc.>

## Modelo de datos
- **Juego:**
  - **Constantes:** `engine/constants.ts`, con los valores del original o los definidos aquí.
  - **Estado y fases:** `<Id>State`, `<Id>Input` y las fases.
  - **Funciones:** `create<Id>State(rng)`, `step<Id>(state, input, dt, rng)` y `<id>Stats(state): GameStats`.
- **Leaderboard:** el SQL de la fila de `games` (`id`, `title`, `short_description`, `long_description`, `category`, `cover`, `color`, `max_score` y `sort_order`). Las tablas, permisos y `submit_score` ya existen (SPEC 06) y no se tocan.
- **Convenciones:** `dt` en segundos, limitado a 0,05; sin DOM, reloj ni `Math.random` en `engine/`; recursos en `public/games/<id>/`.

## Estructura de archivos
<Árbol: catálogo, `playable.ts`, `app/juegos/<id>/jugar/page.tsx`, `features/arcade/<id>/{engine,components}` y `supabase/migrations/<ts>_add_<id>_game.sql`.>

## Plan de implementación
1. Catálogo, `PLAYABLE_GAME_IDS` y ruta (con un canvas vacío).
2. Motor con test primero: <casos con números exactos>.
3. Render, `<Id>Canvas` y `<Id>Player`: el HUD interno dibuja el mismo `GameStats` que notifica.
4. Leaderboard: migración `add_<id>_game`, `db push --linked --yes`, `db:types` y asesores de Supabase.
5. Verificación con Playwright del juego y del leaderboard, con evidencias en `docs/evidence/spec-NN/`.
6. Documentación en `CLAUDE.md`.

## Criterios de aceptación
**Juego:**
- [ ] lint, tsc, tests y build terminan sin errores; el build lista la ruta propia y `[id]/jugar` deja de generar `<id>`.
- [ ] Los dos HUD muestran siempre lo mismo; los controles originales funcionan; la pausa congela el canvas y reanuda sin saltos.
- [ ] El fin natural muestra la pantalla de fin del canvas y después el modal; FIN lo abre al instante.
- [ ] Un solo rAF; cabe a 1440×900 y 1280×720 y se lee a 390 px; sin errores de consola ni marcas registradas.

**Leaderboard:**
- [ ] `games` tiene la fila `<id>`, con los textos iguales a los del catálogo, `max_score` y `sort_order`.
- [ ] GUARDAR crea en `scores` una fila con el nombre y la puntuación exactos y `user_id` `null`; un segundo envío antes de 10 s se rechaza.
- [ ] El Salón muestra la pestaña del juego con su top 12; el Detalle, su top 10 y MEJOR GLOBAL igual al #01.
- [ ] Sin puntuaciones aparece "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA"; sin Supabase, filas simuladas y guardado local.
- [ ] Los asesores de Supabase no muestran avisos nuevos, aparte del de `submit_score`, que es intencionado.

## Decisiones
<Sí / No con su motivo, incluidas las del port (qué se conserva y qué se elimina) y la elección de `max_score`.>

## Riesgos
<Tabla riesgo → mitigación.>

## Lo que **no** entra en este spec
<Repetición de lo que queda fuera de alcance.>
