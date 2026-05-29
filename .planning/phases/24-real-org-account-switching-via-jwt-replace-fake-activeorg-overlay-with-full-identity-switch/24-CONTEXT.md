# Phase 24: Real Org Account Switching via JWT — Context

**Gathered:** 2026-05-28
**Status:** Ready for planning
**Source:** Pre-planning investigation (providers.tsx, api.ts, auth.service.ts, org-context.guard.ts, orders.service.ts, all service files, Prisma schema)

<domain>
## Phase Boundary

Replace the fake `activeOrg` overlay (X-Org-Context header + setActiveOrg that never changes token/user) with a real full identity switch: after `switchToOrg()`, the `user` object and JWT token change completely so every page sees the org's data automatically.

**Root bug:** `setActiveOrg()` in `providers.tsx` only sets a client-side `activeOrg` state. The JWT's `sub` remains the personal user's ID. Every API call still authenticates as the personal user. `/cuenta/perfil` uses `user` from context → shows personal user's name/bio/email. The org switch is cosmetic only.

**The fix:** `POST /auth/switch-org { orgId }` issues a new JWT with `sub = orgId`. The frontend saves the personal token and swaps in the org token + org user. Every subsequent API call is authenticated as the org. `GET /users/me` → org data. The form in `/cuenta/perfil` → org data. Content creation → attributed to org. Zero page-level special-casing needed.

**Scope:**
- Backend: new endpoint, JWT extension, OrgContextGuard rewrite, critical service fixes, audit logs
- Frontend: providers.tsx rewrite (real switching), api.ts cleanup (remove X-Org-Context), UserMenu rewrite, AccountShell update, perfil/page.tsx Danger Zone conditional
- NOT in scope: changing the `User` type in Prisma schema, changing existing org endpoints, new org management UI

</domain>

<decisions>
## Implementation Decisions

### SWITCH-01: Extend JwtUser type

**File:** `apps/api/src/auth/current-user.decorator.ts`

Current: `export type JwtUser = { sub: number; email: string; role: string }`

New: `export type JwtUser = { sub: number; email: string; role: string; orgRole?: string; actingAs?: number }`

These fields are populated from JWT claims — `orgRole` and `actingAs` are only present in org-context JWTs.

---

### SWITCH-02: POST /auth/switch-org endpoint

**Files:** `apps/api/src/auth/auth.controller.ts`, `apps/api/src/auth/auth.service.ts`, new `apps/api/src/auth/dto/switch-org.dto.ts`

DTO: `class SwitchOrgDto { @IsNumber() orgId: number }`

Service method `switchOrg(personalUserId: number, orgId: number)`:
1. Find OrgMember: `prisma.orgMember.findUnique({ where: { userId_orgId: { userId: personalUserId, orgId } } })`
2. If not found → throw ForbiddenException('No eres miembro de esta organización')
3. Find org user: `prisma.user.findUnique({ where: { id: orgId } })`
4. If not found or `org.blocked` → ForbiddenException
5. Issue org JWT: `this.jwt.sign({ sub: orgId, email: org.email, role: org.role, orgRole: member.role, actingAs: personalUserId })`
6. Return `{ token, user: this.sanitize(org) }`

Controller endpoint:
```typescript
@Post('switch-org')
@UseGuards(JwtAuthGuard)
switchOrg(@CurrentUser() user: JwtUser, @Body() dto: SwitchOrgDto) {
  if (user.actingAs) throw new ForbiddenException('Orgs cannot switch to other orgs');
  return this.auth.switchOrg(user.sub, dto.orgId);
}
```

---

### SWITCH-03: refreshToken must preserve org claims

**File:** `apps/api/src/auth/auth.service.ts`

Current `refreshToken(userId)` calls `this.sign(user)` which strips `orgRole`/`actingAs`. When a user in org context refreshes, they lose their org JWT claims.

Fix: `refreshToken` must accept the current JWT user to check for org context:

