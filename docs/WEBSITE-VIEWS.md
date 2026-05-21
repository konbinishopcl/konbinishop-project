# Vistas del Website — Konbini

**Stack:** Next.js 15 + React 19 + TypeScript. Sin UI library — CSS custom con variables.  
**Rendering:** Server Components para data fetching, Client Components solo para interactividad.  
**Auth:** JWT en localStorage via React Context (`UserCtx`). Guards por `useUser()` + `ready` flag.  
**API Base:** `NEXT_PUBLIC_API_URL` (default `http://localhost:3333/api`)

---

## Roles de usuario

| Rol | Puede acceder a |
|---|---|
| Anónimo | Todo el sitio público |
| `AUTHENTICATED` | `/cuenta`, `/crear`, y el sitio público |
| `ADMIN` / `SUPER_ADMIN` | Todo lo anterior + `/dashboard` |

> `/cuenta` es para **todos** los usuarios autenticados, incluyendo admins y super admins. Es donde cualquier usuario edita su perfil, ve sus publicaciones y gestiona su cuenta personal.

---

## Vistas públicas

### `/` — Home
**Server component.** Fetcha eventos, categorías, heroes, usuarios recientes y estadísticas en paralelo.

#### Secciones (en orden de arriba a abajo)

**1. Hero carousel**
Slides de heroes aprobados. Imagen full-width, título, subtítulo acento, descripción corta, fecha, lugar, botón CTA. Si no hay heroes: no se muestra.

**2. Destacados — Top 12 más likeados**
Grid de 6 columnas × 2 filas (12 eventos). Sin botón "Ver todos".
- Ordenados por `_count.likes` descendente
- Si hay menos de 12 eventos: muestra los que haya
- Si no hay ninguno: **empty state** — mensaje + ilustración + CTA a `/crear`
- API: `GET /events?pageSize=12&sortBy=likes`
- Nota: requiere agregar `sortBy=likes` al query DTO de la API (`QueryEventsDto`) y al `orderBy` del servicio

**3. Últimos en unirse — Social proof**
Franja horizontal con avatares de los últimos N usuarios registrados (con foto o iniciales), contador total de organizadores, y frase tipo "Únete a +500 organizadores que ya publican en Konbini".
- API: `GET /users/recent` (endpoint público a crear — devuelve solo `id`, `firstname`, `lastname`, `avatar` del profile)
- Si no hay usuarios: no se muestra

**4. Newsletter**
Sección con frase vendedora, campo de email y botón de suscripción.
- API: `POST /newsletter/subscribe` con `{ email }` (endpoint a crear, modelo `Subscriber` en Prisma)
- Estado: idle → loading → success ("¡Listo! Te avisamos de los mejores eventos") → error
- No requiere estar logueado

**5. Rails por categoría**
Hasta 6 eventos por categoría (landscape cards). Solo se muestra si hay al menos un evento en esa categoría.
- Si una categoría no tiene eventos aprobados: se omite silenciosamente (no empty state por categoría)
- El link "Ver todos" apunta a `/[category]` (ej. `/musica`)

> **No modificar:** Esta sección ya está implementada y funciona correctamente. El botón "Ver todos" de cada rail está presente e intencional.

#### Empty states
- **Sin eventos destacados:** ilustración + "Aún no hay eventos publicados" + botón "Publicar el primero" → `/crear`
- **Sin heroes:** la sección no se renderiza (no empty state visible)
- **Sin categorías con eventos:** no se renderiza ningún rail

**APIs implementadas:**

- `GET /events?pageSize=12&sortBy=likes` — devuelve los 12 más likeados
- `GET /users/recent` — público, devuelve últimos 10 usuarios: `{ id, firstname, lastname, profile: { avatar } }`
- `POST /subscribers` — `{ email }`, sin auth requerida

---

### `/[category]` — Eventos por categoría

**Server component.** Fetcha categorías y eventos filtrados por slug de categoría. Ejemplo: `demo.com/musica`.

> Las rutas estáticas del sitio (`/busqueda`, `/login`, `/registro`, `/cuenta`, `/crear`, `/carrito`, `/dashboard`, `/u`) tienen precedencia sobre este segmento dinámico en Next.js App Router.

**Renderiza:** Nombre de categoría, contador de resultados, grilla de EventCards.

