# SPEC 02 — Home y Acerca de

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-10-21
> **Objetivo:** Añadir las pantallas Home (nueva portada en `/`) y Acerca de (con formulario de contacto simulado) del prototipo `references/home-about/`, moviendo la Biblioteca a `/biblioteca`.

---

## Por qué existe este spec

El prototipo se amplió en `references/home-about/` con dos pantallas nuevas: una landing (`home.jsx`) y una página Acerca de con contacto (`about.jsx`).
En ese prototipo la ruta por defecto pasa a ser `home`, el logo lleva a Home y la barra de navegación añade los enlaces "Inicio" y "Acerca de" (`nav.jsx`).
Las demás pantallas (`biblioteca`, `detalle`, `reproductor`, `salon`, `auth`) y los datos (`data.jsx`) son idénticos a `references/templates/`; se comprobó extrayendo los `.jsx` del bundle `arcade-vault-standalone.html`.
Por eso la Biblioteca deja `/` y pasa a `/biblioteca`, y todos los enlaces que hoy la apuntan en `/` cambian.

---

## Alcance

**Entra:**

- Pantalla **Home** en `/`: hero con siluetas flotantes, "¿POR QUÉ ARCADE VAULT?", "JUEGOS DISPONIBLES AHORA" (los 6 primeros de `GAMES`), franja de estadísticas, "ACTIVIDAD EN VIVO", "PRECIOS" con FAQ y llamada final.
- Pantalla **Acerca de** en `/acerca`: misión, tres destacados, divisor animado y formulario de contacto con validación, efecto "shake" y mensaje de terminal al enviar.
- Animación de aparición al hacer scroll (`.reveal` → `.reveal.in`) en ambas pantallas, con `IntersectionObserver`.
- Mover la Biblioteca de `/` a `/biblioteca`.
- Barra de navegación y menú móvil con "Inicio" y "Acerca de", en el orden del prototipo. El logo lleva a `/`.
- Cambiar a `/biblioteca` los enlaces que hoy van a la Biblioteca en `/`: Detalle ("VOLVER AL VAULT"), Reproductor ("VOLVER AL VAULT"), Acceso (tras iniciar sesión y "JUGAR COMO INVITADO") y Salón ("VOLVER A LA BIBLIOTECA").
- Portar a `app/globals.css` los bloques nuevos de `references/home-about/styles.css` de forma literal y completa, incluido el bloque GAMEPAD que ninguna pantalla usa.
- Test de la validación del formulario de contacto (función pura).

**Fuera de alcance (para specs futuros):**

- Envío real del formulario de contacto, backend, correo o persistencia del mensaje.
- Datos reales en "ACTIVIDAD EN VIVO": el ticker y el top de jugadores son las filas fijas del prototipo.
- Cifras reales en la franja de estadísticas: "12+ JUEGOS" es texto fijo aunque el catálogo tenga 8 juegos.
- Usar el CSS del bloque GAMEPAD en alguna pantalla (mando virtual del Reproductor).
- Redirigir la antigua URL de la Biblioteca: `/` pasa a ser Home y no hay redirección.
- Tests de componentes o end-to-end.

---

## Modelo de datos

Este spec no añade claves de `localStorage` ni cambia los tipos de SPEC 01.
El contenido fijo de Home se copia literalmente de `home.jsx` a `features/home/data/home-content.ts`.

```ts
export type NeonColor = "cyan" | "magenta" | "yellow" | "green";

export type Feature = { icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET"; title: string; desc: string; color: NeonColor };
export type HomeStat = { n: string; u: string; s: string };                       // { n: "12+", u: "JUEGOS", s: "Y CONTANDO" }
export type RecentScore = { player: string; game: string; score: number; ago: string; color: NeonColor }; // ago: "hace 2 min"
export type TopPlayer = { rank: number; player: string; score: number };
```

El formulario de contacto vive en el estado del componente, con este tipo en `features/about/model/contact.ts`:

```ts
export type ContactForm = { name: string; email: string; msg: string };
```

Convenciones:

