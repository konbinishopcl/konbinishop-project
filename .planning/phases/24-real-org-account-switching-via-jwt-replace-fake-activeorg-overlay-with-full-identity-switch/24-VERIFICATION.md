---
phase: 24-real-org-account-switching-via-jwt
verified: 2026-05-28T20:00:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
---

# Phase 24: Real Org Account Switching via JWT — Verification Report

**Phase Goal:** Replace fake activeOrg overlay with real JWT-based org identity switching — users can switch to an org account (getting a real org JWT), all services use actingAs for attribution, and the UI reflects the active identity.
**Verified:** 2026-05-28
**Status:** PASSED
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 | A logged-in member can POST /auth/switch-org { orgId } and receive a new JWT whose sub is the orgId | VERIFIED | `auth.controller.ts` line 161-169: `@Post('switch-org')` + `auth.service.ts` `async switchOrg(personalUserId, orgId)` issues `{ sub: orgId, orgRole, actingAs: personalUserId }` |
| 2 | An org-context JWT carries orgRole and actingAs claims | VERIFIED | `auth.service.ts` line 267: `actingAs: personalUserId` in `jwt.sign()`; `JwtUser` type has `orgRole?: string; actingAs?: number` |
| 3 | Refreshing the token while in org context returns another org JWT (sub=orgId) | VERIFIED | `auth.service.ts` line 230-248: `refreshToken(currentUser: JwtUser)` re-issues org JWT when `currentUser.actingAs` is set; controller line 158 passes full `user` (not `user.sub`) |
| 4 | OrgContextGuard populates req.orgContext from the JWT actingAs claim with no X-Org-Context header | VERIFIED | `org-context.guard.ts` reads `user.actingAs`, sets `{ orgId: user.sub, role: user.orgRole as OrgRole }`; zero X-Org-Context references; zero PrismaService references |
| 5 | When acting in org context, the personal user can still load/modify their org's orders | VERIFIED | `orders.service.ts` has 3 occurrences of `user.actingAs ?? user.sub` (lines 65, 75, 334) — draft search, owner connect, ensureVisible membership lookup |
| 6 | Creating an org while in org context is forbidden | VERIFIED | `organizations.service.ts` create() first statement: `if (user.actingAs) throw new ForbiddenException('Las organizaciones no pueden crear otras organizaciones')` |
| 7 | Audit logs record the personal actor (actingAs), not the org, when an action happens in org context | VERIFIED | events(6), transfers(4), spots(3), heroes(3), organizations(8) — all audit.log userId fields use `actingAs ?? sub`; `users.service.ts` has zero `actingAs` references |
| 8 | lib/api.ts sends no X-Org-Context header; api.switchOrg exists | VERIFIED | grep: 0 `X-Org-Context`, 0 `setOrgContext/getOrgContext/_activeOrgId`, 1 `switchOrg:` method |
| 9 | The User object carries type and handle; switchToOrg/switchBack real switching in providers | VERIFIED | `data.ts` User has `type?:` and `handle?:`; `providers.tsx` has `switchToOrg`, `switchBack`, `isOrgContext = user?.type === "ORGANIZATION"`, `kb-personal-token` persistence, `kb-org` removal |
| 10 | Selecting an org in UserMenu performs a real switch with toast; personal token used for org list fetch | VERIFIED | `UserMenu.tsx` contains `await switchToOrg(org.id)`, `switchBack()`, `personalToken ?? token` for org fetch, `isOrgContext` for avatar styling; zero `activeOrg/setActiveOrg` |
| 11 | The /cuenta sidebar reflects org identity; Danger Zone hides password change in org context | VERIFIED | `AccountShell.tsx`: `isOrgContext` for avatar, badge, handle display; zero `activeOrg`; `perfil/page.tsx`: `hideInOrgContext: true` on password row, `.filter(r => !isOrgContext \|\| !r.hideInOrgContext)` |
| 12 | Org accounts blocked from creating other orgs (backend 403 + UI hidden); Organizaciones tab hidden + redirect | VERIFIED | Backend guard confirmed (truth 6); `UserMenu.tsx` line 119: `{!isOrgContext && ...Crear organización...}`; `AccountShell.tsx` TABS array has `organizaciones` with `orgHidden: true`, filtered by `!isOrgContext \|\| !t.orgHidden`; `organizaciones/page.tsx` redirects when `isOrgContext` |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/auth/current-user.decorator.ts` | JwtUser with orgRole + actingAs | VERIFIED | Line 3: `orgRole?: string; actingAs?: number` |
| `apps/api/src/auth/dto/switch-org.dto.ts` | SwitchOrgDto with orgId: number | VERIFIED | `class SwitchOrgDto` with `@IsNumber() orgId: number` |
| `apps/api/src/auth/auth.service.ts` | switchOrg() + org-aware refreshToken | VERIFIED | `async switchOrg(` at line 253; `async refreshToken(currentUser: JwtUser)` at line 230 |
| `apps/api/src/auth/auth.controller.ts` | POST /auth/switch-org + refresh with JwtUser | VERIFIED | `@Post('switch-org')` line 161; refresh passes `user` not `user.sub` |
| `apps/api/src/common/org-context/org-context.guard.ts` | JWT actingAs-based orgContext, no header, no DB | VERIFIED | `user.actingAs` check; 0 X-Org-Context; 0 PrismaService |
| `apps/api/src/orders/orders.service.ts` | actingAs-aware draft, owner, ensureVisible | VERIFIED | 3 occurrences of `user.actingAs ?? user.sub` |
| `apps/api/src/payments/payments.service.ts` | actingAs-aware ownership check | VERIFIED | 1 occurrence of `user.actingAs ?? user.sub` |
| `apps/api/src/organizations/organizations.service.ts` | org-can't-create-org guard + actingAs userId | VERIFIED | Guard string present; 8 occurrences of `user.actingAs ?? user.sub` |
| `apps/api/src/events/events.service.ts` | 6 audit.log with actingAs attribution | VERIFIED | `grep -c` = 6 |
| `apps/api/src/transfers/transfers.service.ts` | 4 audit.log with actingAs attribution | VERIFIED | `grep -c` = 4 |
| `apps/api/src/spots/spots.service.ts` | 3 audit.log with actor.actingAs attribution | VERIFIED | `grep -c` = 3 |
| `apps/api/src/heroes/heroes.service.ts` | 3 audit.log with actor.actingAs attribution | VERIFIED | `grep -c` = 3 |
| `apps/website/lib/data.ts` | User type with type? and handle? | VERIFIED | Lines 43-44: `type?: 'PERSON' \| 'ORGANIZATION'`; `handle?: string \| null` |
| `apps/website/lib/api.ts` | switchOrg method, ApiUser with type+handle, no X-Org-Context | VERIFIED | 0 X-Org-Context; 1 switchOrg; ApiUser lines 80-81 |
| `apps/website/components/providers.tsx` | switchToOrg, switchBack, isOrgContext, personalUser | VERIFIED | All present; 0 activeOrg/setActiveOrg/setOrgContext |
| `apps/website/components/UserMenu.tsx` | real switching, personalToken org fetch | VERIFIED | `switchToOrg(org.id)`, `switchBack()`, `personalToken ?? token` |
| `apps/website/app/(site)/cuenta/AccountShell.tsx` | isOrgContext-driven identity display | VERIFIED | 5 `isOrgContext` usages; 0 `activeOrg` |
| `apps/website/app/(site)/cuenta/perfil/page.tsx` | Danger Zone hideInOrgContext filter | VERIFIED | 4 `hideInOrgContext` occurrences; filter present |

### Key Link Verification

| From | To | Via | Status | Details |
|------|-----|-----|--------|---------|
| `auth.controller.ts POST /auth/switch-org` | `auth.service.ts switchOrg()` | `this.auth.switchOrg(user.sub, dto.orgId)` | WIRED | Line 169 |
| `org-context.guard.ts canActivate` | `req.orgContext` | JWT `actingAs` claim → OrgContextDto | WIRED | Line 27-31 of guard |
| `orders.service.ts ensureVisible` | `prisma.orgMember.findUnique` | `userId: user.actingAs ?? user.sub` | WIRED | Line 334 |
| `audit.log calls across 5 services` | `AuditLog.userId` | `actingAs ?? sub` attribution | WIRED | events(6) + transfers(4) + spots(3) + heroes(3) + orgs(7 audit) = 23 total |
| `providers.tsx switchToOrg` | `api.switchOrg → POST /auth/switch-org` | `api.switchOrg(orgId, token)` | WIRED | Line 160 of providers |
| `providers.tsx isOrgContext` | `user.type === 'ORGANIZATION'` | Derived from User.type | WIRED | Line 65: `user?.type === "ORGANIZATION"` |
| `UserMenu org button onClick` | `providers switchToOrg` | `await switchToOrg(org.id)` | WIRED | Line 99 of UserMenu |
| `UserMenu org list fetch` | `/api/organizations/mine` | `personalToken ?? token` | WIRED | useEffect with `personalToken ?? token` Authorization header |

### Requirements Coverage

Requirements are declared in ROADMAP.md as `SWITCH-01..SWITCH-12` and defined individually in `24-CONTEXT.md`. No `.planning/REQUIREMENTS.md` file exists at the standard path — the requirement contract for this phase lives in ROADMAP.md + CONTEXT.md. All 12 SWITCH IDs are claimed across plan frontmatter and each maps to a verified artifact.

| Requirement | Source Plan | Description | Status |
|-------------|-------------|-------------|--------|
| SWITCH-01 | 24-01 | Extend JwtUser with orgRole? + actingAs? | SATISFIED |
| SWITCH-02 | 24-01 | POST /auth/switch-org endpoint + SwitchOrgDto | SATISFIED |
| SWITCH-03 | 24-01 | refreshToken preserves org claims | SATISFIED |
| SWITCH-04 | 24-01 | OrgContextGuard reads JWT actingAs, no header, no DB | SATISFIED |
| SWITCH-05 | 24-02 | Service userId patterns fixed (orders draft/owner/ensureVisible, payments, orgs create) | SATISFIED |
| SWITCH-06 | 24-02 | Audit log attribution via actingAs ?? sub (5 services) | SATISFIED |
| SWITCH-07 | 24-03 | Frontend: X-Org-Context removed, ApiUser/User extended, api.switchOrg added | SATISFIED |
| SWITCH-08 | 24-03 | providers.tsx: switchToOrg, switchBack, isOrgContext, kb-personal-* persistence | SATISFIED |
| SWITCH-09 | 24-04 | UserMenu: real switchToOrg/switchBack, personalToken org fetch | SATISFIED |
| SWITCH-10 | 24-04 | AccountShell: identity from user + isOrgContext directly | SATISFIED |
| SWITCH-11 | 24-04 | perfil/page.tsx: Danger Zone hides password change in org context | SATISFIED |
| SWITCH-12 | 24-02 + 24-04 | Org cannot create org (backend 403 + UI hidden + Organizaciones tab hidden + redirect) | SATISFIED |

No orphaned requirements — ROADMAP.md declares exactly SWITCH-01..12 for this phase; all 12 are claimed and satisfied.

### Anti-Patterns Found

None. Scanned all 18 modified files for TODO/FIXME/placeholder patterns, empty implementations, and hardcoded stub values. All implementations wire to real data:
- `auth.service.ts switchOrg()` queries DB for OrgMember + User before issuing JWT
- `org-context.guard.ts` reads live JWT claims (no static defaults)
- `providers.tsx switchToOrg` calls `api.switchOrg` → real network call
- `UserMenu.tsx` fetches org list from `/api/organizations/mine` live
- No console.log-only handlers; no `return {}` stubs

### TypeScript Compilation

- **API (`apps/api`):** `tsc --noEmit` exits clean with zero errors
- **Website (`apps/website`):** `tsc --noEmit` produces two errors — both in `.next/types/app/(site)/cuenta/organizador/page.ts`, a stale Next.js build cache artifact referencing `cuenta/organizador/page.tsx` which was deleted in Phase 23. The source tree itself is type-clean: all errors are in the auto-generated `.next/` directory. No source file in `apps/website/` has a type error.

### Human Verification

Completed during Phase 24 Plan 04 Task 3 (blocking checkpoint). Human approved all 7 round-trip steps:
1. Login → personal identity shown correctly in UserMenu
2. Click org → toast, navbar avatar purple with org initials
3. /cuenta/perfil → org name + @handle sidebar, purple avatar, "Operando como" badge, org data in profile form
4. Danger Zone hides "Cambiar contraseña"; email + delete remain
5. F5 reload in org context → stays in org context (kb-personal-* persisted)
6. "Cuenta personal" → toast, personal identity restored, password row reappears
7. Backend 403 on org attempting to create another org confirmed

Human typed "approved" — no items pending.

### Deviations from Original Plans

Two fixes added during human verification (plan 04), both confirmed in code:

1. **SWITCH-12 UI (UserMenu):** `{!isOrgContext && <Crear organización button>}` — "Crear organización" hidden when in org context (`UserMenu.tsx` line 119)
2. **Organizaciones tab + redirect:** `AccountShell.tsx` TABS array has `orgHidden: true` on the `organizaciones` entry, filtered by `!isOrgContext || !t.orgHidden` (line 51); `organizaciones/page.tsx` has redirect guard when `isOrgContext` (line 156-158)

Both deviations strengthen the SWITCH-12 requirement (org cannot create orgs — frontend enforcement on top of backend 403).

---

_Verified: 2026-05-28_
_Verifier: Claude (gsd-verifier)_
