# SPEC 05 — Juego jugable: Asteroides

> **Estado:** Aprobado
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-20
> **Objetivo:** Portar a TypeScript el juego de `references/started-games/02-asteroids/` como el juego `asteroids` del catálogo (antes `rocas`), aislado en `features/arcade/asteroids/` y servido por su propia ruta `/juegos/asteroids/jugar`, con su canvas, sus controles y su HUD interno, notificando a React la puntuación, las vidas, el nivel y el fin de la partida.

---

## Por qué existe este spec

SPEC 01 dejó fuera "cualquier juego real": el Reproductor muestra una arena CSS falsa y suma puntos con un temporizador.
`references/started-games/` trae tres juegos en JavaScript plano y canvas 2D. Cada uno tendrá su propio spec. Este es el primero: Asteroides, el port de `02-asteroids`. El catálogo ya tiene su equivalente como `rocas` (título "ROCAS", SHOOTER, "Pulveriza asteroides…"). Este spec lo renombra: `id` `asteroids` (código, archivos y URL en inglés) y título visible "ASTEROIDES" (la interfaz sigue en español).

Como es el primer juego real, este spec también monta la base común que reutilizarán Caída y Bloque Buster: el contrato entre el canvas y React, el contenedor `ArcadePlayer` y las utilidades de bucle, teclado y paleta.

El original no se puede importar tal cual en React:

- Arranca con código de nivel superior (`initGame(); requestAnimationFrame(loop)`) y busca `#canvas` por id.
- Sus listeners de `window` nunca se quitan y su bucle `requestAnimationFrame` no se cancela.
- Guarda todo en variables globales mutables y usa `Math.random` directamente.

Asteroides tiene su propia ruta en lugar de decidirse con un condicional dentro de la ruta genérica `/juegos/[id]/jugar`. Así queda aislado: su página solo importa su código, y añadir un juego no toca la ruta genérica.

---

## Alcance

**Entra:**

- **Base común** (`features/arcade/`):
  - contrato canvas ↔ React
  - contenedor `ArcadePlayer`
  - bucle con pausa
  - teclado
  - paleta
  - generador aleatorio con semilla
  - lista `PLAYABLE_GAME_IDS`
- **Ruta propia** `app/juegos/asteroids/jugar/page.tsx`.
- **Catálogo:** la entrada `rocas` pasa a `id: "asteroids"` y `title: "ASTEROIDES"`. Sus textos, categoría, color, cifras y portada (`cover-rocas`, clase literal del prototipo en `globals.css`) no cambian. Biblioteca, Detalle, Home y Salón usan la nueva URL `/juegos/asteroids` sin cambios en su código, porque la construyen con `game.id`.
- **La ruta genérica** `/juegos/[id]/jugar` deja de generar `asteroids` y sigue sirviendo, sin cambios de comportamiento, los demás juegos simulados.
- **Asteroides completo**:
  - nave con rotación, empuje, inercia y salida por el borde contrario
  - disparo con espera de 0,2 s
  - asteroides de 3 tamaños que se dividen
  - power-up de disparo triple
  - partículas de explosión
  - 3 vidas con reaparición e invencibilidad de 3 s
  - niveles: 4 asteroides al empezar y `3 + nivel` en cada nivel nuevo.
- **Dos HUD a la vez:** el canvas dibuja su HUD original ("SCORE", "NIVEL n", iconos de vida y "3x  Ns" del power-up) y notifica a React, y el HUD del Reproductor muestra los mismos valores.
- **El contenedor controla** la pausa (botón, P y Escape), FIN, el reinicio y el modal de guardar puntuación.
- **Colores** de la paleta neón de la app en el canvas.
- **Tests** de la lógica pura de Asteroides, del reducer del contenedor y del generador aleatorio.
- **`references/started-games/` versionada** limpia, como referencia de los tres ports.
- **Documentación** en `CLAUDE.md`.

**Fuera de alcance (para specs futuros):**

