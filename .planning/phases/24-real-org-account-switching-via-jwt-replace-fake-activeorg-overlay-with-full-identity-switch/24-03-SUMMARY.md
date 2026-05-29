---
phase: 24-real-org-account-switching-via-jwt
plan: "03"
subsystem: frontend-auth
tags: [auth, org-switching, providers, api, typescript]
dependency_graph:
  requires: [24-01]
  provides: [frontend-identity-switching-layer]
  affects: [providers.tsx, api.ts, data.ts, UserMenu.tsx, AccountShell.tsx]
tech_stack:
  added: []
  patterns: [localStorage personal session backup, derived isOrgContext, api.switchOrg]
key_files:
  created: []
  modified:
    - apps/website/lib/data.ts
    - apps/website/lib/api.ts
    - apps/website/components/providers.tsx
decisions:
  - "personalToken added to UserCtxValue so Plan 04 UserMenu can fetch org list with personal token"
  - "isOrgContext derived from user.type === 'ORGANIZATION' — not stored separately"
  - "No org-detection branch in refresh path — backend re-issues org JWT naturally (Plan 01 SWITCH-03)"
  - "kb-org migrated away on init and logout to clean stale localStorage key"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-29"
  tasks_completed: 2
  files_modified: 3
---

# Phase 24 Plan 03: Frontend Auth Layer — Real Identity Switching

Real org identity switching built into the data/api/provider layer: User types extended, X-Org-Context machinery removed, api.switchOrg added, and providers.tsx rewritten with switchToOrg/switchBack that fully swap the JWT token and user object in both memory and localStorage.

## Objective

Rebuild the frontend auth/data layer for real identity switching: remove all X-Org-Context machinery from api.ts, extend ApiUser/User with `type` and `handle`, add `api.switchOrg()`, and rewrite providers.tsx so `switchToOrg()` saves the personal session and swaps in the org token+user, `switchBack()` restores it, and `isOrgContext`/`personalUser`/`personalToken` are exposed.

## Tasks Completed

### Task 1: Extend User/ApiUser types, clean X-Org-Context, add api.switchOrg (SWITCH-07)
**Commit:** `0e110de`
**Files:** `apps/website/lib/data.ts`, `apps/website/lib/api.ts`

- `User` type extended with `type?: 'PERSON' | 'ORGANIZATION'` and `handle?: string | null`
- `ApiUser` type extended with `type: 'PERSON' | 'ORGANIZATION'` and `handle: string | null`
- `toUser()` now passes `type` and `handle` through to the User shape
- Removed `let _activeOrgId`, `setOrgContext()`, `getOrgContext()` exports entirely
- Removed `X-Org-Context` header from `buildHeaders()` and `uploadImage()`
- Added `api.switchOrg(orgId, token)` → `POST /auth/switch-org`

### Task 2: Rewrite providers.tsx for real switching (SWITCH-08)
**Commit:** `d4245fc`
**Files:** `apps/website/components/providers.tsx`

- Removed `OrgEntry` type, `activeOrg` state, `setActiveOrg` function
- Added `personalToken` and `personalUser` state for switch-back persistence
- Added `isOrgContext` derived: `user?.type === "ORGANIZATION"`
- Added `switchToOrg(orgId)`: saves personal session → calls `api.switchOrg` → swaps token+user
- Added `switchBack()`: restores personal session from saved state, clears personal keys
- Init `useEffect`: restores `kb-personal-token`/`kb-personal-user` on page refresh (org mode survives refresh)
- Migrates away `kb-org` stale key: `localStorage.removeItem("kb-org")` on init and logout
- `UserCtxValue` now provides: `isOrgContext`, `personalUser`, `personalToken`, `switchToOrg`, `switchBack`
- Import changed from `{ toUser, setOrgContext, type ApiUser }` to `{ api, toUser, type ApiUser }`

## Verification

```
X-Org-Context in api.ts:               0 (was >0)
setOrgContext/getOrgContext/_activeOrgId: 0 (all removed)
switchOrg in api.ts:                    1
switchToOrg in providers.tsx:           3
switchBack in providers.tsx:            3
activeOrg/setActiveOrg in providers.tsx: 0 (fully removed)
kb-personal-token references:           5
kb-org removal references:              2
```

TypeScript compile: `npx tsc --noEmit` — api.ts, data.ts, providers.tsx compile clean. Only Plan-04 consumer files error (expected):
- `components/UserMenu.tsx` — imports removed `OrgEntry`, uses removed `activeOrg`/`setActiveOrg`
- `app/(site)/cuenta/AccountShell.tsx` — uses removed `activeOrg`
- `.next/types/app/(site)/cuenta/organizador/page.ts` — pre-existing stale generated file from Phase 23

These are non-blocking for this plan; they are fixed in Plan 04.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. The data/api/provider layer is fully wired. The UI consumers in Plan 04 will connect to the new context values.

## Key Architectural Decisions

1. **personalToken in UserCtxValue** — Plan 04's UserMenu needs to fetch org list using the personal token (org JWTs don't carry membership info). Adding it to the context value makes it directly available.

2. **isOrgContext derived, not stored** — `const isOrgContext = user?.type === "ORGANIZATION"` eliminates a separate state variable and stays automatically in sync with user state.

3. **No org-detection branch in refresh** — When refresh returns a user with `type: 'ORGANIZATION'`, `toUser()` naturally preserves that. The backend re-issues the org JWT (Plan 01 SWITCH-03), so no special branching is needed here.

4. **kb-org migration** — Existing users may have a stale `kb-org` key. It's removed on every init and every logout to clean up gracefully.

## Self-Check: PASSED

- `apps/website/lib/data.ts` — file exists and contains `type?:` field
- `apps/website/lib/api.ts` — file exists, contains `switchOrg:`, no X-Org-Context
- `apps/website/components/providers.tsx` — file exists, contains switchToOrg/switchBack/isOrgContext
- Commits `0e110de` and `d4245fc` verified in git log
