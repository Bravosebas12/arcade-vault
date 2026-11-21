# SPEC 04 — Integración base con Supabase

> **Estado:** Implementado
> **Depende de:** SPEC 03
> **Fecha:** 2026-11-19
> **Objetivo:** Conectar la app al proyecto remoto de Supabase (clientes tipados, refresco de sesión en `proxy.ts`, CLI y ruta `/api/health`) sin cambiar ningún comportamiento visible, como base para los specs de autenticación, datos, Realtime y Edge Functions.

---

## Por qué existe este spec

Arcade Vault va a usar Supabase para autenticación y base de datos, y más adelante para Realtime y Edge Functions.
Cada uno de esos usos irá en su propio spec. Todos necesitan la misma base: variables, clientes, refresco de la sesión, CLI y tipos.
Este spec monta solo esa base, para que los specs siguientes empiecen directamente por su funcionalidad.

La guía rápida del panel de Supabase no encaja tal cual en este proyecto:

- Su `page.tsx` reemplaza `app/page.tsx` (la Home) y consulta una tabla `todos` que no existe. El esquema `public` del proyecto tiene 0 tablas.
- Usa `middleware.ts`. En Next 16 ese archivo está obsoleto y se llama `proxy.ts` (`node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`).
- Su helper de middleware no está conectado a ningún archivo, así que nunca se ejecuta.
- Pone los clientes en `utils/`. Este proyecto pone el código compartido en `shared/`.

---

## Alcance

**Entra:**

- Dependencias `@supabase/supabase-js` y `@supabase/ssr`.
- CLI de Supabase como `devDependency`, carpeta `supabase/` (`config.toml`, `migrations/` vacía) y enlace con el proyecto remoto.
- Tipos generados del esquema `public` en `shared/lib/supabase/database.types.ts` y script `npm run db:types` para regenerarlos.
- Variables públicas `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `.env.example` y en `.env.local`.
- Clientes tipados con `Database`: uno de servidor (Server Components, Server Actions, Route Handlers) y otro de navegador.
- `proxy.ts` en la raíz, que refresca la sesión de Supabase en cada petición de página.
- Ruta `GET /api/health` que comprueba la conexión real con el proyecto.
- Funcionamiento degradado sin variables: la app sigue igual que hoy y `/api/health` responde 503.
- Agent Skills de Supabase (`supabase/agent-skills`) en `.claude/skills/`, con versión fijada en `skills-lock.json`.
- Tests de la lectura de variables y de la ruta de salud, con la red simulada.
- Documentación en `CLAUDE.md`.

**Fuera de alcance (para specs futuros):**

- Login real con Supabase Auth: `/acceso`, `SessionProvider` y `localStorage["av_user"]` siguen simulados.
- Tablas, migraciones con contenido, políticas RLS y datos: puntuaciones, perfiles y biblioteca siguen en `localStorage`.
- Rutas protegidas o redirecciones en `proxy.ts` según la sesión.
- Realtime (ticker "ACTIVIDAD EN VIVO" o leaderboards en vivo).
- Edge Functions.
- Stack local con Docker (`supabase start`).
- Clave secreta (`sb_secret_...`) o `service_role` en cualquier parte de la app.
- Configurar las variables en un proveedor de despliegue.

---

## Modelo de datos

Este spec no crea tablas ni cambia los tipos ni las claves de `localStorage` de los specs anteriores.

Variables públicas añadidas a `.env.example` (versionado, vacías) y a `.env.local` (no versionado, con los valores del panel de Supabase en *Project Settings → API*):

```
# URL del proyecto de Supabase (https://<project-ref>.supabase.co). Opcional.
# Sin ella, la app funciona igual y /api/health responde 503.
NEXT_PUBLIC_SUPABASE_URL=

# Clave publicable (sb_publishable_...). Es pública por diseño: se envía al navegador.
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Configuración leída en `shared/lib/supabase/env.ts`:

```ts
export type SupabaseEnv = { url: string; publishableKey: string };

// null si falta alguna de las dos variables o está vacía tras trim()
export function getSupabaseEnv(): SupabaseEnv | null;
```

Respuesta de `GET /api/health`:

```ts
export type HealthResponse =
  | { supabase: "ok" }                                            // 200
  | { supabase: "error"; reason: "missing_env" | "unreachable" }; // 503
```

Convenciones:

