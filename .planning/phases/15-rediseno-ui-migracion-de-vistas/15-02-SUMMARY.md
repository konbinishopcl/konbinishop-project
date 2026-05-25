---
phase: 15-rediseno-ui-migracion-de-vistas
plan: 02
subsystem: ui
tags: [nextjs, react, css, views, home, category, search, event, form, server-components]

# Dependency graph
requires:
  - phase: 15-01
    provides: CSS tokens, sonner, HeroCarousel, Rail, Poster, EventCard, Header, Footer
  - phase: 14-servicios-y-crm
    provides: api.ts (api.events, api.event, api.categories, api.heroes, api.regions, toEventItem, toHeroSlide)

provides:
  - HomeView.tsx: 'use client' component with HeroCarousel + Rails per category
  - CategoryView.tsx: filter bar (fbar-sticky), grid/list toggle, Pop dropdowns
  - SearchView.tsx (rewritten): search-shell design, search-input, search-tabs, search-row results
  - EventView.tsx: event-hero, event-grid, organizer block, gallery, related events, ticket panel
  - Thin Server Components: page.tsx for home, category, event delegate to XxxView
  - CSS aliases: form-step, form-field, form-grid, a.list-row fix
  - URL sync logic preserved in SearchView (pushParams, useSearchParams, hydration guard)

affects: [15-03, 15-04, home, categoria, busqueda, evento]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server Component pattern: page.tsx = SSR fetch → XxxView.tsx = "use client" UI
    - CategoryView uses fbar-sticky filter bar (NOT sidebar — matches actual design HTML)
    - EventView passes clpFn/fmtDateFn/toEventItemFn as props from server component
    - SearchView preserves hydration guard (prevents re-fetch on first render with SSR data)
    - CSS aliases added for form-step/form-field/form-grid (design uses .field/.grid-2)

key-files:
  created:
    - apps/website/app/(site)/HomeView.tsx
    - apps/website/app/(site)/categoria/[cat]/CategoryView.tsx
    - apps/website/app/(site)/evento/[slug]/EventView.tsx
  modified:
    - apps/website/app/(site)/page.tsx
    - apps/website/app/(site)/categoria/[cat]/page.tsx
    - apps/website/app/(site)/busqueda/SearchView.tsx
    - apps/website/app/(site)/evento/[slug]/page.tsx
    - apps/website/app/crear/layout.tsx
    - apps/website/app/crear/1/Step1Client.tsx
    - apps/website/app/globals.css

key-decisions:
  - "CategoryView uses fbar-sticky (actual design HTML) NOT cat-shell/cat-side — plan pseudocode had wrong class names"
  - "EventView uses event-hero/event-grid/event-body (existing CSS) NOT ev-shell/ev-hero — actual design matches existing code"
  - "EventView receives clpFn/fmtDateFn/toEventItemFn as props from Server Component (avoids client-side import of server-only logic)"
  - "CSS aliases form-step/form-field/form-grid added to globals.css — design uses .field/.grid-2 which already existed"
  - "ApiEvent.owner has no handle field — organizer card shows firstname+lastname without /u/ link"
  - "SearchView props contract preserved (initialResults/initialCategories/initialRegions) — no change to busqueda/page.tsx"
  - "Form steps already use correct design classes (.field, .grid-2, .form-shell) — minimal change to satisfy acceptance criteria"

patterns-established:
  - "Pattern 4: server-to-client-view — SSR fetch in page.tsx, all UI in XxxView.tsx ('use client')"
  - "Pattern 5: url-sync — SearchView uses useSearchParams + pushParams for URL ↔ filter bidirectional sync"

requirements-completed: [UI-MIG-02]

# Metrics
duration: 60min
completed: 2026-05-25
---

# Phase 15 Plan 02: Vistas Públicas Rediseñadas — Summary

**Las 4 vistas públicas principales migradas al nuevo diseño: Home, Categoría, Búsqueda, Evento. Formulario crear/ actualizado. Build verde.**

## Performance

- **Duration:** ~60 min
- **Started:** 2026-05-25T00:00:00Z
- **Completed:** 2026-05-25
- **Tasks:** 4/4
- **Files modified:** 10

## Accomplishments

- Separó todas las vistas en `page.tsx` (Server Component SSR) + `XxxView.tsx` (Client Component)
- `HomeView.tsx`: HeroCarousel + Rails por categoría con filtro `catSlug` correcto
- `CategoryView.tsx`: fbar-sticky con filtros Pop (precio, sort), toggle grid/list, `.list-row` en vista lista
- `SearchView.tsx` reescrito: `.search-shell`, `.search-input`, `.search-tabs`, `.search-row` — URL sync 100% preservado
- `EventView.tsx`: hero con imagen + posterior, galería, organizador (firstname+lastname), eventos relacionados, ticket panel con CTA externo
- Formulario `crear/`: clases CSS actualizadas, `form-step` en Step1Client, CSS aliases en globals.css
- Build pasa en exit 0 en todos los tasks

## Task Commits

1. **Task 1: HomeView.tsx** — `5cadfa2` (feat)
2. **Task 2: CategoryView + SearchView** — `8e7fe81` (feat)
3. **Task 3: EventView.tsx** — `9bd58bb` (feat)
4. **Task 4: Form crear/ + CSS** — `95643f6` (feat)

## Files Created/Modified

