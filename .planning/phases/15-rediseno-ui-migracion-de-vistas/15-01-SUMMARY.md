---
phase: 15-rediseno-ui-migracion-de-vistas
plan: 01
subsystem: ui
tags: [nextjs, react, css, design-system, sonner, carousel, hero, event-card]

# Dependency graph
requires:
  - phase: 01-fundaciones
    provides: Next.js app structure, globals.css, components folder
  - phase: 14-servicios-y-crm
    provides: API layer (api.ts), data types (HeroSlide, EventItem)

provides:
  - Design token CSS variables updated in globals.css
  - Phase 15 CSS classes (600+ lines): .pcar, .admin-shell, .auth-shell, .acc-shell, .rail, .panel, etc.
  - sonner toaster mounted globally in layout.tsx
  - toggleTheme() exposed in ThemeCtx (providers.tsx)
  - Header redesigned: mobile nav overlay, top cats + more dropdown, toggleTheme
  - Footer redesigned: correct links, social icons (google/insta/fb/apple)
  - Poster: new aspect-ratio 4/5, pc-img/pc-top/pc-bottom structure, cat-chip, today-chip, heart button
  - EventCard: "use client", sonner toast on save, router.push navigation
  - Rail: new .rail/.rail-head/.rail-track structure, jp/hrefSeeAll props
  - HeroCarousel: new .pcar carousel with auto-advance 7s, nav arrows, dot indicators
  - HeroBlock: shim re-exporting HeroCarousel

affects: [15-02, 15-03, 15-04, home, categoria, evento, cuenta, dashboard, auth]

# Tech tracking
tech-stack:
  added: [sonner@^2.0.7]
  patterns:
    - CSS global append strategy (Phase 15 CSS block at end of globals.css for cascade override)
    - HeroCarousel uses .pcar CSS classes with opacity toggle (.slide.on) not transform
    - EventCard uses sonner toast for UX feedback
    - Rail uses .rail-track (4-col grid) instead of .card-grid

key-files:
  created:
    - apps/website/components/HeroCarousel.tsx
  modified:
    - apps/website/app/globals.css
    - apps/website/app/layout.tsx
    - apps/website/app/(site)/page.tsx
    - apps/website/components/providers.tsx
    - apps/website/components/Header.tsx
    - apps/website/components/Footer.tsx
    - apps/website/components/Poster.tsx
    - apps/website/components/EventCard.tsx
    - apps/website/components/Rail.tsx
    - apps/website/components/HeroBlock.tsx
    - apps/website/package.json
    - pnpm-lock.yaml

key-decisions:
  - "CSS cascade strategy: append full Phase 15 CSS block at end of globals.css (not cherry-picking)"
  - "HeroCarousel uses .pcar CSS (opacity-based slide toggle, .pcar .slide.on) matching design exactly"
  - "EventItem.image used as backgroundImage for Poster pc-img (no art field in API output)"
  - "Rail props renamed: ja→jp, added hrefSeeAll (breaking change, callers updated in same PR)"
  - "Header simplificado: no MOCK_ORGS/activeOrg org-switching, menú personal simple"

patterns-established:
  - "Pattern 1: CSS-global-append — new design CSS appended to globals.css, cascade handles overrides"
  - "Pattern 2: sonner-toast — EventCard uses toast.success/error for UX feedback"
  - "Pattern 3: headroom-scroll — Header hides on scroll-down (headroom--hidden class)"

requirements-completed: [UI-MIG-01]

# Metrics
duration: 45min
completed: 2026-05-25
---

# Phase 15 Plan 01: Base Visual y Componentes Compartidos — Summary

**Capa base del rediseño Phase 15 lista: design tokens CSS, Toaster global, Header/Footer/Poster/EventCard/Rail/HeroCarousel reescritos al nuevo diseño de Konbini.html**

## Performance

- **Duration:** ~45 min
- **Started:** 2026-05-25T00:00:00Z
- **Completed:** 2026-05-25
- **Tasks:** 3/3
- **Files modified:** 12

## Accomplishments

