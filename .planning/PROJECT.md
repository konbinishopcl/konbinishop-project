# Konbini

## What This Is

Plataforma chilena de publicación de eventos de cultura geek/otaku. Los organizadores se
registran y publican sus eventos **gratis**; un administrador los modera y, una vez aprobados,
quedan visibles al público en el sitio. El sitio público y el panel de administración son una
sola app Next.js; los datos los sirve una API NestJS sobre PostgreSQL.

**Konbini NO vende entradas.** La compra de tickets ocurre en una plataforma externa; las
páginas de evento solo enlazan hacia allá.

## Core Value

Organizadores publican gratis sus eventos; tras la aprobación de un administrador quedan
visibles al público.

## Current State (v1.0 shipped 2026-05-27, Phase 27.1 complete 2026-05-30)

- **Phase 27.1 complete:** Dashboard gap fixes — KPIs computados desde datos reales (HomeSection, PaymentsSection, ReportsSection), catálogos geo conectados a API real, breadcrumb group-aware, modal de aprobación limpio (sin IA falsa), SubsSection carga config desde /api/settings, columna COMPRADOR real, top-compradores desde pagos reales.
- **Phase 28 complete:** Artículos con múltiples categorías — Article↔ArticleCategory migrado de FK única a many-to-many implícita de Prisma. Migración SQL hand-crafted (sch11) con backfill de 437 artículos existentes, script idempotente `update-article-categories.ts` (WP API → categorySlugs[]), seed.ts con filtro anti-P2025, 3 DTOs a `articleCategoryIds[]`, `articles.service.ts` con include/where/create/update m2m, `lib/api.ts` tipo actualizado, todos los componentes de display y formularios migrados.
- **Phase 27 complete:** Dashboard analytics/pagos con datos reales — HomeSection queue/actividad real + Recharts BarChart, GET /payments backend admin, PaymentsSection tabla real + CSV, ReportsSection period-bucketed chart + CSV real
- **29 fases completadas, 79 planes ejecutados**
- API NestJS completamente funcional: eventos CRUD, moderación, taxonomías, organizaciones,
  transferencias, suscripciones, servicios, CRM, auditoría, notificaciones, settings
- Website Next.js con diseño completo: vistas públicas, dashboard de organizador, panel admin
  con 15 secciones, auth avanzado (2FA + Google OAuth), carrito, perfil público
- Schema Prisma v2: geografía 3-nivel (País/Estado/Ciudad con datos Chile), orgs, sub, CRM
- **Known gap:** HARD-01..04 (hardening producción: CORS, secretos, sesión) — pendiente

## Requirements

### Validated (v1.0)

- ✓ API NestJS + Prisma sobre PostgreSQL — base operativa — quick tasks
- ✓ Schema v1 portado (regiones, comunas, categorías, tags, artículos, heroes, spots, eventos) — quick tasks
- ✓ Auth full-stack: register/login/me con JWT + bcrypt, 3 roles — quick tasks
- ✓ API de contenido: endpoints de eventos (CRUD + moderación) y lectura de taxonomías — v1.0 Phase 1
- ✓ Sitio público con datos reales (home, categorías, detalle) — v1.0 Phase 2
- ✓ Flujo de publicación: organizador crea evento → pendiente de moderación — v1.0 Phase 3
- ✓ Moderación y panel admin: aprobar/rechazar eventos, gestión de usuarios — v1.0 Phase 4
- ✓ Búsqueda de eventos con filtros (texto, categoría, región, fechas) — v1.0 Phase 5
- ✓ Sistema de auditoría: AuditLog en DB, AuditService, endpoint ADMIN+ — v1.0 Phase 7
- ✓ Schema v2: orgs, geo 3-nivel, settings, sub, transferencias, servicios, CRM — v1.0 Phase 8
- ✓ Organizaciones con membresías y transferencias polimórficas — v1.0 Phase 9
- ✓ Auth avanzado: 2FA email, Google OAuth, change email/password — v1.0 Phase 10
- ✓ Notificaciones internas + Settings en DB — v1.0 Phase 11
- ✓ Suscripciones con créditos y carrito v2 — v1.0 Phase 12
- ✓ Artículos patrocinados, favoritos, perfil público v2 — v1.0 Phase 13
- ✓ Servicios (fotografía/contenido) + CRM pipeline — v1.0 Phase 14
- ✓ Rediseño UI completo: todas las vistas al nuevo diseño Konbini.html — v1.0 Phase 15
- ✓ EventForm rewrite: paridad visual con design/app.jsx, arrays dinámicos, uploads — v1.0 Phase 16

