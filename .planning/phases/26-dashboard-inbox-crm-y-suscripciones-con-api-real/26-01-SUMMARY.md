---
phase: 26-dashboard-inbox-crm-y-suscripciones-con-api-real
plan: "01"
subsystem: api-client
tags: [api, typescript, inbox, crm, subscriptions, types, foundation]
dependency_graph:
  requires: []
  provides: [ApiContactMessage, ApiCrmEntry, ApiCrmNote, ApiSubscription, CrmStage, CrmType, ApiSubscriptionList, ApiCrmList, api.contactAll, api.contactMarkRead, api.contactRemove, api.crmAll, api.crmGet, api.crmNotes, api.crmAddNote, api.crmSetStage, api.subscriptions]
  affects: [apps/website/lib/api.ts, 26-02-inbox, 26-03-crm, 26-04-subs]
tech_stack:
  added: []
  patterns: [flat-api-methods, request-helper, prisma-schema-verified-types]
key_files:
  created: []
  modified:
    - apps/website/lib/api.ts
decisions:
  - "ApiSubscriptionList uses `limit` field (not `pageSize`) — verified against subscriptions.service.ts which returns { items, total, page, limit, totalPages }"
  - "ApiCrmList uses `pageSize` field — verified against crm.service.ts which returns { items, total, page, pageSize, totalPages }"
  - "ApiSubscription.user has only { id, email, type, handle } — no firstname/lastname, confirmed from subscriptions service select clause"
  - "SubscriptionStatus CANCELLED uses double-L — verified directly in Prisma schema enum at line 675"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-29"
  tasks_completed: 2
  files_modified: 1
---

# Phase 26 Plan 01: API Types and Methods Foundation — Summary

**One-liner:** 8 exported TypeScript types + 9 flat api.* methods for Inbox/CRM/Subscriptions, verified against Prisma schema and NestJS service response shapes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add Phase 26 response types to api.ts | 36cdf89 | apps/website/lib/api.ts |
| 2 | Add Phase 26 API methods to the api object | 151ba51 | apps/website/lib/api.ts |

## What Was Built

**8 new exported types** appended after `ApiServiceOption` in the type section:
- `ApiContactMessage` — ContactMessage fields matching Prisma model (id, name, email, subject, message, read, createdAt)
- `CrmStage` — union type `'NEW' | 'CONTACTED' | 'NEGOTIATING' | 'WON' | 'LOST'`
- `CrmType` — union type `'CONTACT' | 'PHOTOGRAPHY' | 'CONTENT'`
- `ApiCrmEntry` — CrmEntry fields with `type: CrmType`, `stage: CrmStage`, contactName, contactEmail, stageReason, assignedTo
- `ApiCrmNote` — CrmNote fields (id, content, authorId, crmEntryId, createdAt)
- `ApiSubscription` — Subscription with `status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED'`, cycle fields, user/org sub-shapes
- `ApiSubscriptionList` — paginated response with `limit` (not `pageSize`, matching service)
- `ApiCrmList` — paginated response with `pageSize` (matching CRM service)

**9 new flat methods** appended to the `api` object after `deleteCreatorOption`:
- `contactAll(token)` — GET /contact → ApiContactMessage[]
- `contactMarkRead(id, token)` — PATCH /contact/:id/read with { read: true }
- `contactRemove(id, token)` — DELETE /contact/:id
- `crmAll(token)` — GET /crm?limit=50 → ApiCrmList
- `crmGet(id, token)` — GET /crm/:id → ApiCrmEntry
- `crmNotes(id, token)` — GET /crm/:id/notes → ApiCrmNote[]
- `crmAddNote(id, content, token)` — POST /crm/:id/notes
- `crmSetStage(id, stage, token, stageReason?)` — PATCH /crm/:id/stage with conditional stageReason
- `subscriptions(token)` — GET /subscriptions?limit=50 → ApiSubscriptionList

## Deviations from Plan

None — plan executed exactly as written. Schema verification confirmed all field names were accurate.

**Pre-verification finding (non-blocking):** The `.next/types` cache contains 2 stale TS errors for a deleted page (`/cuenta/organizador`) from Phase 23. These are pre-existing, not caused by this plan, and not in `lib/api.ts`. No action taken per scope boundary rules.

## Known Stubs

None — this is a types/methods foundation plan. No UI rendering involved.

## Self-Check

- [x] apps/website/lib/api.ts exists and modified
- [x] 8 type exports confirmed by grep count
- [x] 9 method names confirmed by grep count
- [x] `CANCELLED` (double-L) in ApiSubscription.status
- [x] ApiSubscriptionList uses `limit` field (service-verified)
- [x] ApiCrmList uses `pageSize` field (service-verified)
- [x] `npx tsc --noEmit` returns 0 errors in lib/api.ts
- [x] Commits 36cdf89 and 151ba51 exist

## Self-Check: PASSED
