---
phase: 26-dashboard-inbox-crm-y-suscripciones-con-api-real
plan: "04"
subsystem: dashboard-subscriptions
tags: [dashboard, subscriptions, api, real-data, modal, kpi]
dependency_graph:
  requires: [26-01]
  provides: [SubsSection-real-api, subscriber-ver-modal, subs-kpi-real]
  affects: [apps/website/app/dashboard/sections/SubsSection.tsx]
tech_stack:
  added: []
  patterns: [useCallback-useEffect-token-pattern, api-client-method, status-pill, confirm-modal]
key_files:
  created: []
  modified:
    - apps/website/app/dashboard/sections/SubsSection.tsx
decisions:
  - "KPI block reduced to 2 KPIs only (Activos + Total) — MRR/Nuevos mes/Cancelaciones removed because no aggregates endpoint exists"
  - "subDisplayName uses handle when available, falls back to email — consistent with subscriptions service shape (no firstname/lastname)"
  - "Status pill maps ACTIVE->pub class ('Activo'), anything else->exp class ('Inactivo')"
  - "Configuración del plan section (PlanSettings, savePlan, 4 inputs, Guardar) preserved 100% unchanged"
  - "SubRow helper named SubRow (not Row) to avoid name collision with other dashboard sections"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-29"
  tasks_completed: 1
  files_modified: 1
---

# Phase 26 Plan 04: SubsSection Real API — Summary

**One-liner:** SubsSection wired to GET /subscriptions with real KPIs (Activos+Total), real table rows, and Ver modal showing handle/email/status/dates/credits.

## What Was Built

Rewrote the subscriber list portion of `SubsSection.tsx` to load real data from `api.subscriptions(token)`. The mock data array (`MOCK_SUBS`) and local types (`SubStatus`, `Subscriber`) were removed and replaced with the `ApiSubscription` type from lib/api.ts.

### Key Changes

1. **KPI block** — Reduced from 4 KPIs (Activos, Nuevos mes, Cancelaciones, MRR) to 2 KPIs (Activos computed from `subs.filter(s=>s.status==='ACTIVE').length`, Total from `response.total`)

2. **Data loading** — `loadSubs` useCallback fetches `GET /subscriptions?limit=50` on mount and on token change; loading state shows "Cargando…" row while in flight

3. **Table rows** — Now iterate over `subs` (real `ApiSubscription[]`); display name via `subDisplayName()` helper using `org.handle || org.email || user.handle || user.email`; dates formatted with `fmtDate()` using UTC month abbreviations

4. **Ver modal** — `openSub` state set on button click; modal shows 6 fields: Usuario/Org, Email, Estado, Inicio ciclo, Fin ciclo, Créditos; closes on backdrop click or Cerrar button

5. **Configuración del plan** — `PlanSettings` type, `savePlan` async function, plan state, grid-2 inputs, and Guardar button are 100% unchanged

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| MOCK_SUBS removed | 0 matches |
| api.subscriptions present | 1 match |
| Old KPIs (MRR, Nuevos mes) removed | 0 matches |
| New KPIs (ACTIVOS, TOTAL) present | 2 matches |
| openSub state+usage | 8 matches |
| creditsUsed/creditsTotal | 2 matches |
| cycleStart/cycleEnd | 4 matches |
| subDisplayName/subEmail helpers | 5 matches |
| firstname/lastname absent | 0 matches |
| savePlan/PlanSettings preserved | 8 matches |
| useCallback/useEffect present | 3 matches |
| TypeScript compile (SubsSection) | 0 errors |

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | a92e026 | feat(26-04): wire SubsSection to real API — real subscriber table + KPIs + Ver modal |

## Self-Check: PASSED
