---
phase: 3
plan: "03-03"
subsystem: website-organizer-panel
tags: [website, nextjs, organizer, account]
status: complete
provides: [organizer-panel]
affects: [apps/website/app/(site)/cuenta/page.tsx, apps/website/lib/api.ts]
key_files:
  modified:
    - apps/website/app/(site)/cuenta/page.tsx
    - apps/website/lib/api.ts
metrics:
  completed: "2026-05-21"
  files_changed: 2
---

# Phase 3 · Summary 03-03: Panel del organizador (/cuenta)

**One-liner:** `/cuenta` lista los eventos del organizador con su estado de moderación,
consumiendo `GET /events/mine` — cierre de Phase 3.

## Qué se construyó

- **`/cuenta/page.tsx`** reescrito:
  - **Auth gate**: sin sesión redirige a `/login`.
  - Trae `api.myEvents(token)`; el estado de cada evento se deriva: `isRejected` → Rechazado,
    `isApproved` → Publicado, si no → En revisión.
  - Tabs Todos / En revisión / Publicados / Rechazados con conteos (se quitó "Archivados").
  - Cards con imagen real, badge de estado, título, fecha, lugar y precio; el motivo de
    rechazo se muestra en los eventos rechazados; "Ver publicación" enlaza a `/evento/<slug>`
    solo para los aprobados. Estados de carga y vacío.
  - Sidebar con los datos reales del usuario + "Crear evento" y "Cerrar sesión" (`logout`).
- **`lib/api.ts`** — el tipo `ApiEvent` ganó `rejectedReason`.

## Verification

- `pnpm build` del website → compila sin errores.
- Smoke test runtime (API en :3399): `GET /events/mine` sin token → `401`; con token de
  organizador → sus 12 eventos (11 `isApproved` + 1 en revisión), estados correctos.

## Deviations from Plan

Ninguna. Se agregó `rejectedReason` al tipo `ApiEvent` (faltaba) para mostrar el motivo.

## Phase 3 — Cierre

Con 03-03 termina **Phase 3 — Publicación de eventos**:

- **Crear** (03-01) — formulario `/crear` conectado a `POST /events`, con sesión y catálogos.
- **Imágenes** (03-02) — subida de banner/poster/galería vía `POST /api/upload`.
- **Panel** (03-03) — `/cuenta` lista los eventos del organizador con su estado.

El bucle de oferta está completo: el organizador se registra, crea un evento (con imágenes),
queda pendiente de moderación y lo ve en su panel. Siguiente: **Phase 4 — Moderación y panel
admin** (aprobar/rechazar eventos, gestión de usuarios).

## Self-Check: PASSED

- `/cuenta` consume `GET /events/mine` con auth gate — CONFIRMED
- Estado derivado de `isApproved`/`isRejected`; motivo de rechazo visible — CONFIRMED
- `pnpm build` limpio + smoke test (`401` / 12 eventos) — CONFIRMED
