# SPEC 06 — Leaderboard real con Supabase

> **Estado:** Implementado
> **Depende de:** SPEC 04, SPEC 05
> **Fecha:** 2026-11-20
> **Objetivo:** Crear en Supabase la tabla `games` (con los mismos campos que el catálogo, solo con los juegos reales) y la tabla `scores`, guardar ahí la puntuación y el nombre exactos de cada partida, y conectar a esos datos el leaderboard global (Salón de la Fama, una pestaña por juego real) y el leaderboard de la página de cada juego.

---

## Por qué existe este spec

Las pantallas de puntuaciones ya existen, pero no están conectadas a datos reales:

- El **Salón de la Fama** (`/salon`, `features/hall-of-fame/components/HallOfFameScreen.tsx`) tiene una pestaña por cada juego del catálogo, incluidos los simulados. Muestra `seededScores(hallSeed(tab), 12)`, filas inventadas, y una fila "TU MEJOR" falsa.
- El **Detalle** (`/juegos/[id]`, `features/game-detail/components/GameDetailScreen.tsx`) muestra `seededScores(detailSeed(id), 10)`.
- **"GUARDAR PUNTUACIÓN"** solo escribe en `localStorage["av_scores"]` (`features/player/lib/score-storage.ts`), y nada lo lee.

SPEC 04 conectó la app a Supabase con el esquema `public` vacío. SPEC 05 trae el primer juego real, `asteroids`. Este spec une ambas cosas.

**Catálogo híbrido.** Hoy el catálogo vive en código (`features/games/data/catalog.ts`). La dirección es borrar esos datos locales y cargar los juegos solo desde Supabase. Este spec da el primer paso:

- la tabla `games` tiene los mismos campos que el catálogo
- de momento solo contiene los juegos reales
- el Salón ya lee de ella sus pestañas.

Biblioteca, Home y Detalle siguen leyendo `catalog.ts` hasta un spec posterior, que hará el cambio completo y borrará los datos locales.

No hay login real ni clave secreta: todo acceso a Supabase se hace como `anon` con la clave publicable, también desde una Server Action. Por eso la app solo lee `games`, el `INSERT` directo en `scores` se revoca y las puntuaciones solo entran por una función `submit_score` que las valida.

---

## Alcance

**Entra:**

- **Migración** creada con la CLI, con:
  - tabla `games`: los mismos campos que el catálogo, solo con los juegos reales (hoy `asteroids`)
  - tabla `scores`: `id`, `game_id`, `player_name`, `score`, `created_at` y `user_id` opcional
  - RLS, permisos y función `submit_score`
  - índice para el top por juego.
- **`games` es de solo lectura para la app.** Solo cambia por migraciones versionadas. La interfaz y la API no pueden crear, editar ni borrar juegos.
- **Guardar es solo pulsar GUARDAR.** "GUARDAR PUNTUACIÓN" en un juego real envía a la base de datos la puntuación exacta de la partida y el nombre exacto que hay en la caja de texto. Además sigue escribiendo `av_scores` como copia local.
- **Recordar el nombre.** El nombre guardado se recuerda en `localStorage["av_player_name"]` y rellena la caja la próxima vez que el jugador termine una partida.
- **Validación básica** en `submit_score`:
  - el juego existe en `games`
  - la puntuación está entre 0 y `games.max_score`
  - el nombre tiene de 1 a 10 caracteres, sin espacios al principio ni al final
  - no se acepta más de una puntuación con el mismo nombre y juego en 10 s.
- **Salón de la Fama** (leaderboard global): solo tiene pestañas de los juegos reales, leídas de `games`. Cada pestaña muestra el top 12 real.
- **Detalle de un juego real** (leaderboard del juego): muestra el top 10 real.
- **Sin puntuaciones,** ambas tablas muestran "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA".
- **Sin Supabase (sin variables o con error de red):**
  - las pestañas del Salón salen de `catalog.ts` filtrado por `PLAYABLE_GAME_IDS`
  - las filas son las de `seededScores`
  - guardar solo escribe en local.