**Pendiente:** Los chips de filtro (Hoy, Esta semana, etc.) y la barra de filtros (fecha, región, orden) son visuales — sin funcionalidad.

---

### `/[category]/[slug]` — Detalle de evento

**Server component.** Fetcha el evento por slug. `notFound()` si no existe o no está aprobado. Ejemplo: `demo.com/musica/concierto-de-jazz`.

**Renderiza:**

- Imagen de fondo (banner o poster) con overlay
- Categoría, empresa organizadora, título, fecha y lugar
- Descripción y "about"
- Galería (máx 5 imágenes)
- Links a categorías del evento
- Panel lateral con entradas (precios o "Liberado"), botón de compra externo si hay `ticketUrl`
- Fechas y horarios, dirección y ubicación
- Links sociales y videos

**Reglas:**

- Solo eventos con `status: APPROVED` son accesibles públicamente
- `ticketUrl` es externo — el botón redirige fuera del sitio
- Si el evento tiene múltiples categorías, la URL usa la categoría principal (primera del array)

---

### `/busqueda` — Búsqueda
**Server component** fetcha resultados iniciales desde `searchParams` para SSR.  
**SearchView (client)** maneja refetch al cambiar filtros, sincroniza con la URL.

**Filtros disponibles:** texto libre (`q`), categoría, región.  
URL compartible: `/busqueda?q=anime&category=convenciones&region=...`

---

## Vistas autenticadas (`AUTHENTICATED` +)

### `/cuenta` — Mi cuenta
**Client component.** Redirige a `/login` si no hay sesión.

**Estado actual implementado:**
- Sidebar con avatar (iniciales), nombre, email
- Botón "Editar perfil" → abre `ProfileModal` (edita nombre, email, teléfono — **solo en contexto local, no persiste en API**)
- Nav: Mis publicaciones, Crear evento, Cerrar sesión
- Tabs: Todos / En revisión / Publicados / Rechazados
- Lista de eventos propios con estado, motivo de rechazo (si aplica), precio y link a la publicación

**Pendiente / Por implementar:**
- **Editar perfil** → debe llamar a `PUT /profiles/me` con los campos del modelo `Profile` (displayName, bio, avatar, banner, slug, website, instagram, tiktok, facebook, x, youtube, twitch, linkedin)
- **Subir avatar/banner** → `POST /uploads` + guardar URL en el perfil
- **Ver mi perfil público** → link a `/u/:slug` (vista de perfil público, aún no existe en el website)

#### Tab: Mis avisos

Lista los spots del usuario (`GET /spots/mine`). Muestra estado, fechas de vigencia y link al aviso.

- Botón "Crear aviso" → abre el formulario de aviso (mismo formulario que el upsell). El usuario puede crear un aviso de forma independiente, sin necesidad de haber creado un evento antes.
- Puede editar (`PATCH /spots/:id`) o eliminar (`DELETE /spots/:id`) avisos propios en `DRAFT` o `REJECTED`.

#### Tab: Mis heroes

Lista los heroes del usuario (`GET /heroes/mine`). Muestra estado, imagen, título y fechas de vigencia.

- Botón "Crear hero" → abre el formulario de hero (mismo formulario que el upsell). El usuario puede crear un hero de forma independiente.
- Puede editar (`PATCH /heroes/:id`) o eliminar (`DELETE /heroes/:id`) heroes propios en `DRAFT` o `REJECTED`.

> Esta vista aplica igual para usuarios `ADMIN` y `SUPER_ADMIN`. El admin también edita su perfil aquí.

---

### `/crear` — Crear evento
**Client component.** Redirige a `/login` si no hay sesión. Wizard de 3 pasos.

**Paso 1:** Título, empresa, categoría, descripción, "about", tipo de entrada (gratis / precios)  
**Paso 2:** Fechas/horarios, región → comuna, dirección, URL de tickets, links de RRSS  
**Paso 3:** Banner, poster, galería (máx 10), videos, confirmación antes de enviar

#### Selección de región y comuna (Paso 2)

El selector de ubicación sigue este flujo en cascada:

1. Al cargar el paso 2: llamar `GET /regions` para poblar el dropdown de región.
2. Al elegir una región: llamar `GET /communes?region=<slug>` (filtra por slug de la región seleccionada) para poblar el dropdown de comuna.
3. El `POST /events` final envía `regionId` y `communeId` como IDs enteros.

> El filtro de comunas usa el slug de la región (`?region=<slug>`), no el ID.

