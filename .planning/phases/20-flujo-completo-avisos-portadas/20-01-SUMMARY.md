---
phase: 20-flujo-completo-avisos-portadas
plan: "01"
subsystem: api-spots-heroes
tags: [admin-filter, pagination, spots, heroes, moderation]
dependency_graph:
  requires: []
  provides: [GET /spots with ?status= and paginated shape, GET /heroes with ?status= and paginated shape]
  affects: [Plan 02 (lib/api.ts must consume { items } shape), Plan 05 (dashboard moderation queue)]
tech_stack:
  added: []
  patterns: [OptionalJwtAuthGuard role-gate, paginated response shape, admin owner include]
key_files:
  created:
    - apps/api/src/spots/dto/query-spots.dto.ts
    - apps/api/src/heroes/dto/query-heroes.dto.ts
  modified:
    - apps/api/src/spots/spots.controller.ts
    - apps/api/src/spots/spots.service.ts
    - apps/api/src/heroes/heroes.controller.ts
    - apps/api/src/heroes/heroes.service.ts
decisions:
  - "Admin list returns paginated { items, total, page, pageSize, totalPages } shape — same as events (decision locked in RESEARCH open question 3)"
  - "Hero eventCategory always included in both public and admin responses (carousel dependency)"
  - "Public response shape changed from flat array to paginated object — Plan 02 owns lib/api.ts adaptation"
metrics:
  duration: "2m 30s"
  completed_date: "2026-05-28"
  tasks_completed: 3
  tasks_total: 3
  files_created: 2
  files_modified: 4
---

# Phase 20 Plan 01: Admin Filter for Spots and Heroes Summary

**One-liner:** Added OptionalJwtAuthGuard + role-gated `?status=` query param to GET /spots and GET /heroes, converting both from a flat-array public-only endpoint to a paginated response supporting full admin moderation queue access.

## What Was Built

GET /spots and GET /heroes now mirror the GET /events admin filter pattern:

- **Public callers** (no token): receive only APPROVED + non-expired items in a paginated `{ items, total, page, pageSize, totalPages }` shape.
- **Admin callers** (ADMIN/SUPER_ADMIN token): receive all statuses except PENDING_PAYMENT by default, filterable by `?status=PENDING_MODERATION` (or any other status). Each row includes the owner object (`{ id, firstname, lastname, email, handle }`).
- **Heroes always include** `eventCategory` in both public and admin responses (required by the hero carousel).

## Tasks Completed

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create QuerySpotsDto + QueryHeroesDto | cef739b | apps/api/src/spots/dto/query-spots.dto.ts, apps/api/src/heroes/dto/query-heroes.dto.ts |
| 2 | Wire admin filter into SpotsService.findAll + controller | 1b1acff | spots.controller.ts, spots.service.ts |
| 3 | Wire admin filter into HeroesService.findAll + controller | f226e94 | heroes.controller.ts, heroes.service.ts |

## Breaking Change Notice

**Plan 02 dependency:** The public response shape for both `/spots` and `/heroes` changed from a flat array to `{ items: [...], total, page, pageSize, totalPages }`. The public website consumer (`lib/api.ts`) must be updated in Plan 02 to read `.items` instead of the root array.

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

Files exist:
- FOUND: apps/api/src/spots/dto/query-spots.dto.ts
- FOUND: apps/api/src/heroes/dto/query-heroes.dto.ts
- FOUND: apps/api/src/spots/spots.controller.ts (modified)
- FOUND: apps/api/src/spots/spots.service.ts (modified)
- FOUND: apps/api/src/heroes/heroes.controller.ts (modified)
- FOUND: apps/api/src/heroes/heroes.service.ts (modified)

Commits exist:
- FOUND: cef739b (feat(20-01): add QuerySpotsDto and QueryHeroesDto)
- FOUND: 1b1acff (feat(20-01): wire admin filter into SpotsService)
- FOUND: f226e94 (feat(20-01): wire admin filter into HeroesService)

Build: `pnpm build` succeeded with zero TypeScript errors.
