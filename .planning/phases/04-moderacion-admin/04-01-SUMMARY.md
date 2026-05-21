---
phase: 4
plan: "04-01"
subsystem: website-admin-events
tags: [website, nextjs, admin, moderation]
status: complete
provides: [admin-event-moderation]
affects: [apps/website/app/dashboard/events/page.tsx, apps/website/lib/api.ts]
key_files:
  modified:
    - apps/website/lib/api.ts
    - apps/website/app/dashboard/events/page.tsx
metrics:
  completed: "2026-05-21"
  files_changed: 2
---

# Phase 4 · Summary 04-01: Moderación de eventos en el panel admin

**One-liner:** `/dashboard/events` lista los eventos reales y permite aprobar / rechazar
contra la API.

## Qué se construyó

- **`lib/api.ts`** — `api.adminEvents(token)` (`GET /events/admin`),
  `api.approveEvent(id, token)`, `api.rejectEvent(id, reason, token)`; el tipo `ApiEvent`
  ganó `owner`.
- **`/dashboard/events/page.tsx`** reescrito: trae `GET /events/admin`, tabla de eventos
  reales (evento, organizador, fecha/lugar, precio, estado) con búsqueda y filtro por estado.
  Acciones por fila: **Aprobar** y **Rechazar** (motivo vía `prompt`, mín. 3 caracteres) para
  los no-aprobados; "Ver" para los publicados. Tras la acción se actualiza el estado en
  memoria. Se quitaron las columnas de ventas, "destacado", export CSV y acciones masivas.

## Verification

- `pnpm build` del website → compila sin errores.
- Smoke test runtime (API en :3399, token de `admin`):
  - `GET /events/admin` → `total: 12`, los eventos traen `owner`.
  - `PATCH /events/:id/approve` y `/reject` → `200`.

## Deviations from Plan

Ninguna. (El smoke test dejó un evento del seed en estado "rechazado"; `pnpm prisma:seed`
restaura el estado original — no hay endpoint para volver a "pendiente".)

## Known Stubs / Follow-ups

- **04-02:** `/dashboard/users` — gestión de usuarios funcional (SUPER_ADMIN).
- **04-03:** limpiar vistas admin obsoletas (`/dashboard/payments` y la home del panel con
  "RevenueChart" — no hay ingresos en el modelo events-only).
- El panel admin sigue usando `admin-data.ts` mock en las demás vistas.

## Self-Check: PASSED

- `api.adminEvents` / `approveEvent` / `rejectEvent` en `lib/api.ts` — FOUND
- `/dashboard/events` lista real + aprobar/rechazar — CONFIRMED
- `pnpm build` limpio + smoke test (`GET /events/admin`, approve/reject 200) — CONFIRMED