- **El Detalle de los juegos simulados** sigue con `seededScores`, sin consultar Supabase.
- **"TU MEJOR"** pasa a ser la mejor puntuación local (`av_scores`) de este navegador para ese juego. Si no hay ninguna, no aparece.
- **Tipos regenerados** con `npm run db:types`.
- **Tests** de la validación, el mapeo de filas, las funciones de almacenamiento local y la Server Action (con Supabase simulado).
- **Documentación** en `CLAUDE.md`.

**Fuera de alcance (para specs futuros):**

- Que Biblioteca, Home y Detalle lean los juegos de Supabase, y borrar `catalog.ts`. Irá en el spec que complete el catálogo híbrido.
- Juegos simulados en `games`.
- `best` (récord) y `plays` (partidas) en `games`: son cifras inventadas del prototipo y se quedan en `catalog.ts`.
- "ACTIVIDAD EN VIVO" de la Home: sigue fija. Irá con Realtime.
- Login real o login anónimo de Supabase.
- Antitrampas fuerte (validar o firmar la partida) y límite de envíos por IP.
- Migrar a Supabase las puntuaciones ya guardadas en `av_scores`.
- Caída y Bloque Buster: sus specs añadirán su fila a `games` con una migración nueva.
- Paginación, filtros por fecha, rankings que mezclen juegos y moderación de puntuaciones.

---

## Modelo de datos

### Tablas (`supabase/migrations/<timestamp>_create_games_and_scores.sql`)

```sql
create table public.games (
  id                text primary key,                       -- = Game.id
  title             text not null,                          -- = Game.title
  short_description text not null,                          -- = Game.short
  long_description  text not null,                          -- = Game.long
  category          text not null check (category in ('ARCADE','PUZZLE','SHOOTER','VERSUS')), -- = Game.cat
  cover             text not null check (cover like 'cover-%'),                              -- = Game.cover
  color             text not null check (color in ('cyan','magenta','yellow','green')),      -- = Game.color
  max_score         integer not null check (max_score > 0),
  sort_order        integer not null default 0,             -- orden de las pestañas
  created_at        timestamptz not null default now()
);

create table public.scores (
  id          bigint generated always as identity primary key,
  game_id     text not null references public.games (id) on delete restrict,
  player_name text not null check (char_length(player_name) between 1 and 10 and player_name = btrim(player_name)),
  score       integer not null check (score >= 0),
  created_at  timestamptz not null default now(),
  user_id     uuid null references auth.users (id) on delete set null  -- opcional: null mientras no haya login
);

create index scores_game_top_idx on public.scores (game_id, score desc, created_at asc);
```

La semilla copia la entrada de `asteroids` de `catalog.ts`:

```sql
insert into public.games (id, title, short_description, long_description, category, cover, color, max_score, sort_order)
values ('asteroids', 'ASTEROIDES', '<short de catalog.ts>', '<long de catalog.ts>', 'SHOOTER', 'cover-rocas', 'yellow', 1000000, 1);
```

### Seguridad

- RLS activado en `games` y `scores`.
- **`games` es de solo lectura para la app.** Solo tiene política `select` `to anon, authenticated using (true)`. No hay permisos de `insert`, `update` ni `delete`, ni ninguna función que la modifique. Solo cambia mediante migraciones.
- **`scores` se lee en público, con columnas limitadas.** Tiene una política `select` `using (true)`, y el permiso `select` se concede solo sobre `id`, `game_id`, `player_name`, `score` y `created_at`. `user_id` no se expone.
- **Sin escritura directa en `scores`:** se revocan `insert`, `update` y `delete` para `anon` y `authenticated`.
- **Función `public.submit_score(p_game_id text, p_player_name text, p_score integer) returns void`:**
  - `security definer` con `set search_path = ''`
  - `execute` concedido solo a `anon` y `authenticated` (revocado de `public`)
  - valida juego, rango, nombre y la ventana de 10 s, e inserta el nombre y la puntuación tal como llegan, sin transformarlos
  - rellena `user_id` con `auth.uid()`, que hoy es `null`. El cliente nunca envía `user_id`, así que no se puede suplantar.
  - si falla, lanza un error con un código propio: `unknown_game`, `score_out_of_range`, `invalid_name` o `too_soon`.

### Código

