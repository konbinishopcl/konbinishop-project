---
phase: 27-dashboard-analytics-pagos-y-graficos-reales-con-recharts
plan: "02"
subsystem: website
tags: [recharts, charts, api, payments, typescript]
dependency_graph:
  requires: [27-01]
  provides: [RevenueBarChart, ApiPayment, adminPayments, EventsQuery.status, ApiEvent.status]
  affects: [27-03, 27-04, 27-05]
tech_stack:
  added: [recharts@^3.8.1]
  patterns: [ResponsiveContainer, BarChart, TooltipContentProps]
key_files:
  created:
    - apps/website/components/charts/RevenueBarChart.tsx
  modified:
    - apps/website/package.json
    - apps/website/lib/api.ts
    - pnpm-lock.yaml
decisions:
  - "Use TooltipContentProps with unknown cast for recharts v3 tooltip compatibility"
  - "status and statusReason added as required fields to ApiEvent (admin endpoint always returns them)"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-29T18:33:54Z"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
---

# Phase 27 Plan 02: Frontend Foundation — Recharts + ApiPayment + Event Status Summary

## One-liner

Recharts installed with reusable `RevenueBarChart` wrapper, and `api.ts` extended with `ApiPayment` type, `adminPayments()` method, and `status` fields on `EventsQuery`/`ApiEvent`.

## What Was Built

### Task 1: Install recharts and create RevenueBarChart component

- Installed `recharts ^3.8.1` via pnpm in `apps/website`
- Created `apps/website/components/charts/RevenueBarChart.tsx` as a `"use client"` component
- Implements `<BarChart>` inside `<ResponsiveContainer width="100%" height={160}>`
- Bar fill: `color-mix(in oklab, var(--accent) 60%, transparent)` with `radius={[4, 4, 0, 0]}`
- XAxis with mono font, 9px, `var(--ink-3)`, no tick/axis lines
- Custom tooltip: `var(--surface)` background, `var(--line)` border, `var(--r-sm)` radius, CLP formatter
- CLP formatter: ≥1M → `$XM`, ≥1k → `$Xk`, else `$X`
- Empty state: `.empty` panel with "Sin ventas en este período" / "No hubo pagos registrados para el período seleccionado."
- Exports `RevenueDatum` type and `RevenueBarChart` (named + default)

### Task 2: Extend api.ts with ApiPayment, adminPayments, and event status fields

- Added `ApiPayment` type matching `GET /payments` response from Plan 01
- Added `adminPayments: (token: string) => request<ApiPayment[]>("/payments", {}, token)` to `api` object
- Added `status?` to `EventsQuery` with full `PublicationStatus` union
- Added required `status` and `statusReason` to `ApiEvent` type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed recharts v3 TooltipContentProps compatibility**
- **Found during:** Task 1 TypeScript verification
- **Issue:** recharts v3 changed `TooltipProps` — `active` and `payload` are no longer direct props; content callback receives `TooltipContentProps` but the generic type inference conflicted when passing JSX element
- **Fix:** Changed `ChartTooltip` to use a plain object type `{ active?: boolean; payload?: { value?: number }[] }` and cast with `unknown` in the content render prop
- **Files modified:** `apps/website/components/charts/RevenueBarChart.tsx`
- **Commit:** 524ffdb

**2. [Out of scope - pre-existing] .next/types stale cache error for organizador page**
- Logged to deferred items — pre-existing from Phase 23 deletion of `/cuenta/organizador` page. Not caused by this plan.

## Known Stubs

None — this plan only provides types and a component. No data flows or UI sections.

## Success Criteria Verification

- [x] Wave 2 section can `import { RevenueBarChart } from "@/components/charts/RevenueBarChart"` — file exists and exports correctly
- [x] Wave 2 section can `import { api, type ApiPayment } from "@/lib/api"` and call `api.adminPayments(token)` — method added
- [x] `api.adminEvents(token, { status: "PENDING_MODERATION", pageSize: 5 })` works — `status` added to `EventsQuery`
- [x] No CSS tokens invented — chart uses only existing CSS variables (`--accent`, `--surface`, `--line`, `--r-sm`, `--font-mono`, `--ink-3`, `--ink`)
- [x] `tsc --noEmit` produces no errors referencing `lib/api.ts` or `components/charts/RevenueBarChart.tsx`

## Self-Check: PASSED

- `apps/website/components/charts/RevenueBarChart.tsx`: FOUND
- `apps/website/lib/api.ts` contains `export type ApiPayment`: FOUND
- `apps/website/lib/api.ts` contains `adminPayments`: FOUND
- Commits 8b81d36 and 524ffdb: FOUND in git log