- `isContactFormComplete(form)` devuelve `true` solo si `name`, `email` y `msg` no están vacíos tras `trim()`. Es la misma regla del prototipo; no valida el formato del correo más allá de `type="email"`.
- El mensaje de éxito muestra el nombre recortado y en mayúsculas: "GRACIAS, PX_KAI.".
- Los números se formatean con `formatScore` (`toLocaleString("es-ES")`) y los rangos con `formatRank` (`#01`), ya existentes en `shared/lib/format.ts`.

---

## Estructura de archivos

```
app/
  page.tsx                    # Home (antes Biblioteca)
  biblioteca/page.tsx         # Biblioteca (movida desde app/page.tsx)
  acerca/page.tsx             # Acerca de
  globals.css                 # + bloques nuevos de references/home-about/styles.css
features/
  home/   data/home-content.ts,
          components/ (HomeScreen, FloatingSilhouettes, FeatureIcon, MiniCard, ActivitySection, PricingSection)
  about/  model/contact.ts, lib/contact-form.ts (+ test),
          components/ (AboutScreen, HighlightIcon, ContactForm, TerminalSuccess)
shared/
  lib/use-reveal.ts           # IntersectionObserver para .reveal
  components/Nav.tsx, MobileMenu.tsx   # + Inicio y Acerca de
```

- `HomeScreen`, `AboutScreen` y `ContactForm` llevan `"use client"`; el resto son componentes de presentación.
- La navegación de los botones del prototipo (`navigate({ name })`) se traduce a `<Link>` cuando no hay estado que limpiar.

---

## Plan de implementación

1. **CSS.** Copiar a `app/globals.css`, dentro de `@layer components`, los dos bloques que `references/home-about/styles.css` añade respecto a `references/templates/styles.css` (líneas 930–1147 y 1150–1725), sin cambios. Prueba manual: `npm run build` termina y las pantallas existentes no cambian.
2. **Mover la Biblioteca.** Crear `app/biblioteca/page.tsx` con `LibraryScreen` y dejar `app/page.tsx` renderizando temporalmente la misma pantalla. Cambiar a `/biblioteca` los enlaces de Detalle, Reproductor, Acceso y Salón.
3. **Navegación.** En `Nav.tsx` y `MobileMenu.tsx` añadir "Inicio" (activo solo en `/`) y "Acerca de" (activo en `/acerca`). "Biblioteca" pasa a estar activa en `/biblioteca` y `/juegos/*`. Orden: Inicio, Biblioteca, Salón de la Fama, Acerca de.
4. **Hook de aparición.** Crear `shared/lib/use-reveal.ts`: observa los `.reveal` dentro de un contenedor (`ref`) con `threshold: 0.12`, añade `in` y deja de observar cada elemento. Desconecta el observador al desmontar.
5. **Home: contenido.** Crear `features/home/data/home-content.ts` con las listas de `home.jsx` copiadas literalmente.
6. **Home: hero y "POR QUÉ".** Crear `HomeScreen`, `FloatingSilhouettes` y `FeatureIcon`. `app/page.tsx` pasa a renderizar `HomeScreen`. "EXPLORAR JUEGOS" lleva a `/biblioteca` y "CREAR CUENTA" a `/acceso`.
7. **Home: juegos y estadísticas.** Crear `MiniCard` con los 6 primeros juegos de `GAMES`; cada tarjeta lleva a `/juegos/[id]`. "VER TODOS LOS JUEGOS →" lleva a `/biblioteca`. Añadir la franja `home-stats`.
8. **Home: actividad, precios y cierre.** Crear `ActivitySection` (ticker y top con barras; "VER SALÓN →" lleva a `/salon`) y `PricingSection` ("EMPEZAR GRATIS →" lleva a `/acceso`). Añadir la sección final; "INSERTAR MONEDA →" lleva a `/biblioteca`.
9. **Validación de contacto con test.** Crear `features/about/model/contact.ts` y `features/about/lib/contact-form.ts` con `isContactFormComplete`. Escribir el test primero: campos vacíos o solo espacios devuelven `false`; los tres rellenos devuelven `true`.
10. **Acerca de.** Crear `AboutScreen`, `HighlightIcon`, `ContactForm` y `TerminalSuccess`, y la ruta `app/acerca/page.tsx`. Enviar incompleto aplica `shake` durante 400 ms; enviar completo muestra la terminal; "ENVIAR OTRO MENSAJE" vacía el formulario.
11. **Documentación.** Actualizar `CLAUDE.md`: rutas (`/` Home, `/biblioteca`, `/acerca`), funcionalidades `home` y `about`, la referencia `references/home-about/` y las carpetas de capturas `home`, `library` y `about`.