```typescript
async refreshToken(currentUser: JwtUser) {
  const userId = currentUser.actingAs ?? currentUser.sub;
  const user = await this.prisma.user.findUnique({ where: { id: currentUser.sub } });
  if (!user || user.blocked) throw new UnauthorizedException();
  
  if (currentUser.actingAs) {
    // Org context: re-issue org JWT
    const member = await this.prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: currentUser.actingAs, orgId: currentUser.sub } }
    });
    if (!member) throw new UnauthorizedException(); // membership was revoked
    const token = this.jwt.sign({ sub: user.id, email: user.email, role: user.role, orgRole: member.role, actingAs: currentUser.actingAs });
    return { token, user: this.sanitize(user) };
  }
  
  return { token: this.sign(user), user: this.sanitize(user) };
}
```

Auth controller: `refreshToken` handler receives `@CurrentUser() user: JwtUser` and passes it instead of `user.sub`.

---

### SWITCH-04: OrgContextGuard — auto-populate from JWT actingAs

**File:** `apps/api/src/common/org-context/org-context.guard.ts`

Replace X-Org-Context header check with JWT claim check:

```typescript
async canActivate(ctx: ExecutionContext): Promise<boolean> {
  const req = ctx.switchToHttp().getRequest<Request>();
  const user = (req as Request & { user?: JwtUser }).user;
  if (!user) throw new UnauthorizedException('OrgContextGuard requiere JwtAuthGuard previo');

  if (!user.actingAs) return true; // personal mode, no orgContext needed

  // Org JWT: trust the token claims (validated at login, 7-day window policy)
  const context: OrgContextDto = { orgId: user.sub, role: user.orgRole as OrgRole };
  (req as Request & { orgContext: OrgContextDto }).orgContext = context;
  return true;
}
```

Note: Remove the X-Org-Context header path entirely (frontend no longer sends it). The backend services' `orgContext?.orgId ?? user.sub` pattern continues to work without any service changes for content routing.

---

### SWITCH-05: Fix critical service userId patterns (services where user.sub was personal userId)

With the new JWT, `user.sub = orgId` in org context. Services that store `user.sub` as the "personal user" must use `user.actingAs ?? user.sub`.

**CRITICAL — breaks functionality if not fixed:**

**`apps/api/src/organizations/organizations.service.ts` `create()`:**
```typescript
// line ~79: userId in OrgMember.create
data: { userId: user.actingAs ?? user.sub, orgId: newOrg.id, role: OrgRole.OWNER }
// line ~91: audit.log  
this.audit.log({ userId: user.actingAs ?? user.sub, ... })
```

**`apps/api/src/orders/orders.service.ts` `getOrCreateDraft()`:**
```typescript
// Draft search: userId should be personal userId
where: { userId: user.actingAs ?? user.sub, orgId: orgContext?.orgId ?? null, status: OrderStatus.DRAFT }

// Order create: userId is the paying person
owner: { connect: { id: user.actingAs ?? user.sub } }
// plus orgId from orgContext as before
```

**`apps/api/src/payments/payments.service.ts` ownership check:**
```typescript
// line 43:
if (order.userId !== (user.actingAs ?? user.sub)) throw new ForbiddenException('No tienes acceso a esta orden');
```

---

### SWITCH-06: Fix audit logs — use actingAs ?? sub for attribution

All `audit.log({ userId: user.sub, ... })` calls log the wrong actor when in org context (logs orgId instead of the person who acted). Fix: `userId: user.actingAs ?? user.sub`.

**Files to fix:**
- `apps/api/src/events/events.service.ts`: 6 occurrences (CREATE, UPDATE, DELETE, APPROVE, REJECT, BAN)
- `apps/api/src/organizations/organizations.service.ts`: 7 occurrences (covered in SWITCH-05 for create(); remaining 6)
- `apps/api/src/transfers/transfers.service.ts`: 4 occurrences
- `apps/api/src/spots/spots.service.ts`: 3 occurrences (actor.sub → actor.actingAs ?? actor.sub)
- `apps/api/src/heroes/heroes.service.ts`: 3 occurrences (actor.sub → actor.actingAs ?? actor.sub)

