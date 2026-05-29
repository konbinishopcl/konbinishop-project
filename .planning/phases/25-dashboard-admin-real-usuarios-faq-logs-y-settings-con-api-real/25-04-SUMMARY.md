---
phase: 25-dashboard-admin-real-usuarios-faq-logs-y-settings-con-api-real
plan: "04"
subsystem: website/dashboard/admin
tags: [audit-logs, admin-dashboard, filters, real-api]
dependency_graph:
  requires: ["25-01"]
  provides: ["DASH-ADM-07", "DASH-ADM-08"]
  affects: ["apps/website/app/dashboard/sections/LogsSection.tsx"]
tech_stack:
  added: []
  patterns: ["useCallback+useEffect re-fetch on filter change", "useMemo name-lookup map", "client-side userId→name resolution"]
key_files:
  created: []
  modified:
    - apps/website/app/dashboard/sections/LogsSection.tsx
decisions:
  - "Degraded render: ENTITY #id format because GET /admin/audit-logs returns raw scalar rows with no joins"
  - "Admin name resolved client-side from api.adminUsers map; Sistema fallback for null userId, Usuario #id fallback for unknown ids"
  - "actionColor rewritten to match uppercase AuditAction enums (BAN/REJECT/DELETE/APPROVE/UNBAN) — mock used lowercase startsWith logic incompatible with real data"
  - "Todas las acciones button resets both range and adminId; 7-day button toggles; admin dropdown replaces third dead filter button"
metrics:
  duration: "62s"
  completed: "2026-05-29T14:08:23Z"
  tasks_completed: 2
  files_modified: 1
---

# Phase 25 Plan 04: LogsSection Real Audit Log Table Summary

Real audit-log table for LogsSection with GET /admin/audit-logs (pageSize 50), "Últimos 7 días" date-range filter, admin dropdown filter populated from api.adminUsers, and client-side userId→name resolution with Sistema/Usuario #id fallbacks.

## What Was Built

Replaced the hardcoded `LOGS` mock array and three dead filter buttons in `LogsSection.tsx` with:

1. **Real fetch via `api.auditLogs`** — loads 50 most recent audit logs on mount, re-fetches when range or adminId filter changes
2. **Admin dropdown** populated from `api.adminUsers` filtered to ADMIN/SUPER_ADMIN roles
3. **Working filter controls:**
   - "Todas las acciones" button: resets both `range` and `adminId` to defaults
   - "Últimos 7 días" button: re-fetches with `dateFrom`/`dateTo` (ISO YYYY-MM-DD)
   - Admin `<select>` dropdown: re-fetches filtered by `userId`
4. **Degraded column renders** (no joins available from endpoint):
   - ADMIN: resolved from `nameById` useMemo map, fallback to "Sistema" or "Usuario #id"
   - ACCIÓN: uppercase enum value with `actionColor` using `=== "BAN"` etc. matching
   - ENTIDAD: `ENTITY #entityId` format (e.g. "EVENT #142")
   - FECHA: `toLocaleString("es-CL")` formatted date
5. **Loading/empty states:** Cargando… and Sin registros rows with `colSpan={4}`

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Fetch real audit logs + load admins for dropdown | 191bd99 |
| 2 | Render degraded columns + working filter controls | 191bd99 |

Note: Both tasks were implemented in a single Write (complete file rewrite) and committed together in 191bd99. The Task 2 acceptance criteria all pass; tsc produces no errors for LogsSection.tsx.

## Acceptance Criteria Results

All criteria verified passing:
- `! grep -q "const LOGS"` — PASS (mock removed)
- `grep -q "api.auditLogs(query, token)"` — PASS
- `grep -q 'u.role === "ADMIN"'` — PASS
- `grep -q "pageSize: 50"` — PASS
- `grep -q "query.dateFrom"` and `query.dateTo` — PASS
- `grep -q 'action === "BAN"'` — PASS
- `grep -q "<select"` and `"Todos los admins"` — PASS
- `grep -q 'setAdminId("")'` — PASS
- `grep -q "log.entity"` and `"log.entityId"` — PASS
- `grep -q "nameById.get(log.userId)"` — PASS
- `grep -q '"Sistema"'` — PASS
- `npx tsc --noEmit 2>&1 | grep "LogsSection.tsx"` — empty (no errors)

## Deviations from Plan

None — plan executed exactly as written.

One minor enhancement per advisor guidance: added `colSpan={4}` to the "Cargando…" and "Sin registros" rows (plan requested these rows but didn't specify span; 4-column table requires it for correct layout). This is in-scope correct rendering behavior.

## Known Stubs

None. LogsSection now loads real data from `GET /admin/audit-logs` and real admin list from `GET /users`.

## Self-Check: PASSED

- `/home/gab/Code/konbini-project/apps/website/app/dashboard/sections/LogsSection.tsx` — exists with 126 lines
- Commit 191bd99 — verified in git log