- Caída y Bloque Buster: cada uno en su propio spec, sobre esta base.
- Controles táctiles o el mando virtual (bloque GAMEPAD de `globals.css`). En móvil el canvas se ve, pero no se puede controlar.
- Sonido: el original no tiene.
- Los otros juegos simulados del catálogo (`serpentina`, `gloton`, `invasores`, `ranaria`, `duelo-pixel`, y por ahora `caida` y `bloque-buster`).
- Cambiar otros `id`, URLs, portadas, fichas o textos del catálogo. Renombrar la clase `cover-rocas` de `globals.css`.
- Redirigir las antiguas URLs `/juegos/rocas` y `/juegos/rocas/jugar`, o migrar las puntuaciones ya guardadas con `game: "rocas"`.
- Récords por juego, mostrar `av_scores` en el Salón o en el Detalle (siguen con `seededScores`) y guardar puntuaciones en Supabase.
- Tests de componentes o end-to-end.

---

## Modelo de datos

### Contrato canvas ↔ React

En `features/arcade/model/arcade-game.ts`:

```ts
export type GameStats = {
  score: number;
  lives: number | null;   // null: el juego no tiene vidas
  level: number;
};

// Props que el contenedor (ArcadePlayer) pasa al canvas de cada juego
export type ArcadeCanvasProps = {
  paused: boolean;                          // el contenedor manda; el canvas congela bucle y entrada
  runId: number;                            // cambia en "JUGAR DE NUEVO": el canvas empieza una partida nueva
  onStats: (stats: GameStats) => void;      // el canvas notifica a React cuando score, lives o level cambian
  onGameOver: (stats: GameStats) => void;   // el canvas notifica a React el fin, una sola vez por partida
};

export type ArcadeCanvas = ComponentType<ArcadeCanvasProps>;
```

Reglas del contrato:

- **La pausa la decide el contenedor.** El botón PAUSA/REANUDAR del HUD y las teclas P y Escape cambian `paused` en `ArcadePlayer`. El canvas no escucha P ni Escape y no cambia la pausa por su cuenta.
- **El canvas pausa de verdad.** Con `paused: true`, deja de avanzar el estado y de leer la entrada, y sigue mostrando el último fotograma. Al reanudar, el primer `dt` no incluye el tiempo en pausa. El original de asteroides no tiene pantalla de pausa: solo se ve "EN PAUSA" de la CRT.
- **El canvas conserva su HUD y sus controles.** Dibuja su HUD original y responde a sus teclas originales (flechas y espacio). Lo único que se quita es el reinicio con espacio tras el "GAME OVER".
- **El canvas notifica a React.** Llama a `onStats` solo cuando algún valor cambia, nunca en cada fotograma. Llama a `onGameOver` una vez al perder la última vida y después deja de avanzar. Su pantalla "GAME OVER" queda dibujada detrás del modal.
- **Los dos HUD muestran lo mismo.** El canvas dibuja su HUD y notifica `onStats` desde el mismo `GameStats` (`asteroidsStats(state)`).
- **FIN lo decide el contenedor.** Al pulsar FIN, `ArcadePlayer` abre el modal con las últimas estadísticas notificadas y pasa `paused: true` al canvas.
- **El reinicio lo decide el contenedor.** "JUGAR DE NUEVO" incrementa `runId`. El canvas crea un estado nuevo y notifica los valores iniciales.

### Contenedor

En `features/arcade/components/ArcadePlayer.tsx` (`"use client"`):

```ts
type ArcadePlayerProps = { game: Game; Canvas: ArcadeCanvas };
```

Estado del contenedor en `features/arcade/lib/play-state.ts`:

```ts
export type ArcadePlayState = {
  stats: GameStats;          // últimas recibidas del canvas
  paused: boolean;
  over: boolean;
  saved: boolean;
  runId: number;
};
export type ArcadePlayAction =
  | { type: "stats"; stats: GameStats }
  | { type: "togglePause" }
  | { type: "gameOver"; stats: GameStats }   // notificado por el canvas
  | { type: "end" }                           // botón FIN
  | { type: "saved" }
  | { type: "restart" };                      // incrementa runId
```

