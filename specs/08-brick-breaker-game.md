# SPEC 08 — Juego y leaderboard: Brick Breaker

> **Estado:** Implementado
> **Depende de:** SPEC 05, SPEC 06, SPEC 07
> **Fecha:** 2026-11-21
> **Objetivo:** Portar a TypeScript el juego de `references/started-games/04-arkanoid/` como `brick-breaker` ("BRICK BREAKER"), aislado en `features/arcade/brick-breaker/` y servido por su ruta `/juegos/brick-breaker/jugar`, con su canvas, sprites, sonidos, controles y HUD, y registrado en el leaderboard de Supabase (Salón, Detalle y MEJOR GLOBAL).

---

## Por qué existe este spec

`references/started-games/04-arkanoid/` es un juego de romper bloques con pala y pelota, en JavaScript plano. Es el tercer juego real, después de Asteroides (SPEC 05) y Falling Blocks (SPEC 07). El catálogo tuvo su equivalente simulado, "BLOQUE BUSTER", hasta que el PR #16 dejó solo los juegos reales. Este spec lo devuelve al catálogo como juego real.

El original no se puede importar tal cual en React:

- **Scripts globales:** tres archivos (`assets/spritesheet.js`, `levels.js` y `game.js`) comparten variables globales: `LEVELS`, `SPRITES`, `EXPLOSION_FRAMES`, `drawSprite` y `loadSpritesheet`. El bucle arranca dentro del callback de carga del spritesheet y nunca se cancela.
- **Listeners sin limpiar:** los de `keydown` y `keyup` en `document`, y los de `mousemove` y `click` en el canvas, nunca se quitan.
- **Sonido:** los `Audio` se crean al cargar el script, con rutas relativas (`assets/...`).
- **Pausa y salto de nivel:** la pausa tiene botones para saltar de nivel (1–5) dibujados en el canvas. Permitirían puntuaciones imposibles en el leaderboard.
- **Nombre:** el `<title>` dice "Arkanoid", una marca registrada, igual que "Breakout".

---

## Alcance

**Entra:**

- **Juego:**
  - **Mecánica:**
    - pala de 81×14 en `y = 560`, controlada con ← y → a 400 px/s o con el ratón (centrada en el puntero)
    - bola de 16×16 con velocidad base (200, −300) × la velocidad del nivel
    - rebote en las paredes izquierda, derecha y superior, y en la pala (solo bajando, con una tolerancia de 8 px); en la pala solo cambia el signo de la velocidad vertical, nunca el ángulo
    - bloques de 64×24 en una rejilla de 10×6 desde `(80, 80)`
    - romper un bloque suma 10, invierte la velocidad vertical y solo se rompe uno por fotograma
    - explosión animada de 150 ms en 4 fotogramas
    - 5 niveles con sus patrones y velocidades (1,00, 1,10, 1,21, 1,33 y 1,46)
    - vaciar un nivel carga el siguiente con la bola sobre la pala
    - perder la bola resta una vida y la relanza desde la pala
    - con 0 vidas, "GAME OVER"; al vaciar el nivel 5, "¡Completaste el juego!".
  - **Sprites y sonidos:** `spritesheet-breakout.png` (559×337) para la pala, la bola, los bloques (7 colores) y las explosiones; `ball-bounce.mp3` al rebotar y `break-sound.mp3` al romper un bloque.
  - **Canvas:** 800×600, con su HUD interno ("Score: X", "Nivel: N" y una bola por vida), la pantalla "PAUSA" y las de fin ("GAME OVER" y "¡Completaste el juego!").
  - **Integración:**
    - ruta propia y `brick-breaker` en `PLAYABLE_GAME_IDS`
    - `ArcadePlayer` con el tamaño por defecto (800×600)
    - la entrada vuelve al catálogo con los textos y la portada del prototipo y el título "BRICK BREAKER"
    - la Biblioteca recupera el chip ARCADE.
  - **Tests del motor.**
- **Leaderboard:**
  - Migración `add_brick_breaker_game` con la fila de `games`: los mismos textos que el catálogo, `max_score` 2080 y `sort_order` 3.
  - GUARDAR envía la puntuación y el nombre exactos por `submit_score`, y escribe `av_scores` y `av_player_name`.
  - Pestaña propia en el Salón de la Fama (top 12, después de ASTEROIDES y FALLING BLOCKS), top 10 en el Detalle y MEJOR GLOBAL real.
  - Sin puntuaciones: "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA". Sin Supabase: filas simuladas y guardado solo local.