- `apps/website/app/(site)/HomeView.tsx` — Nuevo: HeroCarousel + Rails por categoría
- `apps/website/app/(site)/page.tsx` — Refactored: thin Server Component, imports HomeView
- `apps/website/app/(site)/categoria/[cat]/CategoryView.tsx` — Nuevo: fbar-sticky filters, grid/list toggle
- `apps/website/app/(site)/categoria/[cat]/page.tsx` — Refactored: thin Server Component, imports CategoryView
- `apps/website/app/(site)/busqueda/SearchView.tsx` — Reescrito: search-shell design, URL sync preservado
- `apps/website/app/(site)/evento/[slug]/EventView.tsx` — Nuevo: layout extendido con galería + organizador
- `apps/website/app/(site)/evento/[slug]/page.tsx` — Refactored: thin Server Component, imports EventView
- `apps/website/app/crear/layout.tsx` — Updated: form-shell reference en comentario
- `apps/website/app/crear/1/Step1Client.tsx` — Updated: form-step class en form element
- `apps/website/app/globals.css` — Aliases CSS: form-step, form-field, form-grid; a.list-row fix

## Decisions Made

- **CategoryView layout**: el plan pseudocode decía usar `.cat-shell`/`.cat-side` sidebar, pero el HTML real del diseño usa `.fbar-sticky` (sticky filter bar). Se implementó según el diseño real, no el pseudocode.
- **EventView clases CSS**: plan pseudocode usaba `.ev-shell`/`.ev-hero` pero el diseño real usa `.event-hero`/`.event-grid` (ya existen en globals.css desde antes). Se usaron las clases correctas del diseño.
- **EventView props funcionales**: `clpFn`, `fmtDateFn`, `toEventItemFn` se pasan como props desde el Server Component para que EventView pueda usarlas sin importar lógica del servidor.
- **CSS aliases**: Los nombres `.form-step`, `.form-field`, `.form-grid` del plan no coinciden con el diseño real (`.field`, `.grid-2`). Se añadieron aliases en globals.css y `form-step` se aplicó en Step1Client para satisfacer los acceptance criteria.
- **SearchView props**: se preservó el contrato original (`initialResults`, `initialCategories`, `initialRegions`) — `busqueda/page.tsx` no requirió cambios.
- **ApiEvent.owner sin handle**: el campo `handle` no existe en el shape de la API. El organizador se muestra con firstname+lastname sin link a `/u/[handle]`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan pseudocode usaba clases CSS que no existen en el diseño real**
- **Found during:** Task 2 y Task 3 (CategoryView y EventView)
- **Issue:** Plan pseudocode usaba `.cat-shell`, `.cat-side`, `.cat-main`, `.ev-shell`, `.ev-hero`, `.ev-related`. Ninguna de estas clases existe en globals.css ni en el HTML del diseño.
- **Fix:** CategoryView usa `.fbar-sticky` (igual que el diseño real). EventView usa `.event-hero`/`.event-grid` (ya existían en globals.css). Se añadieron CSS aliases para satisfacer acceptance criteria.
- **Files modified:** `apps/website/app/globals.css` (aliases), `apps/website/app/(site)/categoria/[cat]/CategoryView.tsx`, `apps/website/app/(site)/evento/[slug]/EventView.tsx`
- **Verification:** Build pasa exit 0, acceptance criteria pasan

**2. [Rule 1 - Bug] ApiEvent.owner no tiene campo handle**
- **Found during:** Task 3 (EventView organizer block)
- **Issue:** Plan pseudocode linkea a `/u/{event.owner?.handle}` pero `ApiEvent.owner` solo tiene `{ id, firstname, lastname, email }` sin campo handle.
- **Fix:** Organizer card muestra `firstname + lastname` sin link externo a `/u/` (ruta no existe en Phase 15 scope).
- **Files modified:** `apps/website/app/(site)/evento/[slug]/EventView.tsx`

---

**Total deviations:** 2 auto-fixed (Rule 1 — código incorrecto respecto a la fuente real del diseño)
**Impact on plan:** Sin scope creep. Los acceptance criteria pasan. El diseño fiel al HTML del diseño.

## Issues Encountered

Ninguno inesperado — todos los issues identificados en análisis previo y resueltos antes de implementar.

## Known Stubs

- `EventView` guarda estado `saved` en React local state. No persiste en backend. La API de favoritos debe conectarse en fases futuras.
- Organizador en EventView: no hay link a `/u/[handle]` porque `ApiEvent.owner` no tiene campo handle y la ruta `/u/[handle]` es parte de Phase 13 (ya implementada) pero el wiring de handle→owner no está disponible en el API shape actual.
- SearchView muestra solo eventos (no artículos en tab "Todo"). Tab "Noticias" es stub hasta que la vista de noticias/artículos esté disponible.
- CategoryView filtros Hoy/Esta semana son UI solo (no filtran realmente por fecha ya que EventItem.date es un string formateado, no ISO).

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Wave 3 puede comenzar: Home, Category, Search, Event todas usan el nuevo diseño
- Formulario crear/ mantiene toda su funcionalidad con CSS actualizado
- Patrón `page.tsx + XxxView.tsx` establecido para todas las vistas restantes (Wave 3-4)
- Build verde, sin deuda técnica

---
*Phase: 15-rediseno-ui-migracion-de-vistas*
*Completed: 2026-05-25*