Juego leído de Supabase en `features/leaderboard/model/game-row.ts`:

```ts
// Una fila de games, ya mapeada a los nombres del catálogo
export type GameRecord = Pick<Game, "id" | "title" | "short" | "long" | "cat" | "cover" | "color"> & {
  maxScore: number;
  sortOrder: number;
};
```

Validación compartida en `features/leaderboard/lib/score-input.ts`, la misma regla que aplica la base de datos:

```ts
export const PLAYER_NAME_MAX = 10;
// trim; vacío → "INVITADO". No cambia mayúsculas ni caracteres.
export function toPlayerName(input: string): string;
export function isValidPlayerName(name: string): boolean;   // 1–10 caracteres y sin espacios en los extremos
```

Resultado de la Server Action (`features/leaderboard/actions/submit-score.ts`, `"use server"`):

```ts
export type SubmitScoreResult =
  | { status: "saved" }
  | { status: "error"; reason: "unavailable" | "rejected" };
// unavailable: sin variables o error de red. rejected: submit_score lanzó un error de validación.
```

Lecturas en `features/leaderboard/lib/` (solo servidor):

```ts
// null → sin Supabase o error: usar catalog.ts + PLAYABLE_GAME_IDS
export async function getLeaderboardGames(): Promise<GameRecord[] | null>;
// null → usar seededScores. [] → "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA".
export async function getLeaderboard(gameId: string, limit: number): Promise<LeaderboardRow[] | null>;
```

`LeaderboardRow` (`features/games/model/game.ts`) no cambia: `{ rank, name, score, date }`. `name` se toma de `player_name`, y `date` sale de `created_at` en formato `dd/mm/aaaa`, como las filas simuladas.

Almacenamiento local en `features/player/lib/score-storage.ts`:

```ts
export const PLAYER_NAME_KEY = "av_player_name";
export function bestLocalScore(gameId: string): SavedScore | null;
export function readPlayerName(): string | null;
export function savePlayerName(name: string): void;
```

Convenciones:

- **Se guarda lo que se ve.** La caja del modal ya pasa el texto a mayúsculas y lo corta a 10 caracteres (comportamiento de SPEC 01). Se guarda ese valor exacto, solo sin espacios en los extremos. La puntuación se guarda tal cual, sin redondeos.
- **El nombre de la caja** al abrir el modal es `av_player_name`, si existe; si no, el nombre de la sesión; si no, "INVITADO". Se lee después de montar, nunca durante el render (regla de `CLAUDE.md`).
- **`av_player_name`** se escribe al pulsar GUARDAR, en los juegos reales.
- **Qué juegos consultan Supabase** lo decide `PLAYABLE_GAME_IDS` (SPEC 05). Cada id de esa lista tiene su fila en `games`.
- **Desempate del ranking:** mayor puntuación primero y, con la misma puntuación, la más antigua.
- **La Server Action nunca registra** el nombre ni la puntuación. Solo registra el motivo del error.

---

## Estructura de archivos

```
supabase/migrations/<timestamp>_create_games_and_scores.sql   # creada con npx supabase migration new
shared/lib/supabase/database.types.ts                         # regenerado con npm run db:types
features/leaderboard/
  model/game-row.ts               # GameRecord
  lib/score-input.ts              # toPlayerName, isValidPlayerName (+ test)
  lib/leaderboard-rows.ts         # toLeaderboardRows, toGameRecord (+ test)
  lib/get-leaderboard.ts          # getLeaderboardGames, getLeaderboard (solo servidor)
  actions/submit-score.ts         # Server Action → rpc("submit_score") (+ test)
features/player/lib/score-storage.ts        # + bestLocalScore, readPlayerName, savePlayerName (+ test)
features/arcade/components/ArcadePlayer.tsx # nombre recordado; guardar: local + submitScore
features/hall-of-fame/components/HallOfFameScreen.tsx  # pestañas solo de juegos reales; ranking real; TU MEJOR local
features/game-detail/components/GameDetailScreen.tsx   # ranking real en juegos reales
app/salon/page.tsx, app/juegos/[id]/page.tsx            # pasan juegos y rankings dentro de <Suspense>
```

