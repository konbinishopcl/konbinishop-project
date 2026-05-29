---
phase: 22-org-context-switching
plan: "01"
subsystem: auth
tags: [react, context, localstorage, typescript, org-context]

# Dependency graph
requires:
  - phase: 09-organizaciones-y-transferencias
    provides: setOrgContext/getOrgContext in lib/api.ts with X-Org-Context header injection
provides:
  - OrgEntry exported type { id, name, handle } from providers.tsx
  - activeOrg and setActiveOrg in UserContext (useUser() hook)
  - localStorage persistence of active org under kb-org key
  - setOrgContext re-applied on app init (X-Org-Context header survives refresh)
  - org cleared on logout and 401 expired-session
affects: [22-02-org-context-switching, UserMenu.tsx org switching UI]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "localStorage persistence pattern: read in try/catch inside init useEffect before setReady(true)"
    - "Module-level side effect pattern: setOrgContext synced on every activeOrg change"
    - "Session expiry clear pattern: org cleared in both logout and 401 branch"

key-files:
  created: []
  modified:
    - apps/website/components/providers.tsx

key-decisions:
  - "OrgEntry type is exported from providers.tsx (canonical location); Plan 22-02 will delete the local copy from UserMenu.tsx"
  - "Init restore placed inside existing try/catch block to handle malformed kb-org values without breaking init"
  - "setReady(true) placed after org restore so consumers see activeOrg on first render"
  - "401 branch (background token refresh) clears org identically to logout to prevent stale org context"

patterns-established:
  - "Org restore pattern: localStorage.getItem('kb-org') inside init try/catch, before setReady(true)"
  - "Org sync pattern: every activeOrg change calls setOrgContext() to keep lib/api.ts in sync"

requirements-completed: [ORG-01, ORG-02, ORG-07, ORG-08]

# Metrics
duration: 12min
completed: 2026-05-29
---

# Phase 22 Plan 01: Org Context Switching — Foundation Summary

**OrgEntry exported from providers.tsx with activeOrg/setActiveOrg in UserContext, localStorage kb-org persistence, and setOrgContext re-applied on init so X-Org-Context header survives page refreshes**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-29T00:06:36Z
- **Completed:** 2026-05-29T00:18:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Exported `OrgEntry = { id: number; name: string | null; handle: string | null }` type from providers.tsx as the canonical definition
- Extended `UserCtxValue` and `UserProvider` with `activeOrg` / `setActiveOrg` backed by localStorage `kb-org`
- On app init, `kb-org` is restored into state AND `setOrgContext(id)` is called before `ready` flips true — preserving the `X-Org-Context` header across page refreshes
- Org cleared in both `logout` and the `401` expired-session branch so no stale org context survives a session end

## Task Commits

Each task was committed atomically:

1. **Task 1: Export OrgEntry and extend UserContext with activeOrg** - `9a5db0f` (feat)
2. **Task 2: Implement activeOrg state, persistence, init restore, and logout clear** - `f71a08b` (feat)

**Plan metadata:** _(docs commit follows)_

## Files Created/Modified

- `apps/website/components/providers.tsx` — OrgEntry type export, setOrgContext import, UserCtxValue extension, activeOrg state, kb-org localStorage persistence, logout/401 org clear

## Decisions Made

- `OrgEntry` is the canonical exported type from providers.tsx; Plan 22-02 will delete the local copy from UserMenu.tsx and import this one
- Init restore is placed inside the existing `try { ... } catch { /* ignore */ }` block so a malformed `kb-org` value never breaks initialization
- `setReady(true)` is called after org restore so guards and consumers see `activeOrg` on the very first render (ORG-08)
- The `401` background refresh branch clears the org with the same three lines as `logout` — an expired token is treated identically to a manual logout for org context

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None — TypeScript check passed cleanly on first run, no type errors.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `useUser()` now returns `activeOrg` and `setActiveOrg` in addition to existing fields — Plan 22-02 can import `OrgEntry` and wire the visual org-switcher UI on top of this context
- No blockers

---
*Phase: 22-org-context-switching*
*Completed: 2026-05-29*