**Flujo:** `POST /events` → queda en `DRAFT` → para publicarse debe pasar por pago y moderación (carrito → checkout → Transbank).

**Pendiente:**

- Videos se recolectan pero la vista de detalle solo los muestra como links — no hay embed

---

### Upsell post-wizard de evento

Tras crear exitosamente el evento (respuesta 201 del `POST /events`), el website muestra una pantalla intermedia de upsell antes de redirigir al carrito.

**Lógica:**

1. Llamar `GET /spots/quota` y `GET /heroes/quota` en paralelo.
2. Si `available > 0` en spots: mostrar card con precio por día (`pricePerDay`), cupo disponible y CTA para crear un aviso.
3. Si `available > 0` en heroes: mostrar card con precio por día, cupo disponible y CTA para crear un hero.
4. Si ninguno tiene cupo disponible: omitir la pantalla y redirigir directo al carrito.
5. El usuario puede omitir el upsell con "Continuar sin publicitar" → va al carrito.

> La pantalla es informativa: no realiza ninguna acción hasta que el usuario elige crear un aviso o un hero. Si lo hace, se muestra el formulario correspondiente (inline o modal), se crea el recurso en DRAFT (`POST /spots` o `POST /heroes`) y luego se agrega el ítem al carrito.

---

### Formulario de crear aviso

Formulario inline o modal. Se usa en dos contextos:

1. **Upsell post-evento** — al elegir "Crear aviso" después de crear un evento.
2. **Desde `/cuenta` → Tab "Mis avisos"** — el usuario crea un aviso de forma independiente.

No es una página separada.

**Campos:**

| Campo | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| `title` | texto | Sí | 2–120 caracteres |
| `image` | upload | No | `POST /uploads` → URL |
| `linkType` | enum | Sí | `URL`, `PHONE` o `EMAIL` |
| `linkValue` | texto | Sí | URL, teléfono o email según `linkType` |

**API:** `POST /spots` → devuelve el spot en `DRAFT`.

**Pendiente:** La API no tiene targeting geográfico todavía. En una versión futura el formulario debería incluir selección de regiones y/o comunas donde el aviso se mostrará.

---

### Formulario de crear hero (desde upsell)

Formulario inline o modal que aparece al elegir "Crear hero" en el upsell. No es una página separada.

**Campos:**

| Campo | Tipo | Requerido | Notas |
| --- | --- | --- | --- |
| `title` | texto | Sí | 2–120 caracteres |
| `titleAccent` | texto | No | Parte resaltada del título (ej. año o palabra clave) |
| `lead` | texto | No | Descripción corta, máx 240 caracteres |
| `image` | upload | Sí | `POST /uploads` → URL. Se muestra como imagen de fondo full-width |
| `date` | fecha | No | Fecha del evento asociado (formato ISO) |
| `place` | texto | No | Lugar del evento, máx 120 caracteres |
| `link` | URL | No | Destino al hacer clic en el hero |
| `categoryId` | select | No | Categoría asociada (`GET /categories`) |

**API:** `POST /heroes` → devuelve el hero en `DRAFT`.

---

### `/carrito` — Carrito de compras

**Client component.** Requiere sesión (redirige a `/login` si no hay JWT).

`GET /orders/draft` obtiene o crea el carrito en estado `DRAFT` del usuario autenticado. El carrito puede tener hasta un ítem por tipo (`EVENT`, `SPOT`, `HERO`).

#### Ítems del carrito

| Tipo | Fuente | Precio unitario |
| --- | --- | --- |
| `EVENT` | `eventId` del evento en DRAFT | `pricePerDay` más alto de sus categorías (CLP) |
| `SPOT` | `spotId` del aviso en DRAFT | `SPOT_PRICE_PER_DAY` (default CLP $8.000) |
| `HERO` | `heroId` del hero en DRAFT | `HERO_PRICE_PER_DAY` (default CLP $15.000) |

- `subtotal = days × unitPrice` por ítem. El precio unitario se congela al agregar.
- `total` de la orden = suma de subtotales de todos los ítems.

#### Acciones