La ruta solo compone el contenedor del juego:

```ts
// features/arcade/asteroids/components/AsteroidsPlayer.tsx
export function AsteroidsPlayer({ game }: { game: Game }) {
  return <ArcadePlayer game={game} Canvas={AsteroidsCanvas} />;
}

// app/juegos/asteroids/jugar/page.tsx
export default function Page() {
  return <AsteroidsPlayer game={getGameById("asteroids")} />;
}
```

### Lógica pura de Asteroides

En `features/arcade/asteroids/engine/`:

```ts
export type AsteroidsInput = { left: boolean; right: boolean; thrust: boolean; fire: boolean }; // fire: recién pulsado
export type AsteroidsPhase = "playing" | "dead" | "gameover";

export function createAsteroidsState(rng: () => number): AsteroidsState;
export function stepAsteroids(state: AsteroidsState, input: AsteroidsInput, dt: number, rng: () => number): AsteroidsState;
export function asteroidsStats(state: AsteroidsState): GameStats;
```

Constantes del original, copiadas en `engine/constants.ts`:

```ts
export const W = 800, H = 600;
export const RADII = [0, 16, 30, 50];     // por tamaño 1, 2, 3
export const SPEEDS = [0, 85, 55, 32];
export const POINTS = [0, 100, 50, 20];
export const SHIP = { radius: 12, rot: 3.5, thrust: 260, drag: 0.987, nose: 21, cooldown: 0.2, invincible: 3 };
export const BULLET = { speed: 520, ttl: 1.1 };
export const POWERUP = { dropChance: 0.15, guaranteedAfterKills: 5, duration: 5, ttl: 12, tripleSpread: 0.18 };
export const RESPAWN_DELAY = 2;            // s en fase "dead"
export const SAFE_SPAWN_DIST = 130;
```

### Paleta

En `features/arcade/lib/palette.ts`, leída al montar con `getComputedStyle` desde los tokens de `:root`:

```ts
export type ArcadePalette = { bg: string; ink: string; inkDim: string; cyan: string; magenta: string; yellow: string; green: string };
```

Convenciones:

- `dt` en segundos, limitado a 0,05 s como en el original.
- La lógica de `engine/` no toca el DOM, `window`, el reloj ni `Math.random`: recibe `rng` y `dt`.
- `PLAYABLE_GAME_IDS = ["asteroids"] as const` vive en `features/arcade/playable.ts`. Solo lo usa `gameStaticParams` para excluir esos juegos de la ruta genérica. No es un condicional de renderizado. Cada spec de juego añade su `id`.
- Las puntuaciones se guardan como hoy: `appendScore({ game: "asteroids", score, name })` en `localStorage["av_scores"]`. No se añaden claves nuevas.
- El canvas mide 800×600 lógicos y se escala para caber en `.crt-screen` sin deformarse.
- Textos del canvas: los del original ("SCORE", "NIVEL n", "3x", "GAME OVER", "PUNTAJE: X"), con la fuente `--pixel` o `--mono`. El subtítulo pasa a "PUNTAJE: X", sin "ESPACIO PARA REINICIAR". Los textos visibles están en español: el título es "ASTEROIDES" y ningún texto visible dice "Asteroids".

---

## Estructura de archivos