- `getSupabaseEnv` lee `process.env.NEXT_PUBLIC_SUPABASE_URL` y `process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` escritos literalmente. Next solo sustituye en el bundle del navegador las variables `NEXT_PUBLIC_` que aparecen así; un acceso dinámico (`process.env[name]`) deja `undefined` en el navegador.
- `createClient()` de servidor es `async`, llama internamente a `await cookies()` y devuelve `SupabaseClient<Database> | null`. No recibe el `cookieStore` por parámetro como en la guía.
- `createClient()` de navegador devuelve `SupabaseClient<Database> | null`.
- Ambos devuelven `null` cuando `getSupabaseEnv()` es `null`. Quien los use decide qué hacer en ese caso.
- `updateSession(request)` devuelve `NextResponse.next()` sin tocar nada cuando no hay variables. Con variables, crea el cliente con los handlers de cookies de `@supabase/ssr`, llama a `supabase.auth.getClaims()` para refrescar la sesión y devuelve la respuesta con las cookies actualizadas.
- `/api/health` comprueba la conexión pidiendo `GET <url>/auth/v1/health` con la cabecera `apikey`, sin caché y con un límite de 5 s. Cualquier error, estado no 2xx o tiempo agotado responde `unreachable`.
- La ruta de salud nunca devuelve la URL, la clave ni el cuerpo de la respuesta de Supabase. En el servidor registra solo el motivo (`reason`) y, si lo hay, `error.name` y `error.message`.

---

## Estructura de archivos

```
package.json                        # + @supabase/supabase-js, @supabase/ssr; devDependency supabase; script db:types
.env.example                        # + NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
proxy.ts                            # proxy(): llama a updateSession; matcher sin estáticos
supabase/
  config.toml                       # generado por supabase init (versionado)
  migrations/.gitkeep               # vacía hasta el primer spec de datos
  .gitignore                        # generado por supabase init (ignora .temp, .branches)
shared/lib/supabase/
  env.ts                            # getSupabaseEnv (+ test)
  database.types.ts                 # generado por npm run db:types, no se edita a mano
  server.ts                         # createClient() de servidor
  client.ts                         # createClient() de navegador
  proxy.ts                          # updateSession(request)
app/api/health/route.ts             # GET /api/health (+ test)
.claude/skills/<skills de supabase>/  # instaladas con npx skills add supabase/agent-skills
skills-lock.json                    # + versión fijada de supabase/agent-skills
CLAUDE.md                           # + sección de Supabase
```

- `shared/lib/supabase/` es compartido porque auth, datos y Realtime vivirán en distintas funcionalidades de `features/`.
- `app/page.tsx` y las pantallas existentes no cambian.
- El test de `app/api/health/route.ts` vive en `shared/lib/supabase/health.test.ts` si `vitest.config.ts` solo incluye `features/` y `shared/`. En ese caso, la lógica de la comprobación se extrae a `shared/lib/supabase/health.ts` (`checkSupabaseHealth(): Promise<HealthResponse>`) y la ruta solo la llama.

---

## Plan de implementación

1. **Dependencias y variables.** Instalar `@supabase/supabase-js` y `@supabase/ssr`, y `supabase` como `devDependency`. Añadir las dos variables a `.env.example` con los comentarios del modelo de datos. Prueba manual: `npm run build` termina y `git status` no muestra `.env.local`.
2. **CLI y enlace.** Ejecutar `npx supabase init` (sin generar ajustes de VS Code) y crear `supabase/migrations/.gitkeep`. Enlazar con `npx supabase login` y `npx supabase link --project-ref <project-ref>`; son pasos interactivos que hace la persona, no el agente. Prueba manual: `git status` muestra `supabase/config.toml` y no `supabase/.temp/`.
3. **Tipos generados.** Añadir el script `"db:types": "supabase gen types typescript --linked --schema public > shared/lib/supabase/database.types.ts"` y ejecutarlo. Prueba manual: el archivo existe, exporta `Database` y `npx tsc --noEmit` termina.
4. **Lectura de variables con test.** Crear `env.ts` con `getSupabaseEnv`. Test primero: ambas presentes devuelve el objeto; falta una, cualquiera vacía o solo con espacios devuelve `null`; los valores se devuelven recortados.
5. **Clientes.** Crear `server.ts` y `client.ts` con `createServerClient` y `createBrowserClient` de `@supabase/ssr`, tipados con `Database`. El cliente de servidor ignora el error de `setAll` cuando se llama desde un Server Component, porque `proxy.ts` ya refresca la sesión. Nadie los usa todavía. Prueba manual: `npm run build` termina.
6. **Proxy.** Crear `shared/lib/supabase/proxy.ts` con `updateSession` y `proxy.ts` en la raíz con `export async function proxy(request)` y un `matcher` constante que excluye `_next/static`, `_next/image`, `favicon.ico` y archivos de imagen, fuentes y `.css`. Leer antes `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`. Prueba manual: con y sin `.env.local`, `npm run dev` sirve todas las rutas igual que antes.
7. **Ruta de salud con test.** Crear `checkSupabaseHealth` y `app/api/health/route.ts`. La ruta llama a `await connection()` (de `next/server`) antes de comprobar, para que Cache Components no la prerenderice en el build. Test primero, con `fetch` simulado (`vi.stubGlobal`): sin variables responde `missing_env` sin llamar a `fetch`; `fetch` lanza, responde 500 o tarda más de 5 s responde `unreachable`; 200 responde `ok`; la URL pedida es `<url>/auth/v1/health` con la cabecera `apikey`.
8. **Agent Skills.** Ejecutar `npx skills add supabase/agent-skills` desde la raíz del repo. Prueba manual: las skills aparecen en `.claude/skills/` y su versión en `skills-lock.json`.
9. **Documentación.** Actualizar `CLAUDE.md`: variables de Supabase en `.env.local`, `shared/lib/supabase/` (qué cliente usar en cada sitio y que devuelven `null` sin variables), `proxy.ts`, `/api/health`, `npm run db:types` (y que `database.types.ts` no se edita a mano), pasos de `supabase login` y `supabase link`, y las nuevas skills en *Project skills*.

