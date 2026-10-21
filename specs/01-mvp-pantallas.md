# SPEC 01 — MVP visual de Arcade Vault

> **Estado:** Borrador
> **Depende de:** —
> **Fecha:** 2026-10-21
> **Objetivo:** Reproducir en Next.js las cinco pantallas del prototipo `references/templates/` con su comportamiento simulado, sin implementar ningún juego.

---

## Por qué existe este spec

El prototipo de `references/templates/` es la referencia visual del producto, pero corre con Babel en el navegador, usa variables globales en `window` y navega con un hash JSON.
Este spec lo traslada a la App Router de Next.js 16 con rutas reales, módulos TypeScript y una estructura por funcionalidad.
Los estilos ya están portados de forma literal en `app/globals.css` (rama `styles/01-styles`, PR #1).
Por eso este spec no crea estilos nuevos: reutiliza las clases del prototipo (`av-nav`, `card`, `cover-*`, `crt`, `hall-table`, `btn`, ...).

---

## Alcance

**Entra:**

- Shell de la aplicación: barra de navegación (`av-nav`) con menú móvil, contenedor `av-main` y pie de página, iguales al prototipo.
- Pantalla **Biblioteca** en `/`: hero, búsqueda por nombre, filtro por categoría, rejilla de tarjetas con efecto de inclinación y estado "NO HAY RESULTADOS".
- Pantalla **Detalle** en `/juegos/[id]`: portada, etiquetas, descripción, franja de estadísticas, acciones y tabla de mejores puntuaciones.
- Pantalla **Reproductor** en `/juegos/[id]/jugar`: HUD, pantalla CRT con la arena animada falsa, contador de puntos simulado, pausa, botón FIN, modal de fin de juego y guardado de puntuación.
- Pantalla **Acceso** en `/acceso`: pestañas iniciar sesión / crear cuenta, formulario, "JUGAR COMO INVITADO" y botones sociales sin acción.
- Pantalla **Salón de la Fama** en `/salon`: pestañas por juego, podio, tabla de clasificación y fila "TU MEJOR MARCA" si hay usuario.
- Datos simulados (`GAMES`, `CATS`, `PLAYERS`, `seededScores`) portados a TypeScript.
- Sesión falsa compartida mediante React Context y persistida en `localStorage["av_user"]`.
- Puntuaciones guardadas en `localStorage["av_scores"]`, con el mismo formato del prototipo.
- Vitest con tests de la lógica pura: filtrado, `seededScores`, formatos y acceso a `localStorage`.
- Eliminar el contenido de la plantilla `create-next-app` de `app/page.tsx` y los SVG de plantilla de `public/`.

**Fuera de alcance (para specs futuros):**

- Cualquier juego real: la arena del reproductor es la animación CSS falsa del prototipo.
- Autenticación real, backend, base de datos o API.
- Login social funcional con Google o GitHub.
- Leer las puntuaciones guardadas en `av_scores` para mostrarlas en el Detalle o en el Salón: ambas pantallas siguen usando `seededScores`, igual que el prototipo.
- Contador de créditos funcional: "CRÉDITOS · 03" es texto fijo.
- Tests de componentes o end-to-end.
- Panel de "tweaks" del prototipo (`.tw-section`, `.tw-label`): existe en el CSS pero ninguna pantalla lo usa.
- Internacionalización: los textos se mantienen en español, tal como están en el prototipo.

---

## Modelo de datos

Los tipos se definen en `features/games/model/game.ts`.

```ts
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";
export type CategoryFilter = "TODOS" | GameCategory;

export type Game = {
  id: string;          // slug usado en la URL: "bloque-buster"
  title: string;       // "BLOQUE BUSTER"
  short: string;       // descripción de la tarjeta
  long: string;        // descripción del detalle
  cat: GameCategory;
  cover: `cover-${string}`; // clase CSS de la portada: "cover-bricks"
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;        // 28450
  plays: string;       // "12.4K"
};

export type LeaderboardRow = {
  rank: number;        // 1-based, tras ordenar por score descendente
  name: string;        // "PX_KAI"
  score: number;
  date: string;        // "dd/mm/2026"
};
```

Los tipos de la sesión y las puntuaciones se definen en `features/session/model/user.ts` y `features/player/model/score-entry.ts`.

```ts
// localStorage["av_user"] → JSON de SessionUser, o ausente
export type SessionUser = { name: string }; // mayúsculas, máximo 10 caracteres

// localStorage["av_scores"] → JSON de SavedScore[]
export type SavedScore = {
  game: string;  // Game.id
  score: number;
  name: string;  // iniciales, mayúsculas, máximo 10 caracteres
  at: number;    // Date.now() al guardar
};
```

Convenciones:

- Los datos (`GAMES`, `CATS`, `PLAYERS`) se copian literalmente de `references/templates/data.jsx` a `features/games/data/catalog.ts`.
- `seededScores(seed, count)` conserva el mismo algoritmo y las mismas semillas que el prototipo: `id.length * 17 + 3` en el Detalle (10 filas) y `id.length * 23 + 7` en el Salón (12 filas). Así, cada pantalla muestra exactamente los mismos nombres y puntos que el prototipo.
- Los números se formatean con `toLocaleString("es-ES")` y los rangos con dos dígitos (`#01`).
- Una lectura de `localStorage` con JSON inválido devuelve el valor por defecto (`null` o `[]`) sin lanzar errores, igual que el `try/catch` del prototipo.

---

## Estructura de archivos

```
app/
  layout.tsx                  # + SessionProvider, Nav, <main className="av-main">, Footer
  page.tsx                    # Biblioteca
  juegos/[id]/page.tsx        # Detalle (generateStaticParams + notFound)
  juegos/[id]/jugar/page.tsx  # Reproductor
  acceso/page.tsx             # Acceso
  salon/page.tsx              # Salón de la Fama
features/
  games/        model/, data/catalog.ts, lib/seeded-scores.ts, lib/filter-games.ts
  session/      model/, lib/session-storage.ts, SessionProvider.tsx (useSession)
  library/      components/ (LibraryScreen, GameCard, Hero, Filters)
  game-detail/  components/ (GameDetailScreen, Leaderboard)
  player/       model/, lib/score-storage.ts, components/ (PlayerScreen, Hud, CrtScreen, GameOverModal)
  auth/         components/ (AuthScreen)
  hall-of-fame/ components/ (HallOfFameScreen, Podium, HallTable)
shared/
  components/   Nav.tsx, MobileMenu.tsx, Footer.tsx
  lib/          safe-storage.ts, format.ts
```

- Las páginas de `app/` solo resuelven parámetros y componen la pantalla de su funcionalidad.
- Los componentes contenedores (estado, efectos, `localStorage`) llevan `"use client"`; los componentes de presentación solo reciben props.
- Los tests viven junto a su archivo: `features/games/lib/seeded-scores.test.ts`.

---

## Plan de implementación

1. **Vitest.** Instalar `vitest` y `jsdom` como dependencias de desarrollo. Crear `vitest.config.ts` con el alias `@/*` y el entorno `jsdom`. Añadir los scripts `"test": "vitest run"` y `"test:watch": "vitest"`. Prueba manual: `npm test` termina sin errores aunque todavía no haya tests.
2. **Catálogo de juegos.** Crear `features/games/model/game.ts` y `features/games/data/catalog.ts` con `GAMES`, `CATS` y `PLAYERS` copiados del prototipo.
3. **Lógica de juegos con tests.** Crear `seeded-scores.ts` y `filter-games.ts` en `features/games/lib/`, cada uno con su test. Escribir los tests primero: misma salida que el prototipo para una semilla fija, filas ordenadas y sin nombres repetidos, filtro por categoría y por texto sin distinguir mayúsculas.
4. **Utilidades compartidas con tests.** Crear `shared/lib/format.ts` (`formatScore`, `formatRank`) y `shared/lib/safe-storage.ts` (`readJson`, `writeJson`, `removeKey`, tolerantes a JSON inválido), cada uno con su test.
5. **Persistencia con tests.** Crear `features/session/lib/session-storage.ts` (clave `av_user`) y `features/player/lib/score-storage.ts` (`appendScore` sobre la clave `av_scores` añadiendo `at`), cada uno con su test.
6. **Sesión.** Crear `features/session/SessionProvider.tsx`, que expone `user`, `login(user)` y `signOut()` mediante `useSession()`. Montarlo en `app/layout.tsx`. El estado inicial es `null` y se lee `av_user` tras montar, para evitar diferencias de hidratación.
7. **Shell.** Crear `shared/components/Nav.tsx`, `MobileMenu.tsx` y `Footer.tsx` reproduciendo `nav.jsx` y el pie de `app.jsx`. El enlace activo se calcula con `usePathname()`: Biblioteca está activa en `/` y en `/juegos/*`. `app/layout.tsx` renderiza Nav, `<main className="av-main">` y Footer.
8. **Biblioteca.** Crear los componentes de `features/library/` y usarlos en `app/page.tsx`, sustituyendo la plantilla. Borrar los SVG de plantilla de `public/`. Al pulsar una tarjeta o "JUGAR" se navega a `/juegos/[id]`.
9. **Detalle.** Crear `features/game-detail/` y `app/juegos/[id]/page.tsx` con `generateStaticParams` sobre `GAMES` y `notFound()` para un `id` desconocido.
10. **Reproductor: HUD y CRT.** Crear `PlayerScreen`, `Hud` y `CrtScreen` en `features/player/` y la ruta `app/juegos/[id]/jugar/page.tsx`. Incluir el contador simulado (cada 220 ms suma entre 10 y 99), la subida de nivel, el overlay "EN PAUSA" y el botón SALIR hacia el Detalle.
11. **Reproductor: fin de juego.** Crear `GameOverModal` con la puntuación final, el campo de iniciales (por defecto el nombre del usuario o "INVITADO"), "GUARDAR PUNTUACIÓN" (que llama a `appendScore` y muestra el mensaje con efecto de máquina de escribir), "JUGAR DE NUEVO" y "VOLVER AL VAULT".
12. **Acceso.** Crear `features/auth/components/AuthScreen.tsx` y `app/acceso/page.tsx`. Al enviar el formulario se llama a `login({ name })` con el nombre en mayúsculas, recortado a 10 caracteres y "PLAYER1" si está vacío, y se navega a `/`. "JUGAR COMO INVITADO" llama a `signOut()` y navega a `/`.
13. **Salón de la Fama.** Crear `features/hall-of-fame/` y `app/salon/page.tsx` con pestañas, podio, tabla con animación escalonada y la fila del usuario, calculada como en el prototipo.
14. **Documentación.** Actualizar `CLAUDE.md` con `npm test`, el comando para ejecutar un solo test (`npx vitest run <archivo> -t "<nombre>"`), las rutas y la estructura `features/` + `shared/`.

---

## Criterios de aceptación

- [ ] `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` terminan sin errores.
- [ ] `npm run build` prerenderiza `/`, `/acceso`, `/salon` y las ocho rutas `/juegos/[id]` y `/juegos/[id]/jugar`.
- [ ] Cada pantalla, vista lado a lado con `references/templates/Arcade Vault.html`, muestra los mismos textos, colores, fuentes y disposición a 1440 px y a 390 px de ancho.
- [ ] La consola del navegador no muestra errores ni avisos de hidratación en ninguna ruta.
- [ ] En `/`, escribir "caí" muestra solo CAÍDA; elegir PUZZLE muestra solo los juegos de esa categoría; una búsqueda sin coincidencias muestra "NO HAY RESULTADOS".
- [ ] Pasar el ratón sobre una tarjeta la inclina siguiendo al cursor y al salir vuelve a su posición.
- [ ] El enlace activo de la barra de navegación es Biblioteca en `/` y en `/juegos/*`, y Salón de la Fama en `/salon`.
- [ ] A menos de 840 px de ancho se ocultan los enlaces, aparece el botón ≡ y el panel lateral se abre y se cierra (también al pulsar el fondo).
- [ ] `/juegos/no-existe` devuelve la página 404.
- [ ] La tabla de `/juegos/caida` muestra los mismos 10 nombres, puntos y fechas que el Detalle de CAÍDA en el prototipo.
- [ ] En el Reproductor la puntuación sube sola; PAUSA la detiene y muestra "EN PAUSA"; REANUDAR la reanuda.
- [ ] FIN abre el modal; GUARDAR PUNTUACIÓN añade `{ game, score, name, at }` a `localStorage["av_scores"]` y muestra "▸ PUNTUACIÓN GUARDADA_".
- [ ] JUGAR DE NUEVO reinicia la puntuación a 0, las vidas a 3 y el nivel a 01.
- [ ] Iniciar sesión como "kai" guarda `{"name":"KAI"}` en `av_user`, lleva a `/` y la barra de navegación muestra "KAI ▾".
- [ ] Pulsar "KAI ▾" cierra la sesión, borra `av_user` y vuelve a mostrar "Iniciar Sesión".
- [ ] Al recargar con `av_user` presente, la sesión sigue activa.
- [ ] En `/salon`, cambiar de pestaña actualiza el podio y la tabla; con sesión iniciada aparece la fila "▸ TU MEJOR MARCA EN <JUEGO>".
- [ ] Con `av_user` o `av_scores` corruptos en `localStorage` la app carga sin errores y se comporta como si no hubiera datos.

---

## Decisiones

- **Sí:** el nombre de la app es Arcade Vault, igual que en el prototipo.
- **Sí:** rutas reales del App Router (`/`, `/juegos/[id]`, `/juegos/[id]/jugar`, `/acceso`, `/salon`). Dan URLs compartibles y el botón Atrás funciona.
- **No:** página única con estado en el hash, como el prototipo. Desaprovecha el App Router.
- **Sí:** replicar los comportamientos simulados del prototipo (filtros, inclinación, contador, pausa, modal, login falso y `localStorage`). El MVP se usa igual que el prototipo.
- **No:** maquetación estática sin interacción.
- **Sí:** estructura por funcionalidad (`features/` + `shared/`) con componentes contenedores y de presentación separados. Escala mejor que una carpeta `components/` plana.
- **Sí:** reutilizar las clases globales del prototipo en lugar de reescribir los estilos con utilidades de Tailwind. La paridad visual ya está garantizada por `app/globals.css`.
- **Sí:** Vitest con `jsdom` solo para la lógica pura. Testing Library no se instala porque no hay tests de componentes en este spec.
- **No:** tests de componentes o end-to-end. El plan crecería bastante; quedan para otro spec.
- **Sí:** React Context (`SessionProvider`) como única fuente de verdad de la sesión, para que la navegación reaccione al login sin recargar.
- **Sí:** las claves `av_user` y `av_scores` con el mismo formato que el prototipo.
- **No:** claves versionadas (`av:user:v1`). Se descartan para mantener la paridad; si el formato cambia, la migración irá en otro spec.
- **Sí:** `notFound()` para un `id` desconocido. El prototipo no renderiza nada en ese caso; una 404 es el equivalente correcto en Next.js.
- **Sí:** la rama `spec-01-mvp-pantallas` sale de `styles/01-styles`, que incluye `main` y los estilos. Su PR se apila sobre el #1.

---

## Riesgos

| Riesgo | Mitigación |
| ------ | ---------- |
| Diferencias de hidratación al leer `localStorage` durante el renderizado del servidor. | El estado de la sesión arranca en `null` y se lee tras montar en `SessionProvider`; ningún componente lee `localStorage` durante el render. |
| `cacheComponents` está activo y cambia el modelo de renderizado y caché de Next.js 16. | Consultar `node_modules/next/dist/docs/` antes de escribir `generateStaticParams` y las páginas dinámicas; verificar con `npm run build`. |
| El PR #1 cambia antes de fusionarse y la rama del spec queda desactualizada. | Rebasar `spec-01-mvp-pantallas` sobre `styles/01-styles` (o sobre `main` tras el merge) antes de abrir su PR. |
| El efecto de inclinación modifica `style.transform` directamente y choca con la transición de `.card:hover`. | Reproducir el mismo enfoque del prototipo (`ref` + `onMouseMove`), que ya convive con esa transición. |

---

## Lo que **no** entra en este spec

- Juegos reales: la arena del reproductor es solo una animación.
- Autenticación real, backend y login social funcional.
- Mostrar en el Detalle o el Salón las puntuaciones guardadas por el usuario.
- Contador de créditos funcional.
- Tests de componentes y end-to-end.
- Traducciones a otros idiomas.

Cada uno de estos puntos, si llega, irá en su propio spec.
