---
phase: 27-dashboard-analytics-pagos-y-graficos-reales-con-recharts
verified: 2026-05-29T20:00:00Z
status: human_needed
score: 12/12 requirements covered; all code-level truths verified; 6 runtime/visual items need human confirmation
human_verification:
  - test: "RevenueBarChart visual appearance"
    expected: "Bars render with accent fill, 160px height, mono-font axis labels, no Y-axis, no grid, no legend. Tooltip shows CLP-formatted value with correct styling."
    why_human: "Pure visual regression — grep confirms the code contract (ResponsiveContainer height=160, accent color-mix, no YAxis) but rendering correctness requires a browser."
  - test: "HomeSection approve/reject removes the row"
    expected: "Clicking '✓ Aprobar' on a pending queue item calls the API, then the row disappears from the table and the EN REVISIÓN KPI decrements."
    why_human: "Runtime state mutation after async API call — cannot be verified statically."
  - test: "PaymentsSection CSV downloads a real file"
    expected: "'Exportar CSV' produces a downloadable .csv with quoted fields, one row per payment, columns: ID, Comprador, Productos, Monto, Fecha, Estado."
    why_human: "Blob/anchor download is a browser-side runtime behavior."
  - test: "ReportsSection period filter re-buckets without refetch"
    expected: "Switching Día/Semana/Mes/Año chips updates the chart immediately (client-side useMemo) without a new API call."
    why_human: "Client-side derived state update on chip click — requires browser interaction to observe."
  - test: "ReportsSection empty-state panel when no PAID payments in period"
    expected: "When the selected period has no PAID payments, RevenueBarChart renders 'Sin ventas en este período' with the .empty panel."
    why_human: "Conditional rendering depends on runtime data; empty array guard verified in code but behavior requires a real data state."
  - test: "GET /payments auth guards — 401 and 403"
    expected: "A request without a JWT receives 401. A request with a non-admin JWT receives 403. An ADMIN/SUPER_ADMIN token receives 200 with ApiPayment[]."
    why_human: "Guard decorators are present in code but HTTP response correctness requires a running API."
---

# Phase 27: Dashboard Analytics, Pagos y Graficos Reales con Recharts — Verification Report

