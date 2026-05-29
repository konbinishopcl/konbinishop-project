---
phase: 24-real-org-account-switching-via-jwt
plan: "01"
subsystem: backend-auth
tags: [auth, jwt, org-switching, guard]
dependency_graph:
  requires: []
  provides: [JwtUser-org-claims, POST-auth-switch-org, org-aware-refresh, OrgContextGuard-jwt-based]
  affects: [auth.service.ts, auth.controller.ts, org-context.guard.ts]
tech_stack:
  added: []
  patterns: [JWT-org-identity, actingAs-claim, no-header-context-guard]
key_files:
  created:
    - apps/api/src/auth/dto/switch-org.dto.ts
  modified:
    - apps/api/src/auth/current-user.decorator.ts
    - apps/api/src/auth/auth.service.ts
    - apps/api/src/auth/auth.controller.ts
    - apps/api/src/common/org-context/org-context.guard.ts
decisions:
  - "JwtUser extended with optional orgRole and actingAs claims — only present in org-context JWTs"
  - "OrgContextGuard is now DB-free — trusts JWT claims validated at switch-org time (7-day window)"
  - "refreshToken accepts full JwtUser to preserve org context on token refresh"
  - "Membership revocation mechanism: refreshToken re-validates OrgMember, throwing 401 if removed"
metrics:
  duration_minutes: 15
  completed_date: "2026-05-28"
  tasks_completed: 3
  files_modified: 5
---

# Phase 24 Plan 01: Backend Auth Foundation Summary

**One-liner:** JWT-based org identity switching — new `sub=orgId` JWT with orgRole+actingAs claims, org-aware refresh, and DB-free OrgContextGuard reading JWT instead of X-Org-Context header.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend JwtUser + SwitchOrgDto + POST /auth/switch-org | 7ac6fb2 | current-user.decorator.ts, switch-org.dto.ts, auth.service.ts, auth.controller.ts |
| 2 | refreshToken preserves org claims | 39fc2a1 | auth.service.ts, auth.controller.ts |
| 3 | Rewrite OrgContextGuard to use JWT actingAs | aba2206 | org-context.guard.ts |

## What Was Built

### Task 1: JwtUser Extension + switch-org Endpoint (SWITCH-01, SWITCH-02)

`JwtUser` type extended with two optional fields:
- `orgRole?: string` — the OrgRole of the acting user within the org
- `actingAs?: number` — the personal userId when operating in org context

New `SwitchOrgDto` follows class-validator + @ApiProperty convention.

`AuthService.switchOrg(personalUserId, orgId)`:
1. Verifies OrgMember membership via composite unique key `userId_orgId`
2. Checks org exists and is not blocked
3. Issues JWT with `{ sub: orgId, email, role, orgRole, actingAs: personalUserId }`
4. Returns `{ token, user: sanitize(org) }`

`POST /auth/switch-org` controller endpoint:
- Guards against nested org switching (`if (user.actingAs) throw ForbiddenException`)
- Protected by `JwtAuthGuard`

### Task 2: Org-Aware Token Refresh (SWITCH-03)

`refreshToken` signature changed from `(userId: number)` to `(currentUser: JwtUser)`.

When `currentUser.actingAs` is set (org context):
- Looks up the org user via `currentUser.sub` (orgId)
- Re-validates OrgMember membership (natural revocation mechanism)
- Re-issues org JWT preserving `actingAs` claim
- Throws `UnauthorizedException` if membership was revoked

Personal-mode refresh path unchanged.

Controller `refresh` handler updated to pass `user` (full JwtUser) instead of `user.sub`.

### Task 3: OrgContextGuard Rewrite (SWITCH-04)

Complete guard rewrite:
- **Before:** Read `X-Org-Context` header, parse orgId, query DB for org existence + membership
- **After:** Read `user.actingAs` from JWT claims, populate `req.orgContext` from `{ orgId: user.sub, role: user.orgRole as OrgRole }`

Removed: `ForbiddenException`, `NotFoundException`, `PrismaService` injection, constructor, header logic, two DB queries per request.

The guard is now stateless and DB-free. All existing service code using `orgContext?.orgId ?? user.sub` pattern continues to work unchanged.

## Deviations from Plan

None — plan executed exactly as written. The advisor noted a minor difference between CONTEXT.md (had dead `userId` variable) and PLAN.md Task 2a code block; the PLAN.md version (cleaner, no dead variable) was used as instructed.

## Success Criteria Verification

- [x] JwtUser carries optional `orgRole` and `actingAs` — `tsc --noEmit` passes
- [x] POST /auth/switch-org issues org JWT for valid member, rejects non-members (403) and org-context callers (403)
- [x] GET /auth/refresh preserves org context (re-issues org JWT) and revokes on lost membership (401)
- [x] OrgContextGuard sources orgContext from the JWT — zero X-Org-Context references, zero DB queries

## Self-Check: PASSED

Files exist:
- apps/api/src/auth/dto/switch-org.dto.ts — FOUND
- apps/api/src/auth/current-user.decorator.ts — FOUND (orgRole+actingAs added)
- apps/api/src/auth/auth.service.ts — FOUND (switchOrg + refreshToken updated)
- apps/api/src/auth/auth.controller.ts — FOUND (switch-org endpoint + refresh update)
- apps/api/src/common/org-context/org-context.guard.ts — FOUND (rewritten)

Commits verified:
- 7ac6fb2 feat(24-01): extend JwtUser + add SwitchOrgDto + POST /auth/switch-org
- 39fc2a1 feat(24-01): refreshToken preserves org claims (SWITCH-03)
- aba2206 feat(24-01): rewrite OrgContextGuard to use JWT actingAs claim (SWITCH-04)
