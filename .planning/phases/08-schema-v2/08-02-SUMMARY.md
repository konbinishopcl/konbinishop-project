---
phase: 08-schema-v2
plan: "02"
subsystem: api/prisma
tags: [schema, geography, migration, prisma, typescript]
dependency_graph:
  requires: ["08-01"]
  provides: ["Country", "State", "City", "Event.cityId", "GET /countries", "GET /states", "GET /cities"]
  affects: ["catalog", "events", "profiles"]
tech_stack:
  added: []
  patterns:
    - "3-level geography hierarchy: Country → State → City"
    - "Per-resource NestJS controller classes (CountriesController, StatesController, CitiesController)"
    - "Prisma migrate reset + migrate dev for destructive schema change on seed-only DB"
key_files:
  created:
    - apps/api/prisma/migrations/20260524233307_sch02_geography_v2/migration.sql
    - apps/api/src/catalog/dto/create-country.dto.ts
    - apps/api/src/catalog/dto/update-country.dto.ts
    - apps/api/src/catalog/dto/create-state.dto.ts
    - apps/api/src/catalog/dto/update-state.dto.ts
    - apps/api/src/catalog/dto/create-city.dto.ts
    - apps/api/src/catalog/dto/update-city.dto.ts
  modified:
    - apps/api/prisma/schema.prisma
    - apps/api/prisma/seed.ts
    - apps/api/src/catalog/catalog.service.ts
    - apps/api/src/catalog/catalog.controller.ts
    - apps/api/src/catalog/catalog.module.ts
    - apps/api/src/events/events.service.ts
    - apps/api/src/events/dto/create-event.dto.ts
    - apps/api/src/events/dto/update-event.dto.ts
    - apps/api/src/events/dto/query-events.dto.ts
    - apps/api/src/profiles/profiles.service.ts
  deleted:
    - apps/api/src/catalog/dto/create-commune.dto.ts
    - apps/api/src/catalog/dto/update-commune.dto.ts
    - apps/api/src/catalog/dto/create-region.dto.ts
    - apps/api/src/catalog/dto/update-region.dto.ts
decisions:
  - "migrate reset strategy: DB confirmed seed-only (Task 0 checkpoint approved) → safe destructive reset"
  - "Per-resource controller pattern: followed existing codebase pattern (CountriesController + @Controller('countries') + @Get()) vs single controller with @Get('countries')"
  - "stateId/countryId required at runtime: added runtime validation in createState/createCity instead of making DTO fields required (preserves optional TS type but validates at service layer)"
  - "query-events.dto.ts: region param renamed to state (Rule 3 deviation — required for tsc to pass)"
metrics:
  duration: "~45 minutes"
  completed_date: "2026-05-24"
  tasks: 3
  files_changed: 18
---

# Phase 8 Plan 02: Geography v2 (Country/State/City) Summary

Replaced the 2-level geography hierarchy (Region + Commune) with a 3-level hierarchy (Country + State + City) across schema, seeder, and all application code. `pnpm tsc --noEmit` passes with 0 errors and `pnpm prisma:seed` populates 1 Country (Chile), 16 States, and 346 Cities.

## What Was Built

### Task 0: Checkpoint (pre-approved)
User confirmed the database is seed-only. `migrate reset` was authorized with response "approved seed-only".

### Task 1: Schema migration

- **Removed:** `model Region` and `model Commune` from `schema.prisma`
- **Added:** `model Country`, `model State`, `model City` with 3-level FK hierarchy
- **Updated:** `model Event` — replaced `region/regionId` and `commune/communeId` with `city/cityId` + `@@index([cityId])`
- **Migration:** `sch02_geography_v2` created and applied via `prisma migrate reset --force --skip-seed` + `prisma migrate dev --name sch02_geography_v2`

Prisma's AI safety gate required the user consent env var `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` set to the user's exact approval message.

### Task 2: Seeder rewrite

- Geography block: `prisma.city.deleteMany() → prisma.state.deleteMany() → prisma.country.deleteMany()` (FK-safe order)
- Seeded Chile as Country; 16 regions as States; communes as Cities via `upsert` (idempotent)
- Events now use `citySlug` (single field) → `cityBySlug` map → `cityId` FK
- Removed the `seenCommuneSlug` dedup Set (upsert-by-slug handles duplicates natively)
- Output: 1 country, 16 states, 346 cities, 12 events

### Task 3: Application code migration

