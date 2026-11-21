# SPEC 07 — Juego y leaderboard: Caída

> **Estado:** Implementado
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-11-21
> **Objetivo:** Portar a TypeScript el juego de `references/started-games/03-tetris/` como el juego `falling-blocks` del catálogo (antes `caida`), aislado en `features/arcade/falling-blocks/` y servido por su ruta `/juegos/falling-blocks/jugar`, con su canvas, sus controles y su panel lateral, y registrado en el leaderboard de Supabase (Salón, Detalle y MEJOR GLOBAL).

---

## Por qué existe este spec

`references/started-games/03-tetris/` es un juego de bloques que caen en JavaScript plano. El catálogo ya tiene su equivalente simulado, `caida` ("CAÍDA", PUZZLE, "Encaja las piezas antes de que el techo te aplaste."). Es el segundo juego real, después de Asteroides (SPEC 05).

El original no se puede importar tal cual en React:

- **Arranque global:** arranca con `init()` en el nivel superior y busca diez elementos por id fijo (`#board`, `#next-canvas`, `#score`, `#overlay`…).
- **Listeners sin limpiar:** su listener de `keydown` en `document` y los `click` de sus botones nunca se quitan.
- **Estado y aleatoriedad:** guarda todo en variables globales y usa `Math.random`.
- **Interfaz en HTML:** el panel lateral (SCORE, LINES, LEVEL, NEXT, CONTROLS) y el overlay de pausa y fin son HTML fuera del canvas.
- **Tema y título:** el tema claro/oscuro cambia la clase de `body` y lo guarda en `localStorage["tetris-theme"]`; el `<h1>` y el `<title>` dicen "TETRIS", una marca registrada.

Hoy el leaderboard (SPEC 06) solo tiene la fila `asteroids` en `games`. Este spec añade la de Caída en el mismo entregable.

---

## Alcance

**Entra:**

- **Juego:**
  - **Mecánica:**
    - tablero de 10×20
    - 8 piezas: I, O, T, S, Z, J, L y la "tuerca", un anillo de 3×3
    - pieza al azar uniforme y vista previa de la siguiente
    - rotación horaria con desplazamientos `[0, -1, 1, -2, 2]`
    - caída automática, caída suave y caída dura, y pieza fantasma
    - limpieza de líneas, con nivel cada 10 líneas y velocidad creciente
    - fin cuando una pieza nueva no cabe al aparecer
    - sin vidas.
  - **Controles:** ← y → mueven, ↑ y X rotan, ↓ hace la caída suave y Espacio la caída dura. P pasa al contenedor.
  - **Canvas:** 420×600 lógicos: tablero de 300×600 y una columna de 120×600 que dibuja el panel original. Además, las pantallas de pausa ("PAUSA") y de fin ("GAME OVER" / "Puntuación: X").
  - **Integración:** ruta propia, `PLAYABLE_GAME_IDS`, `ArcadePlayer`, y la entrada del catálogo renombrada de `caida` a `falling-blocks` con el título "CAÍDA".
  - **Encaje en la ventana:** `arena-fit` pasa a aceptar la proporción de cada juego. Caída (7:10) ocupa toda la altura disponible y Asteroides (4:3) no cambia.
  - **Tests del motor.**
- **Leaderboard:**
  - Migración `add_falling_blocks_game` con la fila de `games`: los mismos textos que el catálogo, `max_score` 10 000 000 y `sort_order` 2.
  - GUARDAR envía la puntuación y el nombre exactos por `submit_score`, y escribe `av_scores` y `av_player_name`.
  - Pestaña propia en el Salón de la Fama (top 12, después de ASTEROIDES), top 10 en el Detalle y MEJOR GLOBAL real.
  - Sin puntuaciones: "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA". Sin Supabase: filas simuladas y guardado solo local.

**Fuera de alcance (para specs futuros):**

