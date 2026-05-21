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
**Server component.** Fetcha eventos, categorías y heroes en paralelo.

- **Hero carousel** — slides de heroes aprobados (imagen, título, subtítulo acento, descripción corta, fecha, lugar, botón CTA con el link del hero)
- **Rail "Destacados"** — primeros 6 eventos aprobados
- **Rails por categoría** — hasta 6 eventos por categoría con al menos un evento publicado

**Pendiente:** El botón "Ver todos" de cada rail no tiene href destino.

---

### `/evento/[slug]` — Detalle de evento
**Server component.** Fetcha el evento por slug. `notFound()` si no existe o no está aprobado.

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

---

### `/categoria/[cat]` — Eventos por categoría
**Server component.** Fetcha categorías y eventos filtrados por slug de categoría.

**Renderiza:** Nombre de categoría, contador de resultados, grilla de EventCards.

**Pendiente:** Los chips de filtro (Hoy, Esta semana, etc.) y la barra de filtros (fecha, región, orden) son visuales — sin funcionalidad.

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
- **Ver mis spots** → `GET /spots/mine`
- **Ver mis heroes** → `GET /heroes/mine`
- **Ver mi perfil público** → link a `/u/:slug` (vista de perfil público, aún no existe en el website)

> Esta vista aplica igual para usuarios `ADMIN` y `SUPER_ADMIN`. El admin también edita su perfil aquí.

---

### `/crear` — Crear evento
**Client component.** Redirige a `/login` si no hay sesión. Wizard de 3 pasos.

**Paso 1:** Título, empresa, categoría, descripción, "about", tipo de entrada (gratis / precios)  
**Paso 2:** Fechas/horarios, región → comuna, dirección, URL de tickets, links de RRSS  
**Paso 3:** Banner, poster, galería (máx 10), videos, confirmación antes de enviar

**Flujo:** `POST /events` → queda en `DRAFT` → para publicarse debe pasar por pago y moderación.

**Pendiente:**
- El evento creado queda en `DRAFT` pero no hay flujo de pago en el website aún
- Videos se recolectan pero la vista de detalle solo los muestra como links — no hay embed

---

## Auth pages (sin header/footer)

### `/login`
Wizard 2 pasos: email → contraseña.  
Botones de social login (Google, Instagram, Apple) son visuales — **sin funcionalidad**.  
Al autenticarse: guarda token + user en localStorage, redirige a `/`.

### `/registro`
Wizard 2 pasos: email → nombre + apellido + contraseña + confirmación.  
Al registrarse: también crea el `Profile` del usuario automáticamente (en la API).  
Mismos botones sociales sin funcionalidad.

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

### `/dashboard/categories` — Categorías
**No implementado** — PlaceholderView.

**Por implementar:**
- CRUD de categorías (`GET/POST/PATCH/DELETE /categories`)
- El campo `pricePerDay` de cada categoría define el precio de publicar un evento en esa categoría

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
3. *(pendiente)* Pago → evento pasa a `PENDING_MODERATION`
4. Admin aprueba → evento pasa a `APPROVED` y aparece en el sitio
5. Con al menos 1 evento aprobado → `/u/:slug` se vuelve accesible
6. `/cuenta` → editar perfil público (displayName, bio, avatar, banner, redes)

### Flujo visitante
1. Home → descubre eventos en el hero o en los rails
2. `/categoria/[cat]` o `/busqueda` → filtra
3. `/evento/[slug]` → detalle, fechas, precios, link de tickets

### Flujo admin
1. Accede a `/dashboard` → ve cola de moderación
2. `/dashboard/events` → aprueba o rechaza eventos con motivo
3. `/cuenta` → edita su propio perfil (igual que cualquier usuario)

---

## Notas para implementación futura

- **ProfileModal** debe reemplazarse por un formulario que llame a `PUT /profiles/me` con todos los campos del perfil
- **Subida de imágenes** en `/cuenta` usa el mismo endpoint que el wizard de eventos: `POST /uploads` devuelve `{ url, filename }`
- **Spots y heroes** tienen endpoints `/mine` y CRUD propio — `/cuenta` debería mostrarlos con tabs separados
- **El flujo de pago** (carrito → checkout → Transbank) aún no tiene vista en el website
- **Cache:** Los GET públicos están cacheados en Redis con TTL de 1 día. Al hacer POST/PATCH/DELETE la colección se invalida automáticamente
