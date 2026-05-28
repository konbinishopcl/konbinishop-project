---
phase: 20
slug: flujo-completo-avisos-portadas
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-28
---

# Phase 20 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | TypeScript compiler (tsc --noEmit) + manual smoke testing |
| **Config file** | apps/api/tsconfig.json, apps/website/tsconfig.json |
| **Quick run command** | `cd apps/api && pnpm exec tsc --noEmit && cd ../website && pnpm exec tsc --noEmit` |
| **Full suite command** | Same — no automated e2e tests exist for this layer |
| **Estimated runtime** | ~15 seconds |

> **Note:** No automated test infrastructure exists for the spots/heroes flow. Validation is type-checking + manual smoke testing via the checkpoint:human-verify tasks at the end of Plans 03, 04, and 05. This is the established pattern for UI-heavy phases in this project.

---

## Sampling Rate

- **After every task commit:** `pnpm exec tsc --noEmit` in the affected app
- **After every plan wave:** Full tsc check on both apps/api and apps/website
- **Before `/gsd:verify-work`:** Manual smoke test per checkpoint instructions in each plan
- **Max feedback latency:** Immediate (type errors) / Manual (functional verification)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 01-T1 | 20-01 | 1 | SPOT-05 | tsc | `cd apps/api && pnpm exec tsc --noEmit` | pending |
| 01-T2 | 20-01 | 1 | SPOT-05 | tsc | `cd apps/api && pnpm exec tsc --noEmit` | pending |
| 01-T3 | 20-01 | 1 | HERO-05 | tsc | `cd apps/api && pnpm exec tsc --noEmit` | pending |
| 02-T1 | 20-02 | 1 | SPOT-07,HERO-06 | tsc | `cd apps/website && pnpm exec tsc --noEmit` | pending |
| 02-T2 | 20-02 | 1 | SPOT-08..10,HERO-07..08 | tsc | `cd apps/website && pnpm exec tsc --noEmit` | pending |
| 02-T3 | 20-02 | 1 | SPOT-07,HERO-06 | tsc | `cd apps/website && pnpm exec tsc --noEmit` | pending |
| 03-T1 | 20-03 | 2 | SPOT-01..04 | tsc + manual | `cd apps/website && pnpm exec tsc --noEmit` | pending |
| 03-T2 | 20-03 | 2 | SPOT-01..04 | manual | checkpoint:human-verify | pending |
| 04-T1 | 20-04 | 2 | SPOT-01..04,HERO-01..04 | tsc + manual | `cd apps/website && pnpm exec tsc --noEmit` | pending |
| 04-T2 | 20-04 | 2 | SPOT-01..04,HERO-01..04 | manual | checkpoint:human-verify | pending |
| 05-T1 | 20-05 | 3 | SPOT-05..06,HERO-05 | tsc + manual | `cd apps/website && pnpm exec tsc --noEmit` | pending |
| 05-T2 | 20-05 | 3 | SPOT-06,HERO-05 | manual | checkpoint:human-verify | pending |

---

## Manual Smoke Test Checklist (per checkpoint)

### Plan 03 & 04 — Public Forms
- [ ] Upload image → preview appears in upload box
- [ ] Submit spot form without title → error renders below title field (not toast-only)
- [ ] Submit spot form with valid data → spot created in DRAFT, days added to cart
- [ ] Submit hero form with valid data → hero created in DRAFT, days added to cart
- [ ] "URL interna" pill is absent from spot linkType options

### Plan 05 — Dashboard
- [ ] SpotsSection shows real spots from API (not mock data)
- [ ] Occupancy badge shows real numbers from /spots/quota
- [ ] Approve button calls PATCH /spots/:id/approve — spot moves out of queue
- [ ] Reject modal collects reason, calls PATCH /spots/:id/reject
- [ ] Ban modal collects reason, calls PATCH /spots/:id/ban
- [ ] Same for heroes in HeroesSection
