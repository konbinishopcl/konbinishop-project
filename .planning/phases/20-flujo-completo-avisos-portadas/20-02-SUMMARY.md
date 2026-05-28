---
phase: 20-flujo-completo-avisos-portadas
plan: "02"
subsystem: website/lib
tags: [api, types, spots, heroes, typescript, css]
dependency_graph:
  requires: ["20-01"]
  provides: ["ApiSpot", "ApiQuota", "ApiOwner", "ApiList", "ApiHero-complete", "spot-methods", "hero-methods", ".field-error"]
  affects: ["20-03", "20-04", "20-05"]
tech_stack:
  added: []
  patterns: ["paginated-adapter (.then(r => r.items))", "typed API method set"]
key_files:
  created: []
  modified:
    - apps/website/lib/api.ts
    - apps/website/app/globals.css
decisions:
  - "orgId intentionally omitted from ApiSpot and ApiHero — Prisma schema has no orgId column on Spot or Hero models"
  - "api.heroes() and api.spots() adapt paginated response via .then(r => r.items) to preserve ApiHero[] return type for existing SSR callers"
  - ".field-error CSS class owned in this plan so Plans 03/04 (parallel Wave 2) never conflict on globals.css"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-28"
  tasks_completed: 3
  files_modified: 2
---

# Phase 20 Plan 02: API Types Foundation Summary

**One-liner:** Typed spot/hero API foundation — ApiSpot/ApiQuota/ApiOwner/ApiList types, 16 CRUD+moderation methods, and .field-error CSS class for Plans 03/04/05 to consume.

## What Was Built

Added the complete typed API foundation that downstream plans (03 CreateProductView, 04 UpsellView, 05 dashboard sections) consume.

### Types added/extended (apps/website/lib/api.ts)

- **ApiOwner** — reusable owner shape for admin views: `{ id, firstname, lastname, email, handle? }`
- **ApiSpot** (new) — full spot shape with status/statusReason/linkType/linkValue/userId/createdAt/updatedAt/owner
- **ApiQuota** (new) — quota response: `{ max, active, available, pricePerDay, maxDays }`
- **ApiList\<T\>** (new) — generic paginated list: `{ items, total, page, pageSize, totalPages }`
- **ApiHero** (extended) — added status/statusReason/userId/createdAt/owner to existing fields; all prior fields preserved

### API methods added (api object)

**Spots (8 methods):**
- `spots()` — public list (paginated adapter)
- `spotsQuota()` — GET /spots/quota
- `mySpots(token)` — GET /spots/mine
- `adminSpots(token, query?)` — GET /spots with status/page/pageSize filter
- `createSpot(body, token)` — POST /spots
- `updateSpot(id, body, token)` — PATCH /spots/:id
- `deleteSpot(id, token)` — DELETE /spots/:id
- `approveSpot(id, token)` — PATCH /spots/:id/approve
- `rejectSpot(id, reason, token)` — PATCH /spots/:id/reject
- `banSpot(id, reason, token)` — PATCH /spots/:id/ban

**Heroes (8 methods):**
- `heroes()` — public list (paginated adapter, returns ApiHero[] as before)
- `heroesQuota()` — GET /heroes/quota
- `myHeroes(token)` — GET /heroes/mine
- `adminHeroes(token, query?)` — GET /heroes with status/page/pageSize filter
- `createHero(body, token)` — POST /heroes (image required)
- `updateHero(id, body, token)` — PATCH /heroes/:id
- `deleteHero(id, token)` — DELETE /heroes/:id
- `approveHero(id, token)` — PATCH /heroes/:id/approve
- `rejectHero(id, reason, token)` — PATCH /heroes/:id/reject
- `banHero(id, reason, token)` — PATCH /heroes/:id/ban

### CSS (apps/website/app/globals.css)

Added `.field-error { color: var(--err); font-size: 12px; margin-top: 5px; line-height: 1.4; }` near `.upload-box` in the form-field CSS block.

## Decisions Made

1. **orgId omitted by design** — Prisma schema has no `orgId` column on Spot or Hero models. Ownership is a single `userId` (org context resolved server-side at create time).

2. **api.heroes() paginated adapter** — `api.heroes()` and `api.spots()` now call `.then(r => r.items)` to adapt Plan 01's paginated backend response, keeping the return type as `ApiHero[]`/`ApiSpot[]` for consumers. The SSR home page (`app/(site)/page.tsx`) calls `heroes.map(toHeroSlide)` directly and remains unbroken.

3. **.field-error CSS ownership** — The class is defined here (Plan 02) so Plans 03 and 04 (parallel in Wave 2) never both touch globals.css. They simply reference `className="field-error"`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan is purely types and API methods, no UI rendering or data flow.

## Self-Check: PASSED

- [x] `apps/website/lib/api.ts` exists with `export type ApiSpot`
- [x] `apps/website/app/globals.css` contains `.field-error { color: var(--err); ... }`
- [x] `cd apps/website && npx tsc --noEmit` exits 0 (no type errors)
- [x] No `orgId` in api.ts
- [x] Commits: 3a7789c (types), 744cc35 (methods), 7b8f067 (CSS)
