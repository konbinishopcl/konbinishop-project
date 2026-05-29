---
phase: 24-real-org-account-switching-via-jwt
plan: "02"
subsystem: api
tags: [jwt, nestjs, prisma, audit, authorization, org-context]

# Dependency graph
requires:
  - phase: 24-real-org-account-switching-via-jwt
    plan: "01"
    provides: "JwtUser extended with actingAs+orgRole claims; OrgContextGuard rewrites; switch-org endpoint"
provides:
  - "actingAs-aware draft order search and creation (Order.userId = personal userId)"
  - "actingAs-aware payment ownership check"
  - "actingAs-aware OrgMember membership lookup in ensureVisible (members can access org orders)"
  - "org-can't-create-org guard (SWITCH-12)"
  - "audit log attribution uses actingAs ?? sub across all 5 impacted services"
affects:
  - "24-03 (frontend foundation — depends on backend being correct)"
  - "24-04 (frontend UI — uses org context data)"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "user.actingAs ?? user.sub — always yields personal userId regardless of context"
    - "Only audit.log userId fields updated; ownership connect/lookup patterns untouched"

key-files:
  created: []
  modified:
    - apps/api/src/orders/orders.service.ts
    - apps/api/src/payments/payments.service.ts
    - apps/api/src/organizations/organizations.service.ts
    - apps/api/src/events/events.service.ts
    - apps/api/src/transfers/transfers.service.ts
    - apps/api/src/spots/spots.service.ts
    - apps/api/src/heroes/heroes.service.ts

key-decisions:
  - "getActiveSub (orders.service.ts line 45) reviewed and left unchanged — orgContext branch already correct"
  - "orders.service.ts line 339 personal-order branch left unchanged — correct by design (org-context access to personal order is correctly blocked)"
  - "transfers.service.ts fromUserId: user.sub and resolvedBy: user.sub left unchanged — they record domain facts, not audit actor"
  - "organizations.service.ts membership lookups (userId_orgId) left unchanged — they use user.sub as intended pre-switch"
  - "articles.service.ts intentionally excluded — zero audit.log calls, only orgContext?.orgId ?? user.sub content-ownership routing (correct pattern)"
  - "users.service.ts intentionally excluded — admins never operate in org context"

patterns-established:
  - "Pattern: actingAs ?? sub — use in any field that means 'the person who took this action' or 'the billing user'"
  - "Pattern: orgContext?.orgId ?? user.sub — use for content ownership routing (owner of the item), unchanged"

requirements-completed: [SWITCH-05, SWITCH-06, SWITCH-12]

# Metrics
duration: 15min
completed: 2026-05-29
---

# Phase 24 Plan 02: Backend Services actingAs Fixes Summary

**actingAs-aware userId patterns across 7 services: orders/payments ownership, org guard, and 22 audit log attributions fixed so org-context actions record the acting person not the org**

## Performance

- **Duration:** 15 min
- **Started:** 2026-05-29T02:33:43Z
- **Completed:** 2026-05-29T02:48:00Z
- **Tasks:** 3
- **Files modified:** 7

## Accomplishments
- Fixed org member lockout from their org's orders (ensureVisible membership lookup was using orgId as userId)
- Orders created in org context now bill the personal user (Order.userId = actingAs) and attribute to the org (Order.orgId)
- Org-context JWTs can no longer create new organizations (403 guard)
- All 22 audit.log calls across events/organizations/transfers/spots/heroes now record the acting person

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix orders + payments userId patterns (SWITCH-05)** - `3d83075` (fix)
2. **Task 2: organizations.service.ts create() userId + org-can't-create-org guard (SWITCH-05, SWITCH-12)** - `8249db6` (fix)
3. **Task 3: Audit log attribution — actingAs ?? sub across 5 services (SWITCH-06)** - `99c000a` (fix)

## Files Created/Modified
- `apps/api/src/orders/orders.service.ts` - Draft search, owner connect, ensureVisible lookup all use actingAs ?? sub
- `apps/api/src/payments/payments.service.ts` - Ownership check uses (actingAs ?? sub) with correct precedence
- `apps/api/src/organizations/organizations.service.ts` - SWITCH-12 guard + OrgMember.userId + 7 audit.log calls
- `apps/api/src/events/events.service.ts` - 6 audit.log calls (CREATE/UPDATE/DELETE/APPROVE/REJECT/BAN)
- `apps/api/src/transfers/transfers.service.ts` - 4 audit.log calls (create/accept/reject/adminCreate)
- `apps/api/src/spots/spots.service.ts` - 3 audit.log calls (APPROVE/REJECT/BAN)
- `apps/api/src/heroes/heroes.service.ts` - 3 audit.log calls (APPROVE/REJECT/BAN)

## Decisions Made

- `getActiveSub` in orders.service.ts (line 45) was reviewed and left unchanged — `orgContext ? null : user.sub` is already correct because in org context `orgContext` is set (so it uses orgId via the second branch), and in personal mode `user.sub` is the person.
- Line 339 in orders.service.ts (`order.userId !== user.sub`) left unchanged intentionally — that else-branch only runs for personal orders (order.orgId === null), and blocking org-context access to a personal order is correct per the full-identity-switch design.
- `transfers.service.ts` `fromUserId: user.sub` and `resolvedBy: user.sub` left unchanged — these are domain facts stored in the Transfer row, not audit attribution.
- Membership lookup lines (`userId_orgId: { userId: user.sub, ... }`) in organizations.service.ts left unchanged — in org context these will now correctly find membership because the caller IS the org user and the guard ensures orgId matches.
- `articles.service.ts` intentionally excluded — zero audit.log calls; its `user.sub` references are content-ownership routing which is the correct pattern.
- `users.service.ts` intentionally excluded — admins never operate in org context.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. TypeScript compiled clean at every checkpoint. All grep counts matched acceptance criteria exactly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Backend is now fully actingAs-aware across all 7 impacted services
- Plan 24-03 (frontend foundation) can proceed: api.ts cleanup, providers.tsx rewrite
- Plan 24-04 (frontend UI): AccountShell, UserMenu, perfil/page.tsx updates can proceed after 24-03

## Self-Check: PASSED

- All 7 modified files exist on disk: FOUND
- Task commits verified: 3d83075, 8249db6, 99c000a all present in git log
- grep counts match acceptance criteria: orders=3, payments=1, orgs_guard=1, orgs=8, events=6, transfers=4, spots=3, heroes=3, users_actingAs=0
- npx tsc --noEmit clean at every checkpoint
- audit.log enumeration verified exhaustive: {events, organizations, transfers, spots, heroes, users} — no other service calls audit.log in org-reachable paths

---
*Phase: 24-real-org-account-switching-via-jwt*
*Completed: 2026-05-29*