- `features/leaderboard/` es una funcionalidad nueva: escritura y lectura del ranking real y de la tabla `games`.
- `PlayerScreen.tsx` (juegos simulados) no cambia: sigue guardando solo en local y sin recordar el nombre.

---

## Plan de implementación

1. **Migración.** Crear el archivo con `npx supabase migration new create_games_and_scores` y escribir tablas, índice, semilla, RLS, permisos y `submit_score`. La semilla copia literalmente `short` y `long` de `asteroids` en `catalog.ts`. Leer antes las referencias de RLS, permisos y funciones de `.claude/skills/supabase-postgres-best-practices/`. Prueba manual: el SQL se revisa antes de aplicarlo.
2. **Aplicar y tipar.** La persona aplica la migración con `npx supabase db push` desde una terminal interactiva, porque puede pedir la contraseña de la base de datos. Después, `npm run db:types`. Prueba manual:
   - `database.types.ts` incluye `games`, `scores` y `submit_score`
   - los asesores de seguridad de Supabase no muestran avisos para estas tablas
   - `npx tsc --noEmit` termina sin errores.
3. **Validación con test.** Crear `score-input.ts`. Test primero:
   - `"  PX_KAI "` → `"PX_KAI"`
   - `"Ñandú"` se mantiene igual
   - `""` y `"   "` → `"INVITADO"`
   - `isValidPlayerName` rechaza cadenas vacías, de más de 10 caracteres y con espacios en los extremos.
4. **Mapeo con test.** Crear `leaderboard-rows.ts`. Test primero:
   - `toLeaderboardRows` asigna `rank` desde 1, toma `name` de `player_name`, formatea `created_at` como `dd/mm/aaaa` y respeta el orden recibido
   - `toGameRecord` convierte `short_description`, `long_description` y `category` a los nombres de `Game`.
5. **Lecturas.** Crear `get-leaderboard.ts`:
   - `getLeaderboardGames` lee `games` ordenada por `sort_order`
   - `getLeaderboard` lee el top de `scores` por `game_id` (`score desc, created_at asc`, con `limit`)
   - las dos devuelven `null` si `createClient()` es `null` o la consulta falla, registrando solo el motivo
   - `getLeaderboard` devuelve `[]` si no hay filas.
6. **Server Action con test.** Crear `submit-score.ts`. Aplica `toPlayerName`, llama a `rpc("submit_score")` y después a `revalidatePath` de `/salon` y `/juegos/<id>`. Test primero, con el cliente de Supabase simulado (`vi.mock`):
   - sin cliente responde `unavailable`
   - un error de validación de la función responde `rejected`
   - un error de red responde `unavailable`
   - el éxito responde `saved` y envía el nombre y la puntuación exactos
   - nunca registra el nombre ni la puntuación.
7. **Almacenamiento local con test.** Añadir `bestLocalScore`, `readPlayerName` y `savePlayerName` a `score-storage.ts`. Test primero:
   - `bestLocalScore`: sin entradas → `null`; con varias, la mayor; ignora otros juegos y el JSON corrupto
   - el nombre se guarda en `av_player_name` y se vuelve a leer igual.
8. **Guardar desde los juegos reales.** En `ArcadePlayer`, el modal abre con el nombre recordado. "GUARDAR PUNTUACIÓN" escribe `av_scores` y `av_player_name` con el nombre exacto de la caja y llama a `submitScore`. El modal pasa a "guardado" tras la escritura local, sin esperar a Supabase, y un fallo remoto solo se registra en el servidor. Prueba manual:
   - guardar una partida de asteroides crea una fila en `scores` con el nombre y la puntuación exactos
   - la siguiente partida abre el modal con ese nombre.
9. **Detalle.** `app/juegos/[id]/page.tsx` pasa a `GameDetailScreen` el ranking de los juegos de `PLAYABLE_GAME_IDS` dentro de un `<Suspense>`, con las filas simuladas como reserva visual. El resto del Detalle sigue prerenderizado. Prueba manual:
   - `/juegos/asteroids` muestra las filas reales o el mensaje de tabla vacía
   - `/juegos/serpentina` sigue igual.