```
app/juegos/
  [id]/jugar/page.tsx             # sin cambios de código; ya no genera asteroids
  asteroids/jugar/page.tsx            # <AsteroidsPlayer game={...} />
features/games/lib/game-params.ts # gameStaticParams de jugar excluye PLAYABLE_GAME_IDS; + getGameById
features/games/data/catalog.ts     # rocas → id "asteroids", title "ASTEROIDES"
features/games/lib/filter-games.test.ts, features/player/lib/score-storage.test.ts  # rocas → asteroids
features/arcade/
  model/arcade-game.ts            # GameStats, ArcadeCanvasProps, ArcadeCanvas
  playable.ts                     # PLAYABLE_GAME_IDS
  components/ArcadePlayer.tsx     # estado de la partida, HUD, CRT, modal, pausa y FIN
  lib/play-state.ts               # reducer de ArcadePlayer (+ test)
  lib/palette.ts                  # readArcadePalette()
  lib/use-game-loop.ts            # rAF con pausa, dt limitado y cancelación al desmontar
  lib/use-keys.ts                 # teclas pulsadas y recién pulsadas; ignora inputs; preventDefault de flechas/espacio
  lib/rng.ts                      # generador con semilla (+ test)
  asteroids/
    engine/constants.ts           # constantes del original
    engine/state.ts               # nave, balas, asteroides, power-ups, partículas, fases (+ test)
    engine/render.ts              # drawAsteroids(ctx, state, palette): partida + HUD + GAME OVER
    components/AsteroidsCanvas.tsx    # canvas + bucle + teclado; implementa ArcadeCanvasProps
    components/AsteroidsPlayer.tsx    # ArcadePlayer + AsteroidsCanvas
features/player/components/
  CrtScreen.tsx                   # + children: si los hay, sustituyen a la arena falsa
  Hud.tsx                         # lives: number | null ("—" si es null), para los juegos sin vidas
  PlayerScreen.tsx                # sin cambios: sigue siendo el reproductor simulado
references/started-games/         # versionada sin .DS_Store, .github, .agents ni .claude
```

- `features/arcade/` es una funcionalidad nueva: una carpeta por juego, nombrada con su `id` del catálogo. Un juego no importa nada de otro juego.
- No hay registro de juegos ni `next/dynamic`: la ruta importa solo su juego, y Next separa el código por ruta.

---

## Plan de implementación

1. **Referencias versionadas.** Añadir a `.gitignore` las reglas `references/started-games/**/.DS_Store`, `.github/`, `.agents/`, `.claude/` y `.Claude/` dentro de esa carpeta, y versionar el resto. Prueba manual: `git status` no muestra esos archivos.
2. **Contrato y utilidades.** Crear `model/arcade-game.ts`, `playable.ts`, `lib/rng.ts` (test primero: misma semilla, misma secuencia, valores en `[0, 1)`), `lib/palette.ts`, `lib/use-game-loop.ts` y `lib/use-keys.ts`. Prueba manual: `npm run build` termina.
3. **Contenedor `ArcadePlayer`.**
   - Crear `lib/play-state.ts`. Test primero:
     - `stats` actualiza puntuación, vidas y nivel
     - `togglePause` alterna la pausa y no hace nada si la partida terminó
     - `gameOver` y `end` marcan el fin una sola vez, y el segundo se ignora
     - `restart` vuelve al estado inicial e incrementa `runId`.
   - Crear `ArcadePlayer.tsx`. Reutiliza `Hud`, `CrtScreen` (con `children`) y `GameOverModal`, escucha P y Escape para la pausa mientras no hay modal, y reinicia antes de navegar, como `PlayerScreen` (Cache Components).
   - Cambiar `CrtScreen` para aceptar `children` y `Hud` para aceptar `lives: null`.
   - Prueba manual: `PlayerScreen` y los juegos simulados no cambian.
4. **Catálogo y ruta propia.** En `catalog.ts`, cambiar la entrada `rocas` a `id: "asteroids"` y `title: "ASTEROIDES"`, y actualizar `filter-games.test.ts` (`"ROCA"` pasa a `"ASTER"`) y `score-storage.test.ts`. Después, añadir `getGameById(id)` en `game-params.ts` y hacer que el `gameStaticParams` de la ruta `jugar` excluya `PLAYABLE_GAME_IDS`. Leer antes la doc de rutas dinámicas de `node_modules/next/dist/docs/`. Crear `app/juegos/asteroids/jugar/page.tsx`, que de momento renderiza `ArcadePlayer` con un canvas vacío que nunca termina. Prueba manual:
   - `npm run build` lista `/juegos/asteroids/jugar` como ruta propia y `[id]/jugar` sin `asteroids`
   - `/juegos/serpentina/jugar` sigue simulado.
