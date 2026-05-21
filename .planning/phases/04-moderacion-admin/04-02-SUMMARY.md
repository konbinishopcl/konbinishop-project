---
phase: 4
plan: "04-02"
subsystem: website-admin-dashboard
tags: [website, nextjs, admin, dashboard]
status: complete
provides: [admin-dashboard-real-data]
affects: [apps/website/app/dashboard/page.tsx]
key_files:
  modified:
    - apps/website/app/dashboard/page.tsx
metrics:
  completed: "2026-05-21"
  files_changed: 1
---

# Phase 4 · Summary 04-02: Dashboard overview con datos de eventos

**One-liner:** El dashboard overview (`/dashboard`) muestra métricas de eventos reales —
KPIs, cola de revisión y desglose por categoría — desde la API; los widgets de pagos quedan
como mock (alcance "Mínimo").

## Qué se construyó

`/dashboard/page.tsx` reescrito como client component:

- Trae `api.adminEvents(token, { pageSize: 100 })` y deriva aprobados, pendientes y conteo
  por categoría.
- **KPIs**: "Eventos publicados" = nº de aprobados; "Pendientes revisión" = nº de pendientes.
  "Ingresos del mes" y "Tickets vendidos" se mantienen mock.
- **Cola de revisión**: lista los eventos pendientes reales (thumbnail, título, organizador,
  categoría) con **Aprobar** / **Rechazar** (motivo vía `prompt`) funcionales; al actuar, el
  evento sale de la cola.
- **Por categoría**: conteo real derivado de `event.categories` + total de eventos.
- Se mantienen sin cambios `RevenueChart`, el feed "Actividad reciente" y "VENUE TOP /
  CONVERSIÓN" (mock, por decisión del usuario).

## Verification

- `pnpm build` del website → compila sin errores.
- La ruta de datos (`GET /events/admin` + `approve`/`reject`) ya fue verificada end-to-end en
  04-01; el dashboard solo deriva conteos de esa misma respuesta.

## Deviations from Plan

Ninguna. El KPI se rotuló "Eventos publicados" (en vez de "Eventos activos") por precisión.

## Phase 4 — Estado

- **04-01** — moderación de eventos en `/dashboard/events` ✅
- **04-02** — dashboard overview con datos de eventos ✅
- `/dashboard/users` (gestión de usuarios) **diferido**: no hay diseño.
- Limpieza de vistas admin obsoletas (`/dashboard/payments`, etc.): pendiente de evaluar —
  el usuario optó por dejar los widgets de pagos como mock por ahora.

## Self-Check: PASSED

- `/dashboard` deriva KPIs / cola / categorías de `GET /events/admin` — CONFIRMED
- Aprobar/rechazar desde la cola reutiliza los endpoints de 04-01 — CONFIRMED
- `pnpm build` limpio — CONFIRMED