- **Agregar o reemplazar ítem:** `PUT /orders/:id/items` — campos `{ type, days, eventId|spotId|heroId }`. Si ya existe un ítem del mismo tipo, lo reemplaza.
- **Cambiar días:** mismo endpoint que agregar — reemplaza el ítem existente con los nuevos días.
- **Eliminar ítem:** `DELETE /orders/:id/items/:type` — elimina el ítem del tipo indicado (`EVENT`, `SPOT` o `HERO`).
- **Pagar:** botón "Pagar" → llama a `POST /payments/:orderId/checkout` con `{ gateway: "TRANSBANK" }` → obtiene `{ redirectUrl, externalId }` → redirige al usuario a `redirectUrl` (Transbank WebPay Plus).

#### Reglas de negocio

- Solo se pueden agregar ítems en estado `DRAFT` (evento, spot o hero propios del usuario).
- El cupo de spots y heroes se valida al agregar al carrito y nuevamente al iniciar el pago (doble check).
- Máximo de días por tipo: `EVENT` → 60 días, `SPOT` → 30 días, `HERO` → 30 días.

#### Estados de la orden

| Estado | Significado |
| --- | --- |
| `DRAFT` | Editable — el usuario puede agregar, modificar o eliminar ítems |
| `PENDING_PAYMENT` | En proceso de pago — no se puede editar |
| `PAID` | Pago confirmado — ítems pasan a `PENDING_MODERATION` |
| `FAILED` | Pago rechazado — se muestra `/checkout/failed` |

---

### Pasarelas de pago

El sistema soporta múltiples pasarelas a través del enum `GatewayType` y `GatewayFactory`. Agregar una pasarela nueva (Flow, MercadoPago, etc.) no requiere cambiar el endpoint de checkout.

**Pasarela activa:** Transbank WebPay Plus (modo producción o integración según `TRANSBANK_ENV`).

#### Flujo de pago con Transbank

1. Frontend llama a `POST /payments/:orderId/checkout` con `{ gateway: "TRANSBANK" }`.
2. La API inicia la transacción en Transbank y devuelve `{ redirectUrl, externalId }`.
3. La orden pasa a `PENDING_PAYMENT`.
4. El frontend redirige al navegador a `redirectUrl` (WebPay Plus).
5. Transbank llama de vuelta a `POST /api/payments/transbank/callback` (server-side) con:
   - `token_ws` (éxito) o `TBK_TOKEN` (abortado por el usuario).
6. La API confirma con Transbank y redirige al frontend:

| Resultado | Redirect |
| --- | --- |
| Éxito | `/checkout/success?orderId=X` — ítems pasan a `PENDING_MODERATION` |
| Abortado por usuario | `/checkout/failed?reason=aborted` |
| Pago rechazado | `/checkout/failed?orderId=X&code=Y` |

> El callback también acepta `GET /api/payments/transbank/callback` para el flujo de timeout de Transbank.

#### Vistas resultantes

- **`/checkout/success`** (`?orderId=X`): confirmación de pago exitoso. Informar que los ítems están en revisión (`PENDING_MODERATION`) y serán aprobados por un administrador.
- **`/checkout/failed`** (`?reason=...` o `?orderId=X&code=Y`): pago fallido o abortado. Mostrar el motivo y ofrecer reintentar.

---

## Auth pages (sin header/footer)

### `/login`
Wizard 2 pasos: email → contraseña.  
Botones de social login (Google, Instagram, Apple) son visuales — **sin funcionalidad**.  
Al autenticarse: guarda token + user en localStorage, redirige a `/`.

> **Nota:** El login es solo email + contraseña. No existe validación por código OTP, SMS ni 2FA actualmente. Los botones de social login son puramente visuales.

### `/registro`
Wizard 2 pasos: email → nombre + apellido + contraseña + confirmación.  
Al registrarse: también crea el `Profile` del usuario automáticamente (en la API).  
Mismos botones sociales sin funcionalidad.

### `/recuperar-contrasena`

Formulario con un campo email. Sin header/footer.

**Flujo:**

1. El usuario ingresa su email y envía el formulario.
2. El website llama a `POST /auth/forgot-password` con `{ email }`.
3. La API siempre responde 200 — nunca revela si el email existe.
4. El website muestra mensaje genérico: "Si el email está registrado, recibirás un enlace de recuperación."
5. El email enviado al usuario incluye un enlace a `/reset-password/:token` con el token de recuperación.

> El token es un hash SHA-256 almacenado en `User.resetToken` con expiración en `User.resetTokenExpiry`. La API rechaza tokens expirados.

### `/reset-password/:token`

