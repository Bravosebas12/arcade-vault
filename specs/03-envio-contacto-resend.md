# SPEC 03 — Envío real del formulario de contacto con Resend

> **Estado:** Implementado
> **Depende de:** SPEC 02
> **Fecha:** 2026-10-21
> **Objetivo:** Hacer que el formulario de contacto de `/acerca` envíe un correo real al equipo mediante Resend, sin cambiar el diseño portado de `references/home-about/about.jsx`.

---

## Por qué existe este spec

La pantalla Acerca de ya está implementada y verificada contra el prototipo en SPEC 02, pero su formulario es simulado: muestra la terminal de éxito sin enviar nada.
Este spec conecta ese formulario a Resend mediante una Server Action.
El prototipo no tiene estados de "enviando" ni de error porque nunca envía. Este spec los añade con la estética existente (botón deshabilitado y una terminal de error).
Cambia un criterio de SPEC 02: enviar el formulario ahora sí hace una petición al servidor.

---

## Alcance

**Entra:**

- Server Action que valida el formulario y envía un correo en texto plano al equipo con Resend.
- Validación compartida por cliente y servidor: campos no vacíos, formato de correo y longitudes máximas.
- Campo trampa (honeypot) contra bots.
- Estado "enviando": el botón muestra "▶  ENVIANDO…" y los campos y el botón quedan deshabilitados.
- Terminal de error con el estilo de la terminal de éxito y un botón "REINTENTAR" que vuelve al formulario con los datos intactos.
- Configuración por variables de entorno del servidor: clave de API, remitente y destinatario.
- Tests de la validación, del contenido del correo y de las ramas de la Server Action (con Resend simulado).

**Fuera de alcance (para specs futuros):**

- Dominio propio verificado en Resend: se usa `onboarding@resend.dev` hasta tenerlo; cambiarlo es solo cambiar variables.
- Correo de confirmación al usuario.
- Límite de envíos por IP, CAPTCHA o cualquier otra protección contra abuso además del honeypot.
- Plantillas HTML o React Email: el correo es texto plano.
- Guardar los mensajes en una base de datos o en `localStorage`.
- Configurar las variables de entorno en un proveedor de despliegue.
- Cambios visuales en el resto de la pantalla Acerca de.

---

## Modelo de datos

`ContactForm` (SPEC 02, `features/about/model/contact.ts`) no cambia. Se añaden estos tipos en el mismo archivo:

```ts
export type ContactField = "name" | "email" | "msg";

// Resultado de la Server Action, consumido por useActionState
export type ContactActionState =
  | { status: "idle" }
  | { status: "sent"; name: string }                  // nombre recortado, para "GRACIAS, PX_KAI."
  | { status: "error"; form: ContactForm };           // datos enviados, para restaurarlos al reintentar
```

Límites en `features/about/lib/contact-form.ts`:

```ts
export const CONTACT_LIMITS = { name: 40, email: 254, msg: 2000 } as const;
```

Variables de entorno (solo servidor, nunca con prefijo `NEXT_PUBLIC_`). Se versiona una plantilla `.env.example` en la raíz; para usarla se copia a `.env.local` (no versionado) y se rellena:

```
# Clave de API de Resend (https://resend.com/api-keys). Obligatoria.
RESEND_API_KEY=

# Correo que recibe los mensajes del formulario. Obligatorio.
# Sin dominio verificado en Resend, debe ser el correo de tu cuenta Resend.
CONTACT_TO_EMAIL=

# Remitente. Opcional; por defecto "Arcade Vault <onboarding@resend.dev>".
CONTACT_FROM_EMAIL=
```

Convenciones:

