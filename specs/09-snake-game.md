# SPEC 09 — Juego y leaderboard: Serpentina

> **Estado:** Implementado
> **Depende de:** SPEC 05, SPEC 06
> **Fecha:** 2026-11-22
> **Objetivo:** Crear el juego `snake` ("SERPENTINA") a partir del prototipo `references/started-games/05-snake/`, aislado en `features/arcade/snake/` y servido por su ruta `/juegos/snake/jugar`, con su canvas, sus frutas pixel art, sus 5 mapas, sus sonidos y su HUD, y registrado en el leaderboard de Supabase (Salón, Detalle y MEJOR GLOBAL).

---

## Por qué existe este spec

Serpentina es un juego del género Snake diseñado para Arcade Vault. No es el port de un juego existente. Su fuente es el prototipo jugable `references/started-games/05-snake/`, creado junto con este spec: todas las mecánicas, constantes y textos de este documento salen de su código.

El catálogo tuvo un equivalente simulado, "SERPENTINA" (`serpentina`, ARCADE, `cover-snake`, verde), hasta que el PR #16 dejó solo los juegos reales. Este spec lo devuelve al catálogo como juego real, con el id en inglés `snake`.

El prototipo no se puede importar tal cual en React:

- **Scripts globales:** comparte `SPRITE_ATLAS`, `SNAKE_MAPS` y `__serpentina` (un acceso de depuración) a través de `window`.
- **Bucle y listeners sin limpiar:** el bucle con `requestAnimationFrame` nunca se cancela y el `keydown` de `window` nunca se quita.
- **Pantallas propias:** tiene su propia pantalla de título ("PULSA ESPACIO"), su propia pausa (P y Escape) y su propio reintento con Espacio. En Arcade Vault esto lo controla `ArcadePlayer`.
- **Aleatoriedad:** usa `Math.random` directamente.

**Arte:** las frutas son pixel art original dibujado para este proyecto. Llegó un `sprites.js` que recortaba una hoja de terceros (el arte extraído del Snake de Google); solo se usó como referencia del formato `{ x, y, w, h }` del atlas. Ese arte no entra en el repositorio.

---

## Alcance

**Entra:**

- **Juego:**
  - **Mecánica:**
    - tablero de 28×20 celdas de 24 px, con un muro en todo el borde
    - la serpiente empieza con largo 4 en la salida del mapa (cabeza y dirección) y avanza `min(6 + nivel, 16)` celdas por segundo
    - las flechas y WASD giran; los giros se encolan (como máximo 2) y se ignoran la marcha atrás y la dirección actual
    - una sola fruta normal a la vez, de un tipo al azar (manzana, cereza, uva, limón, sandía o fresa), en una celda libre al azar; vale 10 × nivel y alarga la serpiente 1 celda
    - cada 5 frutas normales (total de la partida) aparece una piña dorada de bonus durante 5 s, que parpadea en los últimos 1,5 s; vale 50 × nivel y alarga 1 celda (en la práctica, una por mapa)
    - 10 frutas normales completan el mapa: se muestra "MAPA N" con su nombre durante 1,5 s, la serpiente vuelve a la salida con largo 4 y carga el siguiente mapa
    - 5 mapas (ARENA, PILARES, PASILLOS, CRUZ y LABERINTO); tras el 5.º se repiten, más rápido
    - chocar con un muro o con el propio cuerpo resta una vida: la serpiente parpadea en magenta durante 1 s y reaparece en la salida del mismo mapa con largo 4, conservando la puntuación y las frutas del mapa; la bonus desaparece
    - con 0 vidas, "GAME OVER".
  - **Frutas:** 7 sprites pixel art originales de 12×12 (6 normales y la piña de bonus), en mapas de píxeles con su paleta. Al montar, se pintan en un canvas fuera de pantalla con recortes `{ x, y, w, h }`.
  - **Sonidos:** pitidos sintetizados con WebAudio al comer, al coger la bonus, al chocar y al cambiar de mapa. No hay archivos de audio.
  - **Canvas:** 672×520 (HUD de 40 px y tablero de 672×480). Lleva su HUD interno ("PUNTOS 000000", "MAPA N · NOMBRE", el contador de frutas "n/10" y "VIDAS" con un cuadro por vida), el cartel "MAPA N" y la pantalla "GAME OVER".
  - **Integración:**
    - ruta propia y `snake` en `PLAYABLE_GAME_IDS`
    - `ArcadePlayer` con `arena` de 672×520
    - la entrada del catálogo usa los textos del prototipo de Arcade Vault, con la descripción larga adaptada a las frutas y los mapas.
  - **Tests del motor.**