**Phase Goal:** Reemplazar todos los datos mock de analytics y pagos con datos reales: `HomeSection` conecta queue de revisión, actividad reciente y stats de categorías a sus endpoints reales; `PaymentsSection` carga historial real desde `GET /payments`; `ReportsSection` conecta a API con filtro de período funcional y exportación CSV real; instalar Recharts como librería de gráficos única, reemplazando todos los charts mock del dashboard (HomeSection, ReportsSection) con componentes Recharts reutilizables.
**Verified:** 2026-05-29T20:00:00Z
**Status:** human_needed — all 12 code-level truths verified; 6 runtime/visual behaviors need human confirmation
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `GET /payments` admin endpoint exists, guarded, returns PAID/FAILED orders | VERIFIED | `payments.controller.ts` line 15-21: `@Get()`, `@UseGuards(JwtAuthGuard, RolesGuard)`, `@Roles('ADMIN','SUPER_ADMIN')`, delegates to `findAllForAdmin()` |
| 2 | `findAllForAdmin()` returns normalized ApiPayment shape with buyer + items | VERIFIED | `payments.service.ts` line 271-299: `prisma.order.findMany`, `status: { in: [OrderStatus.PAID, OrderStatus.FAILED] }`, `filter(Boolean).join(' ')`, `createdAt.toISOString()` |
| 3 | Non-admin/unauthenticated requests to GET /payments are rejected | CODE WIRED | Guards present in code; HTTP 401/403 behavior flagged for human verification |
| 4 | recharts is installed as the sole chart library | VERIFIED | `apps/website/package.json` line 21: `"recharts": "^3.8.1"`; no competing chart libraries found (victory, d3, nivo, apexcharts absent) |
| 5 | RevenueBarChart is a real Recharts BarChart with correct contract | VERIFIED | File exists; contains `from "recharts"`, `ResponsiveContainer`, `height={160}`, `radius={[4,4,0,0]}`, `color-mix(in oklab, var(--accent) 60%, transparent)`, `RevenueDatum` export, empty-state with "Sin ventas en este período"; tsc clean |
| 6 | api.ts exports ApiPayment, adminPayments, EventsQuery.status, ApiEvent.status | VERIFIED | `api.ts` line 148: `export type ApiPayment`; line 459: `status?:` on EventsQuery; line 329/330: `status`+`statusReason` on ApiEvent; line 519: `adminPayments` method; tsc clean |
| 7 | HomeSection review queue loads from GET /events?status=PENDING_MODERATION | VERIFIED | `HomeSection.tsx` line 46: `api.adminEvents(token, { status: "PENDING_MODERATION", pageSize: 5 })`; mock `QUEUE` const absent |
| 8 | HomeSection activity feed loads from GET /admin/audit-logs | VERIFIED | `HomeSection.tsx` line 47: `api.auditLogs({ pageSize: 5 }, token)`; mock `ACTIVITY` const absent |
| 9 | EN REVISIÓN KPI reflects real pending total | VERIFIED | `HomeSection.tsx` line 110: `{pendingTotal}` rendered in KPI; derived from `evts.total` |
| 10 | HomeSection revenue chart is RevenueBarChart (CSS .chart removed) | VERIFIED | Line 128: `<RevenueBarChart data={chartData} />`; no `className="chart"` found in file |
| 11 | PaymentsSection table loads from GET /payments; modal shows real fields; CSV is real | VERIFIED | `PaymentsSection.tsx`: `api.adminPayments(token)` line 48; `formatCLP`, loading/empty states; `detail.buyer`, `detail.gateway`; `URL.createObjectURL`; no `ROWS`, `detail.err`, `detail.card` found |
| 12 | ReportsSection chart is period-bucketed RevenueBarChart from real payments; CSV is real | VERIFIED | `ReportsSection.tsx`: `api.adminPayments(token)` line 170; `useMemo([payments, period])` line 185; `p.status === "PAID"` filter line 186; `<RevenueBarChart data={chartData}/>` line 271; `buildCSV(periodPayments)` line 218; `URL.createObjectURL` line 220; no `BARS` const found |