---

## Criterios de aceptación

- [x] `npm run lint`, `npx tsc --noEmit`, `npm test` y `npm run build` terminan sin errores.
- [x] `npm run build` prerenderiza `/`, `/biblioteca` y `/acerca`, además de las rutas de SPEC 01.
- [x] Home y Acerca de, vistas lado a lado con `references/home-about/arcade-vault-standalone.html`, muestran los mismos textos, colores, fuentes y disposición a 1440 px y a 390 px de ancho (con animaciones desactivadas y todos los `.reveal` visibles).
- [x] La Biblioteca en `/biblioteca` es idéntica a la que antes se servía en `/`.
- [x] El bloque CSS añadido en `app/globals.css` coincide carácter a carácter con las líneas 930–1147 y 1150–1725 de `references/home-about/styles.css`.
- [x] La consola del navegador no muestra errores ni avisos de hidratación en `/` ni en `/acerca`.
- [x] Al cargar `/`, las secciones con `.reveal` bajo el hero están ocultas y aparecen al hacer scroll hasta ellas.
- [x] El enlace activo es Inicio en `/`, Biblioteca en `/biblioteca` y `/juegos/*`, Salón de la Fama en `/salon` y Acerca de en `/acerca`, tanto en la barra como en el menú móvil.
- [x] El logo lleva a `/`.
- [x] En Home, "EXPLORAR JUEGOS", "VER TODOS LOS JUEGOS →" e "INSERTAR MONEDA →" llevan a `/biblioteca`; "CREAR CUENTA" y "EMPEZAR GRATIS →" llevan a `/acceso`; "VER SALÓN →" lleva a `/salon`.
- [x] Pulsar la mini tarjeta de CAÍDA lleva a `/juegos/caida`.
- [x] "VOLVER AL VAULT" (Detalle y modal del Reproductor), "VOLVER A LA BIBLIOTECA" (Salón), iniciar sesión y "JUGAR COMO INVITADO" llevan a `/biblioteca`.
- [x] En `/acerca`, enviar con algún campo vacío o solo con espacios no muestra la terminal y el formulario tiembla.
- [x] Enviar con nombre "px_kai", un correo y un mensaje muestra "> MENSAJE RECIBIDO. TE RESPONDEREMOS PRONTO. GRACIAS, PX_KAI.".
- [x] "ENVIAR OTRO MENSAJE" vuelve a mostrar el formulario con los tres campos vacíos.
- [x] Enviar el formulario no escribe nada en `localStorage` ni hace peticiones de red.

---

## Decisiones

- **Sí:** un solo spec para Home y Acerca de. Comparten la referencia, el cambio de la barra de navegación y el bloque de CSS.
- **No:** separar Acerca de en SPEC 03. Obligaría a tocar la navegación dos veces.
- **Sí:** Home en `/` y Biblioteca en `/biblioteca`. En el prototipo `home` es la ruta por defecto y el logo lleva a Home.
- **No:** Home en `/inicio` con la Biblioteca en `/`. Contradice el prototipo.
- **No:** redirigir `/` a `/biblioteca` para enlaces antiguos. La app no está publicada y `/` pasa a ser Home.
- **Sí:** portar el CSS nuevo de forma literal y completa, incluido el bloque GAMEPAD sin uso. Mismo criterio que SPEC 01 con el panel de tweaks: `globals.css` sigue siendo una copia verificable de la referencia.
- **No:** portar solo las clases usadas. Rompe la copia literal y complica comparar con futuras versiones del prototipo.
- **Sí:** formulario de contacto simulado, igual que el prototipo, sin envío ni persistencia.
- **No:** guardar los mensajes en `localStorage`. Es un comportamiento que el prototipo no tiene.
- **Sí:** extraer la validación a `isContactFormComplete` con test. Es la única lógica pura nueva y sigue la regla de SPEC 01 de testear solo lógica pura.
- **Sí:** contenido fijo de Home (características, estadísticas, ticker, top) copiado literalmente a `home-content.ts`, separado de los componentes.
- **Sí:** `useReveal` observa los `.reveal` dentro del contenedor de la pantalla, no todo el `document` como el prototipo. Con Cache Components las rutas ocultas siguen en el DOM y el selector global las incluiría.