Note: `users.service.ts` uses `actor.sub` for admin operations — admins never operate in org context, safe to leave unchanged.

---

### SWITCH-07: Frontend — remove X-Org-Context + extend ApiUser

**File:** `apps/website/lib/api.ts`

Remove:
- `let _activeOrgId: number | null = null;`
- `export function setOrgContext(orgId: number | null) { ... }`
- `export function getOrgContext() { ... }`
- The `if (_activeOrgId) h["X-Org-Context"] = String(_activeOrgId)` line in `buildHeaders()`
- The `if (_activeOrgId) headers["X-Org-Context"] = String(_activeOrgId)` line in `uploadImage()`

Extend `ApiUser` type:
```typescript
export type ApiUser = {
  id: number;
  email: string;
  firstname: string | null;
  lastname: string | null;
  rut: string | null;
  isCompany: boolean;
  role: Role;
  confirmed: boolean;
  blocked: boolean;
  type: 'PERSON' | 'ORGANIZATION';   // ADD
  handle: string | null;              // ADD
};
```

Update `toUser()` to pass `type` and `handle` through — add them to the returned object. This requires updating the `User` type in `lib/data.ts` to accept `type?` and `handle?` optional fields.

Add `switchOrg()` API method:
```typescript
switchOrg: (orgId: number, token: string) =>
  request<AuthResponse>('/auth/switch-org', { method: 'POST', body: JSON.stringify({ orgId }) }, token),
```

---

### SWITCH-08: Frontend — rewrite providers.tsx

**File:** `apps/website/components/providers.tsx`

New `UserCtxValue`:
```typescript
type UserCtxValue = {
  user: User | null;
  token: string | null;
  ready: boolean;
  isOrgContext: boolean;       // true when user.type === 'ORGANIZATION' (user IS the org)
  personalUser: User | null;  // personal user when in org mode (for display in UserMenu)
  setAuth: (user: User, token: string) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
  switchToOrg: (orgId: number) => Promise<void>;
  switchBack: () => void;
};
```

Remove: `OrgEntry` type, `activeOrg` state, `setActiveOrg`, `setOrgContext` import/calls.

Add state:
```typescript
const [personalToken, setPersonalToken] = useState<string | null>(null);
const [personalUser, setPersonalUser] = useState<User | null>(null);
```

`isOrgContext` derived: `const isOrgContext = user?.type === 'ORGANIZATION' ?? false`
(Requires adding `type?` to the `User` type from lib/data.ts, or storing it separately)

`switchToOrg(orgId)`:
1. Call `api.switchOrg(orgId, token!)` → `{ token: orgToken, user: apiUser }`
2. Save current personal token/user: `setPersonalToken(token); setPersonalUser(user); localStorage.setItem('kb-personal-token', token); localStorage.setItem('kb-personal-user', JSON.stringify(user))`
3. Set org token/user: `setAuth(toUser(apiUser), orgToken)` → stores to kb-token, kb-user
4. Show toast: done by UserMenu

`switchBack()`:
1. Restore from personalToken/personalUser state (or localStorage)
2. `setAuth(personalUser, personalToken)`; clear `personalToken`, `personalUser`; remove `kb-personal-token`, `kb-personal-user`

Init: restore personal token/user if present in localStorage (handles page refresh during org mode)

Refresh logic: when `r.ok` after `GET /api/auth/refresh`, check if response user has `type: 'ORGANIZATION'` to maintain org context correctly.

---

### SWITCH-09: Frontend — rewrite UserMenu.tsx

**File:** `apps/website/components/UserMenu.tsx`

