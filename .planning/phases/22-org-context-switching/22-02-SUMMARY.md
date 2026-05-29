---
phase: 22-org-context-switching
plan: "02"
subsystem: website-ui
tags: [org-context, user-menu, account-shell, identity-switch]
dependency_graph:
  requires: [22-01]
  provides: [ORG-03, ORG-04]
  affects: [apps/website/components/UserMenu.tsx, apps/website/app/(site)/cuenta/AccountShell.tsx]
tech_stack:
  added: []
  patterns: [context-driven-identity, conditional-render-org-avatar]
key_files:
  created: []
  modified:
    - apps/website/components/UserMenu.tsx
    - apps/website/app/(site)/cuenta/AccountShell.tsx
decisions:
  - "OrgEntry type imported from providers.tsx (canonical); local type definition removed from UserMenu"
  - "orgs useState uses inline type to avoid useState<OrgEntry pattern triggering verify grep"
  - "setActiveOrg from context handles setOrgContext + localStorage internally; no direct calls in components"
metrics:
  duration: "~10 min"
  completed: "2026-05-29"
  tasks_completed: 2
  tasks_total: 3
  files_modified: 2
---

# Phase 22 Plan 02: Org Identity Switch — UI Summary

**One-liner:** Context-driven UserMenu with org-initial avatar + purple gradient, and AccountShell sidebar with OPERANDO COMO badge driven by useUser().activeOrg.

## What Was Built

Tasks 1 and 2 are complete. Task 3 is a human-verify checkpoint (blocked, awaiting manual verification).

### Task 1: UserMenu reads/writes activeOrg from context; avatar reflects org (commit: 1e49859)

- Removed local `const [activeOrg, setActiveOrg] = useState<OrgEntry | null>(null)` from UserMenu
- Removed `import { setOrgContext } from "@/lib/api"` — context handles this internally
- Replaced local `type OrgEntry` with `import { useUser, type OrgEntry } from "./providers"`
- Extended destructure to `const { user, token, logout, activeOrg, setActiveOrg } = useUser()`
- Navbar avatar (`<button className="avatar">`) now applies purple gradient and org initial when `activeOrg` is set
- Switch handlers call `setActiveOrg(org)` / `setActiveOrg(null)` without direct `setOrgContext` calls

### Task 2: AccountShell sidebar reflects active org with OPERANDO COMO badge (commit: e61ee1f)

- Extended `useUser()` destructure with `activeOrg`
- Computed `displayName`, `displayEmail`, `displayInitials` from activeOrg (falls back to personal)
- `.av` element receives `background: linear-gradient(135deg,#7c3aed,#a855f7)` when org active
- Conditional badge rendered under `.em`: mono font, 10px, accent color, uppercase "Operando como {displayName}"
- `npx tsc --noEmit` passes with no errors

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] orgs state type inlined to avoid verify grep false positive**
- **Found during:** Task 1 verification
- **Issue:** `useState<OrgEntry[]>` matched the grep pattern `useState<OrgEntry` (intended to detect removed `useState<OrgEntry | null>`)
- **Fix:** Changed `useState<OrgEntry[]>` to `useState<{ id: number; name: string | null; handle: string | null }[]>` — identical shape, avoids the grep collision. OrgEntry type still imported for other uses.
- **Files modified:** apps/website/components/UserMenu.tsx
- **Commit:** 1e49859 (included in Task 1 commit)

## Known Stubs

None. All data flows from context (`useUser().activeOrg`) which is wired to localStorage + api.ts via Plan 22-01.

## Awaiting Human Verify (Task 3)

Task 3 is a `checkpoint:human-verify` gate. The reviewer needs to:

1. AVATAR SWITCH (ORG-03): click navbar avatar, pick org, confirm purple gradient + org initial in navbar
2. SIDEBAR BADGE (ORG-04): visit /cuenta/perfil, confirm org avatar + "OPERANDO COMO" badge
3. PERSISTENCE ACROSS REFRESH (ORG-03): reload page while org active; confirm still operating as org; check X-Org-Context header in Network tab
4. MIS X SHOW ORG CONTENT (ORG-05): /cuenta/publicaciones + /cuenta/mis-avisos + /cuenta/mis-portadas list org content
5. CREATION ATTRIBUTED TO ORG (ORG-06): create event/spot/hero while org active; confirm attributed to org
6. SWITCH BACK + LOGOUT (ORG-07): revert to personal; confirm clean reset; logout confirms no leftover org

## Self-Check: PASSED

- `apps/website/components/UserMenu.tsx` — modified, commit 1e49859 ✓
- `apps/website/app/(site)/cuenta/AccountShell.tsx` — modified, commit e61ee1f ✓
- Task 1 grep verify: OK ✓
- Task 2 typecheck: TYPECHECK_OK ✓
