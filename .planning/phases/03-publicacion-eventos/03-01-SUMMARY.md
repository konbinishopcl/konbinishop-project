---
phase: 3
plan: "03-01"
subsystem: website-create-event
tags: [website, nextjs, form, events, auth]
status: complete
provides: [create-event-form]
affects: [apps/website/app/(site)/crear/page.tsx, apps/website/lib/api.ts]
key_files:
  modified:
    - apps/website/lib/api.ts
    - apps/website/app/(site)/crear/page.tsx
metrics:
  completed: "2026-05-21"
  files_changed: 2
---

# Phase 3 · Summary 03-01: Formulario /crear conectado a la API

**One-liner:** El formulario `/crear` crea eventos reales vía `POST /events` — con sesión
requerida y catálogos reales; el evento queda pendiente de moderación.

## Qué se construyó

- **`lib/api.ts`** — tipo `CreateEventInput` + `api.createEvent(body, token)` (`POST /events`)
  y `api.myEvents(token)` (`GET /events/mine`, para el plan 03-03).
- **`/crear/page.tsx`** reescrito:
  - **Auth gate**: sin sesión redirige a `/login`; muestra "Verificando acceso…" mientras
    `useUser()` resuelve.
  - **Catálogos reales**: el select de categoría usa `api.categories()`; región y comuna
    usan `api.regions()` / `api.communes(region)` (la comuna se carga al elegir región).
  - **Campos alineados al modelo**: dirección + número separados; se quitó "venue". Fechas
    con `input type="date"` y horas con `type="time"`.
  - **Submit**: arma el `CreateEventInput` y llama `api.createEvent` con el token; pantalla
    de éxito al terminar ("evento enviado a revisión"); errores inline.
  - Se quitó el texto de "el pago se procesa por nuestra pasarela"; el copy aclara que la
    compra de entradas ocurre fuera de Konbini (events-only).

## Verification

- `pnpm build` del website → compila sin errores.
- Smoke test runtime: `POST /events` con un payload con la forma que arma el formulario
  (título, descripción, categoría, dirección+número, precios, fechas) crea el evento con
  `isApproved=false`, slug generado; el evento NO aparece en el listado público.

## Deviations from Plan

Ninguna. La subida de imágenes queda explícitamente diferida al plan 03-02 (Step 3 muestra
"disponible pronto").

## Known Stubs / Follow-ups

- **03-02:** subida de imágenes (banner/poster/galería) en el formulario vía `POST /api/upload`.
- **03-03:** panel `/cuenta` — lista de eventos del organizador con su estado.
- El botón "Guardar borrador" se eliminó (no hay backend de borradores).

## Self-Check: PASSED

- `api.createEvent` + `CreateEventInput` en `lib/api.ts` — FOUND
- `/crear` con auth gate, catálogos reales y submit a la API — CONFIRMED
- `pnpm build` limpio + smoke test de creación (`isApproved=false`) — CONFIRMED
