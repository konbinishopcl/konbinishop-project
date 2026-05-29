---
phase: 25-dashboard-admin-real-usuarios-faq-logs-y-settings-con-api-real
plan: "01"
subsystem: api-client
tags: [api, types, admin, faq, audit, services]
dependency_graph:
  requires: []
  provides: [ApiAdminUser, ApiFaqItem, ApiAuditLog, ApiAuditLogList, AuditQuery, ApiServiceOption, adminUsers, banUser, faqAll, faqCreate, faqUpdate, faqRemove, auditLogs, photoOptions, creatorOptions, createPhotoOption, updatePhotoOption, deletePhotoOption, createCreatorOption, updateCreatorOption, deleteCreatorOption]
  affects: [apps/website/lib/api.ts]
tech_stack:
  added: []
  patterns: [flat api.* convention, request<T>() helper delegation]
key_files:
  created: []
  modified: [apps/website/lib/api.ts]
decisions:
  - "6 new exported types placed after ApiUser block, before export const api"
  - "15 flat methods placed after banHero, before Settings/Stats section"
  - "AuditQuery cast to Record<string, string | number | undefined> to satisfy qs() signature"
  - "Role reused from existing import (not redefined)"
metrics:
  duration: "~5 minutes"
  completed: "2026-05-29"
  tasks_completed: 2
  files_modified: 1
---

# Phase 25 Plan 01: Admin API Client Layer Summary

Typed API client methods and response types added to `apps/website/lib/api.ts` as the Wave 1 foundation for Phase 25 dashboard sections. All four Wave 2 plans (02-05) can now run fully parallel without serializing on api.ts edits.

## What Was Built

6 exported TypeScript types + 15 flat API methods added to the existing `api` object in `apps/website/lib/api.ts`:

**Types:**
- `ApiAdminUser` — full user shape including isVerified, createdAt, updatedAt
- `ApiFaqItem` — FAQ entry with question, answer, order, timestamps
- `AuditAction` — union of 7 audit actions (CREATE/UPDATE/DELETE/APPROVE/REJECT/BAN/UNBAN)
- `AuditEntity` — union of 4 entities (EVENT/USER/AVISO/PORTADA)
- `ApiAuditLog` — raw audit log row (no joins)
- `ApiAuditLogList` — paginated audit log response
- `AuditQuery` — filter params for audit log queries
- `ApiServiceOption` — photography/content-creator option (id, label, order)

**Methods:**
- `adminUsers(token)` — GET /users → ApiAdminUser[]
- `banUser(id, blocked, token)` — PATCH /users/:id/ban → ApiAdminUser
- `faqAll()` — GET /faq → ApiFaqItem[]
- `faqCreate(body, token)` — POST /faq → ApiFaqItem
- `faqUpdate(id, body, token)` — PATCH /faq/:id → ApiFaqItem
- `faqRemove(id, token)` — DELETE /faq/:id
- `auditLogs(query, token)` — GET /admin/audit-logs with filters → ApiAuditLogList
- `photoOptions()` — GET /services/photography/options → ApiServiceOption[]
- `creatorOptions()` — GET /services/content-creators/options → ApiServiceOption[]
- `createPhotoOption(body, token)` — POST /services/photography/options
- `updatePhotoOption(id, body, token)` — PATCH /services/photography/options/:id
- `deletePhotoOption(id, token)` — DELETE /services/photography/options/:id
- `createCreatorOption(body, token)` — POST /services/content-creators/options
- `updateCreatorOption(id, body, token)` — PATCH /services/content-creators/options/:id
- `deleteCreatorOption(id, token)` — DELETE /services/content-creators/options/:id

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | f6ef632 | feat(25-01): add admin response types to api.ts |
| Task 2 | 7ade348 | feat(25-01): add admin/faq/audit/services methods to api object |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan adds no UI or data rendering, only typed API client methods.

## Self-Check: PASSED

- `apps/website/lib/api.ts` exists and modified: FOUND
- Commit f6ef632 exists: FOUND
- Commit 7ade348 exists: FOUND
- `grep -c "export type ApiAdminUser\|..."` returns 6: PASSED
- `grep -c "adminUsers:\|banUser:\|..."` returns 15: PASSED
- `npx tsc --noEmit 2>&1 | grep "lib/api.ts"` returns nothing: PASSED