---

## Riesgos

| Riesgo                                                                                                                                                               | Mitigación                                                                                                                                                                                                                                                                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Cache Components conserva el estado de `/acerca` al navegar: al volver se vería la terminal de éxito en lugar del formulario vacío, a diferencia del prototipo. | Reiniciar el formulario cuando la pantalla se oculta (limpieza de un efecto) y comprobarlo navegando a otra ruta y volviendo.                                                                                                                                                                                                    |
| `.reveal` empieza con `opacity: 0`: si el observador no se ejecuta, las secciones quedan invisibles.                                                             | `useReveal` corre tras montar en un componente cliente; verificar sin errores de consola y con scroll real en Playwright.                                                                                                                                                                                                      |
| Las capturas de paridad salen con secciones ocultas o a medio animar.                                                                                                | En las capturas, desactivar animaciones y forzar `.reveal.in` en ambas páginas antes de capturar.                                                                                                                                                                                                                             |
| El bloque CSS nuevo redefine selectores existentes y altera pantallas de SPEC 01.                                                                                    | Se comprobó que `globals.css` no tiene `.kicker`, `.stat-block`, `.reveal` ni los `@keyframes` `float`, `bounce` y `shake`, y que el bloque nuevo no redefine `.field`, `.card` ni `.btn` a nivel raíz (solo añade `.btn.press`). Tras el paso 1, comparar las pantallas de SPEC 01 con sus capturas. |
| Enlaces a la Biblioteca olvidados en `/`.                                                                                                                          | El paso 2 lista los cinco usos actuales (`AuthScreen` ×2, `GameDetailScreen`, `HallOfFameScreen`, `PlayerScreen`); buscar `"/"` en `features/` y `shared/` antes de cerrar.                                                                                                                                       |

---

## Notas de implementación

Verificado el 2026-10-21 con el MCP de Playwright contra `references/home-about/arcade-vault-standalone.html` (capturas en `.playwright-screenshots/`, no versionadas).

- **Fuentes del bundle:** `arcade-vault-standalone.html` incrusta versiones de Press Start 2P y JetBrains Mono distintas de `app/fonts/`. La paridad se midió sustituyendo en el prototipo las fuentes de la app.
- **Paridad visual:** Home 8 px (1440) y 3 px (390), Acerca de 4 px y 3 px, menú móvil 0 px; ninguna diferencia supera 16 por canal.
- **Botones convertidos en `<Link>`:** un `<a>` no centra el texto como un `<button>`. Los seis enlaces con clase `btn` o `lb-link` de Home llevan `textAlign: "center"` en línea, porque a 390 px "EMPEZAR GRATIS →" y "VER SALÓN →" ocupan dos líneas.
- **Reinicio del formulario:** `ContactForm` vacía el formulario en la limpieza de un efecto; al volver a `/acerca` por navegación de cliente aparece vacío.

## Lo que **no** entra en este spec

- Envío real o persistencia de los mensajes de contacto.
- Datos reales en la actividad en vivo y en las estadísticas de Home.
- Uso del CSS GAMEPAD en el Reproductor.
- Redirección de la antigua URL de la Biblioteca.
- Tests de componentes y end-to-end.

Cada uno de estos puntos, si llega, irá en su propio spec.