- **Leaderboard:**
  - Migración `add_snake_game` con la fila de `games`: los mismos textos que el catálogo, `max_score` 1000000 y `sort_order` 4.
  - GUARDAR envía la puntuación y el nombre exactos por `submit_score`, y escribe `av_scores` y `av_player_name`.
  - Pestaña propia en el Salón de la Fama (top 12, después de ASTEROIDES, FALLING BLOCKS y BRICK BREAKER), top 10 en el Detalle y MEJOR GLOBAL real.
  - La tarjeta de la Biblioteca y ACTIVIDAD EN VIVO de la Home la incluyen automáticamente (PR #19 y #20).
  - Sin puntuaciones: "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA". Sin Supabase: filas simuladas y guardado solo local.

**Fuera de alcance (para specs futuros):**

- La pantalla de título, la pausa y el reintento propios del prototipo, que son del contenedor. También el acceso de depuración `__serpentina`.
- Elegir mapa, mapas nuevos, obstáculos móviles, power-ups o más de una fruta a la vez.
- Botón de silencio o volumen.
- Controles táctiles (deslizar).
- Antitrampas fuerte, aparte del `max_score`.

---

## Modelo de datos

### Juego

Constantes del prototipo en `features/arcade/snake/engine/constants.ts`:

```ts
export const COLS = 28, ROWS = 20, CELL = 24, HUD_H = 40;
export const W = COLS * CELL;               // 672
export const H = ROWS * CELL + HUD_H;       // 520
export const START_LIVES = 3, START_LENGTH = 4;
export const FRUITS_PER_MAP = 10;
export const BONUS_EVERY = 5;               // frutas normales (total de la partida)
export const BONUS_TIME = 5, BONUS_BLINK = 1.5;         // s
export const NORMAL_POINTS = 10, BONUS_POINTS = 50;     // × nivel
export const BASE_SPEED = 6, SPEED_PER_LEVEL = 1, MAX_SPEED = 16; // celdas/s
export const LEVEL_BANNER = 1.5, DEATH_PAUSE = 1.0;     // s
export const INPUT_QUEUE = 2;
export type Direction = "up" | "down" | "left" | "right";
export type FruitType = "apple" | "cherry" | "grape" | "lemon" | "watermelon" | "strawberry" | "pineapple";
export const NORMAL_FRUITS: readonly FruitType[] = ["apple", "cherry", "grape", "lemon", "watermelon", "strawberry"];
```

Mapas en `engine/maps.ts`, copiados de `maps.js`. Cada mapa es `{ name, walls: { x, y, w, h }[], spawn: { x, y, dir } }`, en celdas, y el borde se añade siempre:

| # | Nombre    | Muros interiores                                                                                    | Salida     |
| - | --------- | --------------------------------------------------------------------------------------------------- | ---------- |
| 1 | ARENA     | ninguno                                                                                             | (5, 10) → |
| 2 | PILARES   | 4 bloques de 2×2 en (6,4), (20,4), (6,14) y (20,14)                                                | (5, 10) → |
| 3 | PASILLOS  | 2 barras de 18×1 en las filas 6 y 13, desde x = 5                                                  | (5, 10) → |
| 4 | CRUZ      | brazos verticales de 2×5 en (13,2) y (13,13) y horizontales de 8×2 en (4,9) y (16,9)              | (5, 8) →  |
| 5 | LABERINTO | 4 columnas de 1×7 con hueco en las filas 8–11 (x = 9 y 18) y 6 tramos de 4×1 en las filas 5 y 14 | (4, 10) → |

Cada salida tiene al menos 8 celdas libres por delante.

Estado y funciones en `engine/state.ts`:

```ts
export type SnakePhase = "intro" | "playing" | "levelup" | "dying" | "gameover";
export type SnakeInput = { turns: Direction[] };   // pulsaciones desde el paso anterior, en orden
export type Cell = { x: number; y: number };

export type SnakeState = {
  phase: SnakePhase;
  timer: number;                     // s restantes de intro / levelup / dying
  clock: number;                     // s acumulados, para parpadeos
  level: number;                     // 1, 2, 3…; mapa = MAPS[(level − 1) % 5]
  score: number; lives: number;
  fruitsInMap: number; totalFruits: number;
  snake: Cell[];                     // [0] = cabeza
  dir: Direction; queue: Direction[]; grow: number; acc: number;
  fruit: Cell & { type: FruitType };
  bonus: (Cell & { type: "pineapple"; t: number }) | null;
  events: ("eat" | "bonus" | "die" | "level")[];   // sonidos de este paso
};

export function createSnakeState(rng: () => number): SnakeState;   // fase "intro" con el cartel "MAPA 1"
export function stepSnake(state: SnakeState, input: SnakeInput, dt: number, rng: () => number): SnakeState;
export function snakeStats(state: SnakeState): GameStats;           // { score, lives, level }
export function wallsOf(level: number): ReadonlySet<number>;        // claves y·COLS + x, borde incluido
```

Reglas copiadas del prototipo:

- **Inicio:** el prototipo espera "PULSA ESPACIO". El port empieza en la fase `intro`, con el cartel "MAPA 1 · ARENA" durante `LEVEL_BANNER`, y después pasa a `playing`.
- **Giros:** cada giro de `input.turns` se compara con el último de la cola (o con `dir` si está vacía). Se descarta si es igual, si es el opuesto o si la cola ya tiene 2.
- **Avance:** `acc += dt`. Mientras `acc ≥ 1 / velocidad` y la fase siga en `playing`, la serpiente da un paso: toma el primer giro de la cola y calcula la siguiente celda.
- **Choque:** la siguiente celda choca si es muro o si es del cuerpo. La cola cuenta como libre salvo que `grow > 0`, porque se mueve en ese mismo paso.
- **Crecer:** la cabeza entra y, si `grow > 0`, `grow − 1`; si no, la cola sale.
- **Fruta normal:**
  - suma `10 × level`, `grow + 1`, `fruitsInMap + 1` y `totalFruits + 1`, y emite `"eat"`
  - si `fruitsInMap` llega a 10: `level + 1`, `fruitsInMap = 0`, fase `levelup` con `timer = 1,5`, mapa nuevo con la serpiente reiniciada, fruta nueva, sin bonus, y emite `"level"`
  - si no, aparece otra fruta en una celda libre (sin muro, serpiente ni bonus) y, si `totalFruits % 5 === 0` y no hay bonus, aparece una bonus con `t = 5`.
- **Bonus:** suma `50 × level`, `grow + 1` y emite `"bonus"`. Su `t` baja con `dt` mientras la fase es `playing`; a 0 desaparece.
- **Vidas:** el choque resta una vida y emite `"die"`. Con 0 vidas la fase pasa a `gameover`; si no, a `dying` con `timer = 1`. Al terminar `dying`, la serpiente vuelve a la salida con largo 4, se borran la cola de giros y la bonus, y la fase vuelve a `playing`.
- **Después de `gameover`,** el estado no cambia salvo `clock`.
- **Aleatoriedad:** el tipo de fruta y las celdas usan el `rng` inyectado (`features/arcade/lib/rng.ts` en el canvas, uno con semilla en los tests).

### Frutas

`engine/sprites.ts` contiene los 7 mapas de píxeles de 12×12 de `sprites.js` y su paleta, como datos puros:

```ts
export const FRUIT_SIZE = 12;
export const FRUIT_PALETTE: Record<string, string>;
export const FRUIT_PIXELS: Record<FruitType, readonly string[]>;   // 12 filas de 12 caracteres, "." transparente
export type FruitAtlas = { image: CanvasImageSource; crops: Record<FruitType, { x: number; y: number; w: number; h: number }> };
```

`render.ts` construye el atlas una sola vez al montar (`buildFruitAtlas()`, en un `<canvas>` fuera de pantalla) y dibuja cada fruta escalada a 24 px sin suavizado. No hace falta ningún archivo en `public/games/snake/`.

### Leaderboard

Migración `supabase/migrations/<timestamp>_add_snake_game.sql`:

```sql
insert into public.games (id, title, short_description, long_description, category, cover, color, max_score, sort_order)
values (
  'snake',
  'SERPENTINA',
  'Crece sin morder tu propia cola.',
  'Una serpiente de luz recorre cinco mapas buscando frutas de neón. Cada bocado la alarga y cada mapa la hace más veloz. Un movimiento en falso y se devora a sí misma.',
  'ARCADE', 'cover-snake', 'green', 1000000, 4
);
```

**`max_score`:** el juego no tiene final, porque los mapas se repiten, así que no hay un techo exacto. Completar un mapa del nivel L da como máximo 150 × L puntos (10 frutas × 10L + 1 bonus × 50L). Completar N mapas suma 75 × N × (N + 1): 1 000 000 equivale a unos 115 mapas, muy por encima de una partida real. Cualquier valor mayor es trampa y `submit_score` lo rechaza.

Las tablas, los permisos y `submit_score` ya existen (SPEC 06) y no se tocan.

### Convenciones

- `dt` en segundos, limitado a 0,05 por `use-game-loop`.
- Sin DOM, reloj ni `Math.random` en `engine/`; `sprites.ts` solo tiene datos.
- **Teclado:** `useKeyDown` (pulsaciones sueltas). Las flechas y WASD se acumulan en `turns` hasta el siguiente fotograma. P y Escape son del contenedor, y las flechas y Espacio no desplazan la página.
- **Sonido:** el `AudioContext` se crea con la primera tecla, se cierra al desmontar y no suena nada en pausa.
- **Colores:** la paleta neón (`palette.ts`): fondo `--bg`, rejilla cian tenue, muros magenta con brillo, serpiente verde con la cabeza clara y ojos según la dirección, y textos en cian, amarillo y blanco.
- **Textos del canvas:** "PUNTOS", "MAPA N · NOMBRE", "n/10", "VIDAS", "MAPA N" y "GAME OVER", escalados con `hud-scale`. No hay pantalla de título ni "ESPACIO PARA REINTENTAR".

---

## Estructura de archivos

```
features/games/data/catalog.ts                 # + snake ("SERPENTINA", ARCADE, cover-snake, green)
features/games/lib/*.test.ts                   # catálogo con 4 juegos; chips sin cambios (ARCADE ya existe)
features/arcade/playable.ts                    # + "snake"
app/juegos/snake/jugar/page.tsx                # <SnakePlayer game={getGameById("snake")} />
features/arcade/snake/
  engine/constants.ts
  engine/maps.ts (+ maps.test.ts)
  engine/state.ts (+ state.test.ts)
  engine/sprites.ts (+ sprites.test.ts)        # mapas de píxeles 12×12 y paleta
  engine/render.ts                             # atlas, rejilla, muros, frutas, serpiente, HUD, carteles
  components/SnakeCanvas.tsx                   # bucle, teclado, WebAudio, onStats/onGameOver
  components/SnakePlayer.tsx                   # ArcadePlayer arena 672×520 + SnakeCanvas
supabase/migrations/<ts>_add_snake_game.sql
docs/evidence/spec-09/                         # capturas revisadas + README
```

- `features/arcade/snake/` no importa nada de otro juego.

---

## Plan de implementación

1. **Catálogo y ruta.** Añadir la entrada `snake` y actualizar los tests del catálogo (test primero). Añadir el id a `PLAYABLE_GAME_IDS` y crear la ruta con un canvas vacío. Prueba manual: el build lista `/juegos/snake/jugar` y la Biblioteca muestra 4 juegos.
2. **Motor con test primero (`rng` con semilla).**
   - **Mapas:** los 5 mapas, con el borde completo y las salidas libres con 8 celdas por delante; el nivel 6 vuelve a ARENA.
   - **Velocidad:** 7 celdas/s en el nivel 1 y 16 a partir del nivel 10.
   - **Giros:** la marcha atrás se ignora, la cola guarda 2 giros como máximo y los aplica uno por paso.
   - **Avance:** a 7 celdas/s, 1 s mueve la cabeza 7 celdas y el largo no cambia.
   - **Fruta:** suma 10 × nivel y la serpiente crece 1 en el paso siguiente; la fruta nueva nunca aparece sobre un muro, la serpiente o la bonus.
   - **Bonus:** aparece al comer la 5.ª fruta, desaparece a los 5 s y suma 50 × nivel.
   - **Mapa:** la 10.ª fruta pasa al nivel 2 (PILARES) con largo 4, `fruitsInMap` 0, fase `levelup` y evento `"level"`.
   - **Choques:** con un muro y con el cuerpo restan una vida y pasan a `dying`; tras 1 s, la serpiente vuelve a la salida y se conservan los puntos y las frutas del mapa. Entrar en la celda que deja la cola no es un choque.
   - **Fin:** con 0 vidas, `gameover`, y después el estado no cambia.
   - **Inicio y estadísticas:** `intro` dura 1,5 s y `snakeStats` devuelve `{ score, lives, level }`.
   - **Sprites:** 7 frutas de 12×12 que solo usan letras de la paleta.
3. **Render y componentes.**
   - Crear `render.ts`, `SnakeCanvas.tsx` y `SnakePlayer.tsx`.
   - El canvas construye el atlas al montar, acumula los giros, reproduce `events` con WebAudio y notifica `onStats` solo cuando hay cambios y `onGameOver` una vez.
   - Prueba manual: se juega con flechas y WASD, suena, y los dos HUD coinciden.
4. **Leaderboard.** Migración `add_snake_game` con los textos copiados de `catalog.ts`. Aplicarla con `npx supabase db push --linked --yes`, ejecutar `npm run db:types` y revisar los asesores.
5. **Verificación con Playwright** del juego y del leaderboard, con cada captura revisada y versionada en `docs/evidence/spec-09/`. Borrar las filas de prueba de `scores` al terminar.
6. **Documentación.** Actualizar `CLAUDE.md` y el `README` (rutas, "Project state" y el cuarto juego).

---

## Criterios de aceptación

**Juego:**

- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` terminan sin errores, y el build lista `/juegos/snake/jugar`.
- [x] `features/arcade/snake/` no importa nada de otro juego.
- [x] Al entrar se ve "MAPA 1 · ARENA" y, 1,5 s después, la serpiente avanza sola hacia la derecha.
- [x] Las flechas y WASD giran; la marcha atrás no hace nada y la página no se desplaza.
- [x] Comer una fruta suma 10 × nivel, la serpiente crece, el contador sube ("n/10") y suena el pitido. El HUD del canvas coincide con el del Reproductor (puntuación, vidas y nivel).
- [x] La piña dorada aparece al comer la 5.ª fruta, parpadea antes de desaparecer a los 5 s y suma 50 × nivel.
- [x] La 10.ª fruta muestra "MAPA 2 · PILARES" y carga sus muros, y la serpiente va más rápido.
- [x] Chocar con un muro o con el cuerpo resta una vida y la serpiente parpadea y reaparece. Con la última vida se ve "GAME OVER" en el canvas y, 1,5 s después, el modal. FIN lo abre al instante.
- [x] PAUSA, P y Escape congelan el juego y el sonido. Al reanudar la serpiente no salta.
- [x] JUGAR DE NUEVO empieza en el mapa 1 con 3 vidas y puntuación 0.
- [x] Hay un solo bucle de animación, también al salir y volver; el canvas cabe a 1440×900 y 1280×720 y se lee a 390 px.
- [x] La consola no muestra errores y ningún recurso ni texto viene del Snake de Google ni de otra marca.

**Leaderboard:**

- [x] `games` tiene la fila `snake` con los textos de `catalog.ts`, `max_score` 1000000 y `sort_order` 4.
- [x] GUARDAR crea en `scores` una fila con `game_id` `snake`, el nombre y la puntuación exactos y `user_id` `null`. `submit_score` rechaza 1000010 y un segundo envío antes de 10 s.
- [x] El Salón muestra las pestañas ASTEROIDES, FALLING BLOCKS, BRICK BREAKER y SERPENTINA, en ese orden. El Detalle muestra el top 10 y MEJOR GLOBAL igual al #01, y la tarjeta de la Biblioteca muestra el mismo valor.
- [x] Sin puntuaciones, el Salón y el Detalle muestran "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA".
- [x] Los asesores de Supabase no muestran avisos nuevos, aparte del de `submit_score`, que es intencionado.

---

## Decisiones

- **Sí:** id `snake` con el título "SERPENTINA", el nombre del juego simulado del prototipo. No es una marca y encaja con la UI en español.
- **Sí:** los textos corto, la categoría ARCADE, la portada `cover-snake` y el color verde del prototipo. Cambia la descripción larga: decía "núcleos magenta" y ahora habla de frutas y mapas.
- **No:** el arte del `sprites.js` recibido. Es un recorte del Snake de Google (arte de terceros con derechos) y su atlas además no coincidía con la imagen: el recorte llamado `banana` era una fruta roja. Las frutas son pixel art original en la paleta neón, con el mismo formato `{ x, y, w, h }`.
- **Sí:** las frutas como mapas de píxeles en código, sin PNG. Se revisan en los diffs, no necesitan carga asíncrona y se escalan sin pérdida.
- **Sí:** mapas por progreso (10 frutas por mapa, 5 mapas que se repiten más rápido), 3 vidas y puntos normal + bonus, según lo elegido en la definición.
- **Sí:** bonus "cada 5 frutas" contadas en toda la partida. Como el mapa cambia en la 10.ª, en la práctica sale una por mapa (en la 5.ª, la 15.ª, la 25.ª…).
- **Sí:** `max_score` 1000000. El juego no tiene un techo exacto; se elige uno generoso (unos 115 mapas) que rechaza valores absurdos.
- **Sí:** sonidos con WebAudio, sin archivos y sin control de volumen.
- **Sí:** el motor devuelve `events` y el canvas reproduce los sonidos. El motor sigue siendo puro y testeable.
- **No:** pantalla de título, pausa propia ni reintento con Espacio. Los controla el contenedor; en su lugar, el cartel `intro` da 1,5 s para prepararse.
- **Sí:** `arena` de 672×520, el tamaño lógico del prototipo.
- **Sí:** juego y leaderboard en un solo spec, como exige la skill `arcade-game-spec`.

---

## Riesgos

| Riesgo                                                                                              | Mitigación                                                                                                                                     |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| A velocidad alta, dos giros rápidos en el mismo fotograma se pierden o provocan una marcha atrás. | Cola de 2 giros, validada contra el último giro encolado; hay tests de giros rápidos.                                                         |
| Con `dt` grande (pestaña en segundo plano) la serpiente salta varias celdas y atraviesa un muro. | `dt` limitado a 0,05 s y avance celda a celda dentro del bucle `while`, comprobando el choque en cada paso.                                 |
| Una serpiente muy larga no deja celdas libres para la fruta.                                        | Con 10 frutas por mapa el largo máximo es 4 + 11 = 15 de 468+ celdas libres; si `free` estuviera vacío, el motor no coloca la fruta (test). |
| El navegador bloquea WebAudio antes de la primera interacción.                                     | El `AudioContext` se crea en la primera tecla; antes no hay sonidos que perder.                                                               |
| `max_score` arbitrario deja pasar puntuaciones infladas por debajo del techo.                     | Es la misma defensa que en los otros juegos; el antitrampas fuerte queda fuera de alcance.                                                      |
| `image-rendering` o el escalado del canvas difuminan los sprites de 12 px.                        | `imageSmoothingEnabled = false` al dibujar las frutas; un criterio revisa las capturas a 1440 y 390 px.                                       |

---

## Notas de implementación

Implementado y verificado el 2026-11-22 con Playwright contra `next start` y Supabase: 23 de 23 comprobaciones. Las evidencias revisadas están en [`docs/evidence/spec-09/`](../docs/evidence/spec-09/README.md).

- **Desviaciones:**
  - `wallsOf`, `mapFor` y `cellKey` viven en `engine/maps.ts`, no en `state.ts`. `state.ts` exporta además `speedFor` y `randomFreeCell` para los tests.
  - `fruit` puede ser `null` si no quedara ninguna celda libre (riesgo de la tabla); en la práctica nunca ocurre.
  - El HUD del canvas se coloca midiendo los textos: puntos a la izquierda, vidas a la derecha, frutas antes de las vidas y el mapa en el hueco. Cuando no cabe, el mapa se acorta a "MAPA N" (a 390 px). Con posiciones fijas se solapaba en móvil.
  - En pausa el canvas solo oscurece el tablero, sin texto propio: "EN PAUSA" lo muestra la CRT. El contenedor también pausa durante la espera del fin, así que en `gameover` no se oscurece y "GAME OVER" se ve brillante.
  - El canvas crea su `rng` con semilla en cada partida (`createRng(Date.now() + runId)`), como Asteroides, y pinta el atlas de frutas en el primer fotograma.
  - `npx supabase migration new` espera el SQL por la entrada estándar cuando no hay TTY y deja el archivo vacío; la migración se escribió directamente en el archivo creado.
- **Verificado:**
  - el cartel "MAPA 1 · ARENA" congela el tablero 1,5 s y después la serpiente avanza sola
  - las flechas y WASD giran sin desplazar la página; P y Escape pausan y reanudan
  - un piloto automático (lee el canvas por celdas y busca el camino a la fruta): la primera fruta suma 10, la piña dorada aparece y suma 50, y la 10.ª fruta carga "MAPA 2 · PILARES"
  - un choque resta una vida, la última muestra "GAME OVER" y después el modal con 150
  - GUARDAR crea la fila exacta; `submit_score` rechaza un segundo envío antes de 10 s y 1000010
  - JUGAR DE NUEVO vuelve a 0 / 3 vidas / nivel 01, y FIN abre el modal al instante
  - un solo bucle (60 rAF/s) también al salir y volver; el canvas cabe a 1440×900 y 1280×720 y se lee a 390 px; sin errores de consola
  - el Salón tiene 4 pestañas en orden; el Detalle, la Biblioteca y MEJOR GLOBAL muestran 150.
- **Tabla vacía:** tras borrar las filas de prueba, el Salón y el Detalle de SERPENTINA muestran "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA" y MEJOR GLOBAL "—".
- **Cubierto por los tests del motor:** el cambio a los mapas 3, 4 y 5 y el choque con el propio cuerpo. El cambio a mapas posteriores al 2 y el choque con el propio cuerpo están cubiertos por los tests del motor.
- **Hallazgo previo, no corregido:** la portada `cover-snake` se ve como un degradado vacío. Su `::after` pone posiciones y tamaños dentro de `background-image`, lo que invalida la declaración. Viene así del CSS del prototipo, que se porta sin cambios.
- **Datos de prueba:** las filas `QA_SNAKE` (0, 120 y 150) se borraron al terminar.

---

## Lo que **no** entra en este spec

- Pantalla de título, pausa y reintento propios del prototipo, y su acceso de depuración.
- Elegir mapa, mapas nuevos, obstáculos móviles, power-ups o varias frutas a la vez.
- Silencio, volumen y controles táctiles.
- Antitrampas fuerte.

Cada uno de estos puntos, si llega, irá en su propio spec.