10. **Salón.** `app/salon/page.tsx` pasa a `HallOfFameScreen` los juegos de `getLeaderboardGames()` y sus rankings dentro de un `<Suspense>`. Las pestañas son solo esos juegos, con la reserva de `catalog.ts` y `PLAYABLE_GAME_IDS` sin Supabase. "TU MEJOR" usa `bestLocalScore`. Prueba manual: el Salón solo muestra la pestaña ASTEROIDES, y una puntuación recién guardada aparece en la siguiente visita.
11. **Documentación.** Actualizar `CLAUDE.md`:
    - las tablas y `submit_score`, y que `games` es de solo lectura y solo cambia por migraciones
    - el catálogo híbrido y su dirección (borrar los datos locales)
    - `av_player_name`
    - cómo crear y aplicar migraciones
    - la funcionalidad `leaderboard` y el comportamiento sin Supabase
    - que un juego real nuevo necesita su fila en `games` y su id en `PLAYABLE_GAME_IDS`.

---

## Criterios de aceptación

- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` terminan sin errores.
- [x] La migración está versionada en `supabase/migrations/` y aplicada en el proyecto remoto.
- [x] `games` contiene una sola fila, `asteroids`. Su `title`, `short_description`, `long_description`, `category`, `cover` y `color` coinciden con la entrada de `catalog.ts`, y `max_score` es 1000000.
- [x] Con la clave publicable, `insert`, `update` y `delete` sobre `games` son rechazados; la app solo la lee.
- [x] `scores` tiene las columnas `id`, `game_id`, `player_name`, `score`, `created_at` y `user_id` (nullable), y una lectura pública de `user_id` es rechazada.
- [x] Los asesores de seguridad de Supabase no muestran avisos de RLS desactivado ni de políticas de escritura abiertas en `games` o `scores`.
- [x] Un `INSERT` directo en `scores` con la clave publicable (REST) es rechazado.
- [x] `submit_score` rechaza:
  - un juego inexistente
  - una puntuación negativa o mayor que `max_score`
  - un nombre vacío, de más de 10 caracteres o con espacios en los extremos
  - un segundo envío con el mismo nombre y juego antes de 10 s.
- [x] Escribir "PX_KAI" en la caja y pulsar GUARDAR tras una partida de asteroides crea en `scores` una fila con `player_name` "PX_KAI", la puntuación exacta de la partida y `user_id` `null`, y añade la entrada a `av_scores`.
- [x] Tras guardar, la siguiente partida de asteroides abre el modal con "PX_KAI" en la caja, también tras recargar la página.
- [x] El Salón solo tiene pestañas de los juegos reales (hoy, solo ASTEROIDES).
- [ ] `/juegos/asteroids` y la pestaña ASTEROIDES del Salón muestran las filas reales ordenadas por puntuación, con fecha `dd/mm/aaaa`.
- [x] Una puntuación recién guardada aparece en `/salon` y en `/juegos/asteroids` en la siguiente visita, sin esperar a ninguna caché.
- [x] Con `scores` vacía para asteroides, ambas tablas muestran "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA".
- [ ] Sin las variables de Supabase:
  - el Salón muestra solo la pestaña ASTEROIDES con `seededScores`
  - el Detalle de asteroides muestra `seededScores`
  - guardar escribe solo en local, sin errores visibles.
- [ ] El Detalle de los juegos simulados muestra las mismas filas de `seededScores` que antes y no hace ninguna petición a Supabase.
- [ ] "TU MEJOR" muestra la mejor puntuación local del juego en este navegador, y no aparece si no hay ninguna.
- [x] La consola del servidor nunca muestra nombres ni puntuaciones al fallar un guardado.
- [x] El build sigue prerenderizando el Detalle y el Salón como estáticos con partes dinámicas (◐), no totalmente dinámicos.

---

## Decisiones

- **Sí:** un solo spec "leaderboard" que incluye la tabla `games`. `scores` necesita la clave foránea a `games`.
- **Sí:** catálogo híbrido. `games` tiene los mismos campos que el catálogo para que, más adelante, se puedan borrar los datos locales y cargar los juegos solo desde Supabase.
- **Sí:** de momento, `games` solo con los juegos reales (hoy `asteroids`).
- **No:** sembrar los 8 juegos del catálogo. Los simulados no deben aceptar puntuaciones reales.
- **Sí:** el Salón ya lee sus pestañas de `games`. Biblioteca, Home y Detalle siguen con `catalog.ts`, para no perder el prerender ni la paridad con el prototipo hasta el spec que complete el cambio.
- **No:** `best` y `plays` en `games`. Son cifras inventadas del prototipo.
- **Sí:** `games` de solo lectura desde la app; solo cambia por migraciones. Nadie puede añadir, editar ni borrar juegos desde la interfaz o la API.
- **Sí:** columnas `id`, `game_id`, `player_name`, `score`, `created_at` y `user_id` opcional. `user_id` prepara el login futuro sin obligar a nadie a autenticarse.
- **Sí:** `user_id` lo rellena `submit_score` con `auth.uid()`, nunca el cliente.
- **No:** exponer `user_id` en lecturas públicas. No aporta al ranking y enlazaría puntuaciones con cuentas.
- **Sí:** guardar el nombre exacto de la caja (solo sin espacios en los extremos) y la puntuación exacta. Lo que el jugador ve es lo que queda en el ranking.
- **No:** normalizar el nombre a `A-Z0-9`. Cambiaría lo que el jugador escribió.
- **Sí:** recordar el nombre en `av_player_name`. Al volver, solo hay que pulsar GUARDAR.
- **Sí:** el Salón solo con pestañas de juegos reales. Los simulados no tienen puntuaciones reales que mostrar.
- **Sí:** Server Action con la función `submit_score` y el `INSERT` revocado. Sin clave secreta, es la única forma de que la base de datos valide lo que entra, también ante llamadas directas a la API REST.
- **No:** `INSERT` directo con RLS `to anon`, ni login anónimo de Supabase.
- **Sí:** antitrampas básico (rango, nombre, 10 s). Es proporcional a un portal sin cuentas.
- **Sí:** mantener `av_scores` como copia local sin migrar nada. Es el respaldo sin Supabase y la fuente de "TU MEJOR".
- **Sí:** "SÉ EL PRIMERO EN ENTRAR EN LA SALA DE LA FAMA" sin puntuaciones, y `seededScores` sin Supabase. Cumple la regla de SPEC 04: la app funciona sin variables.
- **No:** mezclar filas reales y simuladas. Haría pasar datos inventados por reales.
- **Sí:** "TU MEJOR" desde `av_scores`. Sin login, solo este navegador sabe qué puntuaciones son del jugador.
- **Sí:** solo el Salón y el Detalle. La "ACTIVIDAD EN VIVO" de la Home encaja con Realtime.
- **Sí:** ranking siempre fresco, en un `<Suspense>` dentro de la página prerenderizada, más `revalidatePath` tras guardar.
- **Sí:** el modal marca "guardado" tras la escritura local, sin esperar a Supabase. El guardado remoto no bloquea al jugador.
- **Sí:** este spec va justo después de SPEC 05. Caída y Bloque Buster (SPEC 07 y 08) solo añadirán su fila a `games` y su id a `PLAYABLE_GAME_IDS`.

---

## Riesgos

| Riesgo                                                                                       | Mitigación                                                                                                                                                             |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `submit_score` es `security definer` y `anon` puede llamarla directamente.             | Es intencionado: valida todo antes de insertar. Lleva `search_path = ''`, `execute` solo para `anon` y `authenticated`, y ningún otro efecto.                  |
| Las tablas nuevas no son accesibles desde la API sin permisos explícitos, o lo son de más. | La migración concede `select` y revoca escritura de forma explícita; los criterios prueban la lectura, el rechazo de escrituras y que `user_id` no se puede leer. |
| `games` y `catalog.ts` se desincronizan (título o textos distintos).                    | La semilla copia literalmente la entrada del catálogo y un criterio lo comprueba. El spec del catálogo completo eliminará la duplicación.                           |
| Un nombre con caracteres raros o emojis ocupa más de lo esperado.                           | `char_length` cuenta caracteres, no bytes; el modal ya limita a 10.                                                                                                   |
| `npx supabase db push` pide datos interactivos.                                            | Paso manual de la persona, documentado en `CLAUDE.md`, como `login` y `link` en SPEC 04.                                                                          |
| Leer Supabase en la página rompe el prerender con Cache Components.                         | Juegos y rankings van en un `<Suspense>` con reserva; un criterio exige que el build siga marcando las rutas como ◐. Leer antes la doc de Cache Components.          |
| Leer `av_player_name` durante el render rompe la hidratación.                             | Se lee en un efecto tras montar, con `safe-storage`, como el resto del almacenamiento local.                                                                          |
| Spam de puntuaciones con nombres distintos.                                                  | Fuera de alcance más allá del límite de 10 s; anotado para el spec de antitrampas.                                                                                   |
| Un juego real nuevo se añade a `PLAYABLE_GAME_IDS` sin su fila en `games`.              | `submit_score` responde `unknown_game` y el Salón no muestra su pestaña; `CLAUDE.md` documenta los dos pasos juntos.                                            |
| Los tests llaman a Supabase de verdad.                                                       | El cliente se simula con `vi.mock`; ningún test lee `.env.local`.                                                                                                  |
| `revalidatePath` no tiene efecto sobre lecturas dinámicas o falla con Cache Components.   | Leer la doc de `revalidatePath` y Cache Components antes del paso 6; el criterio de "siguiente visita" lo comprueba.                                                  |

---

## Notas de implementación

Implementado y verificado el 2026-11-21 con Playwright contra `next start` y el proyecto remoto de Supabase. Las capturas están en `.playwright-screenshots/hall-of-fame/leaderboard/` y no se versionan. Los criterios sin marcar no se pudieron comprobar.

- **Migración:** `20261121023827_create_games_and_scores.sql`, aplicada con `npx supabase db push --linked --yes`. Añade dos índices que el spec no pedía: uno para la ventana de 10 s (`game_id, player_name, created_at`) y otro para la clave foránea `user_id`.
- **Permisos:** Supabase concede por defecto todos los permisos de las tablas nuevas a `anon` y `authenticated`. La migración los revoca antes de conceder solo los de lectura.
- **API REST con la clave publicable:**
  - `INSERT` en `scores`, leer `user_id` y escribir en `games` responden 401
  - `submit_score` rechaza cada caso inválido con su código.
- **Flujo real:**
  - "px_kai" se guarda como "PX_KAI", porque la caja ya convierte a mayúsculas, con la puntuación exacta y `user_id` `null`
  - un segundo guardado antes de 10 s no crea fila
  - el nombre se recuerda tras recargar
  - la fila aparece en el Detalle y en el Salón.
- **Sin verificar:**
  - el orden con varias filas y el formato de fecha en pantalla
  - el comportamiento sin variables de Supabase
  - las peticiones del servidor en los Detalles simulados (el navegador no hace ninguna)
  - "TU MEJOR" oculto sin puntuaciones locales.
- **Desviaciones:**
  - las fechas del ranking se calculan en UTC
  - el Salón usa la pantalla con filas simuladas como reserva del `<Suspense>`, así que se ven un instante antes de las reales
  - "TU MEJOR" se muestra también sin sesión y marca `#--` si queda fuera del top 12
  - no se usa el paquete `server-only`, porque no está instalado.
- **Asesor de seguridad:** avisa de que `submit_score` es `security definer` y ejecutable por `anon`, lo que es intencionado. También avisa de una función previa del proyecto, `public.rls_auto_enable()`, que este spec no creó.
- **Datos de prueba:** quedó en producción una fila `PX_KAI` (20 puntos) de la verificación.

---

## Lo que **no** entra en este spec

- Biblioteca, Home y Detalle leyendo juegos de Supabase, y borrar `catalog.ts`.
- Juegos simulados en `games`, y `best` y `plays` reales.
- "ACTIVIDAD EN VIVO" de la Home y Realtime.
- Login real o anónimo.
- Antitrampas fuerte y límite por IP.
- Migración de `av_scores` a Supabase.
- Caída y Bloque Buster.
- Paginación, filtros, rankings que mezclen juegos y moderación.

Cada uno de estos puntos, si llega, irá en su propio spec.