Replace `{ user, token, logout, activeOrg, setActiveOrg }` with `{ user, token, personalToken, personalUser, logout, switchToOrg, switchBack, isOrgContext }`.

Org list fetch: use `personalToken ?? token` (must always fetch orgs with personal token since org JWT doesn't have memberships):
```typescript
fetch('/api/organizations/mine', { headers: { Authorization: `Bearer ${personalToken ?? token}` } })
```

Switch to org:
```typescript
onClick={async () => {
  try {
    await switchToOrg(org.id);
    close();
    toast.success(`Operando como ${org.name ?? org.handle ?? 'organización'}`);
  } catch {
    toast.error('No se pudo cambiar de cuenta');
  }
}}
```

Switch back to personal:
```typescript
onClick={() => { switchBack(); close(); toast.success('Operando como cuenta personal'); }}
```

Avatar button: `user.initials` for both modes (since user IS the org user after switch, `user.initials` already shows org initials).

---

### SWITCH-10: Frontend — update AccountShell.tsx

**File:** `apps/website/app/(site)/cuenta/AccountShell.tsx`

Replace `{ user, activeOrg, logout }` with `{ user, isOrgContext, logout }`.

```typescript
const displayName = user?.name ?? 'Usuario';
const displayEmail = isOrgContext && user?.handle ? `@${user.handle}` : (user?.email ?? '');
const displayInitials = user?.initials ?? '?';
```

Org badge: replace `{activeOrg && (...)}` with `{isOrgContext && (...)}`

---

### SWITCH-11: Frontend — perfil/page.tsx Danger Zone conditional

**File:** `apps/website/app/(site)/cuenta/perfil/page.tsx`

Add `isOrgContext` from `useUser()`. In Danger Zone rows, filter based on context:

| Row | Personal | isOrgContext |
|-----|----------|-------------|
| Cambiar contraseña | ✓ show | ✗ hide (org has no password) |
| Cambiar email | ✓ show | ✓ show (org can change its email) |
| Eliminar cuenta | ✓ show | ✓ show (org OWNER can delete the org) |

Implementation:
```typescript
const dangerRows = [
  { k: "password", t: "Cambiar contraseña", d: "...", hideInOrgContext: true },
  { k: "email",    t: "Cambiar email",       d: "...", hideInOrgContext: false },
  { k: "delete",   t: "Eliminar cuenta",     d: "...", hideInOrgContext: false },
].filter(r => !isOrgContext || !r.hideInOrgContext);
```

---

### SWITCH-12: Guard org-can't-create-org in organizations.service.ts

**File:** `apps/api/src/organizations/organizations.service.ts` `create()`

Add check at top of method:
```typescript
if (user.actingAs) throw new ForbiddenException('Las organizaciones no pueden crear otras organizaciones');
```

This prevents an org-context JWT from enrolling the org (not a person) as owner of a new org.

---

### Claude's Discretion

- Plan splitting strategy (how many plans, wave grouping)
- Whether to remove X-Org-Context header support from OrgContextGuard entirely or keep as legacy path
- Whether `User.type` should be stored in the provider state vs derived from `user.type` property
- Error handling in `switchToOrg` (network error, 403 → user is no longer a member)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Auth system (backend)
- `apps/api/src/auth/current-user.decorator.ts` — JwtUser type definition (extend here)
- `apps/api/src/auth/auth.service.ts` — sign(), refreshToken(), sanitize() (key methods to modify)
- `apps/api/src/auth/auth.controller.ts` — add POST /auth/switch-org here
- `apps/api/src/auth/jwt-auth.guard.ts` — attaches JWT payload to req.user

### Org context (backend)
- `apps/api/src/common/org-context/org-context.guard.ts` — rewrite to use JWT actingAs
- `apps/api/src/common/org-context/org-context.types.ts` — OrgContextDto type

### Services with critical userId patterns (backend)
- `apps/api/src/organizations/organizations.service.ts` — create(): OrgMember.userId + audit
- `apps/api/src/orders/orders.service.ts` — getOrCreateDraft(): Order.userId + draft search
- `apps/api/src/payments/payments.service.ts` — order ownership check

### Audit log pattern (backend)
- `apps/api/src/events/events.service.ts` — 6 audit.log calls (all user.sub → actingAs ?? sub)
- `apps/api/src/organizations/organizations.service.ts` — 7 audit.log calls
- `apps/api/src/transfers/transfers.service.ts` — 4 audit.log calls
- `apps/api/src/spots/spots.service.ts` — 3 audit.log calls (actor.sub)
- `apps/api/src/heroes/heroes.service.ts` — 3 audit.log calls (actor.sub)

### Frontend
- `apps/website/lib/api.ts` — ApiUser type, setOrgContext, buildHeaders, uploadImage (modify)
- `apps/website/lib/data.ts` — User type (add type?, handle?)
- `apps/website/components/providers.tsx` — UserProvider, UserCtxValue (rewrite)
- `apps/website/components/UserMenu.tsx` — org switch UI (rewrite)
- `apps/website/app/(site)/cuenta/AccountShell.tsx` — sidebar (update)
- `apps/website/app/(site)/cuenta/perfil/page.tsx` — Danger Zone (update)

### Prisma schema reference
- `apps/api/prisma/schema.prisma` — User model (type, handle fields), OrgMember model (userId_orgId composite unique), Order model (userId + orgId separate fields)

</canonical_refs>

<specifics>
## Specific Implementation Details

### JWT payload structure
Personal JWT (unchanged): `{ sub: personalUserId, email, role }`
Org JWT (new): `{ sub: orgId, email: org.email, role: org.role, orgRole: 'OWNER'|'MEMBER', actingAs: personalUserId }`

### localStorage keys
- `kb-token` — active JWT (personal or org)
- `kb-user` — active User object (personal or org)
- `kb-personal-token` — personal JWT saved during org mode (new)
- `kb-personal-user` — personal User saved during org mode (new)
- `kb-org` — REMOVE (no longer needed, replace with kb-personal-token/kb-personal-user)

### OrgMember composite unique key
`prisma.orgMember.findUnique({ where: { userId_orgId: { userId, orgId } } })` — the composite key is `userId_orgId`.

### sanitize() already returns type and handle
The backend `sanitize()` method uses spread `...safe` which already includes `type` and `handle` from the User model. No backend change needed — only the frontend `ApiUser` type needs to be extended to declare these fields.

### refreshToken controller change
Currently: `refreshToken(@CurrentUser() user: JwtUser) { return this.auth.refreshToken(user.sub); }`
After: `refreshToken(@CurrentUser() user: JwtUser) { return this.auth.refreshToken(user); }` (pass full JwtUser)

### Order.userId semantic (IMPORTANT)
`Order.userId` = the personal user who placed the order (for billing/receipts)
`Order.orgId` = the org on whose behalf the order was placed (optional)
These are DIFFERENT fields. `user.actingAs ?? user.sub` always gives the personal userId.

### Orders draft search semantics
When in org context: search by `{ userId: personalUserId (actingAs), orgId: orgId (sub) }`
When in personal mode: search by `{ userId: personalUserId (sub), orgId: null }`

### Membership revocation policy
Accept 7-day JWT window without per-request OrgMember re-validation.
Exception: `refreshToken` DOES re-validate OrgMember (on each app load/refresh) — this is the natural revocation mechanism.

</specifics>

<deferred>
## Deferred Ideas

- Invite flow for new org members (users not yet in OrgMember table)
- org-JWT scoped permissions (member can only view, not create)
- Per-request OrgMember validation (stricter revocation, more DB hits)
- Sidebar conditional navigation by context (show org-specific tabs)

</deferred>

---

*Phase: 24-real-org-account-switching-via-jwt*
*Context gathered: 2026-05-28 via pre-planning investigation*
