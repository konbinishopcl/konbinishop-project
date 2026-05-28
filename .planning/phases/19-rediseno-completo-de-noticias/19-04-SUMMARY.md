---
phase: 19-rediseno-completo-de-noticias
plan: "04"
subsystem: ui
tags: [next.js, react, typescript, articles, news, categories, filters]

# Dependency graph
requires:
  - phase: 19-01
    provides: ApiArticle/ApiArticleCategory types en lib/api.ts, ArticleCard component con formatDate/getCat/readingTime exports
  - phase: 19-02
    provides: fbar-sticky, .menu, .pag-bar CSS classes en globals.css

provides:
  - Ruta /noticias/categoria/[slug] completa con server component + client view
  - Server component page.tsx con validación notFound(), fetch inicial y generateMetadata
  - NewsCategoryView client component con header, fbar-sticky, grid/lista y paginación

affects: [future noticias plans, article category pages]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server component + client view split (page.tsx → NewsCategoryView.tsx)
    - Pop dropdown helper component definido inline dentro de la función principal
    - pageWindows() para paginación con ellipsis
    - Fetch client-side con mounted guard para evitar hydration mismatch
    - Filtros client-side (origen, period, q) sobre datos fetched del servidor

key-files:
  created:
    - apps/website/app/(site)/noticias/categoria/[slug]/page.tsx
    - apps/website/app/(site)/noticias/categoria/[slug]/NewsCategoryView.tsx
  modified: []

key-decisions:
  - "useRef eliminado del import (no utilizado) para evitar warning de TypeScript"
  - "Pop dropdown definido como función interna para acceder al estado openPop del componente padre sin prop drilling"
  - "Filtros Period/Search/Sort son client-side sobre la página fetched; Origen (isSponsored) también client-side"

patterns-established:
  - "NewsCategoryView: mismo patrón que CategoryView de eventos — server fetch → client view con estado propio"
  - "mounted guard: useEffect → setMounted(true) previene refetch en SSR"

requirements-completed: [NEWS-06, NEWS-07, NEWS-08]

# Metrics
duration: 8min
completed: 2026-05-28
---

# Phase 19 Plan 04: News Category Page Summary

**Ruta /noticias/categoria/[slug] con server component, header categoría 64px, fbar-sticky completa, vistas grid/lista y paginación con ellipsis fetching desde la API**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-28T02:30:13Z
- **Completed:** 2026-05-28T02:38:00Z
- **Tasks:** 2
- **Files modified:** 2 (ambos creados)

## Accomplishments
- Server component `page.tsx` valida slug contra `/article-categories`, retorna `notFound()` si no existe, y fetcha artículos iniciales con `Promise.all` para renderizado SSR inmediato
- `NewsCategoryView.tsx` replica el patrón de `CategoryView.tsx` de eventos: header con eyebrow `NOTICIAS · {nameJa}`, h1 64px con punto accent, conteo de artículos, decoración `.jp` a la derecha
- fbar-sticky completa: Period (Hoy/Esta semana), separador .vline, dropdowns Tipo y Origen (Editoriales=!isSponsored, Patrocinados=isSponsored), botón Limpiar condicional, buscador inline con autoFocus, toggle Grid/Lista, dropdown Ordenar
- Vista grid usa `ArticleCard` existente; vista lista usa `.list-row` con `.l-img` / `.l-info` siguiendo patrón de `CategoryView.tsx`
- Paginación con `pageWindows()` para ellipsis, `pag-bar` con `pag-info` (rango + selector items/página) y `pag-pages`
- TypeScript: 0 errores

## Task Commits

1. **Task 1: Crear page.tsx — server component con validación y fetch inicial** - `5ad06e8` (feat)
2. **Task 2: Crear NewsCategoryView.tsx con header + fbar + grid/lista + paginación** - `e528254` (feat)

## Files Created/Modified
- `apps/website/app/(site)/noticias/categoria/[slug]/page.tsx` - Server component: valida slug, fetcha artículos iniciales y categoría, retorna notFound() si slug inválido
- `apps/website/app/(site)/noticias/categoria/[slug]/NewsCategoryView.tsx` - Client component con header, fbar-sticky, grid/lista, paginación

## Decisions Made
- `useRef` eliminado del import de React — el plan lo incluía pero el componente no lo usa; eliminado para mantener TypeScript limpio sin errores
- Pop dropdown definido como función interna al componente para compartir el estado `openPop` sin necesidad de prop drilling ni useRef
- Filtros Period/Origen/Search son client-side sobre la página actual fetched; esto replica exactamente el diseño de `NewsCategoryPage` en `Konbini.html`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Eliminado `useRef` del import**
- **Found during:** Task 2 (revisión previa a escritura — consejo del advisor)
- **Issue:** El plan incluía `useRef` en el import de React pero el componente nunca lo usa; TypeScript strict lo marcaría
- **Fix:** Eliminado del import: `import { useEffect, useState } from "react"` sin `useRef`
- **Files modified:** apps/website/app/(site)/noticias/categoria/[slug]/NewsCategoryView.tsx
- **Verification:** `npx tsc --noEmit` → 0 errores
- **Committed in:** e528254 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug — import innecesario)
**Impact on plan:** Corrección menor de limpieza. Sin impacto en funcionalidad.

## Issues Encountered
None — el plan incluía código completo y todos los tipos/exports necesarios ya existían desde planes anteriores (19-01, 19-02).

## Known Stubs
None — los artículos se fetchan desde la API real en el server component y se refetchan client-side. No hay datos hardcodeados.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ruta /noticias/categoria/[slug] completamente funcional
- Los enlaces a categorías desde `/noticias` (si los hay) ya pueden apuntar a esta ruta
- Phase 19 planes 01–04 completos

## Self-Check: PASSED

- FOUND: apps/website/app/(site)/noticias/categoria/[slug]/page.tsx
- FOUND: apps/website/app/(site)/noticias/categoria/[slug]/NewsCategoryView.tsx
- FOUND: .planning/phases/19-rediseno-completo-de-noticias/19-04-SUMMARY.md
- FOUND commit: 5ad06e8 (Task 1)
- FOUND commit: e528254 (Task 2)
- TypeScript: 0 errors

---
*Phase: 19-rediseno-completo-de-noticias*
*Completed: 2026-05-28*