5. **Motor de Asteroides con test.** Portar `02-asteroids/game.js` a `asteroids/engine/`. Test primero, con `rng` fijo:
   - la nave gira, acelera con inercia y aparece por el lado contrario al salir de la pantalla
   - disparar dos veces en menos de 0,2 s crea una sola bala, y la bala desaparece a los 1,1 s
   - una bala que toca un asteroide de tamaño 3 lo divide en dos de tamaño 2 y suma 20; uno de tamaño 1 desaparece y suma 100
   - tras 5 destrucciones sin power-up aparece uno; recogerlo da disparo triple durante 5 s
   - chocar con un asteroide sin invencibilidad resta una vida y pasa a `dead`; a los 2 s la nave reaparece en el centro con 3 s de invencibilidad
   - durante la invencibilidad, chocar no resta vidas
   - sin asteroides se sube de nivel y aparecen `3 + nivel`, a más de 130 px del centro
   - con 0 vidas, la fase es `gameover`, y `stepAsteroids` ya no cambia la puntuación
   - `asteroidsStats` devuelve `{ score, lives, level }` del estado.
6. **Asteroides jugable.** Crear `render.ts` con la paleta neón (partida, HUD original y "GAME OVER" / "PUNTAJE: X"), `AsteroidsCanvas.tsx` y `AsteroidsPlayer.tsx`, y conectar la página. Prueba manual:
   - `/juegos/asteroids/jugar` se juega con flechas y espacio
   - los dos HUD muestran los mismos valores
   - perder abre el modal.
7. **Documentación.** Actualizar `CLAUDE.md`:
   - la funcionalidad `arcade` y el contrato canvas ↔ React
   - la ruta por juego y por qué la ruta genérica no lleva condicionales
   - cómo añadir un juego: carpeta, `PLAYABLE_GAME_IDS` y ruta
   - la referencia `references/started-games/`
   - en "Project state", que Asteroides ya es un juego real.

