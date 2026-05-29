---
phase: "23"
plan: "02"
subsystem: website-ui
tags: [data, mis-avisos, mis-portadas, uploadImage, org-context]
dependency_graph:
  requires: []
  provides: [mis-avisos-data, mis-portadas-data, uploadImage-org-context]
  affects: [website-ui]
tech_stack:
  added: []
  patterns: [client-side-data-fetch, tab-filter, status-badge]
key_files:
  created: []
  modified:
    - apps/website/app/(site)/cuenta/mis-avisos/page.tsx
    - apps/website/app/(site)/cuenta/mis-portadas/page.tsx
    - apps/website/lib/api.ts
decisions:
  - "D-3: matchesTab uses APPROVED+expirationDate<now for Expirados, APPROVED+(!exp or exp>=now) for Activos — APPROVED expirado no cuenta como Activo"
  - "D-4: mis-portadas TABS con labels femeninos (Activas/Expiradas/Rechazadas) conservados del placeholder"
  - "D-5: uploadImage construye headers manualmente sin buildHeaders() para no forzar Content-Type:application/json en multipart"
metrics:
  duration_minutes: 8
  completed_date: "2026-05-29"
  tasks_completed: 3
  files_changed: 3
requirements_satisfied: [CLEAN-03, CLEAN-04, CLEAN-05]
---

# Phase 23 Plan 02: Mis Avisos + Mis Portadas + uploadImage Org Context Summary

**One-liner:** Real data loading for mis-avisos and mis-portadas via api.mySpots/myHeroes with tab filtering by status; uploadImage patched to send X-Org-Context header without breaking multipart.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Fix uploadImage X-Org-Context | db2ea21 | apps/website/lib/api.ts |
| 2 | Implement mis-avisos with api.mySpots | eb3d3a9 | apps/website/app/(site)/cuenta/mis-avisos/page.tsx |
| 3 | Implement mis-portadas with api.myHeroes | 5315a2e | apps/website/app/(site)/cuenta/mis-portadas/page.tsx |

## What Was Built

### Task 1: uploadImage X-Org-Context Fix
The `uploadImage` function in `lib/api.ts` previously only sent `Authorization` header, missing `X-Org-Context` when operating as an org. Fix: build headers manually (`const headers: Record<string,string> = { Authorization: Bearer ${token} }; if (_activeOrgId) headers["X-Org-Context"] = String(_activeOrgId);`) without calling `buildHeaders()`, which would have forced `Content-Type: application/json` and broken multipart form data.

### Task 2: mis-avisos Real Data
Replaced the static placeholder with real data loading:
- `useUser()` destructures `token` (was missing before)
- `useEffect` calls `api.mySpots(token)` and sets state
- `matchesTab(s, tab, now)` predicate with correct Activos/Expirados logic
- Three render states: loading, primary empty state (CTA to /crear-producto/spot), secondary empty state per-tab, and `pub-grid` card list
- Status badges using existing `.st-rev`, `.st-pub`, `.st-rej` CSS classes

### Task 3: mis-portadas Real Data
Mirror of mis-avisos with hero-specific changes:
- `api.myHeroes(token)` data loading
- TABS with feminine labels: Activas/Expiradas/Rechazadas (preserved from original placeholder)
- `titleAccent` concatenated in card title render
- Same three render states with CTA to /crear-producto/hero

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows are wired to real API endpoints.

## Pre-existing Issues (Out of Scope)

- `.next/types/app/(site)/cuenta/organizador/page.ts` TypeScript errors: stale Next.js type cache for the `organizador` page deleted in plan 23-01. Not caused by this plan. Logged for deferred cleanup.

## Verification

- `grep "api.mySpots" apps/website/app/(site)/cuenta/mis-avisos/page.tsx` — present
- `grep "api.myHeroes" apps/website/app/(site)/cuenta/mis-portadas/page.tsx` — present
- `grep -A14 "uploadImage: async" apps/website/lib/api.ts | grep "X-Org-Context"` — present
- `git diff --name-only` — only 3 expected files modified (no globals.css)
- TypeScript: 0 new errors introduced (pre-existing error in .next/types is unrelated to this plan)
