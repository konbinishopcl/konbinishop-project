---
phase: 26-dashboard-inbox-crm-y-suscripciones-con-api-real
plan: "02"
subsystem: dashboard-inbox
tags: [dashboard, inbox, crm, contact, api, real-data, mutations]
dependency_graph:
  requires: [26-01-api-types, api.contactAll, api.contactMarkRead, api.contactRemove]
  provides: [InboxSection-real-api, contact-message-read, contact-message-delete]
  affects: [apps/website/app/dashboard/sections/InboxSection.tsx]
tech_stack:
  added: []
  patterns: [useCallback-load, optimistic-update, confirm-dialog, stat-pill-read-status, kind-guard-placeholder]
key_files:
  created: []
  modified:
    - apps/website/app/dashboard/sections/InboxSection.tsx
decisions:
  - "kind!==contact guard placed at top of JSX return (after hooks) — renders próximamente placeholder for photo/creators kinds"
  - "Optimistic read update: setMsgs immediately on open, API call async — revert on error"
  - "Delete: API call first (not optimistic), then remove from local state on success"
  - "Removed Archivados tab — API has no archive endpoint; only Todos and No leídos"
  - "stat-pill pub class = Leído, rev class = No leído — consistent with existing CSS patterns"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-29"
  tasks_completed: 1
  files_modified: 1
---

# Phase 26 Plan 02: InboxSection Real API — Summary

**One-liner:** InboxSection rewritten from mock DATA array to real API using api.contactAll/contactMarkRead/contactRemove with stat-pill read status, optimistic mark-read on open, confirm-dialog delete, and próximamente placeholder for photo/creators kinds.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace mock InboxSection with real API fetch + mutations | 87221dd | apps/website/app/dashboard/sections/InboxSection.tsx |

## What Was Built

**InboxSection.tsx** completely rewritten:

- **Real data loading:** `useCallback` + `useEffect([load])` pattern fetches from GET /contact on mount using `api.contactAll(token)`
- **Filter tabs:** "Todos" and "No leídos" (removed "Archivados" — no API endpoint)
- **Table columns:** CONTACTO | ASUNTO | FECHA | ESTADO | (actions) — removed PIPELINE column
- **ESTADO column:** stat-pill with `pub` class for read=true ("Leído") and `rev` class for read=false ("No leído")
- **Mark as read on open:** Calls `api.contactMarkRead(id, token)` with optimistic local state update when opening unread message; reverts on error
- **Delete with confirmation:** ConfirmDialog triggers `api.contactRemove(id, token)` and removes row from local state on success
- **Modal:** Shows ASUNTO + message body, mailto link for reply — no pipeline section
- **kind guard:** `kind !== "contact"` renders explicit placeholder with "próximamente" message (photo/creators kinds)
- **Loading state:** Spinner text when `loading && msgs.length === 0`
- **Empty state:** Contextual empty message per filter in table body
- **Date formatting:** `formatShortDate(iso)` converts ISO string to "8 ABR" style
- **Zero mock data:** DATA array, InboxItem type, PipelineStage type, pillClass function all removed

## Acceptance Criteria — All Passed

- [x] `grep -c "const DATA|MOCK_DATA|InboxItem|PipelineStage|MOVER EN PIPELINE" InboxSection.tsx` = 0
- [x] `grep "api.contactAll" InboxSection.tsx` — match found
- [x] `grep "api.contactMarkRead" InboxSection.tsx` — match found
- [x] `grep "api.contactRemove" InboxSection.tsx` — match found
- [x] `grep "MOVER EN PIPELINE" InboxSection.tsx` = 0
- [x] `grep "Archivados" InboxSection.tsx` = 0
- [x] `grep 'kind !== "contact"' InboxSection.tsx` — match found
- [x] `grep "stat-pill.*pub|stat-pill.*rev" InboxSection.tsx` — match found
- [x] `grep "ESTADO" InboxSection.tsx` — match found
- [x] `grep "PIPELINE" InboxSection.tsx` = 0
- [x] `grep -c "useEffect|useCallback" InboxSection.tsx` = 3 (2+ matches)
- [x] `npx tsc --noEmit 2>&1 | grep "InboxSection"` = no output

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — InboxSection is fully wired to the real API. Photo/creators kinds intentionally show a placeholder (by design — no CRM-by-type endpoint yet).

## Self-Check

- [x] apps/website/app/dashboard/sections/InboxSection.tsx exists and modified
- [x] All mock types and data removed (grep count = 0)
- [x] 3 API method calls confirmed (contactAll, contactMarkRead, contactRemove)
- [x] TypeScript compiles cleanly for InboxSection (no errors)
- [x] Commit 87221dd exists

## Self-Check: PASSED
