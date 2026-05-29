---
phase: 25-dashboard-admin-real-usuarios-faq-logs-y-settings-con-api-real
plan: "02"
subsystem: website/dashboard
tags: [admin, users, ban, modal, api]
dependency_graph:
  requires: ["25-01"]
  provides: ["real user list", "ban/unban persistence", "user detail modal"]
  affects: ["apps/website/app/dashboard/sections/UsersSection.tsx"]
tech_stack:
  added: []
  patterns: ["useCallback+useEffect fetch pattern", "optimistic row update", "inline detail modal"]
key_files:
  created: []
  modified:
    - apps/website/app/dashboard/sections/UsersSection.tsx
decisions:
  - "Detail modal populated entirely from loaded row — no extra fetch"
  - "busyId disables ban button while PATCH in flight"
  - "Loading guard uses colSpan=6 single row to preserve table structure"
metrics:
  duration: "~10 min"
  completed: "2026-05-29"
  tasks_completed: 2
  files_modified: 1
---

# Phase 25 Plan 02: UsersSection Real API Summary

UsersSection backed by real API: fetch from GET /users, ban/unban via PATCH /users/:id/ban with optimistic update, and detail modal populated from loaded row.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Fetch real users + wire ban/unban | d8c3504 | UsersSection.tsx |
| 2 | Add "Ver" user detail modal | d8c3504 | UsersSection.tsx |

## What Was Built

- Removed `USERS` mock array and `UserRow` type; replaced with `ApiAdminUser[]` state
- `fetchUsers` callback pattern (useCallback + useEffect) matching EventsSection pattern
- `applyBan` persists via `api.banUser`, optimistically replaces row in state, shows toast
- `busyId` state disables the ban button while the PATCH is in flight
- Loading guard: single `<td colSpan={6}>Cargando…</td>` row preserves table structure
- `UserDetailModal` inline component: 7 fields (nombre, email, tipo, rol, handle, registrado, estado) from loaded row only — no extra fetch
- Client-side filters operate on `u.type` and `u.blocked` (not mock string fields)
- `key` on rows uses `u.id` (not array index)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data wired to real API.

## Self-Check: PASSED

- UsersSection.tsx: FOUND
- Commit d8c3504: FOUND
