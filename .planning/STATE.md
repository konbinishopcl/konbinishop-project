---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-05-20T23:48:00.000Z"
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 3
  completed_plans: 3
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-23)

**Core value:** Organizadores pueden publicar eventos pagando por cada publicación, que queda visible al público tras aprobación del administrador.
**Current focus:** Phase 1 — Security Foundation

## Current Status

**Milestone:** v1 — Payments, Emails, Organizer Panel, Search
**Active Phase:** Phase 1 — Security Foundation (in progress)
**Overall Progress:** [███░░░░░░░] 33%
**Last session:** 2026-05-20 - Completed quick task 260520-q4m: Exportar Strapi a schema.prisma del nuevo API NestJS + seeders (Neon Auth)

## Phase Summary

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Security Foundation | ◑ In Progress | 1/4 |
| 2 | Payment Schema + Email Infrastructure | ○ Pending | 0/3 |
| 3 | Transbank/Flow Integration | ○ Pending | 0/4 |
| 4 | Mercado Pago + Stripe + Dashboard Updates | ○ Pending | 0/4 |
| 5 | Organizer Panel | ○ Pending | 0/4 |
| 6 | Search | ○ Pending | 0/3 |

## Decisions

- **01-02:** reCAPTCHA enforced at Nuxt proxy layer not in Strapi; dev bypass via empty RECAPTCHA_SECRET_KEY prevents breaking existing forms
- **01-02:** strapi.url points to localhost:3000 proxy loopback; no OAuth routes in konbini proxy
- [Phase 01-security-foundation]: Use role.type === 'dashboard' (not role.name) as canonical check field — consistent across all 4 guard points
- [Phase 01-security-foundation]: useUserStore.getState() in hasDashboardRole to avoid stale closure pitfall in useEffect
- [Phase 01-security-foundation]: Strapi CORS restricted from wildcard to DASHBOARD_URL+WEBSITE_URL with localhost fallbacks
- [Phase 01-03]: StrapiAuth.logout/clearToken made async; callers in layout.tsx remain fire-and-forget (safe since redirect via window.location.href)
- [Phase 01-03]: recaptchaToken optional on all StrapiAPI mutating methods; dev bypass when GOOGLE_RECAPTCHA_SECRET_KEY unset

## Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260327-x7o | Crear seeders para article, hero y spot en Strapi | 2026-03-28 | 3bd7606 | [260327-x7o-revisa-en-private-project-como-se-crean-](./quick/260327-x7o-revisa-en-private-project-como-se-crean-/) |
| 260520-q4m | Exportar content types de Strapi a schema.prisma del nuevo API NestJS + seeders (auth vía Neon Auth) | 2026-05-20 | uncommitted | [260520-q4m-exportar-strapi-a-prisma-neon-auth](./quick/260520-q4m-exportar-strapi-a-prisma-neon-auth/) |

## Next Action

Continue Phase 1: execute remaining plans (01-03, 01-04, and any pending).

---
*State initialized: 2026-03-23*
