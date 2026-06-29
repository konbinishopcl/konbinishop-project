---
phase: 23-cleanup-post-cambio-de-contexto-org
plan: "01"
subsystem: website-ui
tags: [cleanup, sidebar, organizador, carrito, nextjs]

# Dependency graph
requires:
  - phase: 22-org-context-switch
    provides: activeOrg model and org context switch — which made /cuenta/organizador obsolete
provides:
  - Sidebar TABS array without organizador entry (10 tabs)
  - /cuenta/organizador returns 404 (directory deleted)
  - carrito/exito CTA links to /cuenta/perfil with correct copy
affects:
  - 23-02 (frontend data — depends on clean sidebar with mis-avisos/mis-portadas)
  - 23-03 (backend cleanup — removes /api/users/me/organizer endpoint)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Org context = separate entity; no 'organizador mode' for user account"

key-files:
  created: []
  modified:
    - apps/website/app/(site)/cuenta/AccountShell.tsx
    - apps/website/app/(site)/carrito/exito/page.tsx
  deleted:
    - apps/website/app/(site)/cuenta/organizador/page.tsx

key-decisions:
  - "D-1 confirmed: /cuenta/organizador deleted; organizations are separate entities post-Phase-22"
  - "D-2 confirmed: carrito/exito CTA points to /cuenta/perfil with copy '¿Tu perfil está completo?'"

patterns-established:
  - "Org identity lives in /cuenta/organizaciones, not a personal /cuenta/organizador tab"

requirements-completed: [CLEAN-01, CLEAN-02, CLEAN-06]

# Metrics
duration: 8min
completed: 2026-05-28
---

# Phase 23 Plan 01: Cleanup Post-Org-Context-Switch Summary

**Deleted /cuenta/organizador page, removed its sidebar tab, and fixed carrito/exito CTA to link to /cuenta/perfil instead of the defunct ?tab=org**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-28T00:00:00Z
- **Completed:** 2026-05-28T00:08:00Z
- **Tasks:** 3
- **Files modified:** 2 modified, 1 deleted

## Accomplishments
- Deleted `apps/website/app/(site)/cuenta/organizador/page.tsx` — the "organizador profile" concept is gone
- Removed organizador entry from AccountShell TABS array; sidebar now shows 10 clean tabs
- Fixed carrito/exito CTA: h3 text from "¿Tu perfil de organizador está completo?" → "¿Tu perfil está completo?", link from `/cuenta?tab=org` → `/cuenta/perfil`

## Task Commits

Each task was committed atomically:

1. **Task 1: Eliminar directorio /cuenta/organizador** - `be5a866` (feat)
2. **Task 2: Quitar entrada organizador del TABS array en AccountShell** - `f1427e6` (feat)
3. **Task 3: Corregir CTA de carrito/exito hacia /cuenta/perfil** - `95fd2df` (feat)

## Files Created/Modified
- `apps/website/app/(site)/cuenta/organizador/page.tsx` - DELETED (was calling /api/users/me/organizer, now gone)
- `apps/website/app/(site)/cuenta/AccountShell.tsx` - Removed organizador tab from TABS array (11→10 entries)
- `apps/website/app/(site)/carrito/exito/page.tsx` - Fixed CTA h3 text and href

## Decisions Made
- D-1 applied: /cuenta/organizador deleted entirely; organizations are separate entities (post-Phase-22), no user-level "organizador" concept
- D-2 applied: carrito/exito CTA now points to /cuenta/perfil (personal profile), not the defunct ?tab=org query param

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. The `.next/` build cache contained source maps referencing the deleted file, but these are artifacts — no live source files referenced `me/organizer` after deletion.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 23-02 (frontend data — mis-avisos, mis-portadas real data) can proceed: AccountShell is clean
- Phase 23-03 (backend cleanup — delete /api/users/me/organizer endpoint) can proceed: no frontend callers remain

---
*Phase: 23-cleanup-post-cambio-de-contexto-org*
*Completed: 2026-05-28*
