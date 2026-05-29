---
phase: 27-dashboard-analytics-pagos-y-graficos-reales-con-recharts
plan: "05"
subsystem: website/dashboard/sections
tags: [recharts, payments, csv-export, client-side-bucketing, analytics]
dependency_graph:
  requires: ["27-01", "27-02"]
  provides: ["real-reports-chart", "real-csv-export"]
  affects: ["apps/website/app/dashboard/sections/ReportsSection.tsx"]
tech_stack:
  added: []
  patterns:
    - useCallback/useEffect([load]) pattern for data fetching
    - useMemo([payments, period]) for client-side period bucketing
    - Blob/URL.createObjectURL pattern for CSV download
key_files:
  created: []
  modified:
    - apps/website/app/dashboard/sections/ReportsSection.tsx
decisions:
  - "allZero guard: if all buckets are 0, pass empty array to RevenueBarChart to show empty-state panel"
  - "periodPayments computed separately from chart buckets (for CSV export, includes only PAID payments in period window)"
  - "TOP_INGRESOS and TOP_EVENTOS remain mock — no aggregate endpoint available"
metrics:
  duration: "12 minutes"
  completed: "2026-05-29"
  tasks_completed: 2
  files_modified: 1
---

# Phase 27 Plan 05: ReportsSection — Real Chart + CSV Export Summary

ReportsSection wired to real payments from GET /payments, with period-bucketed RevenueBarChart and real CSV download for in-period PAID payments.

## What Was Built

ReportsSection.tsx was rewritten from a fully mock component into a real data-driven analytics section:

- Loads all payments via `api.adminPayments(token)` with loading and error states
- Buckets PAID payments client-side by selected period (Día/Semana/Mes/Año) using `useMemo` keyed on `[payments, period]`
- Passes bucketed data to `RevenueBarChart`; passes empty array when all buckets are zero (triggers empty-state panel)
- Exports a real CSV of in-period PAID payments via `buildCSV(periodPayments)` with quote-escaped fields and Blob download
- Mock TOP_INGRESOS and TOP_EVENTOS rankings preserved (no aggregate endpoint)

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Load payments and replace chart with period-bucketed RevenueBarChart | a873ea8 | ReportsSection.tsx |
| 2 | Real CSV export from in-period payments | a873ea8 | ReportsSection.tsx |

## Deviations from Plan

None — plan executed exactly as written. Both tasks were implemented in a single pass since they modify the same file. The commit covers both tasks atomically.

## Known Stubs

- `TOP_INGRESOS` — mock data for top organizadores by revenue (no aggregate endpoint; intentional per plan)
- `TOP_EVENTOS` — mock data for top organizadores by event count (same reason; intentional per plan)

These stubs are intentional by design (documented in 27-CONTEXT.md under "Deferred Ideas") and do not prevent the plan's goal from being achieved.

## Self-Check: PASSED

- `apps/website/app/dashboard/sections/ReportsSection.tsx` — exists and contains all required patterns
- Commit `a873ea8` — verified present in git log