- Instaló sonner y montó `<Toaster>` globalmente; `toggleTheme()` expuesto en ThemeCtx
- Agregó 600+ líneas de CSS Phase 15 a globals.css: `.pcar`, `.admin-shell`, `.auth-shell`, `.acc-shell`, `.rail`, `.kanban`, `.kpi-grid`, y más — todo listo para las vistas de Wave 2-4
- Reescribió Header con mobile nav overlay, megamenú de categorías extra, toggleTheme
- Reescribió Footer con links correctos y social icons del diseño (google/insta/fb/apple)
- Creó HeroCarousel con `.pcar` CSS, auto-advance 7s, nav arrows y dot indicators
- Reescribió Poster con nueva estructura pc-img/pc-top/pc-bottom (aspect-ratio 4/5, cat-chip, today-chip, heart)
- Reescribió EventCard con sonner toast para favoritos
- Reescribió Rail con `.rail-track` (4 columnas) y nuevas props (jp, hrefSeeAll)

## Task Commits

1. **Task 1: CSS tokens + Toaster + toggleTheme** — `5ca920e` (feat)
2. **Task 2: Header y Footer rediseñados** — `f581ef2` (feat)
3. **Task 3: Poster, EventCard, Rail, HeroCarousel** — `b4d0822` (feat)

## Files Created/Modified

- `apps/website/components/HeroCarousel.tsx` — Nuevo componente de portadas con .pcar CSS
- `apps/website/components/HeroBlock.tsx` — Shim → re-exporta HeroCarousel
- `apps/website/app/globals.css` — +600 líneas de clases CSS Phase 15
- `apps/website/app/layout.tsx` — Monta `<Toaster position="bottom-right" />`
- `apps/website/components/providers.tsx` — ThemeCtx expone toggleTheme()
- `apps/website/components/Header.tsx` — Reescritura completa: mobile overlay, mega-menú, toggleTheme
- `apps/website/components/Footer.tsx` — Reescritura: links actuales, social icons correctos
- `apps/website/components/Poster.tsx` — Reescritura: pc-img/pc-top/pc-bottom, chips, heart
- `apps/website/components/EventCard.tsx` — "use client", router.push, sonner toast
- `apps/website/components/Rail.tsx` — Nuevas props jp/hrefSeeAll, .rail-track grid
- `apps/website/app/(site)/page.tsx` — Actualiza llamadas a Rail (ja→jp, agrega hrefSeeAll)
- `apps/website/package.json` + `pnpm-lock.yaml` — sonner@^2.0.7

## Decisions Made

- **CSS cascade strategy**: se appenda el bloque completo de CSS del diseño al final de globals.css. Esto permite que las reglas nuevas (ej. `.card .poster` con aspect-ratio 4/5) sobreescriban las antiguas sin borrar código existente.
- **HeroCarousel vs HeroBlock**: se crea HeroCarousel.tsx nuevo y HeroBlock.tsx queda como shim. Las páginas que usan `HeroBlock` no necesitan cambios.
- **Rail props breaking change**: se renombra `ja`→`jp` y se agrega `hrefSeeAll` en el mismo commit donde se actualiza el único caller (page.tsx). Cambio atómico, sin regresión.
- **Poster usa backgroundImage inline**: EventItem.image se usa como `style.backgroundImage` para el div `.pc-img` (no hay campo `art` en el output de la API).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Callers de Rail usan prop `ja` que no existe en la nueva firma**
- **Found during:** Task 3 (Rail rewrite)
- **Issue:** page.tsx pasa `ja="注目の作品"` y `landscape` — ambas props eliminadas en el nuevo Rail
- **Fix:** Actualizado page.tsx para usar `jp="注目の作品"` y `hrefSeeAll={...}`, removido `landscape`
- **Files modified:** `apps/website/app/(site)/page.tsx`
- **Verification:** Build pasa exit 0
- **Committed in:** b4d0822 (parte del task 3 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - breaking change prop)
**Impact on plan:** Corrección mínima necesaria para que el build pase. Sin scope creep.

## Issues Encountered

None — el build pasó en cada tarea sin errores inesperados.

## Known Stubs

- `EventCard` guarda estado `saved` en React local state. No persiste en backend. Futuras fases deben conectar a API de favoritos.
- `HeroCarousel` muestra slides vacíos graciosamente (retorna null si `slides.length === 0`).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Wave 2 puede comenzar: todos los componentes compartidos están disponibles
- Header, Footer, Poster, EventCard, Rail, HeroCarousel listos para ser importados por vistas Wave 2
- globals.css tiene todas las clases CSS necesarias para vistas del diseño (.admin-shell, .auth-shell, .acc-shell, etc.)
- Build verde, sin deuda técnica acumulada

---
*Phase: 15-rediseno-ui-migracion-de-vistas*
*Completed: 2026-05-25*