- El remitente (`from`) es siempre la dirección técnica de la app, nunca la persona que rellena el formulario. El correo de esa persona solo va en `replyTo` y en el cuerpo.
- No se requiere sesión: cualquiera que visite `/acerca` puede enviar el formulario.
- El campo honeypot se llama `website`. Si llega con texto, la acción responde `{ status: "sent" }` sin llamar a Resend.
- El correo tiene asunto `[Arcade Vault] Mensaje de <nombre>`, `replyTo` igual al correo del usuario y un cuerpo de texto con las líneas `Nombre:`, `Correo:` y el mensaje.
- Los valores se recortan con `trim()` antes de validar y de enviar.
- Si falta `RESEND_API_KEY` o `CONTACT_TO_EMAIL`, o Resend devuelve `error`, la acción responde `{ status: "error" }` y registra en el servidor solo `error.name` y `error.message`, nunca el contenido del mensaje.

---

## Estructura de archivos

```
.env.example                     # plantilla de variables (versionada)
.gitignore                       # + !.env.example
features/about/
  model/contact.ts               # + ContactField, ContactActionState
  lib/contact-form.ts            # + CONTACT_LIMITS, validateContactForm (+ test)
  lib/contact-email.ts           # buildContactEmail: asunto, texto, replyTo (+ test)
  actions/send-contact.ts        # "use server": honeypot, validación, Resend (+ test)
  components/ContactForm.tsx     # useActionState, estados enviando y error
  components/TerminalError.tsx   # terminal de error con REINTENTAR
```

- `actions/` es una carpeta nueva dentro de la funcionalidad, solo para Server Actions.
- `TerminalSuccess.tsx` no cambia, salvo su comentario ("nothing is actually sent" deja de ser cierto).

---

## Plan de implementación

1. **Dependencia y variables.** Instalar `resend` como dependencia. Crear `.env.example` con el contenido del modelo de datos y añadir `!.env.example` a `.gitignore` tras la regla `.env*`. Prueba manual: `git status` muestra `.env.example` y `npm run build` termina.
2. **Validación con test.** Añadir `CONTACT_LIMITS` y `validateContactForm(form): ContactField | null` en `contact-form.ts`, que devuelve el primer campo inválido o `null`. Test primero: vacío, solo espacios, correo sin `@` o sin dominio, cada límite justo en el máximo (válido) y en máximo + 1 (inválido). `isContactFormComplete` se mantiene.
3. **Contenido del correo con test.** Crear `contact-email.ts` con `buildContactEmail(form)` que devuelve `{ subject, text, replyTo }` con los valores recortados. Test primero con el formulario "px_kai".
4. **Server Action con test.** Crear `actions/send-contact.ts` con `sendContact(prev, formData): Promise<ContactActionState>`. Orden: honeypot, validación, variables de entorno (`CONTACT_FROM_EMAIL` vacía usa el remitente por defecto), `resend.emails.send`. Test con `resend` simulado (`vi.mock`): honeypot no llama a Resend y responde `sent`; formulario inválido responde `error` sin llamar; sin `RESEND_API_KEY` responde `error`; respuesta con `error` responde `error`; éxito llama con `from`, `to`, `subject`, `text` y `replyTo` esperados y responde `sent` con el nombre recortado.
5. **Formulario conectado.** En `ContactForm.tsx`, usar `useActionState(sendContact, { status: "idle" })` y `<form action={formAction}>`. Los campos llevan `name`, `maxLength` según `CONTACT_LIMITS` y siguen controlados. El envío incompleto sigue aplicando `shake` sin llamar a la acción. Mientras `pending`, el botón muestra "▶  ENVIANDO…" y botón y campos quedan `disabled`.
6. **Honeypot.** Añadir el campo `website` fuera de pantalla, con `tabIndex={-1}`, `autoComplete="off"` y `aria-hidden`, sin clases nuevas en `globals.css`.
7. **Terminal de error.** Crear `TerminalError.tsx` con las clases de la terminal (`terminal-success`, `term-bar`, `term-body`, `line`, `prompt`, `dim`) y estilos en línea en magenta para el borde y la última línea. Líneas: `vault@arcade:~$ ./send_message --to=team`, `[OK] Conectando con servidor…`, `[ERR] No se pudo transmitir el paquete.` y `> ERROR AL ENVIAR. INTÉNTALO DE NUEVO EN UNOS MINUTOS._`. "REINTENTAR" vuelve al formulario con los datos de `state.form`.
8. **Reinicios.** "ENVIAR OTRO MENSAJE", "REINTENTAR" y la limpieza del efecto (Cache Components) vuelven al estado inicial remontando el formulario interno con un `key` incremental, porque `useActionState` no se puede reiniciar directamente. "REINTENTAR" conserva los datos; los otros dos los vacían.
9. **Documentación.** Actualizar `CLAUDE.md`: copiar `.env.example` a `.env.local` y rellenar la clave, restricción de `onboarding@resend.dev` y la carpeta `actions/`. Actualizar el comentario de `ContactForm` y `TerminalSuccess`.

