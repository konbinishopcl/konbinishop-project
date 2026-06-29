---
phase: 23-cleanup-post-cambio-de-contexto-org
plan: "03"
subsystem: api
tags: [cleanup, backend, users, organizer-endpoint]
dependency_graph:
  requires: ["23-01", "23-02"]
  provides: ["CLEAN-07"]
  affects: ["apps/api/src/users"]
tech_stack:
  added: []
  patterns: ["dead-code-removal"]
key_files:
  modified:
    - apps/api/src/users/users.controller.ts
    - apps/api/src/users/users.service.ts
  deleted:
    - apps/api/src/users/dto/update-organizer.dto.ts
decisions:
  - "D-6 applied: PATCH /users/me/organizer removed — endpoint only consumed by /cuenta/organizador (deleted in Plan 01); bio/website fields remain in DB Profile but without UI until future org-settings phase"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-29"
  tasks: 3
  files_changed: 3
---

# Phase 23 Plan 03: Backend Cleanup — Remove updateOrganizer Endpoint Summary

**One-liner:** Deleted PATCH /users/me/organizer endpoint by removing the controller method, service method, UpdateOrganizerDto, and all imports — backend compiles clean with no dangling references.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Remove updateOrganizer from controller | f278464 | users.controller.ts |
| 2 | Remove updateOrganizer from service + delete DTO | 017bd5c | users.service.ts, dto/update-organizer.dto.ts (deleted) |
| 3 | Verify clean backend build | — (no code changes) | — |

## What Was Done

**Task 1 — Controller cleanup:**
- Removed `import { UpdateOrganizerDto } from './dto/update-organizer.dto'`
- Removed the entire `@Patch('me/organizer')` route block with its 4 decorators
- All other endpoints (setVerified, update, ban, remove, findByHandle, etc.) remain intact

**Task 2 — Service cleanup + DTO deletion:**
- Removed `import { UpdateOrganizerDto } from './dto/update-organizer.dto'`
- Removed the entire `async updateOrganizer(userId, dto)` method (profile.upsert block, ~25 lines)
- Deleted `apps/api/src/users/dto/update-organizer.dto.ts` via `git rm`
- Verified no other file in `apps/api/src` references `UpdateOrganizerDto` or `updateOrganizer`

**Task 3 — Build verification:**
- `pnpm build` in `apps/api` completed without errors
- No dangling imports or references remain

## Verification Results

```
grep -rn "UpdateOrganizerDto" apps/api/src  → 0 results
grep -rn "updateOrganizer" apps/api/src     → 0 results
test ! -f apps/api/src/users/dto/update-organizer.dto.ts → true (file absent)
grep -rn "me/organizer" apps/**/*.ts apps/**/*.tsx → 0 results
pnpm build (apps/api) → clean, no errors
```

The only "me/organizer" text found was in `.next` build cache sourcemaps — not active source code. These are stale cached artifacts from before Plan 01 removed `cuenta/organizador/page.tsx`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. This plan only removed code; no stubs were introduced.

## Self-Check: PASSED

- `apps/api/src/users/users.controller.ts` — exists, no organizer references
- `apps/api/src/users/users.service.ts` — exists, no organizer references
- `apps/api/src/users/dto/update-organizer.dto.ts` — confirmed absent
- Commits f278464 and 017bd5c — present in git log
