# Arcade Vault

Portal de juegos arcade retro con estética neón/CRT, construido con Next.js 16. Incluye la portada, la biblioteca de juegos, el detalle, los juegos reales (Meteor Storm, Falling Blocks, Brick Breaker y Neon Snake; el catálogo solo muestra juegos implementados), el acceso, el Salón de la Fama con rankings reales en [Supabase](https://supabase.com) y la página Acerca de con un formulario de contacto que envía correos reales con [Resend](https://resend.com).

## Inicio rápido

1. Instala las dependencias:

   ```bash
   npm install
   ```

2. Crea tu archivo de variables locales a partir de la plantilla:

   ```bash
   cp .env.example .env.local
   ```

3. Rellena `.env.local` con tu clave de Resend, tu correo y las variables de Supabase (ver [Variables de entorno](#variables-de-entorno)).

4. Arranca el servidor de desarrollo:

   ```bash
   npm run dev
   ```

5. Abre [http://localhost:3000](http://localhost:3000). Para comprobar el correo, envía el formulario en `/acerca` y revisa tu bandeja (o la carpeta de spam).

> Sin `.env.local` la aplicación funciona igual, salvo el formulario de contacto (muestra la terminal de error al enviar) y los rankings reales (se muestran puntuaciones simuladas).

## Requisitos

| Herramienta | Versión |
| ----------- | ------- |
| Node.js | 24 (el proyecto usa `@types/node` 24 y Vitest 5) |
| npm | El que trae Node 24 |
| Cuenta de Resend | Gratuita; solo para el formulario de contacto |
| Proyecto de Supabase | Opcional; para los rankings reales (plan gratuito) |

## Variables de entorno

La plantilla `.env.example` está versionada; los valores reales van en `.env.local`, que Git ignora. **Nunca pongas valores reales en `.env.example`.**

### Contacto (Resend), solo servidor

| Variable | Obligatoria | Qué es |
| -------- | ----------- | ------ |
| `RESEND_API_KEY` | Sí, para el formulario | Clave de API de Resend. Se crea en [resend.com/api-keys](https://resend.com/api-keys). |
| `CONTACT_TO_EMAIL` | Sí, para el formulario | Correo que **recibe** los mensajes del formulario. Sin dominio verificado, debe ser el correo con el que te registraste en Resend. |
| `CONTACT_FROM_EMAIL` | No | **Remitente**. Déjalo vacío para usar `Arcade Vault <onboarding@resend.dev>`. Solo cámbialo si tienes un dominio verificado en Resend. |

### Supabase (públicas, también llegan al navegador)

| Variable | Obligatoria | Qué es |
| -------- | ----------- | ------ |
| `NEXT_PUBLIC_SUPABASE_URL` | No | URL del proyecto: `https://<project-ref>.supabase.co`. Está en el panel de Supabase, en *Project Settings → API Keys*. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No | Clave **publicable** (`sb_publishable_...`), del mismo sitio. Es pública por diseño: la seguridad la ponen RLS y la función `submit_score`. |

Sin las variables de Supabase la app funciona igual: el Salón de la Fama y el Detalle muestran puntuaciones simuladas, guardar una puntuación solo la escribe en `localStorage` y `/api/health` responde 503. **Nunca** añadas una clave secreta (`sb_secret_...`) ni la `service_role`: el proyecto no las usa.

Ejemplo de `.env.local`:

```
RESEND_API_KEY=re_tu_clave
CONTACT_TO_EMAIL=tu-correo-de-resend@gmail.com
CONTACT_FROM_EMAIL=

NEXT_PUBLIC_SUPABASE_URL=https://tu-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tu_clave
```

Para comprobar la conexión con Supabase: `curl -i http://localhost:3000/api/health` debe responder `200 {"supabase":"ok"}`.

Next.js lee `.env.local` al arrancar: **reinicia el servidor** después de cambiarlo.

### Problemas frecuentes con el correo

| Síntoma | Causa | Solución |
| ------- | ----- | -------- |
| Terminal de error y en el servidor `The gmail.com domain is not verified` | `CONTACT_FROM_EMAIL` tiene un correo personal (Gmail, Outlook...). | Deja `CONTACT_FROM_EMAIL` vacío. |
| Terminal de error y en el servidor `RESEND_API_KEY is not set` | Falta la clave o el servidor no se reinició. | Revisa `.env.local` y reinicia. |
| Resend rechaza el destinatario | Sin dominio verificado, Resend solo entrega al correo de tu cuenta. | Pon ese correo en `CONTACT_TO_EMAIL`. |
| El correo no aparece en la bandeja | Los envíos desde `onboarding@resend.dev` suelen ir a spam. | Revisa la carpeta de spam. |

## Comandos

| Comando | Qué hace |
| ------- | -------- |
| `npm run dev` | Servidor de desarrollo en `http://localhost:3000`. |
| `npm run build` | Build de producción. |
| `npm run start` | Sirve el build de producción. |
| `npm run lint` | ESLint. |
| `npx tsc --noEmit` | Comprobación de tipos (ejecútalo tras un build si faltan tipos de rutas). |
| `npm test` | Tests con Vitest (una sola pasada). |
| `npm run test:watch` | Tests en modo observación. |
| `npm run db:types` | Regenera `shared/lib/supabase/database.types.ts` desde el proyecto de Supabase enlazado (requiere `npx supabase login` y `npx supabase link --project-ref <project-ref>` una vez, desde PowerShell). |

Antes de abrir un PR, deben pasar `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build`.

## Rutas

| Ruta | Pantalla |
| ---- | -------- |
| `/` | Home (portada) |
| `/biblioteca` | Biblioteca de juegos con búsqueda y filtro |
| `/juegos/[id]` | Detalle de un juego |
| `/juegos/asteroids/jugar` | Meteor Storm |
| `/juegos/falling-blocks/jugar` | Falling Blocks |
| `/juegos/brick-breaker/jugar` | Brick Breaker |
| `/juegos/snake/jugar` | Neon Snake |
| `/acceso` | Iniciar sesión / crear cuenta (simulado) |
| `/salon` | Salón de la Fama (ranking real por juego real) |
| `/acerca` | Acerca de y formulario de contacto |
| `/api/health` | Comprueba la conexión con Supabase |

La sesión sigue simulada en `localStorage` (`av_user`). Las puntuaciones de los juegos reales se guardan en Supabase (tablas `games` y `scores`) y, como copia local, en `localStorage` (`av_scores`, y el último nombre usado en `av_player_name`).
## Despliegue

`.env.local` no se sube al repositorio. En el proveedor de despliegue (por ejemplo, Vercel) configura como variables de entorno:

- `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y, si aplica, `CONTACT_FROM_EMAIL` (servidor)
- `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (públicas; se incluyen en el build, así que hay que volver a construir tras cambiarlas).

Después, vuelve a desplegar.

## Cómo se trabaja en el proyecto

- **Specs:** cada funcionalidad se define antes en `specs/NN-slug.md` y se implementa en una rama `spec-NN-slug`. Ver `specs/` para el historial.
- **Ramas:** nunca se hace commit directo a `main`; todo entra por PR.
- **Prototipo de referencia:** `references/templates/` y `references/home-about/` son la especificación visual. La app debe verse igual que el prototipo.
- **Guía técnica:** `CLAUDE.md` describe la arquitectura, la configuración no obvia (Tailwind sin preflight, fuentes locales, Cache Components) y la verificación visual con Playwright.
