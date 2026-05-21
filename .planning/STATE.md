---
gsd_state_version: 1.0
milestone: v1
milestone_name: "Publicación gratuita de eventos"
status: in_progress
last_updated: "2026-05-21T01:00:00.000Z"
progress:
  total_phases: 7
  completed_phases: 2
  total_plans: 4
  completed_plans: 4
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (re-alineado 2026-05-20)

**Core value:** Organizadores publican gratis sus eventos; tras la aprobación de un
administrador quedan visibles al público.
**Current focus:** Phase 2 — Sitio público con datos reales

## Current Status

**Milestone:** v1 — Publicación gratuita de eventos
**Active Phase:** Phase 2 — Sitio público con datos reales (pendiente — por planear)
**Overall Progress:** [███░░░░] Phases 0 y 1 completas
**Last session:** 2026-05-21 — Phase 1 cerrada (plan 01-03: endpoint de subida de imágenes)

## Phase Summary

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 0 | Re-alineación GSD | ✅ Complete | 1/1 |
| 1 | API de contenido (eventos + taxonomías) | ✅ Complete | 3/3 |
| 2 | Sitio público con datos reales | ○ Pending | 0/? |
| 3 | Publicación de eventos | ○ Pending | 0/? |
| 4 | Moderación y panel admin | ○ Pending | 0/? |
| 5 | Búsqueda | ○ Pending | 0/? |
| 6 | Hardening para producción | ○ Pending | 0/? |

## Decisions

- **[01-03]:** Subida de imágenes con `FileInterceptor` en memoria + escritura a disco con
  `fs` — sin importar `multer` ni agregar dependencias. Formatos JPG/PNG/WebP, máx. 5 MB.
- **[01-02]:** Almacenamiento de imágenes = disco local en `apps/api/uploads/`, servido en
  `/uploads`. El catálogo (taxonomías + contenido) se agrupa en un único módulo `catalog` en
  vez de un módulo por recurso.
- **[01-01]:** Un evento creado por un organizador queda `isApproved=false`; editar/borrar lo
  permite el dueño o un admin; `reject` exige un motivo. `UpdateEventDto` escrito a mano para
  no añadir `@nestjs/mapped-types`.
- **[Re-alineación 2026-05-20]:** El stack migró de Strapi 5 + Nuxt 4 + dashboard Next.js a
  NestJS 11 + Prisma 6 + una sola app Next.js (sitio público + admin).
- **[Re-alineación 2026-05-20]:** v1 con publicación gratuita; el cobro al organizador por
  publicar se difiere a v2. Konbini no vende entradas (plataforma externa).
- **[Re-alineación 2026-05-20]:** El roadmap de pagos previo (Strapi) quedó archivado en
  `phases/_archive-strapi/`; reemplazado por el roadmap de 7 fases actual.

## Quick Tasks Completed

| # | Description | Date | Directory |
|---|-------------|------|-----------|
| 260327-x7o | Seeders para article, hero y spot (Strapi — stack anterior) | 2026-03-28 | [dir](./quick/260327-x7o-revisa-en-private-project-como-se-crean-/) |
| 260520-q4m | Exportar content types de Strapi a `schema.prisma` del API NestJS + seeders | 2026-05-20 | [dir](./quick/260520-q4m-exportar-strapi-a-prisma-neon-auth/) |
| 260520-r3t | Sistema de usuarios local con 3 roles (reemplaza Neon Auth y Neon) | 2026-05-20 | [dir](./quick/260520-r3t-sistema-usuarios-local-3-roles/) |
| 260520-w8k | Login + registro con auth full-stack (JWT, roles, guards, CRUD de usuarios) | 2026-05-20 | [dir](./quick/260520-w8k-login-registro-auth/) |

## Next Action

Planear **Phase 2 — Sitio público con datos reales**: conectar home, categorías y detalle de
evento del website a la API NestJS (reemplazar `lib/data.ts` mock) y quitar el checkout /
venta de entradas del diseño.

---
*State initialized: 2026-03-23 · Re-alineado: 2026-05-20*
