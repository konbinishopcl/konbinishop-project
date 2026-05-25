---
phase: 13-contenido-avanzado
plan: "02"
subsystem: events-favorites
tags: [favorites, saved-events, isSaved, batch-query, NestJS, Prisma]
dependency_graph:
  requires: []
  provides: [saved-events-api, isSaved-field]
  affects: [events-api, users-api]
tech_stack:
  added: []
  patterns: [batch-isSaved-without-N+1, delegate-to-EventsService, composite-key-lookup]
key_files:
  created: []
  modified:
    - apps/api/src/events/events.service.ts
    - apps/api/src/events/events.controller.ts
    - apps/api/src/events/events.module.ts
    - apps/api/src/users/users.service.ts
    - apps/api/src/users/users.controller.ts
    - apps/api/src/users/users.module.ts
decisions:
  - "isSaved injected as runtime property via single batch savedEvent.findMany (no N+1)"
  - "findBySlug extended with optional user param — backward compatible (existing callers unaffected)"
  - "GET /users/me/saved-events delegates to EventsService.findSavedByUser (avoids logic duplication)"
  - "Favorites endpoints use JwtAuthGuard only — not OrgContextGuard (favorites are personal to PERSON users)"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-25"
  tasks_completed: 3
  files_modified: 6
---

# Phase 13 Plan 02: Favoritos (CNT-02) Summary

**One-liner:** SavedEvent favorites system with POST/DELETE /events/:id/save, GET /users/me/saved-events, and isSaved field injected via batch query in findAll/findBySlug.

## What Was Built

### EventsService (events.service.ts)
- `save(eventId, userId)`: Creates SavedEvent row; catches Prisma P2002 unique constraint → 409 ConflictException
- `unsave(eventId, userId)`: Checks existence via composite key `userId_eventId`; missing → 404 NotFoundException; deletes on found
- `findSavedByUser(userId, page, pageSize)`: Paginated list via `savedEvent.findMany` with `include: { event: { include: EVENT_INCLUDE } }`; maps `{ ...s.event, isSaved: true }`
- `findAll()` extended: After the main transaction, if `user?.sub` is present and items exist, fires ONE extra `savedEvent.findMany` with `eventId: { in: ids }`, builds a Set, maps `isSaved` onto each item — no N+1
- `findBySlug()` extended: Optional `user?` param; if user present, calls `savedEvent.findUnique` on composite key and returns `{ ...event, isSaved: saved !== null }`

### EventsController (events.controller.ts)
- `POST /events/:id/save` (JwtAuthGuard) → `events.save(id, user.sub)`
- `DELETE /events/:id/save` (JwtAuthGuard) → `events.unsave(id, user.sub)`
- `GET /events/:slug` extended with OptionalJwtAuthGuard + `@CurrentUser()` to pass user to `findBySlug`

### EventsModule (events.module.ts)
- Added `exports: [EventsService]` to allow UsersModule to inject EventsService

### UsersService (users.service.ts)
- Injected `EventsService` via constructor
- Added `findSavedEventsForUser(userId, page, pageSize)` — pure delegate to `events.findSavedByUser`

### UsersController (users.controller.ts)
- Added `GET /users/me/saved-events` (JwtAuthGuard) with `?page=` and `?pageSize=` query params
- Placed after `GET /recent` and before `GET /` to avoid route capture issues

### UsersModule (users.module.ts)
- Added `EventsModule` to imports array (no circular dependency — EventsModule does not import UsersModule)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all endpoints fully wired to database.

## Verification

- `pnpm tsc --noEmit` — exits 0 (no TypeScript errors)
- `pnpm build` — exits 0 (Nest compilation successful)
- All acceptance criteria for Tasks 1, 2, 3 passed

## Commits

- `5c2d0ea` feat(13-02): extend EventsService with save/unsave/findSavedByUser + isSaved injection
- `943b30b` feat(13-02): add POST/DELETE /events/:id/save endpoints + OptionalJwtAuthGuard on findOne
- `db0a80d` feat(13-02): saved events (favorites) + isSaved in event responses (CNT-02)

## Self-Check: PASSED
