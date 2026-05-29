---
phase: 25-dashboard-admin-real-usuarios-faq-logs-y-settings-con-api-real
plan: "03"
subsystem: website/dashboard
tags: [faq, crud, api, admin]
dependency_graph:
  requires: ["25-01"]
  provides: ["DASH-ADM-05", "DASH-ADM-06"]
  affects: ["apps/website/app/dashboard/sections/FAQSection.tsx"]
tech_stack:
  added: []
  patterns: ["useCallback/useEffect fetch on mount", "re-fetch after mutation", "q/a→question/answer field mapping"]
key_files:
  created: []
  modified:
    - apps/website/app/dashboard/sections/FAQSection.tsx
decisions:
  - "Handlers do not call setModal(null) — inline AdminFormModal and ConfirmDialog close themselves synchronously after invoking onSave/onConfirm"
  - "api.faqAll() is public (no token needed for fetch); POST/PATCH/DELETE require admin token from useUser()"
  - "Form field keys q/a kept as-is; mapped to question/answer only at API call boundary"
metrics:
  duration: "8 minutes"
  completed: "2026-05-29T14:07:39Z"
  tasks_completed: 2
  files_modified: 1
---

# Phase 25 Plan 03: FAQ CRUD with Real API Summary

FAQSection wired to GET/POST/PATCH/DELETE /faq — real persisted FAQ replacing hardcoded mock array.

## What Was Built

- Removed hardcoded `FAQS: [string, string][]` array (4 items)
- `useCallback`/`useEffect` fetch pattern loads `ApiFaqItem[]` from `api.faqAll()` on mount
- `ModalState` union now carries full `ApiFaqItem` (with `id`) for edit/delete operations
- `handleCreate`: maps form fields `q`/`a` to `question`/`answer`, calls `api.faqCreate`, re-fetches
- `handleEdit`: calls `api.faqUpdate(id, ...)` with item id from modal state, re-fetches
- `handleDelete`: calls `api.faqRemove(id, ...)` with item id from modal state, re-fetches
- Loading placeholder shown while fetching; error toasts on API failure
- List rows keyed by `f.id` (not index); rendered from `faqs` state (ApiFaqItem[])

## Commits

| Task | Description | Commit |
|------|-------------|--------|
| Task 1 + 2 | Real FAQ CRUD (fetch + handlers) | b307868 |

## Deviations from Plan

None — plan executed exactly as written. Both tasks (fetch/list and handlers) were implemented together in a single file rewrite since they touched the same file with no intermediate verification requirement.

## Known Stubs

None — all FAQ operations are wired to real API endpoints.

## Self-Check: PASSED

- File exists: apps/website/app/dashboard/sections/FAQSection.tsx — FOUND
- Commit b307868 — FOUND
- tsc --noEmit: no errors in FAQSection.tsx
- All grep acceptance criteria: PASSED
