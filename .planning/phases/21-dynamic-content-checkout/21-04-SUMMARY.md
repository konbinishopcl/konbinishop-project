---
phase: 21-dynamic-content-checkout
plan: "04"
subsystem: website-frontend
tags: [env-config, social-links, contact, about-stats, ssr]
dependency_graph:
  requires: [21-01]
  provides: [DYN-02, DYN-05, DYN-06]
  affects: [Footer, contacto/page, nosotros/page]
tech_stack:
  added: []
  patterns: [env-backed-constants, async-server-component, graceful-fallback]
key_files:
  created: []
  modified:
    - apps/website/components/Footer.tsx
    - apps/website/app/(site)/contacto/page.tsx
    - apps/website/app/(site)/nosotros/page.tsx
decisions:
  - "Prose '244.000 seguidores' in nosotros/Historia card kept as editorial copy — INSTAGRAM_FOLLOWERS defaults to '244K' (abbreviated) which does not match the fully written-out prose format. Hardcoded prose number is intentionally different from the stats-cell abbreviation."
metrics:
  duration: ~10min
  completed: 2026-05-28
  tasks_completed: 3
  files_modified: 3
---

# Phase 21 Plan 04: Env-backed social links, contact emails, and about stats — Summary

**One-liner:** Footer, contact, and about pages now read social URLs, emails, and event/organizer counts from NEXT_PUBLIC env vars and the /stats/public API endpoint, with hardcoded fallbacks on every value.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Footer social links from env | 5edfffe | apps/website/components/Footer.tsx |
| 2 | Contact page emails + handle from env | 83e9f8e | apps/website/app/(site)/contacto/page.tsx |
| 3 | About page stats from /stats/public | 18e23d4 | apps/website/app/(site)/nosotros/page.tsx |

## What Was Done

### Task 1 — Footer (DYN-05)
Imported `INSTAGRAM_URL`, `TIKTOK_URL`, `DISCORD_URL`, `FACEBOOK_URL` from `@/lib/site`. Replaced all hardcoded social domain strings in two locations: the brand-block icon-btn row (Instagram + Facebook) and the Comunidad column (Instagram, TikTok, Discord). Discord uses `{DISCORD_URL || "#"}` so an empty env var falls back to a no-op anchor. Google and Apple icon-btns remain `href="#"` as placeholder — no change.

### Task 2 — Contact Page (DYN-06)
The page is `"use client"` (ContactForm needs useState/useRouter); imported `CONTACT_EMAIL`, `ABUSE_EMAIL`, `INSTAGRAM_URL`, `INSTAGRAM_HANDLE` as static constants — they are NEXT_PUBLIC vars that tree-shake into the client bundle. Replaced all three hardcoded contact points:
- `mailto:hola@konbini.cl` + visible text → `{CONTACT_EMAIL}`
- Instagram href + `@konbinishop.cl` text → `{INSTAGRAM_URL}` / `{INSTAGRAM_HANDLE}`
- `mailto:abuso@konbini.cl` + visible text → `{ABUSE_EMAIL}`

### Task 3 — About Page (DYN-02)
Converted `NosotrosPage` from a synchronous to an **async server component**. Added `await api.statsPublic().catch(() => ({ approvedEvents: 1200, organizers: 300 }))` at the top of the function — the fallback ensures the page renders even if the API is unreachable. Imported `INSTAGRAM_FOLLOWERS` from `@/lib/site` for the SEGUIDORES cell. The stats grid now shows:
- SEGUIDORES: `${INSTAGRAM_FOLLOWERS}+` (env-driven, editorial)
- EVENTOS PUBLICADOS: real DB count from `/stats/public` formatted with `es-CL` locale
- ORGANIZADORES: real DB count from `/stats/public` formatted with `es-CL` locale
- AÑO DE FUNDACIÓN: hardcoded `"2024"` (immutable founding year)

**Prose "244.000" decision:** The Historia card prose ("Crecimos a más de 244.000 seguidores") was kept as-is. `INSTAGRAM_FOLLOWERS` defaults to `"244K"` (abbreviated), which is stylistically incompatible with the fully written-out prose number. The two serve different purposes: the stats grid uses abbreviated display values, the prose card is editorial copy. This is intentional and documented.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data sources are wired. Instagram followers cell uses env var (not a stub — it is brand content, not DB data).

## Self-Check: PASSED

- [x] `apps/website/components/Footer.tsx` — exists, contains `INSTAGRAM_URL`, no hardcoded social URLs
- [x] `apps/website/app/(site)/contacto/page.tsx` — exists, contains `CONTACT_EMAIL`, no hardcoded konbini.cl emails
- [x] `apps/website/app/(site)/nosotros/page.tsx` — exists, contains `statsPublic`, async function
- [x] Commits 5edfffe, 83e9f8e, 18e23d4 — all present in git log
- [x] `pnpm exec tsc --noEmit` — clean, no errors in any of the three files