**catalog module:**
- `catalog.service.ts`: New methods `findCountries()`, `findStates(countrySlug?)`, `findCities(stateSlug?)`, `findCountry/State/City(id)`, `createCountry/State/City(dto)`, `updateCountry/State/City(id, dto)`, `removeCountry/State/City(id)`; helper renamed `assertUniqueSlug`
- `catalog.controller.ts`: `CountriesController` (`GET/POST/PATCH/DELETE /countries`), `StatesController` (`GET/POST/PATCH/DELETE /states`), `CitiesController` (`GET/POST/PATCH/DELETE /cities`)
- `catalog.module.ts`: Registered new controllers
- DTOs: Created `create/update-country.dto.ts`, `create/update-state.dto.ts`, `create/update-city.dto.ts`; deleted `create/update-region.dto.ts` and `create/update-commune.dto.ts`

**events module:**
- `events.service.ts`: `EVENT_INCLUDE` now uses `city: { include: { state: { include: { country: true } } } }`; `create()` uses `dto.cityId`; `update()` uses `dto.cityId`; `findAll()` filter uses `city.state.slug` instead of `region.slug`
- `create-event.dto.ts` / `update-event.dto.ts`: `cityId?: number` replaces `regionId` + `communeId`
- `query-events.dto.ts`: `state?: string` replaces `region?: string` (see Deviations)

**profiles module:**
- `profiles.service.ts`: `profileInclude()` helper uses `city: { include: { state: { include: { country: true } } } }`

## New REST Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /countries | Public | List all countries |
| GET | /countries/:id | Public | Get country with states |
| POST | /countries | ADMIN+ | Create country |
| PATCH | /countries/:id | ADMIN+ | Update country |
| DELETE | /countries/:id | ADMIN+ | Delete country |
| GET | /states?country=chile | Public | List states, filter by country slug |
| GET | /states/:id | Public | Get state with cities |
| POST | /states | ADMIN+ | Create state |
| PATCH | /states/:id | ADMIN+ | Update state |
| DELETE | /states/:id | ADMIN+ | Delete state |
| GET | /cities?state=slug | Public | List cities, filter by state slug |
| GET | /cities/:id | Public | Get city |
| POST | /cities | ADMIN+ | Create city |
| PATCH | /cities/:id | ADMIN+ | Update city |
| DELETE | /cities/:id | ADMIN+ | Delete city |

## Verification Results

- `pnpm prisma validate`: PASSED
- `pnpm prisma:seed`: PASSED (1 country, 16 states, 346 cities, 12 events)
- `pnpm tsc --noEmit`: PASSED (0 errors)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] query-events.dto.ts region→state rename**
- **Found during:** Task 3
- **Issue:** `events.service.ts` used `query.region` to filter events. After removing `region` from Event model, this filter needed to change to `city.state.slug` via `query.state`. The DTO field `region?: string` had to be renamed to `state?: string` for tsc to pass.
- **Fix:** Renamed `region` to `state` in `QueryEventsDto`; updated `events.service.ts` to use `city: { state: { slug: query.state } }`
- **Files modified:** `apps/api/src/events/dto/query-events.dto.ts`, `apps/api/src/events/events.service.ts`
- **Commit:** 013be3a

**2. [Rule 1 - Bug] createState/createCity required FK validation**
- **Found during:** Task 3 (tsc reported type error)
- **Issue:** `State.countryId` and `City.stateId` are non-nullable FKs in Prisma schema; passing `undefined` for the relation caused TypeScript type error in create methods.
- **Fix:** Added runtime validation (`if (!dto.countryId) throw new Error(...)`) before the Prisma `create` call; relation always passed as `{ connect: { id } }` when valid.
- **Files modified:** `apps/api/src/catalog/catalog.service.ts`
- **Commit:** 013be3a

### Architectural Notes

**Controller pattern:** The plan's acceptance criteria expected `@Get('countries')` literal inside the controller. The implementation uses the established codebase pattern (`@Controller('countries')` class + `@Get()`) which exposes the same `GET /countries` route. The functional outcome is identical; only the literal grep check differs.

**Prisma AI safety gate:** `prisma migrate reset` detected an AI agent environment and required `PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION` env var set to the exact user approval message. This is expected Prisma behavior for destructive operations run by AI.

## Known Stubs

None. All geography data is real (16 Chilean regions + 346 communes from official data) and all events use real `cityId` FKs.

## Commits

| Hash | Description |
|------|-------------|
| 01ba24a | feat(08-02): migrate schema — drop Region/Commune, add Country/State/City |
| bc15d6a | feat(08-02): rewrite seeder with Country/State/City hierarchy (Chile) |
| 013be3a | feat(08-02): rewrite catalog/events/profiles for Country/State/City — tsc passes |
