---
phase: 20-flujo-completo-avisos-portadas
plan: "03"
subsystem: ui
tags: [react, zod, nextjs, forms, image-upload, cart]

# Dependency graph
requires:
  - phase: 20-flujo-completo-avisos-portadas
    provides: "api.ts methods (createSpot, createHero, uploadImage, imageUrl), .field-error CSS class"
provides:
  - "Working spot creation form: image upload, Zod per-field errors, 3-pill linkType, create→draft→PUT-cart→redirect flow"
  - "Working hero creation form: image upload, Zod per-field errors, titleAccent sent correctly, same cart flow"
  - "Verified: days never go in POST /spots or POST /heroes — only in PUT /orders/:id/items"
affects: [20-04, plan-upsell-forms]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Zod module-scope schema (SpotSchema, HeroSchema) — validates before API call, renders per-field errors"
    - "create→getDraft→PUT-addItem→redirect: create resource (no days), fetch /api/orders/draft, PUT /api/orders/:id/items with days"
    - "Hidden file input triggered by upload-box click, uploadImage → store URL, render preview via imageUrl()"

key-files:
  created: []
  modified:
    - "apps/website/app/(site)/crear-producto/[kind]/CreateProductView.tsx"

key-decisions:
  - "Zod schemas at module scope above components to avoid recreation on every render"
  - "SITE_HOST import removed — neither spot nor hero form needs it after dropping internal linkType"
  - "Separate heroImage/heroFileRef state from spotImage/fileInputRef to avoid branch collision in single component"
  - "subtitle state kept (bound to heroSubtitle input) but titleAccent used as key in createHero API call"

patterns-established:
  - "create→cart pattern: POST create (no days) → GET /api/orders/draft → PUT /api/orders/:id/items {type, id, days}"
  - "Per-field Zod errors: safeParse → fieldErrors map → setErrors → <p className=\"field-error\"> below each input"
  - "linkType pill mapping: UI pill value (url/email/tel) → backend enum (URL/EMAIL/PHONE) via LINK_MAP const"

requirements-completed: [SPOT-01, SPOT-02, SPOT-03, SPOT-04, HERO-01, HERO-02, HERO-03, HERO-04]

# Metrics
duration: checkpoint-approved
completed: "2026-05-28"
---

# Phase 20 Plan 03: Spot + Hero Creation Forms Summary

**CreateProductView spot and hero branches rewritten with real image upload, Zod per-field errors, correct create→cart flow, and titleAccent fix — verified by human in browser**

## Performance

- **Duration:** Checkpoint-based (human verification required)
- **Started:** 2026-05-28
- **Completed:** 2026-05-28
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint — approved)
- **Files modified:** 1

## Accomplishments

- Spot form: removed `days`/`description`/`buttonText` from POST /spots; image upload with preview; 3-pill linkType (URL/EMAIL/PHONE, no "URL interna"); Zod errors render per-field; days forwarded to PUT cart
- Hero form: `titleAccent` now actually sent (was `heroSubtitle` but never serialized); image required with upload+preview; Zod errors per-field; same create→draft→PUT-cart→redirect flow
- Both forms verified in browser by user — spot lands in /carrito with correct day count, hero shows titleAccent in DB

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite the SPOT branch** - `3c719a9` (feat)
2. **Task 2: Rewrite the HERO branch** - `3c719a9` (feat — same commit, both branches)
3. **Task 3: Visual + functional verification** - checkpoint:human-verify — approved by user

**Plan metadata:** (final commit — this summary)

## Files Created/Modified

- `apps/website/app/(site)/crear-producto/[kind]/CreateProductView.tsx` — spot and hero branches fully rewritten; articulo branch left unchanged

## Decisions Made

- Zod schemas at module scope above components to avoid recreation on every render; SITE_HOST import removed as neither form needs it; subtitle state kept but titleAccent used as key in API call (avoids renaming state which could break other parts of hero branch)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Plan 20-04 (UpsellView) can reuse the create→draft→PUT-item→redirect sequence verbatim
- The `.field-error` CSS class from Plan 20-02 is already in globals.css — no conflicts
- Both spot and hero creation now fully functional end-to-end into the cart

---
*Phase: 20-flujo-completo-avisos-portadas*
*Completed: 2026-05-28*
