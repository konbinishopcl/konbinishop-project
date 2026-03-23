---
phase: 01-security-foundation
plan: 01
subsystem: auth
tags: [role-enforcement, cors, zustand, next-middleware, strapi]

# Dependency graph
requires: []
provides:
  - Role enforcement at 4 guard points (useUserStore, auth.ts login, layout.tsx, middleware.ts)
  - CORS restricted to known origins (DASHBOARD_URL, WEBSITE_URL)
  - auth-response middleware enriches POST /api/auth/local with role object
affects: [payments, organizer-panel, any feature requiring dashboard access]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "useUserStore.getState() for hasDashboardRole to avoid stale closure"
    - "role.type (not role.name) as the canonical role field for all guard points"
    - "?populate=role appended to /api/users/me fetch in middleware"

key-files:
  created: []
  modified:
    - apps/dashboard/src/lib/stores/useUserStore.ts
    - apps/dashboard/src/lib/strapi/auth.ts
    - apps/dashboard/src/app/dashboard/layout.tsx
    - apps/dashboard/src/middleware.ts
    - apps/strapi/config/middlewares.ts

key-decisions:
  - "Use role.type === 'dashboard' (not role.name === 'Dashboard') for all guard points — consistent with validateUserRole and Strapi Users & Permissions plugin type field"
  - "useUserStore.getState() in hasDashboardRole to read live store state, avoiding stale closure pitfall in useEffect"
  - "Uncomment global::auth-response middleware — confirmed it enriches POST /api/auth/local responses with role object, required for login-time role validation"
  - "Remove hardcoded username blocklist (jokukapi/Prueba) — role.type check is the correct general solution"

patterns-established:
  - "Role check pattern: !user.role || user.role.type !== 'dashboard' used consistently at all 4 guard points"
  - "CORS env var pattern: process.env.DASHBOARD_URL || 'http://localhost:3001'"

requirements-completed: [SEC-01, SEC-03]

# Metrics
duration: 3min
completed: 2026-03-23
---

# Phase 1 Plan 1: Role Enforcement + CORS Restriction Summary

**Four-layer role enforcement (store, login, layout, middleware) plus CORS restricted from wildcard to explicit dashboard+website origins**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-23T04:37:23Z
- **Completed:** 2026-03-23T04:40:09Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Restored role.type === 'dashboard' enforcement at all 4 guard points in the dashboard app
- Removed hardcoded username blocklist (jokukapi, Prueba) — security now based on role, not identity
- Restricted Strapi CORS from wildcard `['*']` to explicit `[DASHBOARD_URL, WEBSITE_URL]`
- Enabled auth-response middleware to ensure POST /api/auth/local returns role object in login response

## Task Commits

Each task was committed atomically:

1. **Task 1: Restore role enforcement in useUserStore, auth.ts, layout.tsx, and middleware.ts** - `1466463` (feat)
2. **Task 2: Restrict Strapi CORS to known origins** - `4212757` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `apps/dashboard/src/lib/stores/useUserStore.ts` - setUser throws on non-dashboard role; hasDashboardRole reads live state via getState()
- `apps/dashboard/src/lib/strapi/auth.ts` - login() rejects non-dashboard users; re-throws custom role error
- `apps/dashboard/src/app/dashboard/layout.tsx` - removed blocklist, restored hasDashboardRole() guard and Acceso Denegado render block; added AlertTriangle import
- `apps/dashboard/src/middleware.ts` - adds ?populate=role to /api/users/me; uncomments role.type check with redirect
- `apps/strapi/config/middlewares.ts` - CORS restricted to DASHBOARD_URL/WEBSITE_URL; auth-response and auth-error-logger enabled

## Decisions Made
- Used `role.type` (not `role.name`) as the canonical check field — consistent with existing `validateUserRole` in auth.ts and the Strapi Users & Permissions plugin convention
- Used `useUserStore.getState()` in `hasDashboardRole` to avoid the stale closure pitfall documented in research
- Uncommented `global::auth-response` middleware after confirming it enriches `/api/auth/local` responses with the `role` object — required for `response.user.role` to be populated during login validation
- Removed `localStorage.removeItem('user-storage')` from `setUser` — Zustand persist handles storage consistently; manual removal caused race conditions

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Dashboard is now accessible only to users with role.type === 'dashboard'
- CORS is restricted; unknown origins will receive 403 from Strapi
- Production environment variables DASHBOARD_URL and WEBSITE_URL must be set (otherwise falls back to localhost defaults)
- Ready for Phase 1 Plan 2 (remaining security tasks)

---
*Phase: 01-security-foundation*
*Completed: 2026-03-23*
