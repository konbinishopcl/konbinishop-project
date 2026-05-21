---
phase: 0
plan: "00-01"
subsystem: planning-realignment
tags: [gsd, planning, roadmap, docs]
status: complete
provides: [project-doc, requirements-doc, roadmap-doc, codebase-docs, state-doc]
affects: [.planning]
metrics:
  completed: "2026-05-20"
  files_changed: 12
  product_code_changed: 0
---

# Phase 0 · Summary 00-01: Re-alineación GSD

**One-liner:** Toda la documentación de planning fue reescrita para reflejar el stack
NestJS + Prisma + Next.js y el modelo de publicación gratuita de eventos; el roadmap de
pagos sobre Strapi/Nuxt quedó archivado.

## Qué se hizo

| # | Tarea | Resultado |
|---|-------|-----------|
| 1 | `PROJECT.md` | Reescrito — stack, core value, scope (events-only, v1 sin pagos), decisiones |
| 2 | `REQUIREMENTS.md` | Reescrito — 25 requisitos v1 nuevos + AUTH ya completado; v2 diferido |
| 3 | `ROADMAP.md` | Reescrito — 7 fases (0 re-alineación + 1–6 de producto) |
| 4 | `codebase/*.md` | 7 docs refrescados al stack actual |
| 5 | Fase Strapi | `01-security-foundation` movida a `phases/_archive-strapi/` con README |
| 6 | `STATE.md` | Re-inicializado al milestone v1 con las fases nuevas |

## Resultado

### Modelo del producto (v1)

Konbini es una plataforma de **publicación gratuita** de eventos geek/otaku. Bucle central:
organizador se registra → crea un evento → un admin lo modera → queda visible al público.
**No se venden entradas** (ocurre en una plataforma externa; el sitio enlaza vía
`ticketUrl`). El cobro al organizador por publicar se difiere a v2.

### Roadmap re-alineado — milestone v1 "Publicación gratuita de eventos"

| Fase | Nombre | Estado |
|------|--------|--------|
| 0 | Re-alineación GSD | ✅ Complete |
| 1 | API de contenido (eventos + taxonomías) | Pending |
| 2 | Sitio público con datos reales (+ quitar checkout) | Pending |
| 3 | Publicación de eventos (organizador) | Pending |
| 4 | Moderación y panel admin | Pending |
| 5 | Búsqueda | Pending |
| 6 | Hardening para producción | Pending |

### Lo que ya estaba hecho (quick tasks previas)

Auth full-stack: register/login/me con JWT + bcrypt, 3 roles, guards, CRUD de usuarios
protegido. Se mantiene como base; en el roadmap nuevo figura como AUTH-01..03 completado.

## Deviations from Plan

Ninguna. El alcance fue exactamente las 6 tareas planificadas; no se tocó código de producto.

## Known Stubs / Follow-ups

- `.planning/research/*.md` siguen describiendo el stack Strapi — obsoletos, fuera de alcance.
- El roadmap previo de pagos queda solo como referencia histórica en `_archive-strapi/`.
- Próximo paso recomendado: planear **Phase 1 — API de contenido** (módulo `events` +
  taxonomías), que desbloquea las fases 2–5.

## Self-Check: PASSED

- `.planning/PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md` reescritos — FOUND
- `.planning/codebase/` 7 docs al stack actual — FOUND
- `phases/_archive-strapi/01-security-foundation/` — FOUND (archivado)
- `.planning/` sin milestone de pagos en v1 — CONFIRMED