- Tema claro/oscuro, botón "Reiniciar" y pausa propia del original (reiniciar es "JUGAR DE NUEVO" y la pausa es del contenedor).
- Bolsa de 7 piezas, reserva de pieza ("hold"), giro antihorario, T-spins y combos: no existen en el original.
- Controles táctiles y sonido (el original no tiene).
- Redirigir `/juegos/caida` y migrar las puntuaciones guardadas con `game: "caida"`.
- Bloque Buster y los demás juegos simulados.
- Antitrampas fuerte.

---

## Modelo de datos

### Juego

Constantes del original en `features/arcade/falling-blocks/engine/constants.ts`:

```ts
export const COLS = 10, ROWS = 20, BLOCK = 30;            // tablero 300×600
export const PANEL_WIDTH = 120;                           // canvas 420×600
export const PIECES = [ /* null, I, O, T, S, Z, J, L, tuerca — matrices literales del original */ ];
export const PIECE_COLORS = [null, "#4dd0e1", "#ffd54f", "#ba68c8", "#81c784", "#e57373", "#90caf9", "#ffb74d", "#9e9e9e"];
export const LINE_SCORES = [0, 100, 300, 500, 800];       // × nivel
export const KICKS = [0, -1, 1, -2, 2];
export const SOFT_DROP_POINTS = 1;                        // por fila
export const HARD_DROP_POINTS = 2;                        // por fila
export const LINES_PER_LEVEL = 10;
export const DROP = { base: 1.0, stepPerLevel: 0.09, min: 0.1 }; // segundos
export const GHOST_ALPHA = 0.2;
```

Estado y funciones en `engine/state.ts`:

```ts
export type FallingBlocksPiece = { type: number; shape: number[][]; x: number; y: number };
export type FallingBlocksPhase = "playing" | "gameover";
export type FallingBlocksAction = "left" | "right" | "rotate" | "softDrop" | "hardDrop";

export type FallingBlocksState = {
  board: number[][];            // ROWS×COLS; 0 vacío, 1–8 índice de pieza
  current: FallingBlocksPiece;
  next: FallingBlocksPiece;
  score: number; lines: number; level: number;
  dropAccum: number;            // s acumulados
  dropInterval: number;         // s = max(0.1, 1.0 − (level − 1) × 0.09)
  phase: FallingBlocksPhase;
};

export function createFallingBlocksState(rng: () => number): FallingBlocksState;
export function applyFallingBlocksAction(state: FallingBlocksState, action: FallingBlocksAction, rng: () => number): FallingBlocksState;
export function stepFallingBlocks(state: FallingBlocksState, dt: number, rng: () => number): FallingBlocksState; // caída automática
export function ghostY(state: FallingBlocksState): number;
export function fallingBlocksStats(state: FallingBlocksState): GameStats; // { score, lives: null, level }
```

Reglas copiadas del original:

- **Pieza nueva:** `type = floor(rng() × 8) + 1`. Aparece en `x = floor(COLS / 2) − floor(ancho / 2)` e `y = 0`. Si choca al aparecer, la fase pasa a `gameover`.
- **Rotación:** horaria (transponer e invertir). Se prueba con cada desplazamiento de `KICKS` y se aplica el primero libre; si ninguno lo está, la pieza no cambia.
- **Caída suave:** si la pieza puede bajar, baja una fila y suma 1. Si no puede, se fija de inmediato.
- **Caída dura:** baja hasta `ghostY`, suma 2 por fila recorrida y se fija.
- **Fijar:** unir la pieza al tablero, limpiar líneas de abajo arriba y sacar la siguiente.
- **Al limpiar `n` líneas:**
  - `score += LINE_SCORES[n] × level`, con el nivel previo
  - `lines += n`
  - `level = floor(lines / 10) + 1`
  - el intervalo se recalcula.
- **Caída automática:** `dropAccum += dt`. Cuando llega a `dropInterval`, se pone a 0 y la pieza baja una fila o, si no puede, se fija.
- **Tras `gameover`,** ninguna función cambia la puntuación.

