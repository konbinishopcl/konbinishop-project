---
phase: 27
plan: "03"
subsystem: website/dashboard
tags: [recharts, real-api, homeSection, queue, audit-logs, moderation]
dependency_graph:
  requires: ["27-02"]
  provides: ["HomeSection real queue + activity + Recharts chart"]
  affects: ["apps/website/app/dashboard/sections/HomeSection.tsx"]
tech_stack:
  added: []
  patterns: ["useCallback fetch with Promise.all", "degraded render for audit logs", "RevenueBarChart reuse"]
key_files:
  created: []
  modified:
    - apps/website/app/dashboard/sections/HomeSection.tsx
decisions:
  - "Both tasks implemented in single file edit — committed together as one atomic change"
  - "Activity feed uses degraded render: 'Sistema' for null userId, 'Usuario #N' for numeric userId (no join available)"
  - "pendingTotal decremented locally on approve/reject via Math.max(0, n-1) to keep KPI in sync without re-fetch"
metrics:
  duration: "10 minutes"
  completed: "2026-05-29T18:38:00Z"
  tasks_completed: 2
  files_modified: 1
---

# Phase 27 Plan 03: HomeSection Real Data + RevenueBarChart Summary

Real API wiring for HomeSection: review queue from GET /events?status=PENDING_MODERATION, activity feed from GET /admin/audit-logs, real pending total for EN REVISIÓN KPI, and Recharts BarChart replacing the CSS .chart bars.

## What Was Built

### Task 1: Wire HomeSection queue + activity + KPI to real API

Replaced the three hardcoded mock arrays (`QUEUE`, `ACTIVITY`, and their `QueueItem` type) with real API calls using the established fetch pattern from LogsSection.

**Changes in HomeSection.tsx:**
- Added imports: `useCallback`, `useEffect`, `useState`, `useUser`, `api`, `ApiEvent`, `ApiAuditLog`
- New state: `queue: ApiEvent[]`, `pendingTotal: number`, `activity: ApiAuditLog[]`
- `load` callback: `Promise.all([api.adminEvents(token, { status: "PENDING_MODERATION", pageSize: 5 }), api.auditLogs({ pageSize: 5 }, token)])` on `[token]` dependency
- `handleApprove` / `handleReject` call real API endpoints (`api.approveEvent`, `api.rejectEvent`), filter the row out of queue state, and decrement `pendingTotal` via `Math.max(0, n-1)`
- Queue rendering: shows `r.poster` as `<img>` (40×40, object-fit cover) or fallback `<div className="pic poster-art">`. Meta = `[r.company, r.eventCategory?.name].filter(Boolean).join(" · ")`
- Activity feed: degraded render per Phase 25-04 pattern. Actor = `a.userId == null ? "Sistema" : "Usuario #${a.userId}"`. Body: `<strong>{actor}</strong> {a.action} <span style accent>{a.entity} #{a.entityId}</span>`. Time: `toLocaleString("es-CL")`
- Empty states: queue → "Sin eventos pendientes" / "No hay eventos esperando revisión."; activity → "Sin actividad reciente" / "No hay registros de actividad disponibles."
- EN REVISIÓN KPI: now renders `{pendingTotal}` (from `evts.total`)

### Task 2: Replace CSS .chart with RevenueBarChart

- Added import: `RevenueBarChart, type RevenueDatum` from `@/components/charts/RevenueBarChart`
- `const chartData: RevenueDatum[]` built from mock `CHART_VALUES`/`CHART_LABELS` (revenue values stay mock — no aggregate endpoint)
- Removed `<div className="chart" ...>` CSS bars block entirely
- Replaced with `<RevenueBarChart data={chartData} />` inside the same `<div className="panel">` wrapper
- cat-bar "Por categoría" panel left untouched

## Deviations from Plan

**None** — both tasks executed exactly as specified. Tasks 1 and 2 were implemented in a single file edit and committed together since they modify the same file.

## Verification

```
cd apps/website && npx tsc --noEmit  → no errors referencing HomeSection.tsx
grep -q "api.adminEvents(token" HomeSection.tsx  → OK
grep -q "auditLogs(" HomeSection.tsx  → OK
grep -q "RevenueBarChart data={chartData}" HomeSection.tsx  → OK
! grep -q 'className="chart"' HomeSection.tsx  → OK (CSS bars removed)
grep -q 'className="cat-bar"' HomeSection.tsx  → OK (preserved)
```

## Known Stubs

- INGRESOS MES KPI: hardcoded "$3.8M" — no revenue aggregate endpoint
- EVENTOS PUBLICADOS KPI: hardcoded 142 — no published count endpoint
- SUSCRIPTORES KPI: hardcoded 87 — no subscriber count endpoint
- CHART_VALUES / CHART_LABELS: mock revenue values — no monthly revenue endpoint
- CATEGORIES (cat-bar): mock category stats — no category aggregate endpoint

All stubs are intentional per CONTEXT.md decisions. They do not prevent the plan's goal (real queue + activity + KPI + chart component) from being achieved.

## Self-Check

### Created files:
- No new files created — only modification of existing HomeSection.tsx

### Commits:
- 0c23945: feat(27-03): wire HomeSection to real API — queue, activity, KPI, RevenueBarChart

## Self-Check: PASSED
