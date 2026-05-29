---
phase: 26-dashboard-inbox-crm-y-suscripciones-con-api-real
plan: "03"
subsystem: dashboard/crm
tags: [crm, kanban, dashboard, admin, modal, notes, stage-management]
dependency_graph:
  requires: [26-01]
  provides: [CRMSection live kanban with real data, detail modal with notes and stage changes]
  affects: [apps/website/app/dashboard/sections/CRMSection.tsx]
tech_stack:
  added: []
  patterns: [useCallback+useEffect data loading, confirm-bg/confirm-card modal pattern, client-side kanban grouping]
key_files:
  created: []
  modified:
    - apps/website/app/dashboard/sections/CRMSection.tsx
decisions:
  - "STAGE_CONFIG array used for ordered kanban columns (NEW→CONTACTED→NEGOTIATING→WON→LOST)"
  - "TYPE_TAG record maps CrmType enum to CSS class and display label"
  - "Modal extracted to CRMDetailModal component receiving all state as props — clean separation"
  - "LOST stageReason guard: disable button + show required input when selectedStage===LOST"
  - "Initials avatar derived from contactName (same gradient pattern as UsersSection)"
metrics:
  duration: "~10 min"
  completed: "2026-05-29"
  tasks_completed: 1
  files_changed: 1
---

# Phase 26 Plan 03: CRM Kanban Real — Summary

**One-liner:** Rewrote CRMSection from static mock CARDS to live kanban loaded from `GET /crm?limit=50`, grouped by stage client-side, with a full detail modal for notes (GET/POST) and stage changes (PATCH, LOST guard).

## Completed Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build real kanban with API data + detail modal | b30c426 | apps/website/app/dashboard/sections/CRMSection.tsx |

## What Was Built

**CRMSection.tsx — complete rewrite:**

- Removed static `CARDS` record (5 columns × mock entries) and `TAG_LABEL` map
- `STAGE_CONFIG` array defines 5 ordered kanban columns: Nuevo / Contactado / En negociación / Cerrado ganado / Cerrado perdido
- `TYPE_TAG` record maps `CrmType` → CSS class (`contact` / `foto` / `creat`) and Spanish label
- Data load via `api.crmAll(token)` in `useCallback` + `useEffect([load])`
- Client-side kanban grouping: `entries.filter(e => e.stage === stage)` per column
- Each `.kan-card` shows type badge, contactName, contactEmail, formatted date; click → `openModal(entry)`
- **CRMDetailModal:** contact avatar (gradient initials, 44px), contactName h3, contactEmail mailto link
- Notes section: loading state, "Sin notas aún.", existing notes list with timestamps, textarea + "Agregar nota" button
- Stage section: select with STAGE_CONFIG options, conditional stageReason input when LOST, "Guardar etapa" button
- Handlers: `handleAddNote` → `api.crmAddNote`, `handleSaveStage` → `api.crmSetStage` with LOST guard

## Verification Results

```
grep -c "const CARDS|MOCK_DATA|const TAG_LABEL"  → 0  (mock removed)
grep -c "api.crmAll|api.crmNotes|api.crmAddNote|api.crmSetStage"  → 4  (all 4 methods used)
grep -c "STAGE_CONFIG"  → 4 (definition + 2 usages)
grep -c "TYPE_TAG"  → 2 (definition + usage in render)
grep -c "stageReason"  → 8 (state + input + handler guards)
grep -c "LOST guard"  → 4 (multiple guards)
npx tsc --noEmit | grep "CRMSection"  → 0 (clean)
```

## Deviations from Plan

None — plan executed exactly as written.

The modal structure mirrors the `confirm-bg`/`confirm-card` pattern from `UsersSection.tsx` (Phase 25 reference) for design consistency. `CRMDetailModal` extracted as a named component receiving all state as props rather than inlined, for clarity.

## Known Stubs

None. All API calls are wired to real endpoints defined in Phase 26-01.

## Self-Check: PASSED

- File exists: apps/website/app/dashboard/sections/CRMSection.tsx ✓
- Commit b30c426 exists ✓
- TypeScript: 0 CRMSection errors ✓