---

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` terminan sin errores.
- [ ] `npm run build` lista `/juegos/asteroids/jugar` como ruta propia, y `/juegos/[id]/jugar` ya no genera `asteroids`.
- [ ] `app/juegos/[id]/jugar/page.tsx` y `PlayerScreen.tsx` no contienen ninguna referencia a `asteroids`, `features/arcade` ni `PLAYABLE_GAME_IDS`.
- [ ] `/juegos/asteroids/jugar` muestra el juego real en la pantalla CRT y no la arena falsa.
- [ ] Los demás juegos del catálogo siguen mostrando la arena falsa y el contador simulado, igual que antes.
- [ ] Se ven a la vez el HUD interno del canvas ("SCORE", "NIVEL n", vidas) y el HUD del Reproductor, y muestran en todo momento la misma puntuación, nivel y vidas.
- [ ] Flechas izquierda y derecha giran la nave, flecha arriba la impulsa y espacio dispara, como en el original.
- [ ] Recoger el power-up muestra "3x  Ns" en el HUD del canvas y dispara tres balas durante 5 s.
- [ ] PAUSA, P y Escape, gestionados por el contenedor, congelan el juego y muestran "EN PAUSA"; REANUDAR lo continúa desde el mismo punto sin salto de los objetos.
- [ ] Al perder la última vida, el canvas dibuja "GAME OVER" / "PUNTAJE: X" y el modal "FIN DEL JUEGO" se abre solo con esa puntuación.
- [ ] Tras "GAME OVER", pulsar espacio no reinicia la partida.
- [ ] FIN abre el modal con la puntuación del momento y el juego queda congelado detrás.
- [ ] GUARDAR PUNTUACIÓN añade `{ game: "asteroids", score, name, at }` a `localStorage["av_scores"]` con la puntuación real.
- [ ] JUGAR DE NUEVO empieza una partida nueva: puntuación 0, nivel 1, 3 vidas y 4 asteroides.
- [ ] Escribir iniciales con espacios y flechas en el modal no mueve la nave ni desplaza la página.
- [ ] Durante la partida, las flechas y el espacio no desplazan la página.
- [ ] Al salir con SALIR y volver a Asteroides por navegación de cliente, la partida empieza de cero y no quedan dos bucles corriendo.
- [ ] El título visible del juego es "ASTEROIDES" en Biblioteca, Detalle, Home, Salón y la CRT, y ningún texto visible dice "Asteroids".
- [ ] Biblioteca, Detalle, Home y Salón enlazan a `/juegos/asteroids`; `/juegos/rocas` responde 404.
- [ ] Ningún archivo de `app/`, `features/` ni `shared/` contiene el `id` `"rocas"`; solo queda la clase `cover-rocas` de `globals.css` y del catálogo.
- [ ] El canvas se escala dentro de la pantalla CRT sin deformarse a 1440 px y a 390 px.
- [ ] La consola del navegador no muestra errores en `/juegos/asteroids/jugar`.
- [ ] `references/started-games/` está versionada sin `.DS_Store`, `.github`, `.agents` ni `.claude`.

---

## Decisiones

- **Sí:** un spec por juego, empezando por Asteroides. El primero monta la base común; Caída y Bloque Buster la reutilizan en sus propios specs.
- **No:** un spec con los tres juegos. Más difícil de revisar y aprobar por partes.
- **Sí:** Asteroides primero. Es el más simple: sin recursos externos y todo en un canvas.
- **Sí:** una ruta estática por juego (`app/juegos/asteroids/jugar/`). El juego queda aislado y la ruta genérica no decide nada.
- **No:** un condicional o un registro (`getArcadeGame(id)`) en `/juegos/[id]/jugar`. Acopla todos los juegos a la ruta genérica y hace que esta cambie con cada juego nuevo.
- **Sí:** renombrar el juego en todo: `id` `asteroids` y título "ASTEROIDES". Nombres de código, archivos, carpetas y URL en inglés, como el resto del proyecto; la interfaz visible en español.
- **No:** mantener `rocas`. El juego es el port de asteroides y el nombre debe decirlo.
- **No:** renombrar `cover-rocas`. `globals.css` es una copia literal del prototipo.
- **Sí:** aceptar que cambien las filas simuladas de Detalle y Salón para este juego. `detailSeed` y `hallSeed` usan la longitud del `id`; siguen siendo deterministas, solo son otras.
- **No:** redirigir `/juegos/rocas`. La app no está publicada.
- **Sí:** excluir los juegos jugables de `gameStaticParams` de la ruta genérica. Evita generar dos veces la misma URL.
- **Sí:** dos HUD a la vez. El canvas conserva su HUD original y notifica a React, y el HUD del Reproductor muestra los mismos valores.
- **No:** quitar el HUD interno del juego. Es parte del juego y se mantiene como en el original.
- **Sí:** el contenedor (`ArcadePlayer`) controla la pausa, FIN, el reinicio y el modal, y el canvas los obedece por props. Hay una sola fuente de verdad para el estado de la partida.
- **Sí:** el canvas notifica a React con `onStats` y `onGameOver`. React no lee el estado interno del juego.
- **No:** `onStats` en cada fotograma. Provocaría 60 renders por segundo del HUD.
- **Sí:** un `ArcadePlayer` nuevo en lugar de modificar `PlayerScreen`. El reproductor simulado no cambia y sigue sirviendo a los demás juegos.
- **Sí:** mantener el power-up de disparo triple, las partículas y la invencibilidad. Forman parte del juego original.
- **No:** el reinicio con espacio tras "GAME OVER". El reinicio lo controla el contenedor con "JUGAR DE NUEVO".
- **Sí:** `features/arcade/asteroids/`. Sigue la organización por funcionalidad y deja `features/games/` como catálogo.
- **Sí:** reescribir en TypeScript separando `engine/` (puro, con tests) y dibujo. Cumple TypeScript estricto y la regla de testear solo lógica pura.
- **No:** envolver el JavaScript original. Sin tipos ni tests y con listeners y globals que React no limpia.
- **Sí:** `rng` inyectado. Hace los tests deterministas.
- **Sí:** paleta neón de la app en el canvas, leída de los tokens CSS.
- **No:** controles táctiles. El bloque GAMEPAD merece su propio spec.
- **Sí:** versionar `references/started-games/` limpia, como `references/templates/`. Permite comparar los ports con los originales.
- **Sí:** el spec base de los tres juegos (`specs/_base-juegos-jugables.md`) queda solo en local, ignorado por Git, como guía para los specs siguientes.

---

## Riesgos

| Riesgo                                                                                                  | Mitigación                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Cambiar el `id` deja enlaces o tests apuntando a `rocas`.                                           | Buscar `"rocas"` en `app/`, `features/` y `shared/` antes de cerrar el paso 4; un criterio lo exige. Los tests de filtrado y de puntuaciones se actualizan en el mismo paso. |
| Cambian las filas simuladas de Detalle y Salón de este juego.                                          | Aceptado (ver Decisiones): siguen siendo deterministas.                                                                                                                              |
| Las puntuaciones guardadas antes con `game: "rocas"` quedan huérfanas en `av_scores`.              | Nada las muestra todavía; la migración queda fuera de alcance.                                                                                                                     |
| La ruta estática y `[id]/jugar` generan la misma URL y el build falla o sirve la página equivocada. | `gameStaticParams` de `jugar` excluye `PLAYABLE_GAME_IDS`; un criterio revisa la lista de rutas del build. Leer antes la doc de rutas dinámicas.                              |
| Cache Components mantiene la ruta oculta y el bucle o los listeners siguen corriendo.                   | Los efectos se desmontan al ocultarse la ruta; `use-game-loop` cancela el rAF y `use-keys` quita los listeners en la limpieza. Hay un criterio de salir y volver.                |
| Al reanudar tras una pausa larga, el primer `dt` hace saltar los objetos.                             | `use-game-loop` reinicia la marca de tiempo al reanudar y limita `dt` a 0,05 s.                                                                                                  |
| `onGameOver` y FIN llegan a la vez y el modal guarda una puntuación distinta.                        | El reducer ignora `gameOver` y `end` si la partida ya terminó; está cubierto por el test de `play-state`.                                                                    |
| `preventDefault` del teclado rompe la escritura de iniciales en el modal.                             | `use-keys` ignora eventos cuyo destino es `input` o `textarea` y se desactiva con `paused` o con el modal abierto.                                                           |
| El HUD del canvas y el del Reproductor muestran valores distintos.                                      | El canvas dibuja y notifica desde el mismo `asteroidsStats(state)`; un criterio lo comprueba.                                                                                      |
| El disparo se repite sin soltar espacio (el original dispara solo al pulsar).                           | `use-keys` distingue teclas pulsadas de recién pulsadas; un test comprueba la espera de 0,2 s.                                                                                    |
| El port cambia la jugabilidad respecto al original.                                                     | Mismas constantes que el original, en `constants.ts` y cubiertas por los tests; `references/started-games/` queda versionada para comparar.                                      |
| Los colores de `getComputedStyle` llegan vacíos en el primer render.                                 | La paleta se lee en un efecto, después de montar, con valores por defecto si un token falta.                                                                                        |

---

## Lo que **no** entra en este spec

- Caída y Bloque Buster: sus propios specs.
- Controles táctiles y mando virtual.
- Sonido.
- Los demás juegos simulados del catálogo.
- Otros cambios en el catálogo, redirecciones desde `/juegos/rocas` y migración de puntuaciones guardadas.
- Récords por juego, `av_scores` en el Salón o el Detalle, y puntuaciones en Supabase.

Cada uno de estos puntos, si llega, irá en su propio spec.