### Leaderboard

Migración `supabase/migrations/<timestamp>_add_falling_blocks_game.sql`, creada con `npx supabase migration new add_falling_blocks_game`:

```sql
insert into public.games (id, title, short_description, long_description, category, cover, color, max_score, sort_order)
values ('falling-blocks', 'CAÍDA', '<short de catalog.ts>', '<long de catalog.ts>', 'PUZZLE', 'cover-tetro', 'magenta', 10000000, 2);
```

Las tablas, los permisos y `submit_score` ya existen (SPEC 06) y no se tocan.

### Convenciones

- `dt` en segundos, limitado a 0,05 por `use-game-loop`. El motor convierte los milisegundos del original a segundos.
- La lógica de `engine/` no toca el DOM, `window`, el reloj ni `Math.random`.
- `PLAYABLE_GAME_IDS = ["asteroids", "falling-blocks"]`.
- **Teclado:** cada `keydown`, incluidas las repeticiones del sistema al mantener una tecla, es una acción, como en el original. Se ignoran los eventos de `input` y `textarea` y se llama a `preventDefault` en flechas y Espacio.
- **Colores:** las piezas conservan `PIECE_COLORS`. El fondo, la rejilla, la columna y los textos usan la paleta neón (`--bg`, `--line`, `--cyan`, `--magenta`, `--ink`, `--ink-dim`).
- **Textos del canvas:** "SCORE", "LINES", "LEVEL", "NEXT", "CONTROLS", "← → mover", "↑ rotar", "↓ bajar", "Space caída", "P pausa", "PAUSA", "GAME OVER" y "Puntuación: X", con `--mono` o `--pixel` y escalados con `hud-scale`. Ningún texto dice "Tetris".
- **Encaje:** `arena-fit` recibe la proporción del canvas (`4 / 3` para Asteroides, `420 / 600` para Caída) y limita a la vez el ancho y el alto disponibles, sin superar nunca el tamaño lógico.

---

## Estructura de archivos

```
features/games/data/catalog.ts                 # caida → id "falling-blocks" (título "CAÍDA")
features/games/lib/*.test.ts, features/player/lib/*.test.ts   # caida → falling-blocks donde aparezca
features/arcade/playable.ts                    # + "falling-blocks"
features/arcade/lib/arena-fit.ts               # proporción por juego (+ test si hay lógica pura)
features/arcade/components/ArcadePlayer.tsx    # pasa la proporción del juego a arena-fit
app/juegos/falling-blocks/jugar/page.tsx       # <FallingBlocksPlayer game={getGameById("falling-blocks")} />
features/arcade/falling-blocks/
  engine/constants.ts
  engine/state.ts (+ state.test.ts)
  engine/render.ts                             # tablero, fantasma, pieza, columna, PAUSA, GAME OVER
  components/FallingBlocksCanvas.tsx           # canvas 420×600 + use-game-loop + teclado
  components/FallingBlocksPlayer.tsx           # ArcadePlayer + FallingBlocksCanvas, proporción 420/600
supabase/migrations/<ts>_add_falling_blocks_game.sql
shared/lib/supabase/database.types.ts          # regenerado (sin cambios de esquema esperados)
docs/evidence/spec-07/                         # capturas revisadas + README
```

- `features/arcade/falling-blocks/` no importa nada de `features/arcade/asteroids/`.
- `app/juegos/[id]/jugar/page.tsx` y `PlayerScreen.tsx` no cambian.

---

## Plan de implementación

1. **Catálogo, ruta y encaje.**
   - Renombrar `caida` a `falling-blocks` en `catalog.ts` y en los tests que lo usen.
   - Añadir el id a `PLAYABLE_GAME_IDS`.
   - Crear la ruta con un canvas vacío.
   - Generalizar `arena-fit` con la proporción.
   - Prueba manual: el build lista `/juegos/falling-blocks/jugar` como ruta propia, Asteroides se ve igual que antes y `/juegos/serpentina/jugar` sigue simulado.
