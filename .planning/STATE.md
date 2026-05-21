---
gsd_state_version: 1.0
milestone: v1
milestone_name: "Publicación gratuita de eventos"
status: in_progress
last_updated: "2026-05-21T08:00:00.000Z"
progress:
  total_phases: 7
  completed_phases: 5
  total_plans: 14
  completed_plans: 14
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (re-alineado 2026-05-20)

**Core value:** Organizadores publican gratis sus eventos; tras la aprobación de un
administrador quedan visibles al público.
**Current focus:** Phase 5 — Búsqueda

## Current Status

**Milestone:** v1 — Publicación gratuita de eventos
**Active Phase:** Phase 5 — Búsqueda (en progreso — 1/2 planes)
**Overall Progress:** [██████░] Phases 0–4 completas · Phase 5 en curso
**Last session:** 2026-05-21 — Phase 5 plan 05-01: página /busqueda (texto + categoría + región)

## Phase Summary

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 0 | Re-alineación GSD | ✅ Complete | 1/1 |
| 1 | API de contenido (eventos + taxonomías) | ✅ Complete | 3/3 |
| 2 | Sitio público con datos reales | ✅ Complete | 4/4 |
| 3 | Publicación de eventos | ✅ Complete | 3/3 |
| 4 | Moderación y panel admin | ✅ Complete | 2/2 |
| 5 | Búsqueda | ◑ In Progress | 1/2 |
| 6 | Hardening para producción | ○ Pending | 0/? |

## Decisions

- **[04-02]:** `/dashboard/users` se difiere (no hay diseño). El dashboard overview se conecta
  con alcance "Mínimo": KPIs de eventos + cola de revisión + por-categoría reales; los widgets
  de pagos (Ingresos, Tickets, RevenueChart, Conversión) y el feed de actividad quedan mock.
- **[02-01]:** El website mapea los eventos de la API al shape `EventItem` con `toEventItem`
  para no reescribir las cards. Detalle de evento será por `slug`. `HeroBlock` sigue en mock
  hasta conectarlo a `/api/heroes`.
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
| 260521-d8k | Documentar la API con Swagger/OpenAPI (UI en /docs) | 2026-05-21 | [dir](./quick/260521-d8k-documentar-api-con-swagger/) |
| 260521-r4p | Endpoints de recuperación de contraseña (forgot/reset) | 2026-05-21 | [dir](./quick/260521-r4p-recuperar-contrasena/) |
| 260521-s7v | Feature de avisos (Spots): CRUD en la API | 2026-05-21 | [dir](./quick/260521-s7v-spots-avisos-crud/) |
| 260521-h3o | Heroes como placement pagado: rework + CRUD + cobro por día + cupo | 2026-05-21 | [dir](./quick/260521-h3o-rework-heroes-pagados/) |
| 260521-kcl | Actualizar WEBSITE-VIEWS.md con reglas de negocio completas | 2026-05-21 | [dir](./quick/260521-kcl-actualizar-website-views-md-con-reglas-d/) |

## Next Action

Continuar **Phase 5** con el plan **05-02**: filtro por rango de fechas — agregar
`desde`/`hasta` al `QueryEventsDto` y al servicio de la API, y los inputs de fecha en
`/busqueda`. Con eso cierra Phase 5.

---
*State initialized: 2026-03-23 · Re-alineado: 2026-05-20*
