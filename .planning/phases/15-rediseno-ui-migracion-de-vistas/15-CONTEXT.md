# Phase 15: Rediseño UI — migración de vistas - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrar todas las vistas del website al nuevo diseño definido en `design/Konbini.html`.
Esto incluye: actualizar vistas existentes con los nuevos estilos/layout/componentes,
rediseñar completamente el panel admin (cambió de estructura por completo), e incorporar
las vistas nuevas que el diseño define pero el sitio aún no tiene.

**Fuera de alcance:** cambios en la API, nuevas integraciones, lógica de negocio nueva.
Solo se actualiza la capa de presentación. Las integraciones API existentes se preservan.

</domain>

<decisions>
## Implementation Decisions

### Sistema de diseño (tokens CSS)
- **D-01:** Reemplazar el sistema de variables CSS actual por el del diseño:
  `--bg`, `--bg-2`, `--surface`, `--surface-2`, `--line`, `--line-2`, `--ink`, `--ink-2`,
  `--ink-3`, `--accent` (#ff5b49), `--accent-2` (#f3c053), `--accent-3` (#6c5cff),
  `--ok`, `--warn`, `--err`, `--shadow`, `--ring`, `--r-sm`, `--r`, `--r-lg`, `--r-xl`
- **D-02:** Tipografía del diseño: Space Grotesk (display/headings), Inter (body),
  Zen Kaku Gothic New (elementos japoneses), JetBrains Mono (mono). Cargar desde Google Fonts.
- **D-03:** El diseño tiene modo oscuro (default) y modo claro con `[data-theme="light"]`.
  Se implementa el toggle en el Header. El modo oscuro es el default.

### Separación de vistas
- **D-04:** Cada vista/página en su propio archivo. No se mezclan páginas en un mismo archivo.
  El código del diseño es una SPA de referencia — hay que traducirlo a la estructura de
  Next.js App Router con rutas separadas.
- **D-05:** Los subcomponentes de vista grandes (ej. pasos del formulario, secciones de
  AccountPage) también van en archivos separados dentro de la carpeta de su ruta.

### Mapeo de rutas: diseño → Next.js

**Vistas existentes a actualizar:**
- `home` → `(site)/page.tsx` — actualizar con nuevo layout/componentes
- `category` → `(site)/categoria/[cat]/page.tsx` — actualizar
- `event` → `(site)/evento/[slug]/page.tsx` — actualizar (vista muy expandida en el diseño)
- `search` → `(site)/busqueda/` — actualizar
- `form` (multi-step) → `crear/` — actualizar Step1..4 + layouts
- `login` / `auth` → `login/` y `registro/` — rediseñar con nueva `AuthPage`/`AuthShell`

**Admin completamente rediseñado:**
- `admin` → `dashboard/` — rediseñar desde cero con la nueva `AdminPage` del diseño.
  El admin actual usa `AdminSidebar`/`AdminTopbar` separados; el nuevo diseño
  tiene su propio sidebar integrado con secciones: events, articles, users, payments,
  subscriptions, CRM, inbox, categories, spots, heroes, FAQ, reports, logs, settings.

**Vistas de usuario:**
- `dashboard` (organizador) → `(site)/cuenta/publicaciones/page.tsx` — la vista
  "Mis publicaciones" del organizador (DashboardPage del diseño) es nueva sección de cuenta.
- `account` → `(site)/cuenta/page.tsx` — expandir con todas las pestañas del diseño:
  perfil, organizaciones, suscripción, eventos, artículos, favoritos, mensajes, pagos.
  Cada pestaña en su propio archivo dentro de `cuenta/`.

**Nuevas vistas a crear:**
- `news` → `(site)/noticias/page.tsx`
- `article` → `(site)/noticias/[slug]/page.tsx`
- `organizer` → `(site)/u/[handle]/page.tsx`
- `pricing` → `(site)/precios/page.tsx`
- `photo` → `(site)/servicios/fotografia/page.tsx`
- `creators` → `(site)/servicios/creadores/page.tsx`
- `photoThanks` / `creatorsThanks` / `contactThanks` → `(site)/gracias/[kind]/page.tsx`
- `cart` → `(site)/carrito/page.tsx`
- `cartSuccess` → `(site)/carrito/exito/page.tsx`
- `cartFail` → `(site)/carrito/error/page.tsx`
- `createSpot` / `createHero` / `createArticle` → `(site)/crear/[kind]/page.tsx` o dentro de cuenta
- `about` → `(site)/nosotros/page.tsx`
- `help` → `(site)/ayuda/page.tsx`
- `tag` → `(site)/tag/[tag]/page.tsx`
- `expired` → `(site)/evento/expirado/page.tsx`
- `upsell` → `(site)/upgrade/page.tsx`
- `notfound` → `app/not-found.tsx`

### Componentes compartidos a actualizar
- **D-06:** `Header` — completamente actualizado: nuevo logo con `BrandMark` (imagen SVG),
  nav de categorías como pills/botones, buscador, menú de usuario con avatar y dropdown,
  toggle de tema oscuro/claro, mega-menú de categorías.
- **D-07:** `Footer` — actualizar con nueva estructura y links del diseño.
- **D-08:** `EventCard` — actualizar con nuevo diseño de poster (aspect-ratio 4/5,
  esquinas redondeadas 22px, chips de categoría + "hoy", botón de favorito).
- **D-09:** `Poster` — actualizar/unificar con el nuevo diseño de card.
- **D-10:** `Rail` — actualizar con nuevo header de sección (título + label japonés + "ver todos").
- **D-11:** `HeroBlock` → renombrar/refactorizar a `HeroCarousel` con el nuevo diseño
  (grid de 2 cols, texto + arte con poster diagonal, flechas de navegación).

### Admin dashboard
- **D-12:** El dashboard admin (`/dashboard/`) se rediseña completamente. La nueva
  estructura es una SPA dentro de la ruta con un sidebar lateral y contenido principal
  que cambia de sección sin navegar de ruta. El sidebar tiene:
  - Eventos, Artículos, Usuarios, Pagos, Suscripciones, CRM, Mensajes/Inbox,
    Categorías, Avisos (spots), Portadas (heroes), FAQ, Reportes, Logs, Configuración.
- **D-13:** Las vistas de cada sección del admin van en archivos separados dentro de
  `dashboard/` (ej. `dashboard/sections/EventsSection.tsx`, `ArticlesSection.tsx`, etc.).
- **D-14:** El admin actual tiene integraciones reales (aprobar/rechazar eventos con API).
  Estas integraciones se preservan en las secciones correspondientes del nuevo admin.
  Las secciones sin API real (pagos, suscripciones, CRM visual) quedan con UI del diseño.

### Nuevas vistas — nivel de integración
- **D-15:** Las vistas nuevas se implementan con la UI del diseño fiel al HTML.
  Los datos que ya tienen API (noticias/artículos, perfil de organizador, búsqueda,
  categorías) se conectan a las APIs existentes. Los datos sin API (carrito completo,
  precios, servicios con cotización) usan datos de ejemplo/mock del diseño.
- **D-16:** Los formularios de servicios (fotografía, creadores) usan el mismo patrón
  que el formulario de contacto existente — envían a la API de servicios de Phase 14.

### Claude's Discretion
- Estructura exacta de archivos dentro de cada carpeta de ruta
- Decisión sobre si `CreateProductPage` va dentro de `/crear/` o `/cuenta/`
- Manejo de estados de carga y error en vistas nuevas (skeleton vs spinner)
- Responsive breakpoints para las nuevas vistas (seguir el patrón del diseño)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Fuente del diseño
- `design/Konbini.html` — Fuente única y completa del rediseño. Contiene TODO el código
  React/CSS de referencia. Leer las funciones de componente y los estilos CSS definidos
  en `<style>` para entender el diseño exacto de cada vista.

### Código actual del website
- `apps/website/app/` — Estructura de rutas Next.js actual
- `apps/website/components/` — Componentes compartidos actuales
- `apps/website/app/dashboard/` — Admin panel actual (se rediseña completamente)
- `apps/website/app/(site)/cuenta/page.tsx` — Vista de cuenta actual (se expande)
- `apps/website/lib/api.ts` — Capa de datos del website (no tocar la lógica)

### Estilos globales actuales
- `apps/website/app/globals.css` — Variables CSS y estilos globales actuales (a reemplazar)
- `apps/website/app/dashboard/admin.css` — Estilos del admin actual (a reemplazar)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `apps/website/lib/api.ts`: capa de datos con `api.events()`, `api.adminEvents()`,
  `api.approveEvent()`, `api.rejectEvent()`, `api.categories()`, `api.articles()` etc.
  — se preserva sin tocar, las vistas actualizadas siguen usándola.
- `apps/website/components/providers.tsx`: `useUser()` hook para sesión — se mantiene.
- `apps/website/components/admin/AdminGuard.tsx`: guard de acceso admin — se mantiene.
- Iconos inline SVG del diseño (`const Ic = {...}`) → migrar a `components/icons.tsx`.

### Established Patterns
- Next.js App Router con grupos de rutas: `(site)/` para público, `dashboard/` para admin,
  `crear/`, `login/`, `registro/` sin grupo.
- "use client" en páginas interactivas; Server Components para páginas de solo lectura.
- CSS modules o CSS global — el proyecto usa CSS global (`globals.css`, `admin.css`).
  El diseño también usa CSS global inline; mantener ese patrón por consistencia.

### Integration Points
- El Header actualizado sigue usando `useUser()` de providers para el estado de sesión.
- `AdminGuard` sigue wrapeando el layout del dashboard.
- `api.ts` sigue siendo la capa de datos — no se toca.
- Los formularios de servicios (`/servicios/fotografia/`, `/servicios/creadores/`)
  se conectan a `api.createServiceRequest()` de Phase 14 cuando esté disponible.

### Admin current structure (to be replaced)
- `AdminSidebar.tsx`, `AdminTopbar.tsx`, `KpiCard.tsx`, `RevenueChart.tsx`,
  `PlaceholderView.tsx`, `icons.tsx` — todos se reemplazan por la nueva estructura del admin.
  Los archivos viejos pueden eliminarse o reusarse si el nuevo diseño los necesita.

</code_context>

<specifics>
## Specific Ideas

- El usuario dijo: "el dashboard casi que cambio completamente" — dar prioridad y cuidado
  especial al rediseño del admin. No es una actualización incremental, es desde cero.
- "todas las vistas siempre deben estar separadas" — cada vista/página en archivo propio,
  sin excepciones. Esto incluye los subcomponentes grandes de admin.
- El diseño tiene elementos japoneses (subtítulos en kanji/katakana como "ダッシュボード",
  "注目の作品", etc.) — estos son parte del diseño y deben preservarse.
- El nuevo `BrandMark` usa la imagen `konbini-logo.svg` (no texto CSS como el actual).
- El diseño tiene `CheckoutPage` con flujo de 3 pasos — esto es mock (no hay checkout real
  en v1/v2), implementar como UI estática de referencia o no incluir si es checkout de entradas
  (fue eliminado del scope en Phase 2).

</specifics>

<deferred>
## Deferred Ideas

- Nuevas integraciones API para las vistas nuevas (noticias con API real, carrito real,
  suscripción conectada) — esto es scope de fases futuras.
- `CheckoutPage` del diseño hace referencia a venta de entradas (eliminada en Phase 2) —
  se omite o se implementa solo como referencia visual sin funcionalidad real.
- `UpsellPage` (upgrade/suscripción) — implementar UI pero sin flujo de pago real.

</deferred>

---

*Phase: 15-rediseno-ui-migracion-de-vistas*
*Context gathered: 2026-05-25*
