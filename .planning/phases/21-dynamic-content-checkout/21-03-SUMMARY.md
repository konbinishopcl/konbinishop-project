---
phase: 21-dynamic-content-checkout
plan: "03"
subsystem: website/checkout
tags: [dynamic-content, quota, pricing, forms]
dependency_graph:
  requires: [21-01]
  provides: [DYN-01, DYN-04]
  affects: [crear-producto, upsell]
tech_stack:
  added: []
  patterns:
    - "useEffect quota fetch on mount with .catch(() => {}) fire-and-forget"
    - "Prop-drilling pricePerDay from parent (UpsellView) to child forms (SpotForm/HeroForm)"
    - "Fallback chain: quota?.pricePerDay ?? hardcoded (8000/15000)"
key_files:
  created: []
  modified:
    - apps/website/app/(site)/crear-producto/[kind]/CreateProductView.tsx
    - apps/website/app/(site)/upsell/UpsellView.tsx
decisions:
  - "TITLES quota text moved out of module-scope constant into the rendered subtitle paragraph — module scope cannot access React state"
  - "formatCLP helper added locally to each view (not shared) to avoid cross-file imports for a trivial utility"
  - "pricePerDay prop passed from UpsellView parent to SpotForm/HeroForm to avoid redundant quota fetches inside child components"
metrics:
  duration: "~10 min"
  completed_date: "2026-05-28"
  tasks_completed: 2
  files_modified: 2
---

# Phase 21 Plan 03: Dynamic price and quota in CreateProductView and UpsellView Summary

**One-liner:** Replaced hardcoded $8.000/$15.000 prices and "Cupo: 9/12"/"Cupo: 3/5" quota strings in both product-creation surfaces with live data from api.spotsQuota()/api.heroesQuota(), using sensible fallbacks.

## What Was Built

Both surfaces (`CreateProductView` and `UpsellView`) now fetch real quota data on mount and render per-day price and live active/max quota counts from the API instead of static literals.

### CreateProductView changes
- Added `useState<ApiQuota | null>(null)` and a `useEffect` that calls `api.spotsQuota()` or `api.heroesQuota()` depending on `kind`
- Removed the `PRICE` module-scope constant; `pricePerDay` now derives from `quota?.pricePerDay` with hardcoded fallbacks (8000 for spot, 15000 for hero, null for articulo)
- Stripped hardcoded `"Cupo: 9 / 12."` and `"Cupo: 3 / 5."` from the `TITLES` record (module scope cannot read state)
- Added dynamic quota text in the rendered subtitle: `{sub}{quota ? \` Cupo: ${quota.active} / ${quota.max} ocupados.\` : ""}`
- Updated spot and hero day-range help text from `$8.000 CLP / día → ${days * 8000}` to `{formatCLP(pricePerDay ?? 0)} CLP / día → {formatCLP((pricePerDay ?? 0) * days)}`
- Added local `formatCLP(es-CL)` helper; imported `ApiQuota` type from `@/lib/api`

### UpsellView changes
- Added `useState<ApiQuota | null>` for both `spotQuota` and `heroQuota`, fetched in a single `useEffect` on mount
- Updated Step 1 (aviso) price pill from `$8.000 / día` to `{formatCLP(spotQuota?.pricePerDay ?? 8000)} / día`
- Updated Step 1 quota copy from `"Cupo: 9 / 12 ocupados"` to dynamic `{spotQuota ? \`${spotQuota.active} / ${spotQuota.max}\` : "9 / 12"} ocupados`
- Updated Step 2 (portada) equivalently with `heroQuota` (fallback `15000` / `"3 / 5"`)
- Added `pricePerDay` prop to `SpotForm` and `HeroForm` (default 8000/15000 for backwards compat); parent passes live value
- Updated help text inside SpotForm and HeroForm to use `formatCLP(pricePerDay)` instead of hardcoded multiplications
- Added local `formatCLP` helper; imported `ApiQuota` type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing feature] SpotForm/HeroForm help text also needed dynamic price**
- **Found during:** Task 2 review
- **Issue:** The verify regex included `\$8\.000 CLP / día` which appears in the embedded SpotForm/HeroForm help text, not just the outer step UI
- **Fix:** Added `pricePerDay` prop to both forms and prop-drilled the live value from UpsellView's quota state
- **Files modified:** apps/website/app/(site)/upsell/UpsellView.tsx
- **Commit:** 8dd7a78

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 2a8a7ec | feat(21-03): dynamic price and quota in CreateProductView |
| Task 2 | 8dd7a78 | feat(21-03): dynamic price and quota in UpsellView |

## Known Stubs

None. All price and quota data is wired to real API endpoints with sensible fallbacks.

## Self-Check: PASSED

- CreateProductView.tsx: FOUND
- UpsellView.tsx: FOUND
- 21-03-SUMMARY.md: FOUND
- Commit 2a8a7ec (Task 1): FOUND
- Commit 8dd7a78 (Task 2): FOUND