### Active

*(Vacío — definir en siguiente milestone con `/gsd:new-milestone`)*

### Out of Scope

| Feature | Reason |
|---------|--------|
| Venta de entradas / tickets | Ocurre en plataforma externa; el sitio solo enlaza vía `ticketUrl` |
| Cobro al organizador por publicar | Diferido — en v1 publicar es gratis |
| Emails transaccionales (MJML / Mailgun) | Diferido al siguiente milestone |
| App móvil | Web-first |

## Context

- **Stack:** monorepo pnpm (`pnpm@10.11.0`) + Turborepo
  - `apps/api` — NestJS 11 + Prisma 6 + PostgreSQL 16 (local WSL). Puerto 3333, prefijo `/api`
  - `apps/website` — Next.js 15 (App Router) + React 19 + TypeScript. CSS plano
- **Auth:** JWT propio (`@nestjs/jwt` + `bcryptjs`) + 2FA email + Google OAuth. Token 7 días en localStorage
- **Schema:** Prisma v2 con geografía 3-nivel (País/Estado/Ciudad), orgs, sub, CRM, audit
- **LOC:** ~1,750 líneas TypeScript (solo `apps/`); 399 commits en rama `develop`
- **Entorno:** Windows 11 + WSL Ubuntu. Proyecto en `/home/gab/Code/konbini-project`
- **Known gap post-v1.0:** HARD-01..04 — CORS acotado, secretos de entorno, revalidación de sesión, build/deploy documentado

## Constraints

- **Tech stack:** mantener NestJS + Prisma + Next.js — no migrar frameworks otra vez
- **Alcance events-only:** nada de venta de entradas ni checkout en el sitio
- **Builds en WSL:** instalaciones y compilaciones corren dentro de WSL, no desde Windows

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Migrar de Strapi/Nuxt a NestJS + Prisma + Next.js | Control total del backend, un solo framework frontend | ✓ Validated |
| Sistema de usuarios local vs Neon Auth | Menos dependencias externas; control total de roles | ✓ Validated |
| Sitio público + panel admin en una sola app Next.js | Evita tercera app; comparten componentes y deploy | ✓ Validated |
| v1 con publicación gratuita | Lanzar el bucle organizador→moderación→público sin la complejidad de pagos | ✓ Shipped |
| Konbini no vende entradas | Ocurre en plataforma externa; reduce alcance y carga regulatoria | ✓ Validated |
| CrmEntry independiente de ContactMessage | Acoplamiento mínimo entre módulos; evita romper ContactMessage existente | ✓ Validated |
| Schema v2 con geo 3-nivel (País/Estado/Ciudad) | Region/Commune demasiado limitado para expansión futura | ✓ Applied |
| JWT propio + 2FA email (sin Passport) | Control total del flujo de auth; Passport añadía abstracción sin valor | ✓ Validated |
| CSS plano sin Tailwind | El diseño Konbini.html no usa utilidades; CSS plano es más fiel | ✓ Validated |
| Phase 6 (Hardening) skipped → Known gap | Funcionalidad completa tenía prioridad; hardening se hace antes del deploy | ⚠ Pending |

## Evolution

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-27 after v1.0 milestone*