---

## Criterios de aceptación

- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` terminan sin errores.
- [x] `.env.example` está versionado con `RESEND_API_KEY`, `CONTACT_TO_EMAIL` y `CONTACT_FROM_EMAIL` vacías y comentadas, y `.env.local` sigue ignorado por Git.
- [x] Con solo `RESEND_API_KEY` y `CONTACT_TO_EMAIL` en `.env.local`, el correo sale desde "Arcade Vault <onboarding@resend.dev>".
- [x] Con `RESEND_API_KEY` y `CONTACT_TO_EMAIL` igual al correo de la cuenta Resend, enviar como "px_kai" muestra "> MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, PX_KAI." y el correo llega con asunto "[Arcade Vault] Mensaje de px_kai".
- [x] Responder ese correo desde el cliente de correo usa como destinatario el correo que escribió el usuario.
- [x] Sin `RESEND_API_KEY`, enviar un formulario válido muestra la terminal de error y la consola del servidor registra el motivo sin el contenido del mensaje.
- [x] "REINTENTAR" vuelve al formulario con nombre, correo y mensaje intactos.
- [x] Mientras se envía, el botón muestra "▶  ENVIANDO…" y ni el botón ni los campos aceptan entrada.
- [x] Enviar con algún campo vacío o solo con espacios sigue aplicando `shake` y no hace ninguna petición al servidor.
- [x] Un formulario con el campo `website` relleno muestra la terminal de éxito y no llama a Resend (comprobado en el test de la acción).
- [x] Los campos no aceptan más de 40, 254 y 2000 caracteres respectivamente.
- [x] Ninguna variable de entorno de Resend aparece en el JavaScript enviado al navegador (`.next/static` no contiene `RESEND_API_KEY` ni su valor).
- [x] El formulario en reposo y la terminal de éxito siguen sin diferencias visuales respecto a `references/home-about/` a 1440 px y a 390 px.
- [x] Al salir de `/acerca` y volver por navegación de cliente, el formulario aparece vacío en cualquiera de los tres estados (formulario, éxito, error).

---

## Decisiones

- **Sí:** solo el envío real. La pantalla Acerca de ya está portada y verificada con 0 px de diferencia en SPEC 02.
- **Sí:** Server Action con `useActionState`. Es el patrón de formularios de la guía de Next 16 (`node_modules/next/dist/docs/01-app/02-guides/forms.md`) y trae el estado `pending`.
- **No:** Route Handler `POST /api/contact`. Solo tendría sentido si otro cliente fuera a usarlo.
- **Sí:** remitente y destinatario en variables de entorno, con `onboarding@resend.dev` por ahora. Sin dominio verificado, Resend solo entrega a la cuenta dueña; con dominio basta cambiar las variables.
- **Sí:** validación propia sin dependencias, compartida por cliente y servidor. Son tres campos.
- **No:** Zod. Una dependencia para tres reglas.
- **Sí:** honeypot como única protección contra bots. No guarda datos ni depende de servicios externos.
- **No:** límite por IP en memoria. En serverless no se comparte entre instancias.
- **Sí:** solo un correo al equipo, en texto plano, con `replyTo` del usuario.
- **No:** correo de confirmación al usuario. Sin dominio verificado fallaría siempre.
- **Sí:** terminal de error con el lenguaje visual de la terminal de éxito y estilos en línea. `app/globals.css` sigue siendo una copia literal del prototipo.
- **Sí:** botón y campos deshabilitados mientras se envía. Evita envíos dobles sin claves de idempotencia.
- **No:** clave de idempotencia de Resend. El botón deshabilitado ya evita el doble envío del caso normal.
- **Sí:** el honeypot responde éxito sin enviar, para no indicarle al bot que fue detectado.
- **Sí:** `.env.example` versionado como el lugar donde poner la clave de Resend, con una excepción `!.env.example` en `.gitignore`. La clave real va en `.env.local`, que nunca se versiona.
- **No:** escribir la clave directamente en el código o en un archivo versionado. Quedaría expuesta en el repositorio.
- **Sí:** remitente fijo de la app (`onboarding@resend.dev` por defecto), independiente de quién rellena el formulario. Resend exige un remitente de un dominio autorizado; el correo del visitante no lo es.

---

## Riesgos

| Riesgo                                                                                                                | Mitigación                                                                                                                             |
| --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Con `onboarding@resend.dev`, enviar a un destinatario distinto del correo de la cuenta falla siempre.               | `CONTACT_TO_EMAIL` se documenta como el correo de la cuenta; el fallo se ve en la terminal de error y en el registro del servidor.    |
| La clave de API se filtra al navegador.                                                                               | Solo se lee dentro de la Server Action, sin `NEXT_PUBLIC_`; un criterio busca su valor en `.next/static`.                           |
| `useActionState` y el estado propio del formulario (controlado, `shake`, reinicio por Cache Components) se pisan. | Un único `key` incremental remonta el formulario interno para cada reinicio; el criterio de navegar y volver cubre los tres estados. |
| Los tests llaman a Resend de verdad.                                                                                  | `resend` se simula con `vi.mock` en el test de la acción; ningún test lee `.env.local`.                                         |
| Abuso de la cuota de Resend por envíos manuales repetidos.                                                           | Fuera de alcance; el honeypot solo frena bots simples. Queda anotado para un spec futuro.                                               |

---

## Notas de implementación

Verificado el 2026-10-21 con el MCP de Playwright y un envío real (capturas en `.playwright-screenshots/about/`, no versionadas).

- **Envío real:** el correo llegó a la bandeja de la cuenta Resend con `CONTACT_FROM_EMAIL` vacío (remitente por defecto). `replyTo`, asunto y remitente por defecto también están cubiertos por el test de la acción.
- **Remitente inválido:** un primer intento con un `@gmail.com` en `CONTACT_FROM_EMAIL` falló con `validation_error: The gmail.com domain is not verified`. Sin dominio propio, el remitente solo puede ser `onboarding@resend.dev`; el correo personal va en `CONTACT_TO_EMAIL`.
- **Variables de entorno:** Next.js solo lee `.env.local` al arrancar el servidor; tras cambiarlo hay que reiniciar `next dev` o `next start`.
- **Validación en el cliente:** el formulario tiembla con la regla compartida `validateContactForm`, así que un correo como `a@b`, que `type="email"` acepta, tampoco llega al servidor.
- **Paridad visual:** el formulario en reposo difiere en 4 px (1440) y 0 px (390) del prototipo, ninguno por encima de 16 por canal.
- **Fuga de la clave:** `.next/static` no contiene los nombres de las variables ni cadenas con forma de clave de Resend, con un build hecho con `.env.local`.

## Lo que **no** entra en este spec

- Dominio verificado y correo de confirmación al usuario.
- Límite por IP, CAPTCHA u otras protecciones contra abuso.
- Plantillas HTML o React Email.
- Persistencia de los mensajes.
- Configuración del despliegue.

Cada uno de estos puntos, si llega, irá en su propio spec.