---

## Criterios de aceptación

- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` terminan sin errores.
- [x] `package.json` tiene `@supabase/supabase-js` y `@supabase/ssr` en `dependencies`, `supabase` en `devDependencies` y el script `db:types`.
- [ ] `.env.example` está versionado con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` vacías y comentadas, y `.env.local` sigue ignorado por Git.
- [x] `supabase/config.toml` y `supabase/migrations/.gitkeep` están versionados y `supabase/.temp/` está ignorado.
- [x] `npm run db:types` regenera `shared/lib/supabase/database.types.ts` sin diferencias respecto a la versión versionada.
- [x] Con `.env.local` correcto, `curl -i http://localhost:3000/api/health` responde `200` con `{"supabase":"ok"}`.
- [ ] Sin las variables de Supabase, `/api/health` responde `503` con `{"supabase":"error","reason":"missing_env"}` y `/`, `/biblioteca`, `/acceso` y `/acerca` cargan sin errores.
- [ ] Con `NEXT_PUBLIC_SUPABASE_URL` apuntando a un dominio inexistente, `/api/health` responde `503` con `"reason":"unreachable"` en menos de 6 s y la consola del servidor no muestra la URL ni la clave.
- [x] `/api/health` aparece como ruta dinámica en la salida de `npm run build` (no prerenderizada).
- [ ] Iniciar sesión en `/acceso` sigue guardando `{ name }` en `localStorage["av_user"]` y no hace peticiones a `*.supabase.co`.
- [x] Las peticiones a `/_next/static/*` no pasan por `proxy.ts` (el `matcher` las excluye).
- [ ] Ningún archivo versionado ni `.next/static` contiene `sb_secret_` ni `service_role`.
- [x] Las skills de `supabase/agent-skills` están en `.claude/skills/` y su versión en `skills-lock.json`.
- [ ] Home, Biblioteca, Acerca de y Acceso no muestran diferencias visuales respecto a antes del spec a 1440 px y a 390 px.

---

## Decisiones

- **Sí:** solo la integración base, sin funcionalidades. Auth, datos, Realtime y Edge Functions irán cada uno en su spec y compartirán esta base.
- **No:** reemplazar el login simulado ahora. Cambia `SessionProvider` y `/acceso`, y merece su propio spec.
- **No:** aplicar la guía del panel de Supabase literal. Borra la Home, consulta una tabla inexistente y usa `middleware.ts`, obsoleto en Next 16.
- **Sí:** `proxy.ts` desde este spec. `@supabase/ssr` necesita refrescar la sesión en cada petición; montarlo ahora deja el spec de auth centrado en el login.
- **No:** redirecciones o rutas protegidas en el proxy. No hay sesión real todavía.
- **Sí:** clientes en `shared/lib/supabase/`. Los usarán varias funcionalidades de `features/`.
- **No:** carpeta `utils/` de la guía. Rompe la convención del proyecto.
- **Sí:** cliente de servidor `async` que llama a `cookies()` por dentro. Quien lo usa no tiene que repetir `await cookies()`.
- **Sí:** la app funciona sin variables de Supabase y los clientes devuelven `null`. Nada visible depende todavía de Supabase y `proxy.ts` corre en cada petición; fallar rompería toda la app sin `.env.local`.
- **No:** lanzar un error si faltan variables. Bloquearía `npm run dev` y los tests a quien no tenga acceso al proyecto.
- **Sí:** ruta `/api/health` con una petición real a `/auth/v1/health`. Es la única forma de verificar la conexión sin tablas ni sesión, y sirve también en despliegue.
- **No:** usar `auth.getClaims()` como comprobación de salud. Sin sesión no hace ninguna petición de red, así que respondería `ok` aunque el proyecto no exista.
- **No:** solo tests unitarios. No prueban la conexión con el proyecto real.
- **Sí:** CLI como `devDependency` con script `db:types`. Todo el equipo usa la misma versión fijada en `package-lock.json`.
- **No:** `npx supabase@latest` o CLI global. La versión cambia entre máquinas.
- **Sí:** tipos generados y versionados desde ya, aunque `public` esté vacío. Los specs de datos solo añaden migraciones y regeneran.
- **Sí:** solo el proyecto remoto. No hay tablas que probar en local.
- **No:** stack local con Docker. Añade Docker Desktop como requisito sin beneficio todavía.
- **Sí:** solo la clave publicable. Es pública por diseño y RLS protegerá los datos cuando existan.
- **No:** clave secreta o `service_role`. Ninguna parte de este spec la necesita.
- **Sí:** Agent Skills de Supabase en este spec, fijadas en `skills-lock.json`. Los specs de auth, Realtime y Edge Functions las tendrán disponibles.