Formulario con campos "Nueva contraseña" y "Confirmar contraseña". Sin header/footer.

**Flujo:**

1. El token viene en la URL como parámetro de ruta (`:token`).
2. Al enviar: llama a `POST /auth/reset-password` con `{ token, password }`.
3. **Éxito:** muestra confirmación y redirige a `/login`.
4. **Error (token inválido o expirado):** muestra mensaje de error con link a `/recuperar-contrasena`.

---

## Dashboard — Solo `ADMIN` y `SUPER_ADMIN`

Protegido por `AdminGuard` (client component). Redirige a `/login` si no es admin.

### `/dashboard` — Panel principal
**Client component.** Fetcha `GET /events` con token (devuelve todos los estados).

**Implementado:**
- 4 KPI cards (ingresos, tickets vendidos, eventos publicados, pendientes de revisión)
- Cola de revisión: últimos 5 eventos en `PENDING_MODERATION` con botones de aprobar/rechazar
- Gráfico de actividad (datos mock)
- Feed de actividad reciente (datos **hardcodeados** — no conectado a API)
- Desglose por categoría (datos **hardcodeados**)

**Pendiente:**
- KPI de ingresos y tickets conectado a datos reales (`GET /orders` o similar)
- Feed de actividad real
- Gráfico de eventos por categoría real
- Botones "Exportar reporte" y "Nuevo evento" sin handler

---

### `/dashboard/events` — Moderación de eventos
**Implementado completamente.**

- Tabla de todos los eventos con búsqueda por texto y filtro por estado
- Acciones: Aprobar (`PATCH /events/:id/approve`), Rechazar con motivo (`PATCH /events/:id/reject`), Ver publicación (link externo si está aprobado)
- Paginación visual en la tabla

---

### `/dashboard/users` — Gestión de usuarios
Solo accesible para `SUPER_ADMIN`. Si el rol es `ADMIN`, muestra "Acceso restringido".  
**No implementado** — PlaceholderView.

**Por implementar:**
- Listar usuarios (`GET /users` — endpoint a crear en la API)
- Bloquear/desbloquear usuario
- Cambiar rol

---

### `/dashboard/regions` — Regiones

**No implementado** — PlaceholderView. Solo `ADMIN` y `SUPER_ADMIN`.

**Por implementar:**

- `GET /regions` — lista todas las regiones.
- `POST /regions` — crea una región (campos: `name`, `slug`).
- `PATCH /regions/:id` — edita una región.
- `DELETE /regions/:id` — elimina una región.

---

### `/dashboard/communes` — Comunas

**No implementado** — PlaceholderView. Solo `ADMIN` y `SUPER_ADMIN`.

**Por implementar:**

- `GET /communes` — lista comunas (filtrable con `?region=<slug>`).
- `POST /communes` — crea una comuna (campos: `name`, `slug`, `regionId` requerido).
- `PATCH /communes/:id` — edita una comuna.
- `DELETE /communes/:id` — elimina una comuna.

---

### `/dashboard/categories` — Categorías
**No implementado** — PlaceholderView. Solo `ADMIN` y `SUPER_ADMIN`.

**Por implementar:**

- `GET /categories` — lista todas las categorías.
- `POST /categories` — crea una categoría (campos: `name`, `slug`, `description`, `pricePerDay`).
- `PATCH /categories/:id` — edita una categoría.
- `DELETE /categories/:id` — elimina una categoría.

**Regla clave:** el campo `pricePerDay` (Int, default CLP $1.000) define el precio de publicación de un evento en esa categoría. Si el evento pertenece a múltiples categorías, se usa el precio más alto.

---

### `/dashboard/tags` — Tags

**No implementado** — PlaceholderView. Solo `ADMIN` y `SUPER_ADMIN`.

**Por implementar:**

- `GET /tags` — lista todos los tags.
- `POST /tags` — crea un tag (campos: `name`, `slug`).
- `PATCH /tags/:id` — edita un tag.
- `DELETE /tags/:id` — elimina un tag.

> Los tags se asocian a artículos, no directamente a eventos.

---

### `/dashboard/spots` — Avisos

**No implementado** — PlaceholderView. Solo `ADMIN` y `SUPER_ADMIN`.

**Por implementar:**

