# SPEC NN — Juego jugable: <TÍTULO>

> **Estado:** Borrador
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** <AAAA-MM-DD>
> **Objetivo:** <Una frase: portar/crear `<id>` aislado en `features/arcade/<id>/`, con su ruta `/juegos/<id>/jugar`, su canvas y su HUD, notificando a React y registrado en el leaderboard.>

## Por qué existe este spec
<Origen: `references/started-games/NN-x/` o "desde cero". Qué impide importarlo tal cual. Relación con el catálogo.>

## Alcance
**Entra:**
- **Mecánica:** <reglas completas: entidades, movimiento, colisiones, puntuación, vidas, niveles, fin>.
- **Controles:** <teclas y ratón; lo que pasa al contenedor>.
- **Canvas:** <tamaño lógico, capas de dibujo, HUD interno, pantallas de pausa y de fin>.
- **Integración:** ruta propia, `PLAYABLE_GAME_IDS`, `ArcadePlayer`, entrada del catálogo y migración con la fila de `games`.
- **Tests del motor.**
**Fuera de alcance (para specs futuros):** <comportamientos eliminados, táctil, sonido si no aplica, etc.>

## Modelo de datos
- **Constantes:** `engine/constants.ts`, con los valores del original o los definidos aquí.
- **Estado y fases:** `<Id>State`, `<Id>Input` y las fases.
- **Funciones:** `create<Id>State(rng)`, `step<Id>(state, input, dt, rng)` y `<id>Stats(state): GameStats`.
- **Fila de `games`:** `id`, `title`, `short_description`, `long_description`, `category`, `cover`, `color`, `max_score` y `sort_order`.
- **Convenciones:** `dt` en segundos, limitado a 0,05; sin DOM, reloj ni `Math.random` en `engine/`; recursos en `public/games/<id>/`.

## Estructura de archivos
<Árbol: catálogo, `playable.ts`, `app/juegos/<id>/jugar/page.tsx`, `features/arcade/<id>/{engine,components}` y la migración.>

## Plan de implementación
1. Catálogo, `PLAYABLE_GAME_IDS` y ruta (con un canvas vacío).
2. Motor con test primero: <casos con números exactos>.
3. Render, `<Id>Canvas` y `<Id>Player`: el HUD interno dibuja el mismo `GameStats` que notifica.
4. Migración `add_<id>_game`, `db push`, `db:types` y asesores de Supabase.
5. Verificación con Playwright y evidencias en `docs/evidence/spec-NN/`.
6. Documentación en `CLAUDE.md`.

## Criterios de aceptación
<Copiar y adaptar: lint, tsc, tests y build; ruta propia; los dos HUD iguales; controles; pausa congelada; fin con retardo y modal; GUARDAR crea la fila en `scores`; pestaña en el Salón y top 10 en el Detalle; un solo rAF; cabe a 1440 y 1280 px y se lee a 390 px; sin errores de consola ni marcas registradas.>

## Decisiones
<Sí / No con su motivo, incluidas las del port: qué se conserva y qué se elimina.>

## Riesgos
<Tabla riesgo → mitigación.>

## Lo que **no** entra en este spec
<Repetición de lo que queda fuera de alcance.>