---

## Riesgos

| Riesgo                                                                                              | Mitigación                                                                                                                    |
| --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Las variables `NEXT_PUBLIC_` llegan `undefined` al navegador si se leen dinámicamente.         | `getSupabaseEnv` las escribe literalmente; queda documentado en el modelo de datos y en `CLAUDE.md`.                       |
| Cache Components prerenderiza `/api/health` en el build y siempre responde lo mismo.              | `await connection()` antes de comprobar; un criterio exige que el build la marque como dinámica.                            |
| El `matcher` del proxy deja pasar estáticos y añade latencia o rompe CSS y fuentes.             | `matcher` con exclusión negativa según la doc de `proxy.md`; criterio sobre `/_next/static/*`.                         |
| `proxy.ts` añade una llamada a Supabase en cada petición y ralentiza las páginas.              | Sin sesión, `getClaims()` no hace peticiones de red. Se revisará en el spec de auth, cuando haya sesiones reales.          |
| La redirección `>` del script `db:types` en Windows escribe el archivo con otra codificación. | El criterio de regenerar sin diferencias lo detecta; si falla, usar la salida a archivo de la CLI en lugar de la redirección. |
| `supabase link` pide datos interactivos (login, contraseña de la base de datos).                 | Es un paso manual de la persona, documentado en `CLAUDE.md`; el agente no lo ejecuta.                                        |
| La ruta de salud expone detalles del proyecto.                                                      | Solo devuelve `ok`, `missing_env` o `unreachable`; nunca la URL, la clave ni la respuesta de Supabase.                   |
| Los tests llaman a Supabase de verdad.                                                              | `fetch` se simula con `vi.stubGlobal`; ningún test lee `.env.local`.                                                    |

---

## Notas de implementación

Implementado el 2026-11-20 y aprobado por la persona responsable. Los criterios sin marcar no se verificaron durante la implementación.

- **Conexión real:** con `next start` y `.env.local`, `/api/health` respondió `200` con `{"supabase":"ok"}` y las rutas existentes `200`.
- **Archivos `.env*`:** el agente no tiene permiso para leerlos. `.env.example` y `.env.local` los editó la persona; por eso no se verificaron el contenido de `.env.example` ni el arranque sin variables. Los casos `missing_env` y `unreachable` están cubiertos por `shared/lib/supabase/health.test.ts`.
- **`service_role`:** no hay ninguna clave en el código ni en `.next/static`, pero la palabra aparece en un comentario generado de `supabase/config.toml` y en la documentación (skills, `CLAUDE.md`, este spec). El criterio debería decir "ninguna clave secreta".
- **Cabeceras anti-caché:** `@supabase/ssr` 0.12 pasa un segundo parámetro `headers` a `setAll`; `updateSession` las copia a la respuesta para que un CDN no cachee cookies de sesión.
- **Registro de errores:** los mensajes de error de red se registran con la URL, el host y la clave sustituidos por `<redacted>`, para cumplir a la vez "registrar `error.message`" y "nunca mostrar la URL".
- **CLI:** `supabase login` no funciona en un shell sin TTY; se hace desde PowerShell. La CLI 3.2.0 avisa de que `--linked` está obsoleto en favor de `--remote`.
- **`skills-lock.json`:** el CLI de skills migró el archivo a `version: 2` y vació los `computedHash` de las skills existentes; se restauraron a mano.
- **Next 16.4.2:** `next build` avisa de una vulnerabilidad conocida y pide actualizar. Queda fuera de este spec.

---

## Lo que **no** entra en este spec

- Login real con Supabase Auth y cambios en `/acceso` o `SessionProvider`.
- Tablas, migraciones con contenido, RLS y migración de datos de `localStorage`.
- Rutas protegidas o redirecciones por sesión.
- Realtime y Edge Functions.
- Stack local con Docker.
- Claves secretas o `service_role`.
- Configuración del despliegue.

Cada uno de estos puntos, si llega, irá en su propio spec.
