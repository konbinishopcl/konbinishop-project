---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-05-25T01:09:26.805Z"
progress:
  total_phases: 15
  completed_phases: 8
  total_plans: 30
  completed_plans: 29
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (re-alineado 2026-05-20)

**Core value:** Organizadores publican gratis sus eventos; tras la aprobación de un
administrador quedan visibles al público. v2 agrega suscripción, organizaciones, servicios y CRM.
**Current focus:** Phase 9 — Organizaciones y transferencias

## Current Status

**Milestone:** v2 — Plataforma completa
**Active Phase:** Phase 9 — Organizaciones y transferencias
**Overall Progress:** [██████████] 100% (25/25 plans) · Phases 0–8 completas · Phases 9–14 pendientes (v2)
**Last session:** 2026-05-25T01:09:26.802Z

## Phase Summary

### Milestone v1 — Publicación gratuita de eventos ✅

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 0 | Re-alineación GSD | ✅ Complete | 1/1 |
| 1 | API de contenido (eventos + taxonomías) | ✅ Complete | 3/3 |
| 2 | Sitio público con datos reales | ✅ Complete | 4/4 |
| 3 | Publicación de eventos | ✅ Complete | 3/3 |
| 4 | Moderación y panel admin | ✅ Complete | 2/2 |
| 5 | Búsqueda | ✅ Complete | 2/2 |
| 6 | Hardening para producción | ✅ Complete | 3/3 |
| 7 | Sistema de auditoría | ✅ Complete | 5/5 |

### Milestone v2 — Plataforma completa 🔄

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 8 | Schema v2 | ✅ Complete | 6/6 |
| 9 | Organizaciones y transferencias | ⏳ Pending | 0/5 |
| 10 | Auth avanzado | ⏳ Pending | 0/4 |
| 11 | Notificaciones y Settings | ⏳ Pending | 0/3 |
| 12 | Suscripciones y carrito v2 | ⏳ Pending | 0/4 |
| 13 | Contenido avanzado | ⏳ Pending | 0/4 |
| 14 | Servicios y CRM | ⏳ Pending | 0/5 |

## Decisions

- **[07-05]:** ensure() en UsersService retorna usuario (antes void) para obtener before.role sin query extra; actor como nombre de parámetro JwtUser en los tres servicios para evitar colisión con variables locales; UPDATE de rol auditado solo si dto.role cambia
- **[07-02]:** AuditEntity usa AVISO/PORTADA (nombres comerciales), no SPOT/HERO (nombres de modelos Prisma). AuditAction tiene 7 valores sin CHANGE_ROLE (cambios de rol = UPDATE + metadata). userId es Int? sin FK — historial sobrevive borrado de usuarios.
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

- [Phase 07-01]: pnpm se usa para instalar deps en apps/api; npm falla por postinstall de @nestjs/cli que llama a husky
- [Phase 07-01]: Enum AuditEntity usa SPOT y HERO (nombres de modelo Prisma) no AVISO/PORTADA (nombres comerciales UI) — más mantenible cuando la UI cambia
- [Phase 07]: log() es síncrono (void) — fire-and-forget garantizado; e2e suite con describe.skip por DB en VPS; metadata requiere cast a Prisma.InputJsonValue
- [Phase 08-01]: Profile permanece separado de User (no fusión). handle va en User para namespace global entre personas y organizaciones. Migración manual via SQL + migrate deploy por entorno no-interactivo.
- [Phase 08-02]: Jerarquía geográfica 3-nivel: Country → State → City. migrate reset (seed-only confirmado). query-events usa `state` en vez de `region`. Controller pattern: clase por recurso (@Controller('countries')) no @Get('countries') en un solo controller.
- [Phase 08-03]: MySQL cannot enforce user.type=ORGANIZATION for OrgMember.orgId — enforcement is service-layer (Phase 9). OrgRole enum: OWNER/MEMBER. Migration: 20260524234414_sch03_organizations.
- [Phase 08-04]: KEY #5 locked: env vars de precios permanecen en código en Phase 8; migración env→Settings es scope de Phase 11. Settings.upsert con update:{} — valor admin-modificado no se sobreescribe. Transfer polymorphic via itemType+itemId sin FKs múltiples (patrón AuditLog). Migration: 20260524234837_sch04_core_systems.
- [Phase 08-05]: KEY #4 locked: Article.status absorbed in SCH-05; Pitfall #5: @@unique([orderId,type]) stays intact; Pitfall #6: Order.orgId enforcement is service-layer (MySQL cannot CHECK cross-row); UserOrders relation rename is schema-metadata-only (no DDL, no TS breaks)
- [Phase 08-06]: KEY DECISION #2 LOCKED: CrmEntry es modelo independiente de ContactMessage. El service layer de Phase 14 crea ContactMessage + CrmEntry en transacción al recibir POST /contact. ServiceRequest NO tiene status — el pipeline vive en CrmEntry.stage.
- [Phase 09-02]: OrgContextModule is @Global() standalone — avoids circular deps when transfers/events/spots import it
- [Phase 09-02]: Guard allows pass-through when X-Org-Context absent (null = personal mode), enabling dual-mode endpoints
- [Phase 09-01]: ORG_PUBLIC_SELECT via Prisma select en vez de post-query deletion; dto.name prioridad sobre dto.firstname en update; handlePrismaError() centraliza P2002; assertOrg() separado de assertOwnerOrAdmin()
- [Phase 09]: token UUID plano en URL (no hash) — single-use 72h, aceptable para invitaciones de org
- [Phase 09]: mail.sendOrgInvitation en try/catch fire-and-forget — fallo de email no revierte la invitación creada
- [Phase 09-05]: ownerId = orgContext?.orgId ?? user.sub en create()/findMine() de events/spots/heroes; carrito Order identificado por (userId, orgId, DRAFT); ensureVisible() verifica membresía OrgMember cuando order.orgId != null; OrgContextGuard a nivel de clase en OrdersController

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
| 260521-mkj | Implementar envío de emails transaccionales con Mailgun + MJML | 2026-05-21 | [dir](./quick/260521-mkj-implementar-envio-de-emails-mailgun-mjml/) |
| 260522-lu2 | Corregir validación del formulario de creación de eventos (/crear) | 2026-05-22 | [dir](./quick/260522-lu2-corregir-validaci-n-del-formulario-de-cr/) |

## Next Action

**Phase 8 completada.** SCH-06 aplicado: ServiceOption, ServiceRequest, CrmEntry, CrmNote + 3 enums + migración sch06_services_crm. Phase gate: pnpm prisma validate + tsc --noEmit + prisma:seed todos exit 0. ContactMessage intocado (KEY DECISION #2). Próximo: Phase 9 — Organizaciones y transferencias.

---
*State initialized: 2026-03-23 · Re-alineado: 2026-05-20*
