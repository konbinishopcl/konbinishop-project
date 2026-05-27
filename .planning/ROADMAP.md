# Roadmap: Konbini

## Milestones

- ✅ **v1.0 MVP Konbini** — Phases 0-16 (shipped 2026-05-27)

---

## Phases

<details>
<summary>✅ v1.0 MVP Konbini (Phases 0-16) — SHIPPED 2026-05-27</summary>

### Milestone v1 — Publicación gratuita de eventos (Phases 0-7)

- [x] Phase 0: Re-alineación GSD (1/1 plans) — Re-alinear PROJECT, REQUIREMENTS, ROADMAP al stack y alcance reales
- [x] Phase 1: API de contenido (3/3 plans) — Endpoints NestJS de eventos y taxonomías
- [x] Phase 2: Sitio público con datos reales (4/4 plans) — Reemplazar data mock por API; quitar checkout
- [x] Phase 3: Publicación de eventos (3/3 plans) — Organizador crea y envía eventos desde el sitio
- [x] Phase 4: Moderación y panel admin (2/2 plans) — Aprobar/rechazar eventos; gestión de usuarios
- [x] Phase 5: Búsqueda (1/1 plans) — Búsqueda de eventos con filtros
- [x] Phase 6: Hardening para producción (0/0 plans) — **SKIPPED** — diferido (CORS, secretos, sesión) → Known gap HARD-01..04
- [x] Phase 7: Sistema de auditoría (5/5 plans) — AuditLog en DB con AuditService + endpoint admin

### Milestone v2 — Plataforma completa (Phases 8-16)

- [x] Phase 8: Schema v2 (6/6 plans) — Migración Prisma completa: orgs, geo 3-nivel, settings, sub, transfer, servicios, CRM
- [x] Phase 9: Organizaciones y transferencias (5/5 plans) — Orgs con membresías, X-Org-Context guard, transferencias polimórficas
- [x] Phase 10: Auth avanzado (3/3 plans) — 2FA por email, Google OAuth, change email/password
- [x] Phase 11: Notificaciones y Settings (3/3 plans) — Sistema de notificaciones internas + tabla Settings en DB
- [x] Phase 12: Suscripciones y carrito v2 (4/4 plans) — Plan mensual con créditos, descuentos para suscriptores
- [x] Phase 13: Contenido avanzado (4/4 plans) — Artículos patrocinados, favoritos, perfil público v2
- [x] Phase 14: Servicios y CRM (4/4 plans) — Cotizaciones fotografía/contenido + CRM pipeline unificado
- [x] Phase 15: Rediseño UI — migración de vistas (5/5 plans) — Todas las vistas al nuevo diseño Konbini.html
- [x] Phase 16: EventForm rewrite (1/1 plans) — Paridad visual con design/app.jsx: arrays dinámicos, uploads, footer sticky

**Total:** 16 fases, 54 planes — shipped 2026-05-27

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

---

## ▶ Next Milestone

*Run `/gsd:new-milestone` to define next milestone scope, requirements, and roadmap.*

---

*Roadmap creado: 2026-03-23 · v1.0 shipped: 2026-05-27*
