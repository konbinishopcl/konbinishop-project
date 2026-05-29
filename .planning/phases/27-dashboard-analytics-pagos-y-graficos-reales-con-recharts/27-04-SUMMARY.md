---
phase: 27
plan: "04"
subsystem: website-dashboard
tags: [payments, real-data, api, admin, modal, csv]
dependency_graph:
  requires: ["27-01", "27-02"]
  provides: ["real payments table", "real detail modal", "CSV export from real data"]
  affects: ["apps/website/app/dashboard/sections/PaymentsSection.tsx"]
tech_stack:
  added: []
  patterns: ["useCallback/useEffect fetch", "ApiPayment type", "formatCLP es-CL", "loading/empty table states"]
key_files:
  created: []
  modified:
    - apps/website/app/dashboard/sections/PaymentsSection.tsx
decisions:
  - "KPIs (Ingresos mes, Histórico, Pendientes, Reembolsos) remain mock — no aggregate endpoint available"
  - "buildCSV uses quoted fields to handle commas/quotes in buyer names and product titles"
  - "detail.items keyed by item.title (sufficient for real data; no unique id in ApiPayment items)"
  - "Reembolsar and Descargar comprobante remain stubs per plan — real flows deferred"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-29"
  tasks_completed: 2
  files_modified: 1
---

# Phase 27 Plan 04: PaymentsSection Real Data Summary

Real payments table + detail modal + CSV export wired to `api.adminPayments(token)` via `ApiPayment` shape, replacing hardcoded `ROWS` mock and dropping all unbacked fields (card, method, err).

## What Was Built

PaymentsSection.tsx was fully rewritten from mock to real data:

- **Data loading:** `useCallback` fetch keyed on `[token]` → `api.adminPayments(token)` → `setRows(data)`. Loading state shows "Cargando…" row; empty state shows "Sin pagos registrados".
- **Table:** Maps over `ApiPayment[]`. Columns: `TX-{id}`, buyer name, joined item titles, `formatCLP(total)`, `formatDate(createdAt)`, status pill (pub/rej), Detalle button.
- **formatCLP:** `"$" + n.toLocaleString("es-CL")` — whole pesos, es-CL locale separators.
- **formatDate:** `toLocaleDateString("es-CL", { day:"2-digit", month:"short", year:"numeric" })`.
- **buildCSV:** Accepts `ApiPayment[]`; emits quoted fields; columns: ID, Comprador, Productos, Monto, Fecha, Estado.
- **Detail modal:** Rebuilt from real fields — Comprador (name + handle if present), Email, Fecha, Pasarela (gateway ?? "—"). ÍTEMS list maps `item.title` / `formatCLP(item.subtotal)`. Total row shows `formatCLP(detail.total)`. Removed Tarjeta row and `detail.err` block.
- **Stubs:** "Descargar comprobante" → `toast.info`; "Reembolsar" (PAID-only) → `toast.warning`.

## Deviations from Plan

None — plan executed exactly as written.

Tasks 1 and 2 both modify the same file; committed together in a single atomic commit.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| "Reembolsar" button | PaymentsSection.tsx | Real refund confirmation dialog deferred per plan |
| "Descargar comprobante" button | PaymentsSection.tsx | PDF generation deferred per plan |
| KPI values (Ingresos mes, Histórico, Pendientes, Reembolsos) | PaymentsSection.tsx | No aggregate endpoint — intentionally mock per plan |

## Self-Check: PASSED

- [x] `apps/website/app/dashboard/sections/PaymentsSection.tsx` exists and modified
- [x] Commit `2a6e883` exists: `feat(27-04): wire PaymentsSection to real GET /payments data`
- [x] All Task 1 acceptance criteria verified (useUser, adminPayments, ApiPayment, no ROWS, formatCLP, loading, empty, buildCSV(rows))
- [x] All Task 2 acceptance criteria verified (detail.buyer, detail.gateway, no detail.err/card/method, items.map, PAID gate, toast.warning, toast.info)
- [x] tsc --noEmit: no errors referencing PaymentsSection.tsx (pre-existing unrelated error in organizador/page.ts from Phase 23)