2. **Motor con test primero.** Usa `rng` fijo y tableros preparados:
   - una pieza no atraviesa paredes, suelo ni bloques
   - la rotación aplica el primer desplazamiento libre de `[0, −1, 1, −2, 2]` y, si no hay ninguno, la pieza no cambia
   - la caída suave suma 1 por fila y fija la pieza si no puede bajar
   - la caída dura suma 2 por fila y fija la pieza
   - limpiar 1 y 4 líneas en nivel 1 suma 100 y 800; en nivel 3, 300 y 2400
   - con 10 líneas el nivel pasa a 2 y el intervalo a 0,91 s; nunca baja de 0,1 s
   - la caída automática baja una fila al acumular el intervalo
   - una pieza que no cabe al aparecer da `gameover`, y después la puntuación ya no cambia
   - `floor(rng() × 8) + 1` puede dar la tuerca (tipo 8)
   - `fallingBlocksStats` devuelve `{ score, lives: null, level }`.
3. **Render y componentes.**
   - Crear `render.ts`: rejilla neón, bloques con los colores originales y brillo superior, fantasma al 0,2, columna con el panel, "PAUSA" cuando `paused` y "GAME OVER" / "Puntuación: X" al terminar.
   - Crear `FallingBlocksCanvas.tsx` (implementa `ArcadeCanvasProps` y notifica `onStats` solo cuando cambian) y `FallingBlocksPlayer.tsx`.
   - Prueba manual: `/juegos/falling-blocks/jugar` se juega; el panel del canvas y el HUD del Reproductor muestran la misma puntuación y el mismo nivel.
4. **Leaderboard.** Crear la migración `add_falling_blocks_game` con los textos copiados literalmente de `catalog.ts`. Aplicarla con `npx supabase db push --linked --yes`, ejecutar `npm run db:types` y revisar los asesores de seguridad.
5. **Verificación con Playwright** del juego y del leaderboard contra `next start`. Revisar cada captura y versionarlas en `docs/evidence/spec-07/` con su README.
6. **Documentación.** Actualizar `CLAUDE.md`: rutas, "Project state" y `arena-fit` con proporción por juego.

---

## Criterios de aceptación

**Juego:**

- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` terminan sin errores. El build lista `/juegos/falling-blocks/jugar` como ruta propia, y `/juegos/[id]/jugar` ya no genera `falling-blocks`.
- [x] `app/juegos/[id]/jugar/page.tsx` y `PlayerScreen.tsx` no mencionan `falling-blocks`, y `features/arcade/falling-blocks/` no importa nada de otro juego.
- [x] El canvas muestra el tablero, la pieza fantasma y la columna con "SCORE", "LINES", "LEVEL", "NEXT" (con la pieza siguiente) y "CONTROLS".
- [x] La puntuación y el nivel de la columna coinciden siempre con el HUD del Reproductor, que muestra "—" en vidas.
- [ ] ← y → mueven, ↑ y X rotan, ↓ hace la caída suave (+1) y Espacio la caída dura (+2 por fila). Mantener una flecha repite el movimiento.
- [x] PAUSA, P y Escape congelan el juego. Se ven "PAUSA" en el canvas y "EN PAUSA" en la CRT, y al reanudar la pieza no salta.
- [x] Al llenar el tablero se ven "GAME OVER" / "Puntuación: X" en el canvas, y 1,5 s después el modal "FIN DEL JUEGO". FIN abre el modal al instante.
- [x] JUGAR DE NUEVO empieza con el tablero vacío, puntuación 0 y nivel 1.
- [x] Hay un solo bucle de animación, también al salir y volver.
- [x] El Reproductor completo cabe sin scroll a 1440×900 y a 1280×720, con el canvas en 7:10 y centrado; el panel se lee a 390 px. Asteroides mantiene su tamaño de antes.
- [x] La consola no muestra errores y ningún texto visible dice "Tetris".
- [ ] `/juegos/caida` responde 404 al navegar, y la Biblioteca enlaza a `/juegos/falling-blocks`.

**Leaderboard:**

- [x] `games` tiene la fila `falling-blocks` con `title`, `short_description`, `long_description`, `category`, `cover` y `color` iguales a los de `catalog.ts`, `max_score` 10 000 000 y `sort_order` 2.
- [ ] GUARDAR crea en `scores` una fila con `game_id` `falling-blocks`, el nombre y la puntuación exactos y `user_id` `null`, y escribe `av_scores`. Un segundo envío antes de 10 s se rechaza.
- [x] El Salón muestra las pestañas ASTEROIDES y CAÍDA, en ese orden, y la de CAÍDA con su top 12.
- [x] El Detalle `/juegos/falling-blocks` muestra el top 10 real y un MEJOR GLOBAL igual al #01.
- [ ] Sin puntuaciones, ambas tablas muestran "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA".
- [x] Los asesores de seguridad de Supabase no muestran avisos nuevos, aparte del de `submit_score`, que es intencionado.

---

## Decisiones

- **Sí:** id `falling-blocks` con el título "CAÍDA". Código, archivos y URL en inglés, como `asteroids`; la interfaz en español.
- **No:** usar `tetris` ni el título "TETRIS". Es una marca registrada.
- **No:** mantener `caida`. Rompería la convención de ids en inglés que fijó el SPEC 05.
- **Sí:** las 8 piezas, incluida la tuerca. Es lo que distingue al original.
- **Sí:** piezas al azar uniformes, como el original.
- **No:** bolsa de 7 piezas. Cambiaría la jugabilidad del original y tampoco contemplaría la tuerca.
- **Sí:** colores originales en las piezas y paleta neón en el tablero y la columna. Son 8 piezas y la paleta neón solo tiene 4 tokens.
- **Sí:** el panel HTML pasa a una columna del canvas con sus mismos textos. Así se conserva el HUD propio del juego sin depender de ids fijos ni del DOM.
- **Sí:** pantallas "PAUSA" y "GAME OVER" del original dibujadas en el canvas. El contenedor decide cuándo se muestran.
- **No:** botón "Reiniciar", pausa propia ni tema claro/oscuro. Reiniciar y pausar son del contenedor; el tema chocaría con la identidad neón.
- **Sí:** cada `keydown` es una acción, incluida la repetición del sistema. Es como se mueve el original.
- **Sí:** generalizar `arena-fit` con la proporción de cada juego. El canvas vertical aprovecha toda la altura, y Bloque Buster lo heredará.
- **No:** forzar 4:3 con bandas a los lados. Encogería el tablero.
- **Sí:** `max_score` 10 000 000. El multiplicador por nivel no tiene techo, y el valor solo debe descartar cifras absurdas.
- **Sí:** `sort_order` 2. Las pestañas del Salón siguen el orden en que se publicaron los juegos.
- **Sí:** juego y leaderboard en un solo spec, como exige la skill `arcade-game-spec`.

---

## Riesgos

| Riesgo                                                                                       | Mitigación                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Generalizar `arena-fit` cambia el tamaño de Asteroides.                                   | Un criterio exige que Asteroides mantenga su tamaño; se comparan capturas a 1440×900 y 1280×720 con las de `docs/evidence/fix-review-findings/`.                                                          |
| La repetición de teclas del sistema mueve demasiado rápido o no funciona con `use-keys`. | Usar los `keydown` con repetición, como el original; si `use-keys` no los expone, ampliarlo sin romper Asteroides (que solo usa teclas mantenidas y recién pulsadas).                                    |
| Renombrar `caida` deja enlaces, tests o filas simuladas apuntando al id viejo.             | Buscar `"caida"` en `app/`, `features/` y `shared/` antes de cerrar el paso 1. Las filas simuladas cambian porque `detailSeed` y `hallSeed` usan la longitud del id; ya se aceptó con Asteroides. |
| La columna de 120 px es ilegible a 390 px.                                                   | Escalar sus textos con `hud-scale`; un criterio lo comprueba con una captura.                                                                                                                                |
| La caída suave fija la pieza en cuanto toca, lo que puede sentirse brusco.                  | Es el comportamiento del original; se mantiene y queda documentado.                                                                                                                                            |
| Una partida legítima supera `max_score`.                                                  | 10 000 000 deja un margen muy amplio; si ocurre, una migración nueva lo sube.                                                                                                                                 |
| Un `dt` grande tras volver de otra pestaña provoca varias caídas de golpe.               | `use-game-loop` limita `dt` a 0,05 s y pone `dt = 0` al reanudar.                                                                                                                                        |

---

## Notas de implementación

Implementado y verificado el 2026-11-21 con Playwright contra `next start` y Supabase. Las evidencias revisadas están en [`docs/evidence/spec-07/`](../docs/evidence/spec-07/README.md). Los criterios sin marcar no se verificaron por completo.

- **Encaje:** `arena-fit` recibe el tamaño lógico (`{ width, height }`) en lugar de solo la proporción, para poder limitar a él. Caída mide 420×600 a 1440×900 y 294×420 a 1280×720. Asteroides no cambia: 800×600 y 560×420, porque `ArcadePlayer` usa 800×600 por defecto y `AsteroidsPlayer` no se tocó. `CrtScreen` recibe `screenStyle`, porque `.crt-screen` fija 4:3 en CSS.
- **Teclado:** `useKeyDown` (nuevo en `use-keys.ts`) trata cada `keydown` como una acción, incluidas las repeticiones del sistema. `useKeys` no cambia.
- **Desviaciones:**
  - "PAUSA" se dibuja en el cuarto superior del tablero, para que no lo tape el "EN PAUSA" de la CRT
  - las puntuaciones se muestran sin separador de miles
  - los textos de la columna se escalan hasta 1,7× y se reducen si no caben
  - al pulsar FIN en plena partida, el canvas muestra "PAUSA" detrás del modal.
- **Verificado:**
  - caída suave +1 y caída dura +28 (14 filas)
  - pausa congelada y fin natural con el modal ~1,1 s después de detectarlo
  - GUARDAR creó en `scores` la fila QA_CAIDA · 193
  - Salón con ASTEROIDES y CAÍDA, y Detalle con MEJOR GLOBAL 193
  - un solo rAF, sin errores de consola y sin "Tetris".
- **Sin verificar:** la repetición al mantener una tecla, que la Biblioteca enlace a la nueva URL, el límite de 10 s para este juego (la lógica es la misma de `submit_score`) y la tabla vacía de CAÍDA.
- **`/juegos/caida`:** siempre muestra la página de "no encontrado" (`noindex`), pero el código HTTP alterna entre 404 y 200 por el streaming de Next, igual que con cualquier id desconocido.
- **Hallazgos de las capturas:** el pie de la CRT se apelotona en la CRT estrecha de Caída; Espacio desplaza la página durante los 1,5 s previos al modal (también en Asteroides); y "Í" se dibuja mal en la fuente pixel, algo que ya pasaba antes. Detalle en `docs/evidence/spec-07/README.md`.
- **Datos de prueba:** quedó en producción una fila `QA_CAIDA` (193).

---

## Lo que **no** entra en este spec

- Tema claro/oscuro, botón "Reiniciar" y pausa propia del original.
- Bolsa de 7 piezas, "hold", giro antihorario, T-spins y combos.
- Controles táctiles y sonido.
- Redirección desde `/juegos/caida` y migración de puntuaciones antiguas.
- Bloque Buster y los demás juegos simulados.
- Antitrampas fuerte.

Cada uno de estos puntos, si llega, irá en su propio spec.
