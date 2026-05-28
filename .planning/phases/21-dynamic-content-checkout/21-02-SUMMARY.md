---
phase: 21-dynamic-content-checkout
plan: "02"
subsystem: website-pricing-surfaces
tags: [dynamic-content, pricing, settings, ssr, client-fetch]
dependency_graph:
  requires: [21-01]
  provides: [dynamic-pricing-page, dynamic-home-copy, dynamic-upgrade-page]
  affects: [precios, home, upgrade, cuenta/suscripcion]
tech_stack:
  added: []
  patterns:
    - "n(key, fallback) helper for safe parseInt on settings strings"
    - "formatCLP using toLocaleString('es-CL') for CLP formatting"
    - "SSR fetch via Promise.all in async server component (precios/page.tsx)"
    - "Client fetch via useEffect + api.settingsPublic() in client components"
key_files:
  created: []
  modified:
    - apps/website/app/(site)/precios/page.tsx
    - apps/website/app/(site)/precios/PricingView.tsx
    - apps/website/app/(site)/HomeView.tsx
    - apps/website/app/(site)/page.tsx
    - apps/website/app/(site)/upgrade/page.tsx
    - apps/website/app/(site)/cuenta/suscripcion/page.tsx
decisions:
  - "precios/page.tsx converted to async SSR — PricingView is already 'use client' so it receives props from the server page"
  - "Home stats (organizers) wired from statsPublic — full wiring was straightforward, no fallback-only choice needed"
  - "eventMinPrice derived from Math.min of categories[].pricePerDay in both precios/page.tsx and home page.tsx"
  - "upgrade/page.tsx is client component — uses useEffect + api.settingsPublic() pattern"
  - "BENEFITS array moved inside UpgradePage component to access dynamic credits/discount values"
  - "45 days kept as editorial literal in all pages (no SUBSCRIPTION_CREDIT_DAYS setting exists)"
metrics:
  duration_minutes: 18
  completed_date: "2026-05-28"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 6
requirements_satisfied: [DYN-01, DYN-03]
---

# Phase 21 Plan 02: Dynamic Pricing Surfaces Summary

SSR and client-fetch pricing surfaces replacing hardcoded values with live /settings/public data, driving event min price from eventCategories and organizer count from /stats/public.

## Tasks Completed

| # | Task | Commit | Pattern |
|---|------|--------|---------|
| 1 | SSR pricing page + dynamic PricingView | 04dcce7 | SSR server component → props |
| 2 | Dynamic HomeView placement/pricing copy | c6f83a4 | SSR + statsPublic wired |
| 3 | Dynamic upgrade + subscription pages | 4ed0dcc | Client useEffect fetch |

## SSR vs Client Pattern

| File | Pattern | Reason |
|------|---------|--------|
| precios/page.tsx | SSR (async server component) | Was synchronous, converted to async |
| PricingView.tsx | Receives props from page | Already "use client"; props from SSR parent |
| HomeView.tsx | Receives props from page | Already "use client"; props from SSR parent |
| app/(site)/page.tsx | SSR (async server component) | Was already async, added settingsPublic + statsPublic to Promise.all |
| upgrade/page.tsx | Client useEffect + api.settingsPublic() | Was "use client" with no server alternative |
| cuenta/suscripcion/page.tsx | Client useEffect + api.settingsPublic() | Was "use client" with useUser hook |

## Helper Location

Both `n(key, fallback)` and `formatCLP()` are defined locally in each file that needs them (PricingView.tsx, HomeView.tsx, upgrade/page.tsx). No shared utility was created — consistent with the existing pattern in the codebase (CartView.tsx, EventView.tsx each define their own `formatCLP`).

## Home Stats Wiring

Stats (organizer count) were fully wired from `api.statsPublic()` in home page.tsx — the addition was straightforward (one extra entry in the existing Promise.all). Both `settings` and `stats` are passed as props to HomeView with graceful fallbacks (500 for organizers).

## Dynamic Values Replaced

| View | Was | Now |
|------|-----|-----|
| PricingView card 1 | $4.990 hardcoded | eventMinPrice from min(categories[].pricePerDay) |
| PricingView card 1 | "10 a 60 días" | "10 a {EVENT_MAX_DAYS} días" |
| PricingView card 2 | $29.990 | SUBSCRIPTION_PRICE (fallback 9990) |
| PricingView card 2 | "10 créditos" | SUBSCRIPTION_CREDITS (fallback 10) |
| PricingView card 2 | "20% off" | SUBSCRIPTION_SPOT_DISCOUNT% (fallback 20) |
| PricingView card 3 | "desde $8.000" | SPOT_PRICE_PER_DAY (fallback 8000) |
| PricingView card 3 | "12 cupos globales" | SPOT_MAX_ACTIVE (fallback 12) |
| PricingView card 3 | "5 cupos en home" | HERO_MAX_ACTIVE (fallback 5) |
| PricingView card 3 | "Mínimo 10, máximo 30" | SPOT_MIN_DAYS/SPOT_MAX_DAYS (fallback 10/30) |
| HomeView SpotCard | "12 cupos · placement..." | SPOT_MAX_ACTIVE (fallback 12) |
| HomeView LastJoined | "+500 organizadores" | stats.organizers (fallback 500) |
| HomeView LastJoined | "desde $4.990 / día" | eventMinPrice from categories |
| HomeView LastJoined | "10 eventos al mes" | SUBSCRIPTION_CREDITS (fallback 10) |
| upgrade/page.tsx | "10 créditos al mes" | SUBSCRIPTION_CREDITS (fallback 10) |
| upgrade/page.tsx | "20% descuento" | SUBSCRIPTION_SPOT_DISCOUNT% (fallback 20) |
| upgrade/page.tsx | "Suscribirme por $29.990/mes" | SUBSCRIPTION_PRICE (fallback 9990) |
| suscripcion/page.tsx | "10 créditos" in lead | SUBSCRIPTION_CREDITS (fallback 10) |
| suscripcion/page.tsx | "20% off" in benefits | SUBSCRIPTION_SPOT_DISCOUNT% (fallback 20) |

## Known Stubs

None — all dynamic values are wired to live settings with sensible fallbacks. No placeholder text remains.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- precios/page.tsx exists with async export default: FOUND
- precios/PricingView.tsx exists with settings prop: FOUND
- HomeView.tsx updated with settings/stats props: FOUND
- app/(site)/page.tsx fetches settingsPublic + statsPublic: FOUND
- upgrade/page.tsx has useEffect + api.settingsPublic(): FOUND
- cuenta/suscripcion/page.tsx imports api and fetches settingsPublic: FOUND
- Commits 04dcce7, c6f83a4, 4ed0dcc exist: FOUND
- TypeScript check clean (0 errors): PASSED
- No hardcoded prices in touched views: PASSED
