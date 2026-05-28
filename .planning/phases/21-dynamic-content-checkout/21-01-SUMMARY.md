---
phase: 21-dynamic-content-checkout
plan: "01"
subsystem: api-foundation
tags: [settings, stats, api-client, env-vars, orders, payments]
dependency_graph:
  requires: []
  provides: [settings-public-extended, stats-public, api-client-orders-payments, social-env-vars]
  affects: [21-02, 21-03, 21-04, 21-05, 21-06]
tech_stack:
  added: []
  patterns:
    - "PUBLIC_PREFIXES filter in SettingsService (extended)"
    - "Public route declared before admin route (no UseGuards pattern)"
    - "UserType enum from @prisma/client for type-safe queries"
    - "NEXT_PUBLIC_* env vars with fallbacks in lib/site.ts"
key_files:
  created: []
  modified:
    - apps/api/src/settings/settings.service.ts
    - apps/api/src/stats/stats.service.ts
    - apps/api/src/stats/stats.controller.ts
    - apps/website/lib/api.ts
    - apps/website/lib/site.ts
    - apps/website/.env
    - apps/website/.env.example
decisions:
  - "PUBLIC_PREFIXES=['SPOT_','HERO_','EVENT_','SUBSCRIPTION_'] — ARTICLE_PRICE stays private"
  - "getPublicStats() uses UserType.ORGANIZATION enum (not string literal) for type safety"
  - "GET /stats/public declared before GET /stats to prevent route shadowing"
  - "lib/site.ts exports use process.env.NEXT_PUBLIC_* with hardcoded fallbacks so render never breaks"
metrics:
  duration_seconds: 176
  completed_date: "2026-05-28"
  tasks_completed: 4
  files_modified: 7
---

# Phase 21 Plan 01: Data Foundation for Dynamic Content & Checkout Summary

**One-liner:** Extended public settings (EVENT_/SUBSCRIPTION_ prefixes), new `/stats/public` endpoint, complete orders/payments/settings/stats API client surface, and social/contact constants via NEXT_PUBLIC env vars.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Extend public settings prefixes | 13b4e99 | apps/api/src/settings/settings.service.ts |
| 2 | Add public stats endpoint | 73d84c7 | apps/api/src/stats/stats.service.ts, apps/api/src/stats/stats.controller.ts |
| 3 | Add orders/payments/settings/stats methods to lib/api.ts | 372eaa4 | apps/website/lib/api.ts |
| 4 | Add NEXT_PUBLIC social/contact env vars and surface via lib/site.ts | 21e99ff | apps/website/lib/site.ts, apps/website/.env.example |

## Implementation Details

### Task 1: Extended PUBLIC_PREFIXES

`settings.service.ts` — `PUBLIC_PREFIXES` changed from:
```ts
const PUBLIC_PREFIXES = ['SPOT_', 'HERO_'] as const;
```
to:
```ts
const PUBLIC_PREFIXES = ['SPOT_', 'HERO_', 'EVENT_', 'SUBSCRIPTION_'] as const;
```

`GET /settings/public` now returns 13 keys (verified live):
- `EVENT_MAX_DAYS: "60"`
- `SUBSCRIPTION_PRICE: "9990"`, `SUBSCRIPTION_CREDITS: "10"`, `SUBSCRIPTION_SPOT_DISCOUNT: "20"`, `SUBSCRIPTION_HERO_DISCOUNT: "20"`
- All existing SPOT_* and HERO_* keys unchanged
- `ARTICLE_PRICE` confirmed absent from response

### Task 2: Public Stats Endpoint

`stats.service.ts` — New method `getPublicStats()`:
```ts
async getPublicStats(): Promise<{ approvedEvents: number; organizers: number }> {
  const [approvedEvents, organizers] = await this.prisma.$transaction([
    this.prisma.event.count({ where: { status: PublicationStatus.APPROVED } }),
    this.prisma.user.count({ where: { type: UserType.ORGANIZATION } }),
  ]);
  return { approvedEvents, organizers };
}
```

`stats.controller.ts` — New route declared ABOVE the admin `@Get()`:
```ts
@Get('public')
@ApiOperation({ summary: 'KPIs públicos (sin auth)' })
getPublic() { return this.stats.getPublicStats(); }
```

Verified: `GET /api/stats/public` returns `{"approvedEvents":11,"organizers":0}`. Admin `GET /api/stats` still returns 401.

### Task 3: api.ts Type Exports and Methods

Types added above `EventsQuery` (around line 264 in modified file):
- `OrderItemKind = "EVENT" | "SPOT" | "HERO" | "ARTICLE" | "SUBSCRIPTION"`
- `ApiOrderItem` — full order item shape with optional nested event/spot/hero/article
- `ApiOrder` — order with status, total, gateway, externalId, items array
- `AddOrderItemInput` — payload for adding/updating cart items

Methods added to `api` object after heroes section:
- `settingsPublic()` — no token, returns `Record<string, string>`
- `statsPublic()` — no token, returns `{ approvedEvents, organizers }`
- `ordersDraft(token)` — GET /orders/draft
- `getOrder(id, token)` — GET /orders/:id
- `addOrderItem(orderId, body, token)` — PUT /orders/:orderId/items
- `removeOrderItem(orderId, type, token)` — DELETE /orders/:orderId/items/:type
- `checkout(orderId, gateway, token)` — POST /payments/:orderId/checkout

TypeScript compiles clean with no errors in lib/api.ts.

### Task 4: Social/Contact Env Vars

9 `NEXT_PUBLIC_*` keys added to `.env` (gitignored) and documented in `.env.example`:
- `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_TIKTOK_URL`, `NEXT_PUBLIC_DISCORD_URL`, `NEXT_PUBLIC_FACEBOOK_URL`
- `NEXT_PUBLIC_INSTAGRAM_FOLLOWERS`, `NEXT_PUBLIC_INSTAGRAM_HANDLE`
- `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_ABUSE_EMAIL`, `NEXT_PUBLIC_PRIVACY_EMAIL`

`lib/site.ts` exports: `INSTAGRAM_URL`, `TIKTOK_URL`, `DISCORD_URL`, `FACEBOOK_URL`, `INSTAGRAM_FOLLOWERS`, `INSTAGRAM_HANDLE`, `CONTACT_EMAIL`, `ABUSE_EMAIL`, `PRIVACY_EMAIL` — all with hardcoded fallbacks so missing env vars never break render.

## Deviations from Plan

None — plan executed exactly as written. Updated inline comments in `settings.service.ts` to reflect the new PUBLIC_PREFIXES value (pre-existing stale comment updated proactively).

## Known Stubs

None — this plan is pure data foundation (API endpoints + types + env vars). No UI components with placeholder data.

## Self-Check: PASSED

Files exist:
- apps/api/src/settings/settings.service.ts — FOUND
- apps/api/src/stats/stats.service.ts — FOUND
- apps/api/src/stats/stats.controller.ts — FOUND
- apps/website/lib/api.ts — FOUND
- apps/website/lib/site.ts — FOUND
- apps/website/.env.example — FOUND

Commits exist:
- 13b4e99 — feat(21-01): extend PUBLIC_PREFIXES to include EVENT_ and SUBSCRIPTION_
- 73d84c7 — feat(21-01): add public GET /stats/public endpoint without auth
- 372eaa4 — feat(21-01): add orders/payments/settings/stats methods and types to lib/api.ts
- 21e99ff — feat(21-01): add NEXT_PUBLIC social/contact env vars and site.ts exports
