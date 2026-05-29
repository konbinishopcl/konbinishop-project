---
phase: 24-real-org-account-switching-via-jwt
plan: "04"
subsystem: frontend-ui-consumers
tags: [auth, org-switching, UserMenu, AccountShell, providers, typescript]
dependency_graph:
  requires: [24-03]
  provides: [frontend-ui-org-switching-complete]
  affects: [UserMenu.tsx, AccountShell.tsx, perfil/page.tsx, cuenta/organizaciones]
tech_stack:
  added: []
  patterns: [isOrgContext-driven conditional rendering, personalToken org-list fetch, switchToOrg/switchBack toast wiring]
key_files:
  created: []
  modified:
    - apps/website/components/UserMenu.tsx
    - apps/website/app/(site)/cuenta/AccountShell.tsx
    - apps/website/app/(site)/cuenta/perfil/page.tsx
decisions:
  - "org list always fetched with personalToken ?? token so org JWTs (which have no memberships) do not break the switcher list"
  - "isOrgContext used everywhere instead of activeOrg — single source of truth from user.type === ORGANIZATION"
  - "SWITCH-12 deviation added during human-verify: Crear organizacion UI hidden in org context (backend already returns 403)"
  - "Organizaciones tab hidden in sidebar + redirect guard added while in org context to prevent stale UI"
metrics:
  duration: "~25 minutes (including human-verify and fix cycle)"
  completed: "2026-05-29"
  tasks_completed: 3
  files_modified: 4
---

# Phase 24 Plan 04: Frontend UI Consumers Summary

Real org account switching UI wired end-to-end: UserMenu calls `switchToOrg`/`switchBack` from providers, AccountShell and perfil/page.tsx render org identity directly from `user` + `isOrgContext`, human-verified the full round-trip including reload persistence.

## What Was Built

### Task 1 — Rewrite UserMenu.tsx for real switching (SWITCH-09)

Rewrote `UserMenu.tsx` to use the new provider API from Plan 03:
- Removed `OrgEntry` import (no longer exported from providers)
- Replaced `activeOrg`/`setActiveOrg` with `user`, `personalToken`, `personalUser`, `switchToOrg`, `switchBack`, `isOrgContext`
- Org list fetch now uses `personalToken ?? token` so org JWTs (which have no memberships) do not break the switcher list
- Avatar button shows org initials with purple gradient when `isOrgContext`
- "Operando como" block renders from `user` directly (user IS the org after switching)
- "Cambiar de cuenta" personal-row renders `(personalUser ?? user).initials` so personal identity is shown even in org context
- Org buttons call `await switchToOrg(org.id)` with toast success/error; "Cuenta personal" calls `switchBack()` with toast
- Zero remaining `activeOrg`/`setActiveOrg` references

Commit: `ff40ccc`

### Task 2 — AccountShell identity + perfil Danger Zone conditional (SWITCH-10, SWITCH-11)

**AccountShell.tsx:**
- Replaced `activeOrg` with `isOrgContext` throughout
- `displayEmail` shows `@handle` in org context, email in personal context
- Avatar circle uses purple gradient when `isOrgContext`
- "Operando como" badge rendered conditionally on `isOrgContext`

**perfil/page.tsx:**
- Destructures `isOrgContext` from `useUser()`
- Danger Zone rows carry `hideInOrgContext` flag; array is `.filter(r => !isOrgContext || !r.hideInOrgContext)` before `.map()`
- Password row has `hideInOrgContext: true`; email and delete rows have `hideInOrgContext: false`

Commit: `8b3a25c`

### Task 3 — Human-verify full org switch round-trip (checkpoint)

Human approved all verification steps:
1. Login, org listed in UserMenu — personal identity shown correctly
2. Click org → toast "Operando como {org}", navbar avatar turns purple with org initials
3. /cuenta/perfil sidebar shows ORG name + @handle, purple avatar, "Operando como" badge; profile form shows org data
4. Danger Zone hides "Cambiar contraseña"; "Cambiar email" and "Eliminar cuenta" remain
5. F5 reload while in org context — stays in org context (kb-personal-* keys preserve session)
6. "Cuenta personal" → toast, personal identity restored, password row reappears
7. (Backend 403 on org trying to create another org confirmed)

During verification two additional fixes were applied (see Deviations).

## Deviations from Plan

### Auto-fixed Issues During Human Verify

**1. [Rule 2 - Missing Critical Functionality] Hide "Crear organización" UI when in org context (SWITCH-12)**
- **Found during:** Task 3 human verification
- **Issue:** The "Crear organización" button in UserMenu was visible while in org context, even though the backend already returns 403. Showing it is misleading and potentially confusing.
- **Fix:** Added `{!isOrgContext && (/* Crear organización button */)}` conditional in UserMenu.tsx
- **Files modified:** `apps/website/components/UserMenu.tsx`
- **Commit:** `73c23e3`

**2. [Rule 2 - Missing Critical Functionality] Hide Organizaciones tab + redirect guard in org context**
- **Found during:** Task 3 human verification
- **Issue:** The "Organizaciones" tab in the sidebar was visible in org context (org accounts have no org management). Navigating to /cuenta/organizaciones while in org context rendered org management UI for the org's own perspective, which is incorrect.
- **Fix:** Hid the Organizaciones tab from sidebar when `isOrgContext`; added redirect from /cuenta/organizaciones to /cuenta/perfil when in org context
- **Files modified:** `apps/website/app/(site)/cuenta/AccountShell.tsx`, `apps/website/app/(site)/cuenta/organizaciones/page.tsx`
- **Commit:** `63d35be`

## Known Stubs

None — all data is wired to real API responses.

## Self-Check: PASSED

- `ff40ccc` exists: `git log --oneline --all | grep ff40ccc` → found
- `8b3a25c` exists: found
- `73c23e3` exists: found
- `63d35be` exists: found
- `apps/website/components/UserMenu.tsx` exists and contains `switchToOrg`
- `apps/website/app/(site)/cuenta/AccountShell.tsx` exists and contains `isOrgContext`
- `apps/website/app/(site)/cuenta/perfil/page.tsx` exists and contains `hideInOrgContext`
