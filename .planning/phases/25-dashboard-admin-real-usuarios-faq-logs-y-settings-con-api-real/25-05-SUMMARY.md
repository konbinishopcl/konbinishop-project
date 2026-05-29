---
phase: 25-dashboard-admin-real-usuarios-faq-logs-y-settings-con-api-real
plan: "05"
subsystem: website/dashboard/settings
tags: [settings, services, crud, api, payments]
dependency_graph:
  requires: ["25-01"]
  provides: ["DASH-ADM-09", "DASH-ADM-10", "DASH-ADM-11"]
  affects: ["SettingsSection"]
tech_stack:
  added: []
  patterns: ["useCallback+useEffect fetch on mount", "re-fetch after mutation", "info-only modal"]
key_files:
  created: []
  modified:
    - apps/website/app/dashboard/sections/SettingsSection.tsx
decisions:
  - "loadServices is a separate useEffect from the settings loader — public GET endpoints need no token; token-gated settings loader kept untouched"
  - "WebPay info modal reuses confirm-bg/confirm-card CSS with single Cerrar button — not ConfirmDialog which has two buttons"
  - "MercadoPago and Flow rows kept visible with disabled buttons per CONTEXT — not removed"
metrics:
  duration: "5 minutes"
  completed: "2026-05-29T14:08:53Z"
  tasks_completed: 2
  files_modified: 1
---

# Phase 25 Plan 05: Settings Section — Real Services CRUD + Payment Buttons Summary

Real service options CRUD for photography/content-creator panels via `api.photoOptions`/`api.creatorOptions` + 6 persist methods; WebPay opens an info-only env-var modal; MercadoPago and Flow are disabled "Próximamente" buttons.

## What Was Built

**Task 1 — Real services CRUD wired to API**

- Removed `DEFAULT_FOTO`/`DEFAULT_CREAT` constants and `ServiceItem` type; replaced with `ApiServiceOption` from `api.ts`
- Added `useCallback loadServices` that calls `api.photoOptions()` + `api.creatorOptions()` in `Promise.all` on mount via a separate `useEffect`
- `handleSaveService` now async: calls `createPhotoOption`/`updatePhotoOption`/`createCreatorOption`/`updateCreatorOption` by modal type, then re-fetches
- `handleDeleteService` now async: calls `deletePhotoOption`/`deleteCreatorOption` by id, then re-fetches
- Panel renders switch from `key={s.name}`/`s.name` to `key={s.id}`/`s.label`
- Delete ConfirmDialog message uses `modal.item.label` (not `.name`)
- `ModalState` union updated: edit/delete variants carry `ApiServiceOption` (not `ServiceItem`)

**Task 2 — Payment integration buttons**

- Added `webpayInfo` boolean state
- WebPay "Configurar" button calls `setWebpayInfo(true)`
- Info-only modal rendered with `confirm-bg`/`confirm-card`: title "Configuración de WebPay Plus", body with exact env-var copy, single "Cerrar" button
- MercadoPago + Flow "Conectar" buttons replaced with `disabled` "Próximamente" buttons (opacity 0.5, not-allowed cursor)
- Existing "Inactivo" `stat-pill exp` rows kept unchanged

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Service options are fetched from real API endpoints on mount.

## Self-Check: PASSED

- `/home/gab/Code/konbini-project/apps/website/app/dashboard/sections/SettingsSection.tsx` — exists and modified
- Commit `9fb9c6b` — verified in git log
- TypeScript: `npx tsc --noEmit` produces no output for SettingsSection.tsx
- All grep acceptance criteria: PASS (see task verification)
