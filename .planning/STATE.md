---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-05-25T16:04:14.427Z"
progress:
  total_phases: 15
  completed_phases: 13
  total_plans: 48
  completed_plans: 45
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (re-alineado 2026-05-20)

**Core value:** Organizadores publican gratis sus eventos; tras la aprobación de un
administrador quedan visibles al público. v2 agrega suscripción, organizaciones, servicios y CRM.
**Current focus:** Phase 14 — servicios-y-crm

## Current Status

**Milestone:** v2 — Plataforma completa
**Active Phase:** Phase 13 — Contenido avanzado
**Overall Progress:** [████████░░] 87% (44/44 plans) · Phases 0–12 completas · Phases 13–14 pendientes (v2)
**Last session:** 2026-05-25T16:04:14.425Z

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
| 9 | Organizaciones y transferencias | ✅ Complete | 5/5 |
| 10 | Auth avanzado | ✅ Complete | 3/3 |
| 11 | Notificaciones y Settings | ✅ Complete | 3/3 |
| 12 | Suscripciones y carrito v2 | ✅ Complete | 4/4 |
| 13 | Contenido avanzado | ✅ Complete | 4/4 |
| 14 | Servicios y CRM | 🔄 In Progress | 0/5 |

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
- [Phase 09-04]: Plantillas email de transferencia usan renderTemplate(MJML) para consistencia con las 10 plantillas existentes
- [Phase 09-04]: null-check explícito en Event.userId / Article.userId antes del ownership check para mensaje de error claro
- [Phase 10]: TwoFaUser exportado desde two-fa.guard.ts; TwoFaGuard no consulta DB; pendingToken 15min con twoFaPending:true; JwtAuthGuard rechaza tokens pending explícitamente
- [Phase 10]: 10-02: onboardingToken 30min con onboardingPending:true; upsertGoogleUser devuelve isNew; countryId/acceptedTerms diferidos a Phase 13 (solo validación por ahora)
- [Phase 10-03]: pendingEmail sin @unique — validación en service layer; confirm sin JwtAuthGuard — token como prueba de propiedad del nuevo email; sanitize() actualizado para excluir los 3 campos de email change
- [Phase 11-01]: NotificationsService.create() es void (no Promise<void>) — patrón idéntico a AuditService.log() para garantizar fire-and-forget
- [Phase 11-01]: PATCH read-all declarado ANTES de :id/read — evita que ParseIntPipe intente parsear 'read-all' como Int
- [Phase 11-01]: markRead devuelve 404 (no 403) cuando notificación es ajena — evita revelar existencia de IDs ajenos
- [Phase 11-02]: Recipient rule: User.type=ORGANIZATION → orgId, PERSON → userId — aplicado inline en Events/Spots/Heroes/Organizations
- [Phase 11-02]: TRANSFER_REQUEST: 1 notif al orgId (no N a OWNERs individuales); AUTO_ACCEPTED y adminCreate() sin notificación
- [Phase 11-02]: ARTICLE_* diferido a Phase 13; SUBSCRIPTION_* diferido a Phase 12
- [Phase 11-03]: PUBLIC_PREFIXES=['SPOT_','HERO_'] hard-coded en SettingsService; getNum() lanza NotFoundException si clave falta; SPOT_MAX_ACTIVE=10 (decision bloqueada 11-CONTEXT.md)
- [Phase 12]: COM-01: SubscriptionsModule con CRUD + delete-then-create para re-suscripción + Subscription row NO se crea en POST (solo en /confirm callback)
- [Phase 12-02]: COM-02: days opcional en DTO con validación >=1 movida al service; ConfigService removido de OrdersService → SettingsService; ARTICLE branch en resolveItem con ARTICLE_PRICE desde Settings; SPOT_PRICE_PER_DAY y HERO_PRICE_PER_DAY también migrados a SettingsService
- [Phase 12-suscripciones-y-carrito-v2]: Guards movidos de clase a método en SubscriptionsController para permitir callbacks públicos /subscriptions/confirm
- [Phase 12-suscripciones-y-carrito-v2]: recipient tipado como discriminated union { orgId: number } | { userId: number } para evitar ambigüedad TS con Prisma nullable fields
- [Phase 12-03]: Days cap for EVENT credit: Math.min(45, daysUntilCycleEnd, daysUntilEventExpiration?) — D-05 with 3 caps
- [Phase 12-03]: Signal-via-zero (unitPrice===0 && subtotal===0) detects credited EVENT in activateOrderItems — no schema column needed
- [Phase 12-03]: PaymentsService accesses sub via SubscriptionsService.getActiveForOwner (not direct Prisma query) for cross-module consistency
- [Phase 13]: CatalogService usa data: dto (spread directo) — solo extender DTOs es suficiente para persistir campos v2 sin tocar el service
- [Phase 13]: category.minDays/maxDays cap en EVENT: query liviana solo cuando type=EVENT && !hasCredit; Math.min(globalMax, categoryMaxDays) como effectiveMax
- [Phase 13-contenido-avanzado]: isSaved injected via batch savedEvent.findMany — no N+1
- [Phase 13-contenido-avanzado]: Favorites endpoints use JwtAuthGuard only (not OrgContextGuard) — personal to PERSON users
- [Phase 13-01]: D-04 simplificación intencional: ARTICLE_* notifications use userId directly (Article has no orgId unlike Events/Spots/Heroes)
- [Phase 13-contenido-avanzado]: profile.upsert con fallbackSlug=user-{userId} para crear Profile si no existe en PATCH /users/me/organizer
- [Phase 14-servicios-y-crm]: ServicesModule no importa CrmModule — integración CRM via PrismaService directo en plan 14-04 (patrón D-19/D-23)
- [Phase 14-01]: deleteOption() soft-delete cuando requests._count > 0, hard-delete si no hay vinculados

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

**Phase 12 completada.** COM-01..04 implementados: SubscriptionsModule CRUD, ARTICLE en carrito, créditos en carrito + descuentos SPOT/HERO para suscriptores, callback /subscriptions/confirm + notificación SUBSCRIPTION_ACTIVATED. Verificación 17/17 passed. Próximo: Phase 13 — Contenido avanzado (CNT-01..04).

---
*State initialized: 2026-03-23 · Re-alineado: 2026-05-20*
