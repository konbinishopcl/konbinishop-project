---
phase: 20-flujo-completo-avisos-portadas
plan: "04"
subsystem: website/upsell
tags: [upsell, spots, heroes, image-upload, zod, validation, cart]
dependency_graph:
  requires: ["20-02"]
  provides: ["UpsellView-SpotForm-fixed", "UpsellView-HeroForm-fixed"]
  affects: ["20-05"]
tech_stack:
  added: ["zod (already in project)"]
  patterns: ["upload-pick pattern (fileRef + preview)", "Zod safeParse + per-field field-error", "create-then-draft-then-PUT-cart flow"]
key_files:
  created: []
  modified:
    - apps/website/app/(site)/upsell/UpsellView.tsx
decisions:
  - "Both Zod schemas placed at module scope (above components) to avoid recreation on every render"
  - "SITE_HOST import removed — HeroForm placeholder replaced with static string; no longer needed in either form"
  - "subtitle state variable kept (bound to titleAccent field label) — only the object key subtitle: was the bug, not the state name"
  - "errors cleared only on next valid submit attempt — same pattern as CreateProductView"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-28"
  tasks_completed: 2
  files_modified: 1
---

# Phase 20 Plan 04: Upsell Forms Fix Summary

**One-liner:** Upsell SpotForm + HeroForm rewritten with real image upload, Zod per-field errors, 3-pill linkType, and the correct create → GET draft → PUT cart days flow.

## What Was Built

Both inner form components inside `UpsellView.tsx` were rewritten to match the
CreateProductView fixes from Plan 03:

### SpotForm
- Added `image`/`setImage`, `uploading`/`setUploading`, `fileRef`, `errors`/`setErrors` state
- Upload-box now triggers file input; previews uploaded image via `imageUrl()`
- Removed `description`/`buttonText`/`setDescription`/`setButtonText` state (not backend columns)
- Removed "URL interna" 4th linkType pill — now exactly 3: url, email, tel
- `handleAdd`: validates with `SpotSchema`, maps UI linkType → backend enum, calls `api.createSpot` (no days), GETs draft order, PUTs item with days, calls `onAdd()`
- Per-field `<p className="field-error">` under title, image, linkValue

### HeroForm
- Added `image`/`setImage`, `uploading`/`setUploading`, `fileRef`, `errors`/`setErrors` state
- Upload-box (aspectRatio 21/9) now functional with preview
- `handleAdd`: validates with `HeroSchema`, calls `api.createHero` with `titleAccent: subtitle` (not bare `subtitle:` key), GETs draft, PUTs item with days, calls `onAdd()`
- Per-field `<p className="field-error">` under title, image
- Image is now required (Zod: `min(3, "La imagen es requerida")`)

### Both forms
- Submit button disabled while `busy || uploading`
- Removed `import { SITE_HOST }` (no longer needed in either form)

## Commits

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1+2  | Rewrite SpotForm + HeroForm | 01894e3 | UpsellView.tsx |

## Deviations from Plan

### Auto-approved Checkpoint

**Task 3:** `checkpoint:human-verify` — Auto-approved (auto_advance=true).
Verification steps listed for manual confirmation when testing the live app.

### Inline decisions

**[Rule 1 - Decision] Zod schemas at module scope**
- Both `SpotSchema` and `HeroSchema` placed above the component functions, not inside them, to avoid recreation on every render (follows Plan 03 pattern).

**[Rule 2 - Fix] SITE_HOST import removal**
- HeroForm used `SITE_HOST` only in a placeholder string. Replaced with static `"konbini.cl/evento/mi-evento"`. Import removed entirely since neither form needs it.

No other deviations — plan executed exactly as specified.

## Acceptance Criteria Verification

| Check | Expected | Actual | Pass |
|-------|----------|--------|------|
| "URL interna" count | 0 | 0 | PASS |
| description/buttonText count | 0 | 0 | PASS |
| api.createSpot occurrences | 1 | 1 | PASS |
| createSpot has no days key | true | true | PASS |
| type: "SPOT", spotId | 1 | 1 | PASS |
| field-error after Task 1 | >=3 | 5 | PASS |
| subtitle: as object key | 0 | 0 | PASS |
| titleAccent: occurrences | >=1 | 3 | PASS |
| api.createHero occurrences | 1 | 1 | PASS |
| createHero has no days key | true | true | PASS |
| type: "HERO", heroId | 1 | 1 | PASS |
| field-error cumulative | >=5 | 5 | PASS |
| TypeScript noEmit | no errors | 0 errors | PASS |

## Known Stubs

None — both forms fully wired with real API calls.