- `GET /spots` — lista todos los spots (cualquier estado).
- Aprobar spot (`PATCH /spots/:id/approve`) → pasa a `APPROVED` y empieza a correr la expiración.
- Rechazar spot con motivo.
- `DELETE /spots/:id` — eliminar un spot.

---

### `/dashboard/heroes` — Heroes

**No implementado** — PlaceholderView. Solo `ADMIN` y `SUPER_ADMIN`.

**Por implementar:**

- `GET /heroes` — lista todos los heroes (cualquier estado).
- Aprobar hero (`PATCH /heroes/:id/approve`) → pasa a `APPROVED` y aparece en el carrusel de la home.
- Rechazar hero con motivo.
- `DELETE /heroes/:id` — eliminar un hero.

---

### `/dashboard/payments` — Pagos
**No implementado** — PlaceholderView.

**Por implementar:** Historial de órdenes, estado de pagos, detalles de transacciones Transbank.

---

### `/dashboard/settings`, `/dashboard/reports`, `/dashboard/logs`, `/dashboard/help`
**No implementados** — PlaceholderView.

---

## Vistas pendientes (no existen aún)

### `/u/[slug]` — Perfil público de organizador
Página pública que muestra el perfil de un usuario con al menos un evento aprobado.

**Debe renderizar:**
- Banner del perfil (`profile.banner`)
- Avatar (`profile.avatar`)
- Nombre público (`profile.displayName` o firstname + lastname)
- Bio (`profile.bio`)
- Website y redes sociales (instagram, tiktok, facebook, x, youtube, twitch, linkedin)
- Grilla de eventos aprobados y activos del usuario

**Regla de visibilidad:** `GET /profiles/:slug` devuelve 404 si el usuario no tiene ningún evento aprobado — el perfil no existe públicamente hasta ese momento.

**Datos desde API:** `GET /profiles/:slug`

---

### `/articulos` — Listado de artículos
**Por implementar.** `GET /articles`

### `/articulos/[slug]` — Detalle de artículo
**Por implementar.** `GET /articles/:slug`. Incluye contenido, tags, y eventos relacionados.

---

## Componentes clave

| Componente | Propósito | Estado |
|---|---|---|
| `Header` | Nav con categorías, menú de usuario | Completo. Links "Mis tickets" y "Configuración" en dropdown redirigen a `/cuenta` (stubs) |
| `Footer` | Links del sitio | Visual. Todos los `href` apuntan a `#` |
| `HeroBlock` | Carousel de heroes en la home | Completo |
| `Rail` | Sección horizontal de event cards | Completo. "Ver todos" sin href |
| `EventCard` | Card de evento (link a detalle) | Completo |
| `ProfileModal` | Modal para editar nombre/email/teléfono | **Solo actualiza contexto local — no llama a la API** |

---

## Flujos de usuario completos

### Flujo organizador
1. `/registro` → crea cuenta + perfil vacío (automático en API)
2. `/crear` → crea evento en `DRAFT`
3. Upsell post-wizard → ofrece agregar spot/hero si hay cupo
4. `/carrito` → agrega ítems, elige días, revisa total → paga con Transbank
5. Transbank confirma → ítems pasan a `PENDING_MODERATION`
6. Admin aprueba → ítems pasan a `APPROVED` y aparecen en el sitio
7. Con al menos 1 evento aprobado → `/u/:slug` se vuelve accesible
8. `/cuenta` → editar perfil público (displayName, bio, avatar, banner, redes)

### Flujo visitante
1. Home → descubre eventos en el hero o en los rails
2. `/[category]` o `/busqueda` → filtra
3. `/[category]/[slug]` → detalle, fechas, precios, link de tickets

### Flujo admin
1. Accede a `/dashboard` → ve cola de moderación
2. `/dashboard/events` → aprueba o rechaza eventos con motivo
3. `/cuenta` → edita su propio perfil (igual que cualquier usuario)

---

## Notas para implementación futura

- **ProfileModal** debe reemplazarse por un formulario que llame a `PUT /profiles/me` con todos los campos del perfil
- **Subida de imágenes** en `/cuenta` usa el mismo endpoint que el wizard de eventos: `POST /uploads` devuelve `{ url, filename }`
- **Spots y heroes** tienen endpoints `/mine` y CRUD propio — `/cuenta` debería mostrarlos con tabs separados
- **Cache:** Los GET públicos están cacheados en Redis con TTL de 1 día. Al hacer POST/PATCH/DELETE la colección se invalida automáticamente
