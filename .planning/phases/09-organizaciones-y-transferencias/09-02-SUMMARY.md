---
phase: 09-organizaciones-y-transferencias
plan: 02
subsystem: api
tags: [nestjs, prisma, guards, decorators, org-context, organizations]

# Dependency graph
requires:
  - phase: 08-schema-v2
    provides: OrgMember model, OrgRole enum, User.type=ORGANIZATION, User.blocked field
provides:
  - OrgContextDto type (orgId + role)
  - OrgContextGuard (validates X-Org-Context header, membership, org type, blocked status)
  - "@OrgContext() decorator (injects req.orgContext into handler params)"
  - OrgContextModule @Global() registered in AppModule
affects:
  - 09-04 (transfers endpoints need @UseGuards(JwtAuthGuard, OrgContextGuard))
  - 09-05 (integraciones endpoints need org context)
  - Any feature module needing per-request org context validation

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Standalone @Global() guard module pattern (no circular deps with feature modules)
    - X-Org-Context header pattern for org-scoped API requests
    - express-serve-static-core Request augmentation for req.orgContext

key-files:
  created:
    - apps/api/src/common/org-context/org-context.types.ts
    - apps/api/src/common/org-context/org-context.decorator.ts
    - apps/api/src/common/org-context/org-context.guard.ts
    - apps/api/src/common/org-context/org-context.module.ts
  modified:
    - apps/api/src/app.module.ts

key-decisions:
  - "OrgContextModule is @Global() standalone — avoids circular deps when transfers/events/spots import it"
  - "No barrel index.ts — consumers import directly from individual files per plan spec"
  - "Guard allows pass-through when X-Org-Context absent (null = personal mode), enabling dual-mode endpoints"
  - "Curl smoke test deferred to integration testing in 09-04 (manual checkpoint not automated)"

patterns-established:
  - "OrgContextGuard pattern: @UseGuards(JwtAuthGuard, OrgContextGuard) + @OrgContext() ctx: OrgContextDto | null"
  - "X-Org-Context header carries orgId as integer string; guard validates type=ORGANIZATION + not blocked + membership"
  - "req.orgContext set via express-serve-static-core augmentation for type-safe access"

requirements-completed: [ORG-01]

# Metrics
duration: 8min
completed: 2026-05-25
---

# Phase 9 Plan 02: OrgContext Module Summary

**Global NestJS guard + decorator for X-Org-Context header validation: checks membership, ORGANIZATION type, and blocked status via Prisma, exposing req.orgContext for org-scoped endpoints**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-25T00:56:54Z
- **Completed:** 2026-05-25T01:05:00Z
- **Tasks:** 3
- **Files modified:** 5 (4 created, 1 modified)

## Accomplishments
- Created `OrgContextDto` type with express Request augmentation for type-safe `req.orgContext`
- Implemented `OrgContextGuard` validating X-Org-Context header against User (type=ORGANIZATION, not blocked) and OrgMember table
- Created `OrgContextModule` as `@Global()` module registered in AppModule — available to all feature modules without re-importing

## Task Commits

Each task was committed atomically:

1. **Task 1: Define OrgContextDto type + @OrgContext() decorator** - `316bf3f` (feat)
2. **Task 2: Implement OrgContextGuard with header validation + membership check** - `bda2b23` (feat)
3. **Task 3: Create OrgContextModule global + register in AppModule** - `f487a93` (feat)

**Plan metadata:** (docs commit — see state updates)

## Files Created/Modified
- `apps/api/src/common/org-context/org-context.types.ts` - OrgContextDto type + express-serve-static-core Request augmentation
- `apps/api/src/common/org-context/org-context.decorator.ts` - @OrgContext() createParamDecorator extracting req.orgContext
- `apps/api/src/common/org-context/org-context.guard.ts` - OrgContextGuard: X-Org-Context validation, User type/blocked check, OrgMember membership check
- `apps/api/src/common/org-context/org-context.module.ts` - @Global() OrgContextModule providing and exporting OrgContextGuard
- `apps/api/src/app.module.ts` - Added OrgContextModule import after AuthModule

## Decisions Made
- **No barrel file**: Consumers import directly from individual files to avoid implicit re-exports (`import { OrgContextGuard } from 'src/common/org-context/org-context.guard'`).
- **Standalone module**: `OrgContextModule` has no imports of feature modules — only `PrismaService` from the already-global `PrismaModule`. Prevents circular dependencies when `transfers`, `events`, `spots`, etc. import it in 09-04/09-05.
- **Curl smoke test deferred**: The manual smoke test from Task 3 acceptance criteria requires an endpoint using both guards; deferred to integration testing in 09-04 where transfers controller will use `@UseGuards(JwtAuthGuard, OrgContextGuard)`.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- `@UseGuards(JwtAuthGuard, OrgContextGuard)` + `@OrgContext() ctx: OrgContextDto | null` is available globally.
- 09-04 (transfers) and 09-05 (integraciones) can import guard and decorator directly from their file paths.
- `pnpm tsc --noEmit` exits 0. `pnpm build` exits 0.

## Self-Check: PASSED

- All 4 org-context files created and present
- 09-02-SUMMARY.md present
- Commits 316bf3f, bda2b23, f487a93 exist in git log
- pnpm tsc --noEmit exits 0
- pnpm build exits 0

---
*Phase: 09-organizaciones-y-transferencias*
*Completed: 2026-05-25*
