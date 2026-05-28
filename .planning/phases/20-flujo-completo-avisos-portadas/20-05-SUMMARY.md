---
phase: 20-flujo-completo-avisos-portadas
plan: "05"
subsystem: ui
tags: [react, next.js, dashboard, spots, heroes, moderation]

# Dependency graph
requires:
  - phase: 20-flujo-completo-avisos-portadas
    provides: "api.adminSpots, api.adminHeroes, api.spotsQuota, api.heroesQuota, approve/reject/ban endpoints for spots and heroes (Plans 01-02)"
provides:
  - "Real-data SpotsSection: status-filtered list, real quota badge, approve/reject/ban actions"
  - "Real-data HeroesSection: mirrors SpotsSection exactly for heroes"
affects:
  - dashboard moderation workflow
  - admin UI completeness

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useCallback + stale-guard effect for typed api.* methods that wrap request() without AbortSignal"
    - "AdminRejectModal reused for both reject AND ban to always collect a reason"
    - "Quota badge refreshed after every moderation action (approve/reject/ban) alongside list refetch"

key-files:
  created: []
  modified:
    - apps/website/app/dashboard/sections/SpotsSection.tsx
    - apps/website/app/dashboard/sections/HeroesSection.tsx

key-decisions:
  - "Quota badge refreshed after every action (not only on mount) to keep active/max count current"
  - "AdminRejectModal used for ban (kind='aviso (ban)') instead of ConfirmDialog — ban endpoint requires a reason, modal enforces it"
  - "ConfirmDialog deleted (no remaining callers after ban moved to AdminRejectModal)"
  - "pageSize: 100 — no pagination UI for admin moderation queues"

patterns-established:
  - "Stale-guard pattern: let stale = false; ... return () => { stale = true; } — used when typed api.* wraps request() with no AbortSignal"

requirements-completed: [SPOT-05, SPOT-06, SPOT-07, SPOT-08, SPOT-09, SPOT-10, HERO-05, HERO-06, HERO-07, HERO-08]

# Metrics
duration: 20min
completed: 2026-05-28
---

# Phase 20 Plan 05: Rewrite SpotsSection and HeroesSection Summary

**SpotsSection and HeroesSection rewritten from 100% mock to real-data moderation queues using api.adminSpots/adminHeroes with status filters, real occupancy badges from quota endpoints, and working approve/reject/ban actions that collect a reason via AdminRejectModal**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-28T19:30:00Z
- **Completed:** 2026-05-28T19:50:00Z
- **Tasks:** 2 auto + 1 checkpoint (paused)
- **Files modified:** 2

## Accomplishments
- SpotsSection fully connected to real API: status-filtered listing via `api.adminSpots`, real occupancy badge from `api.spotsQuota`, approve/reject/ban calling real PATCH endpoints with reason collection
- HeroesSection mirrors SpotsSection exactly for heroes using `api.adminHeroes`, `api.heroesQuota`, `api.approveHero/rejectHero/banHero`
- Mock EVENTS array, AdminApproveModal, AdminTransferModal, and ConfirmDialog removed from both files; no dead code remains

## Task Commits

1. **Task 1: Rewrite SpotsSection.tsx** - `e5de25e` (feat)
2. **Task 2: Rewrite HeroesSection.tsx** - `8a0fe4a` (feat)

## Files Created/Modified
- `apps/website/app/dashboard/sections/SpotsSection.tsx` — Rewritten: real data via api.adminSpots, spotsQuota, approve/reject/ban actions, AdminRejectModal for both reject and ban
- `apps/website/app/dashboard/sections/HeroesSection.tsx` — Rewritten: mirrors SpotsSection for heroes via api.adminHeroes, heroesQuota, approve/reject/ban actions

## Decisions Made
- **Quota refresh after actions:** `api.spotsQuota().then(setQuota)` added alongside every `fetchSpots()` call (not only on mount) to keep the occupancy badge current after approve/reject/ban changes the active count. Same for heroes.
- **Ban uses AdminRejectModal:** The `/ban` endpoint requires `{ reason }` (Pitfall 6 from RESEARCH). Instead of the ConfirmDialog (which collects no reason), AdminRejectModal is reused with `kind="aviso (ban)"` — this guarantees the reason is always non-empty before the call is made.
- **ConfirmDialog deleted:** With ban moved to AdminRejectModal and no delete action for spots/heroes, ConfirmDialog became unused. Deleted to avoid dead code.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Quota badge refreshed after every action**
- **Found during:** Task 1 (advisor review before implementation)
- **Issue:** Plan specified quota fetch only on mount. Approve/reject/ban changes active count, making the badge stale immediately after an action.
- **Fix:** Added `api.spotsQuota().then(setQuota).catch(() => {})` alongside each `fetchSpots(activeFilter)` call in doApprove/doReject/doBan. Same applied to heroes.
- **Files modified:** SpotsSection.tsx, HeroesSection.tsx
- **Verification:** Badge updates immediately after moderation action
- **Committed in:** e5de25e, 8a0fe4a

---

**Total deviations:** 1 auto-fixed (Rule 2 — missing correctness: stale badge after actions)
**Impact on plan:** Fix is necessary for correct UI. No scope creep.

## Issues Encountered
None — TypeScript compiled clean after each task. All acceptance grep checks passed.

## Known Stubs
None — both sections are fully wired to real API data.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- Task 3 (checkpoint:human-verify) is next: admin must log in and manually verify the moderation dashboard with real spots and heroes in PENDING_MODERATION status.
- Prerequisite: at least one spot and one hero in PENDING_MODERATION (run through Plan 03/04 forms or set status directly in DB).

---
*Phase: 20-flujo-completo-avisos-portadas*
*Completed: 2026-05-28*