**Fuera de alcance (para specs futuros):**

- El salto de nivel de la pausa (permitiría puntuaciones trucadas) y la pausa propia del original (es del contenedor).
- Cambiar el ángulo de la bola según el punto de impacto en la pala, power-ups, varias bolas, vidas extra o niveles nuevos: no existen en el original.
- Botón de silencio o volumen.
- Controles táctiles.
- La "MEJOR PUNTUACIÓN" inventada de las tarjetas de la Biblioteca y los textos fijos de la Home (pendiente de los PR #16 y #17).
- Antitrampas fuerte, aparte del `max_score` exacto.

---

## Modelo de datos

### Juego

Constantes del original en `features/arcade/brick-breaker/engine/constants.ts`:

```ts
export const W = 800, H = 600;
export const PADDLE = { y: 560, w: 81, h: 14, speed: 400, catchTolerance: 8 };
export const BALL = { size: 16, baseVx: 200, baseVy: -300 };
export const GRID = { cols: 10, rows: 6, blockW: 64, blockH: 24, originX: 80, originY: 80 };
export const POINTS_PER_BLOCK = 10;
export const START_LIVES = 3;
export const EXPLOSION_DURATION = 0.15; // s (150 ms), 4 fotogramas
export type BlockColor = "red" | "yellow" | "cyan" | "magenta" | "hotpink" | "green" | "gray";
```

Niveles en `engine/levels.ts`: los 5 patrones de `levels.js`, generados con las mismas reglas (completo, pirámide, tablero de ajedrez, huecos y marco con cruz), con 60, 40, 30, 39 y 39 bloques (208 en total).

Estado y funciones en `engine/state.ts`:

```ts
export type BrickBreakerPhase = "playing" | "gameover" | "win";
export type BrickBreakerInput = { left: boolean; right: boolean; pointerX: number | null }; // pointerX en coordenadas lógicas

export type BrickBreakerState = {
  paddleX: number;
  ball: { x: number; y: number; vx: number; vy: number };
  blocks: { x: number; y: number; color: BlockColor; alive: boolean }[];
  explosions: { x: number; y: number; color: BlockColor; elapsed: number }[];
  score: number; lives: number; level: number;  // nivel 1–5
  phase: BrickBreakerPhase;
  events: ("bounce" | "break")[];                // sonidos que el canvas reproduce en este paso
};

export function createBrickBreakerState(): BrickBreakerState;
export function stepBrickBreaker(state: BrickBreakerState, input: BrickBreakerInput, dt: number): BrickBreakerState;
export function brickBreakerStats(state: BrickBreakerState): GameStats; // { score, lives, level }
```

Reglas copiadas del original:

- **Pala:** ← y → la mueven a 400 px/s, limitada a `[0, 800 − 81]`. Si hay `pointerX`, la pala se centra en él con el mismo límite.
- **Bola:** avanza `v × dt`. Rebota en `x ≤ 0`, `x + 16 ≥ 800` e `y ≤ 0`, corrigiendo la posición y el signo de la velocidad.
- **Pala con la bola:** con `vy > 0`, si la bola se solapa horizontalmente con la pala y su borde inferior está entre `paddle.y` y `paddle.y + 14 + 8`, se coloca sobre la pala y `vy = −|vy|`.
- **Bloques:** el primer bloque vivo que choca (comprobación de cajas) muere, suma 10, invierte `vy` y genera una explosión. Solo uno por paso.
- **Fin de nivel:** si no quedan bloques, se carga el nivel siguiente: bola centrada sobre la pala y velocidad base × la del nivel. Tras el nivel 5, la fase pasa a `win`.
- **Bola perdida:** si `y > 600`, `lives − 1`. Con 0 vidas, la fase pasa a `gameover`; si quedan vidas, la bola se relanza desde la pala.
- **Explosiones:** su `elapsed` avanza con `dt` y se eliminan a los 0,15 s.
- **Sonidos:** cada rebote añade `"bounce"` a `events` y cada bloque roto, `"break"`.
- **Tras `gameover` o `win`,** el estado no cambia.
- **Sin aleatoriedad:** el original no la usa, así que el motor no recibe `rng`.

### Leaderboard

Migración `supabase/migrations/<timestamp>_add_brick_breaker_game.sql`:

```sql
insert into public.games (id, title, short_description, long_description, category, cover, color, max_score, sort_order)
values ('brick-breaker', 'BRICK BREAKER', 'Rebota la pelota y destruye muros de neón.', '<long del prototipo>', 'ARCADE', 'cover-bricks', 'cyan', 2080, 3);
```

`max_score` 2080 es el techo real (208 bloques × 10). Las tablas, los permisos y `submit_score` ya existen (SPEC 06) y no se tocan.

### Convenciones

- `dt` en segundos, limitado a 0,05 por `use-game-loop`, igual que en el original.
- Sin DOM, reloj ni `Math.random` en `engine/`.
- **Recursos** en `public/games/brick-breaker/` (`spritesheet-breakout.png` y `sounds/ball-bounce.mp3` / `sounds/break-sound.mp3`), con rutas absolutas. El bucle no arranca hasta que el spritesheet carga, y los `Audio` se crean al montar y se liberan al desmontar.
- **Ratón:** `mousemove` en el canvas se convierte a coordenadas lógicas con `getBoundingClientRect()`. Se ignora si `paused`.
- **Teclado:** `useKeys` (teclas mantenidas). P y Escape son del contenedor.
- **Colores:** los sprites originales. El fondo del canvas y los textos del HUD usan la paleta neón (`--bg`, `--ink`).
- **Textos del canvas:** "Score: X", "Nivel: N", "PAUSA", "GAME OVER" y "¡Completaste el juego!", escalados con `hud-scale`. Ningún texto dice "Arkanoid" ni "Breakout".
- **Sonido:** un `play()` que el navegador rechace por la política de reproducción automática se ignora.

---

## Estructura de archivos

```
features/games/data/catalog.ts                 # + brick-breaker ("BRICK BREAKER", ARCADE, cover-bricks, cyan)
features/games/lib/*.test.ts                   # catálogo con 3 juegos; chips TODOS, ARCADE, PUZZLE, SHOOTER
features/arcade/playable.ts                    # + "brick-breaker"
app/juegos/brick-breaker/jugar/page.tsx        # <BrickBreakerPlayer game={getGameById("brick-breaker")} />
public/games/brick-breaker/                    # spritesheet y sonidos copiados de references/started-games/04-arkanoid/assets/
features/arcade/brick-breaker/
  engine/constants.ts
  engine/levels.ts (+ levels.test.ts)
  engine/state.ts (+ state.test.ts)
  engine/sprites.ts                            # coordenadas de SPRITES y EXPLOSION_FRAMES del original
  engine/render.ts                             # bloques, explosiones, pala, bola, HUD, PAUSA, fin
  components/BrickBreakerCanvas.tsx            # carga de sprites, bucle, teclado, ratón, sonidos
  components/BrickBreakerPlayer.tsx            # ArcadePlayer + BrickBreakerCanvas
supabase/migrations/<ts>_add_brick_breaker_game.sql
docs/evidence/spec-08/                         # capturas revisadas + README
```

- `features/arcade/brick-breaker/` no importa nada de otro juego.

---

## Plan de implementación

1. **Catálogo y ruta.** Añadir la entrada `brick-breaker` con los textos del prototipo y el título "BRICK BREAKER", y actualizar los tests del catálogo y de las categorías visibles (test primero). Añadir el id a `PLAYABLE_GAME_IDS` y crear la ruta con un canvas vacío. Prueba manual: el build lista `/juegos/brick-breaker/jugar` y la Biblioteca muestra 3 juegos y el chip ARCADE.
2. **Motor con test primero.**
   - **Niveles:** 60, 40, 30, 39 y 39 bloques con sus colores y velocidades.
   - **Pala:** ← y → mueven a 400 px/s con límite; `pointerX` la centra con límite.
   - **Paredes:** la bola rebota en las tres y cambia el signo correcto.
   - **Pala con la bola:** solo cuando `vy > 0` y dentro de la tolerancia de 8 px.
   - **Bloques:** un bloque roto suma 10, invierte `vy` y crea una explosión; con dos bloques solapados, solo se rompe uno por paso.
   - **Explosiones:** desaparecen a los 0,15 s.
   - **Niveles:** vaciar el nivel 1 carga el 2 con la velocidad × 1,10 y la bola sobre la pala; vaciar el nivel 5 da `win`.
   - **Vidas:** perder la bola resta una vida y la relanza; con 0 vidas, `gameover`. Después, el estado ya no cambia.
   - **Eventos:** `events` contiene `"bounce"` o `"break"` en el paso en que ocurren.
   - **Estadísticas:** `brickBreakerStats` devuelve `{ score, lives, level }`.
3. **Recursos, render y componentes.**
   - Copiar los recursos a `public/games/brick-breaker/`.
   - Crear `sprites.ts`, `render.ts`, `BrickBreakerCanvas.tsx` y `BrickBreakerPlayer.tsx`.
   - El canvas carga el spritesheet antes de arrancar, reproduce `events` con clones de `Audio`, convierte el ratón a coordenadas lógicas y notifica `onStats` solo cuando hay cambios.
   - Prueba manual: se juega con teclado y con ratón, suena, y los dos HUD coinciden.
4. **Leaderboard.** Migración `add_brick_breaker_game` con los textos copiados de `catalog.ts`. Aplicarla con `npx supabase db push --linked --yes`, ejecutar `npm run db:types` y revisar los asesores.
5. **Verificación con Playwright** del juego y del leaderboard, con cada captura revisada y versionada en `docs/evidence/spec-08/`.
6. **Documentación.** Actualizar `CLAUDE.md` y el `README` (rutas, "Project state" y recursos en `public/games/`).

---

## Criterios de aceptación

**Juego:**

- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` terminan sin errores, y el build lista `/juegos/brick-breaker/jugar`.
- [x] `features/arcade/brick-breaker/` no importa nada de otro juego.
- [x] El canvas dibuja la pala, la bola y los bloques del nivel 1 con los sprites originales, y el HUD "Score: X", "Nivel: N" con una bola por vida coincide con el HUD del Reproductor.
- [x] ← y → mueven la pala; el ratón la mueve también, y la sigue con la ventana a 1440 px y a 390 px.
- [x] Romper un bloque suma 10 y se ve su explosión; suenan el rebote y la rotura.
- [ ] Vaciar un nivel pasa al siguiente con la bola más rápida.
- [x] PAUSA, P y Escape congelan el juego. Se ven "PAUSA" en el canvas (sin "Saltar al nivel") y "EN PAUSA" en la CRT, y al reanudar la bola no salta.
- [ ] Al perder la última vida se ve "GAME OVER" en el canvas y, 1,5 s después, el modal. Al vaciar el nivel 5 se ve "¡Completaste el juego!" y después el modal.
- [x] JUGAR DE NUEVO empieza en el nivel 1 con 3 vidas y puntuación 0.
- [x] Hay un solo bucle de animación, también al salir y volver; el canvas cabe a 1440×900 y 1280×720 y se lee a 390 px.
- [x] La consola no muestra errores y ningún texto visible dice "Arkanoid" ni "Breakout".

**Leaderboard:**

- [x] `games` tiene la fila `brick-breaker` con los textos de `catalog.ts`, `max_score` 2080 y `sort_order` 3.
- [x] GUARDAR crea en `scores` una fila con `game_id` `brick-breaker` y la puntuación exacta. `submit_score` rechaza 2090.
- [x] El Salón muestra las pestañas ASTEROIDES, FALLING BLOCKS y BRICK BREAKER, en ese orden. El Detalle muestra el top 10 y MEJOR GLOBAL igual al #01.
- [ ] Sin puntuaciones, ambas tablas muestran "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA".
- [x] Los asesores de Supabase no muestran avisos nuevos.

---

## Decisiones

- **Sí:** id `brick-breaker` con el título "BRICK BREAKER". Un solo nombre en inglés, como FALLING BLOCKS.
- **No:** "Arkanoid" ni "Breakout". Son marcas registradas.
- **No:** "BLOQUE BUSTER". Mezcla idiomas y no coincidiría con el id.
- **Sí:** reutilizar los textos, la categoría ARCADE, la portada `cover-bricks` y el color cyan del prototipo. Solo cambia el título.
- **Sí:** `max_score` 2080, el techo real del juego. Cualquier valor mayor es trampa y `submit_score` lo rechaza.
- **Sí:** el rebote en la pala solo cambia el signo, como en el original. Cambiar el ángulo modificaría la mecánica.
- **Sí:** sprites y sonidos originales, sin control de volumen.
- **Sí:** el motor devuelve `events` y el canvas reproduce los sonidos. El motor sigue siendo puro y testeable.
- **No:** salto de nivel ni pausa propia. El contenedor controla la pausa y el salto permitiría puntuaciones trucadas.
- **Sí:** "¡Completaste el juego!" también llama a `onGameOver`. Terminar el juego abre el modal para guardar, igual que perder.
- **Sí:** tamaño por defecto de `ArcadePlayer` (800×600). Es el mismo que el original y no necesita `arena`.
- **Sí:** juego y leaderboard en un solo spec, como exige la skill `arcade-game-spec`.

---

## Riesgos

| Riesgo                                                                                          | Mitigación                                                                                                                               |
| ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| La política de reproducción automática bloquea los sonidos antes de la primera interacción. | Se ignora el `play()` rechazado; el juego se inicia con teclado o ratón, así que el primer sonido suele llegar tras una interacción. |
| El bucle arranca antes de cargar el spritesheet y dibuja huecos.                                | El canvas espera al `onload` de la imagen; un criterio comprueba el primer fotograma.                                                   |
| La posición del ratón no coincide con la pala cuando el canvas está escalado.                | Convertir con `getBoundingClientRect()` y el tamaño lógico; un criterio lo comprueba a 1440 px y a 390 px.                            |
| Al ser un juego determinista, la bola puede quedar en un bucle de rebotes sin tocar bloques.    | Es el comportamiento del original; se mantiene y queda documentado.                                                                       |
| La bola atraviesa un bloque en un fotograma con un `dt` grande.                               | `dt` limitado a 0,05 s: a la velocidad del nivel 5 (~440 px/s) avanza unos 22 px por paso, menos que un bloque.                         |
| Volver a añadir un juego al catálogo cambia la Home, los chips y las filas simuladas.         | Los tests del catálogo y de las categorías se actualizan en el paso 1; las filas simuladas solo se usan sin Supabase.                   |

---

## Notas de implementación

Implementado y verificado el 2026-11-21 con Playwright contra `next start` y Supabase. Las evidencias revisadas están en [`docs/evidence/spec-08/`](../docs/evidence/spec-08/README.md). Los criterios sin marcar no se verificaron en el navegador: el cambio de nivel y "¡Completaste el juego!" están cubiertos por los tests del motor, y la tabla vacía de BRICK BREAKER no se capturó.

- **Desviaciones:**
  - la bola perdida solo se comprueba mientras la fase es `playing`, así que una victoria con el último bloque no puede convertirse en "GAME OVER" en el mismo paso, cosa que el original sí permitía
  - el ratón solo actualiza la pala cuando se mueve, para que no anule las flechas
  - "PAUSA" se dibuja en H/4 y los títulos de fin se reducen para caber en 800 px, porque "¡Completaste el juego!" a 64 px no cabe
  - las bolas de vida del HUD también se escalan con `hud-scale`.
- **Verificado:**
  - la flecha ← mueve la pala 200 px en 0,5 s
  - el ratón centra la pala a 1440 px y a 390 px, y se ignora en pausa
  - un bloque suma 10 y suenan la rotura y el rebote
  - la pausa congela el canvas sin botones de nivel
  - "GAME OVER" se ve y después se abre el modal
  - GUARDAR crea en `scores` la fila QA_BRICK · 30, y `submit_score` rechaza 2090
  - el Salón tiene 3 pestañas en orden y la Biblioteca 3 juegos con el chip ARCADE.
- **Sin Supabase,** las pestañas de reserva del Salón siguen el orden del catálogo (BRICK BREAKER primero); con Supabase manda `sort_order`.
- **Colores:** los bloques usan las coordenadas del spritesheet original, que dibujan algunos colores distintos de su nombre (por ejemplo, "cyan" sale verde azulado). El original se veía igual.
- **Datos de prueba:** quedó en producción una fila `QA_BRICK` (30).

---

## Lo que **no** entra en este spec

- Salto de nivel y pausa propia del original.
- Ángulo según el punto de impacto, power-ups y niveles nuevos.
- Silencio, volumen y controles táctiles.
- "MEJOR PUNTUACIÓN" inventada en las tarjetas y los textos fijos de la Home.
- Antitrampas fuerte.

Cada uno de estos puntos, si llega, irá en su propio spec.