**Code-level score: 12/12 truths wired correctly**

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/payments/payments.service.ts` | findAllForAdmin() returning ApiPayment[] | VERIFIED | Method at line 271; full Prisma query with includes; buyer/item normalization |
| `apps/api/src/payments/payments.controller.ts` | GET /payments guarded by JwtAuthGuard + RolesGuard | VERIFIED | @Get(), @UseGuards, @Roles at lines 15-21; RolesGuard imported line 6 |
| `apps/website/components/charts/RevenueBarChart.tsx` | Recharts BarChart with RevenueDatum prop, empty-state | VERIFIED | All contract patterns present; tsc clean |
| `apps/website/lib/api.ts` | ApiPayment type, adminPayments method, EventsQuery.status, ApiEvent.status | VERIFIED | All four additions confirmed; tsc clean |
| `apps/website/app/dashboard/sections/HomeSection.tsx` | Real queue + activity + KPI + RevenueBarChart | VERIFIED | All patterns present; mock QUEUE/ACTIVITY removed |
| `apps/website/app/dashboard/sections/PaymentsSection.tsx` | Real table + detail modal + CSV from ApiPayment | VERIFIED | All patterns present; mock ROWS/unbacked fields removed |
| `apps/website/app/dashboard/sections/ReportsSection.tsx` | Real chart with period bucketing + CSV export | VERIFIED | All patterns present; BARS mock removed |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `payments.controller.ts GET /payments` | `payments.service.findAllForAdmin` | controller calls `this.payments.findAllForAdmin()` | WIRED | Line 21 |
| `payments.service.findAllForAdmin` | `prisma.order` | `prisma.order.findMany` with PAID/FAILED filter | WIRED | Line 272-273 |
| `HomeSection.tsx` | `GET /events?status=PENDING_MODERATION` | `api.adminEvents(token, { status, pageSize })` | WIRED | Line 46 |
| `HomeSection.tsx` | `GET /admin/audit-logs` | `api.auditLogs({ pageSize: 5 }, token)` | WIRED | Line 47 |
| `HomeSection.tsx` | `RevenueBarChart` | `<RevenueBarChart data={chartData} />` | WIRED | Line 128 |
| `PaymentsSection.tsx` | `GET /payments` | `api.adminPayments(token)` | WIRED | Line 48 |
| `ReportsSection.tsx` | `GET /payments` | `api.adminPayments(token)` | WIRED | Line 170 |
| `ReportsSection.tsx` | `RevenueBarChart` | `<RevenueBarChart data={chartData} />` | WIRED | Line 271 |
| `api.ts adminPayments` | `GET /payments` | `request<ApiPayment[]>("/payments", {}, token)` | WIRED | Confirmed in api.ts |

---

## Requirements Coverage

Requirements source: `.planning/ROADMAP.md` lines 236-247 (IDs not present in REQUIREMENTS.md — no orphan risk).

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| DASH-ANLT-01 | 27-02 | Recharts instalado como librería única | SATISFIED | package.json line 21; no competing libs |
| DASH-ANLT-02 | 27-02 | RevenueBarChart reutilizable con empty-state | SATISFIED | All contract patterns verified in file |
| DASH-ANLT-03 | 27-03 | HomeSection cola desde GET /events?status=PENDING_MODERATION | SATISFIED | api.adminEvents call wired |
| DASH-ANLT-04 | 27-03 | HomeSection aprobar/rechazar real + actividad reciente | SATISFIED (code) | approveEvent/rejectEvent calls wired; runtime row-removal needs human |
| DASH-ANLT-05 | 27-01, 27-04 | Backend GET /payments admin guarded | SATISFIED (code) | Guards present; HTTP behavior needs human |
| DASH-ANLT-06 | 27-01 | findAllForAdmin() con buyer + items resueltos | SATISFIED | Full implementation verified |
| DASH-ANLT-07 | 27-02, 27-03, 27-05 | ApiPayment + adminPayments + chart CSS reemplazado | SATISFIED | All three verified; no className="chart" remains |
| DASH-ANLT-08 | 27-03 | KPI "En Revisión" desde total real | SATISFIED | {pendingTotal} from evts.total |
| DASH-ANLT-09 | 27-04 | PaymentsSection tabla desde GET /payments | SATISFIED | adminPayments wired; loading/empty states present |
| DASH-ANLT-10 | 27-04 | PaymentsSection modal real + CSV client-side | SATISFIED (code) | Real fields bound; CSV download wired; runtime behavior needs human |
| DASH-ANLT-11 | 27-05 | ReportsSection gráfico con filtro de período client-side | SATISFIED (code) | useMemo bucketing wired; period chip behavior needs human |
| DASH-ANLT-12 | 27-05 | ReportsSection export CSV del período seleccionado | SATISFIED (code) | buildCSV(periodPayments) + createObjectURL wired; download needs human |

No orphaned requirements — all 12 IDs declared across plans; all found in ROADMAP.md.

---

## Anti-Patterns Found

| File | Pattern | Severity | Notes |
|------|---------|----------|-------|
| `PaymentsSection.tsx` — KPI values | Hardcoded "$3.8M", counts | INFO | Intentional per CONTEXT.md — no aggregate endpoint exists |
| `HomeSection.tsx` — INGRESOS/EVENTOS/SUSCRIPTORES KPIs | Hardcoded mock values | INFO | Intentional per CONTEXT.md |
| `ReportsSection.tsx` — TOP_INGRESOS, TOP_EVENTOS | Mock ranking arrays | INFO | Intentional per CONTEXT.md; no aggregate endpoint |
| `PaymentsSection.tsx` — "Reembolsar", "Descargar comprobante" | toast stubs | INFO | Intentional per plan; deferred per scope |
| `HomeSection.tsx` — CHART_VALUES, CHART_LABELS | Mock revenue values | INFO | Intentional — no monthly revenue aggregate endpoint |

No STUB or BLOCKER anti-patterns. All mock data is intentional, scoped, and documented.

---

## TypeScript Verification

Both API and website tsc checks ran independently and returned no errors referencing any phase-27 file:

- `cd apps/api && npx tsc --noEmit 2>&1 | grep -iE "payments.(service|controller)"` — no output (clean)
- `cd apps/website && npx tsc --noEmit 2>&1 | grep -iE "HomeSection|PaymentsSection|ReportsSection|RevenueBarChart|lib/api"` — no output (clean)

Pre-existing unrelated error in `organizador/page` (Phase 23 deletion artifact) was filtered by targeted grep and does not affect this phase.

---

## Human Verification Required

### 1. RevenueBarChart Visual Appearance

**Test:** Load the dashboard as an admin. Navigate to Home section and to Reports section. Inspect the revenue bar chart in both.
**Expected:** Bars display with accent color fill (color-mixed with transparency), 160px height, mono-font X-axis labels, no Y-axis, no grid lines, no legend. Tooltip shows CLP-formatted value (e.g. "$3k", "$1.2M") with styled background.
**Why human:** Visual rendering — grep confirms the code contract but browser rendering requires visual inspection.

### 2. HomeSection Approve/Reject Row Removal

**Test:** In the dashboard Home section, if there are pending events in the queue, click "✓ Aprobar" on one.
**Expected:** The API is called, a success toast appears, and the row disappears from the queue table. The EN REVISIÓN KPI decrements by 1.
**Why human:** Runtime state mutation after async API call.

### 3. PaymentsSection CSV Download

**Test:** In the Payments section, click "Exportar CSV".
**Expected:** A file named `reporte.csv` (or similar) downloads with quoted fields: ID, Comprador, Productos, Monto, Fecha, Estado — one row per real payment.
**Why human:** Browser Blob/anchor download behavior.

### 4. ReportsSection Period Filter Re-buckets Client-Side

**Test:** In the Reports section, with data loaded, switch between Día / Semana / Mes / Año chips.
**Expected:** The chart updates immediately without a network request. Network tab shows no new API calls on chip switch.
**Why human:** Client-side useMemo update on chip interaction.

### 5. ReportsSection Empty-State Panel

**Test:** Select a period (e.g., "Día") that has no PAID payments.
**Expected:** Chart shows "Sin ventas en este período" empty panel instead of bars.
**Why human:** Depends on runtime data state; empty-array guard verified in code but behavior requires a real empty period.

### 6. GET /payments Auth Guards

**Test:** Hit `GET /api/payments` without a token, then with a non-admin token, then with an ADMIN token.
**Expected:** 401, 403, 200 (with ApiPayment[] body) respectively.
**Why human:** Guard decorators confirmed present; HTTP response correctness requires a running API.

---

## Summary

Phase 27 goal is **code-complete**: all 12 requirements are implemented and wired. tsc is clean across all modified files. No mock data was left in place where real data was mandated — all remaining mocks are intentional per CONTEXT.md (no aggregate endpoints exist for KPIs, top-organizadores, category stats, or monthly revenue totals).

Six items cannot be confirmed programmatically and require human testing: visual chart appearance, runtime approve/reject row removal, CSV download, client-side period bucketing, empty-state display, and API auth guard HTTP responses.

---

_Verified: 2026-05-29T20:00:00Z_
_Verifier: Claude (gsd-verifier)_
