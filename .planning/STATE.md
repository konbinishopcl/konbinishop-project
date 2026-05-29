---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: unknown
last_updated: "2026-05-29T18:31:33.877Z"
progress:
  total_phases: 12
  completed_phases: 10
  total_plans: 46
  completed_plans: 42
---

# Project State

## Project Reference

See: `.planning/PROJECT.md` (updated 2026-05-27 after v1.0 milestone)

**Core value:** Organizadores publican gratis sus eventos; tras la aprobación de un
administrador quedan visibles al público.
**Current focus:** Phase 27 — dashboard-analytics-pagos-y-graficos-reales-con-recharts

## Current Status

**Milestone:** v2 — Plataforma completa ✅
**Active Phase:** —
**Overall Progress:** [██████████] 100% (48/48 plans) · Todas las fases completas (0–14)
**Last session:** 2026-05-29T18:31:33.874Z

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

### Milestone v2 — Plataforma completa ✅

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 8 | Schema v2 | ✅ Complete | 6/6 |
| 9 | Organizaciones y transferencias | ✅ Complete | 5/5 |
| 10 | Auth avanzado | ✅ Complete | 3/3 |
| 11 | Notificaciones y Settings | ✅ Complete | 3/3 |
| 12 | Suscripciones y carrito v2 | ✅ Complete | 4/4 |
| 13 | Contenido avanzado | ✅ Complete | 4/4 |
| 14 | Servicios y CRM | ✅ Complete | 4/4 |

### Rediseño UI ✅

| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 15 | Rediseño UI — migración de vistas | ✅ Complete | 5/5 |

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
- [Phase 14-03]: D-18: prisma.$transaction callback form (no batch array) garantiza atomicidad ContactMessage + CrmEntry; D-19: ContactModule NO importa CrmModule — PrismaService directo; D-20: response POST /contact sigue siendo solo ContactMessage (backwards compatible)
- [Phase 14-04]: D-22: $transaction callback form requerido para many-to-many connect; D-23: ServicesModule sin CrmModule; D-21: crmTypeMap explícito PHOTOGRAPHY/CONTENT as const
- [Phase 14]: CrmService no se exporta — Contact/Services usan PrismaService directamente (D-19/D-23). Sin DELETE /crm/:id para conservar historial (D-16). Validación LOST+stageReason en service layer.
- [Phase 15-01]: CSS cascade strategy: append full Phase 15 CSS block at end of globals.css; HeroCarousel uses .pcar opacity-based slide toggle; Rail props renamed ja→jp
- [Phase 15-02]: CategoryView uses fbar-sticky (NOT cat-shell sidebar — plan pseudocode incorrect); EventView uses event-hero/event-grid (existing CSS); ApiEvent.owner has no handle field; CSS aliases form-step/form-field/form-grid added to globals.css
- [Phase 15-04]: AuthShell uses .auth-shell/.auth-art/.auth-form-side from design (not .auth-card spec in plan); User.type has no firstname/lastname — AccountShell uses user.name+initials; api.login takes {email,password} object; Suspense wrapper preserved for useSearchParams; admin section stubs created for InboxSection/CRMSection/FAQSection/ReportsSection/SettingsSection (missing from 15-03 parallel run)
- [Phase 15-03]: Admin nav uses button+useRouter.push (CSS .admin-side button.nav-item); api.ts only has adminEvents/approveEvent/rejectEvent — other sections use fetch() directly; CRMSection uses mock data with /api/crm fallback; InboxSection receives kind prop routed by AdminPage
- [Phase 15-05]: api.ts sin métodos articles/userByHandle — server pages usan fetch() directo con process.env.API_URL + API_KEY (NO TOCAR api.ts preservado)
- [Phase 16]: Status-select movido al Panel 06 admin-only; footer limpio con texto + 3 botones; CTA labels exactos per UI-SPEC
- [Phase 17-04]: ArticleForm inline en UpsellView eliminado (payload roto videoUrl+isSponsored:true); botón 'Sí, agregar artículo' redirige a /crear-articulo via router.push (decisión D-#3 conectada)
- [Phase 17-articles-crud]: Use slug (not id) for articles edit URLs — zero API proxy changes
- [Phase 17-articles-crud]: AdminArticleEditor eliminado — era orphan llamando a /api/articles/edit (no existe)
- [Phase 18-01]: Hero reutiliza EventCategory (opción A): Hero.eventCategoryId apunta a event_categories; categoría decorativa no de pricing. Migración sch08 hand-edited con orden A→B→C→D: CreateTable → ADD COLUMN → DML INSERT/UPDATE → AddForeignKey. Tablas legacy conservadas hasta plan 18-04.
- [Phase 18-02]: aliases /categories y /tags apuntan a eventCategory/articleTag en lectura; escritura sigue en tablas legacy hasta plan 18-04
- [Phase 18-02]: dual-write en create/update: ambas FKs (category + eventCategory) se escriben con mismo ID; unitPrice usa fallback chain eventCategory?.pricePerDay ?? category?.pricePerDay ?? 0
- [Phase 18-02]: EventTag endpoint creado pero UI de asignación diferida a Phase 19+
- [Phase 18-03]: api.categories() mantiene alias hacia /event-categories — compatibilidad temporal hasta Phase 19+
- [Phase 18-03]: Step4Client (no Step1Client) enviaba categoryIds al backend — fix corregido a eventCategoryId singular
- [Phase 18-03]: ArticleForm usa /api/article-tags y envía articleTagIds al backend — migración completa desde /api/tags
- [Phase 18]: Endpoints /categories y /tags eliminados definitivamente (no mantenidos como aliases permanentes)
- [Phase 18]: Migración sch09_drop_legacy_taxonomy creada manualmente con prisma migrate resolve --applied por restricción de entorno non-interactive
- [Phase 19-01]: ApiArticle/ApiArticleEvent movidos de noticias/page.tsx a lib/api.ts como tipos exportados globales
- [Phase 19-01]: ArticleCard extrae la card inline de NoticiasListView; agrega like optimistic + reading time
- [Phase 19-02]: onMouseEnter trigger (no CSS hover puro) para controlar estado React del mega menú y animar chevron; mega menú renderizado fuera de <header> en fragment; z-index 70 sin ajuste necesario (header z-50)
- [Phase 19-rediseno-completo-de-noticias]: [Phase 19-04]: useRef eliminado del import en NewsCategoryView — no utilizado; Pop definido inline para compartir estado openPop sin prop drilling
- [Phase 19-03]: NoticiasListView.tsx conservada como archivo dormido; page.tsx simplificado sin total/totalPages
- [Phase 20]: orgId omitted from ApiSpot/ApiHero — Prisma schema has no orgId column; api.heroes()/spots() adapt paginated response via .then(r => r.items); .field-error CSS owned in Plan 02 so Plans 03/04 don't conflict on globals.css
- [Phase 20-01]: Admin list returns paginated { items, total, page, pageSize, totalPages } shape — same as events. Hero eventCategory always included in both public and admin responses.
- [Phase 20-04]: Zod schemas at module scope above components to avoid recreation on every render; SITE_HOST import removed as neither form needs it; subtitle state kept but titleAccent used as key in API call
- [Phase 20-03]: Zod schemas at module scope above components to avoid recreation on every render; SITE_HOST import removed; subtitle state kept but titleAccent used as key in createHero API call
- [Phase 20-05]: Quota badge refreshed after every moderation action (approve/reject/ban) not only on mount, to keep active/max count current
- [Phase 20-05]: AdminRejectModal reused for ban (kind='aviso/portada (ban)') because /ban endpoint requires { reason } >= 3 chars; ConfirmDialog deleted as it became unused
- [Phase 21]: PUBLIC_PREFIXES extended to SPOT_/HERO_/EVENT_/SUBSCRIPTION_; ARTICLE_PRICE stays private
- [Phase 21]: GET /stats/public (no guard) declared above admin GET /stats in StatsController to prevent route shadowing
- [Phase 21]: lib/site.ts social/contact constants use NEXT_PUBLIC env vars with hardcoded fallbacks so render never breaks on missing env
- [Phase 20-05]: Quota badge refreshed after every action (not only on mount) to keep active/max count current
- [Phase 20-05]: AdminRejectModal reused for ban (kind='aviso/portada (ban)') because /ban endpoint requires { reason } >= 3 chars; ConfirmDialog deleted as it became unused
- [Phase 21-04]: Prose '244.000 seguidores' in nosotros/Historia kept as editorial copy; INSTAGRAM_FOLLOWERS env var is abbreviated ('244K') and incompatible with prose style
- [Phase 21]: Discount row gated on unitPrice < base price from settingsPublic; signal-via-zero credit detection; adjustDays debounced 400ms per item; Pagar button disabled placeholder (21-06 wires payment)
- [Phase 21-03]: TITLES quota text moved to rendered subtitle paragraph — module scope cannot access React state; formatCLP added locally per view; pricePerDay prop-drilled from UpsellView to SpotForm/HeroForm
- [Phase 21]: precios/page.tsx converted to async SSR; PricingView is 'use client' and receives props from server parent
- [Phase 21]: Home stats and settings fully wired from Promise.all in page.tsx; eventMinPrice from Math.min(categories[].pricePerDay)
- [Phase 22-01]: OrgEntry exported from providers.tsx (canonical); 401 branch clears org like logout; init restore inside try/catch before setReady(true)
- [Phase 23-01]: D-1 applied: /cuenta/organizador deleted; organizations are separate entities post-Phase-22; no user-level organizador concept remains
- [Phase 23-01]: D-2 applied: carrito/exito CTA now points to /cuenta/perfil with copy '¿Tu perfil está completo?'
- [Phase 23-02]: D-3: matchesTab uses APPROVED+expirationDate<now for Expirados — APPROVED expirado no cuenta como Activo; D-4: mis-portadas TABS femeninos conservados; D-5: uploadImage construye headers sin buildHeaders() para no romper multipart
- [Phase 23-03]: D-6 applied: PATCH /users/me/organizer removed; bio/website fields remain in DB Profile without UI until future org-settings phase
- [Phase 24-01]: JwtUser extended with orgRole+actingAs claims; OrgContextGuard is DB-free trusting JWT claims; refreshToken accepts JwtUser for org-context preservation
- [Phase 24-03]: personalToken in UserCtxValue so Plan 04 UserMenu can fetch org list with personal token
- [Phase 24-03]: isOrgContext derived from user.type === 'ORGANIZATION' — not stored separately, stays in sync with user
- [Phase 24-03]: No org-detection branch in refresh path — backend re-issues org JWT naturally via Plan 01 SWITCH-03
- [Phase 24-03]: kb-org stale key removed on every init and logout for clean migration
- [Phase 24-02]: getActiveSub (orders.service.ts) reviewed and left unchanged — orgContext branch already correct; orders personal-order branch at line 339 left unchanged by design; articles.service.ts and users.service.ts intentionally excluded from audit attribution fixes
- [Phase 24]: SWITCH-12: Crear organizacion UI hidden in org context; Organizaciones tab hidden + redirect guard added — org accounts cannot manage orgs
- [Phase 25-01]: 6 new exported types + 15 flat api methods added to api.ts as Wave 1 foundation for Phase 25 parallel execution
- [Phase 25-02]: Detail modal populated from loaded row — no extra fetch; busyId disables ban button while PATCH in flight
- [Phase 25-03]: Handlers do not call setModal(null) — inline modals close themselves after invoking callbacks
- [Phase 25-03]: Form field keys q/a kept for AdminFormModal; mapped to question/answer only at API call boundary
- [Phase 25-04]: Degraded render: ENTITY #id format for LogsSection because GET /admin/audit-logs returns raw scalar rows with no joins
- [Phase 26-01]: ApiSubscriptionList uses limit field (not pageSize) — verified against subscriptions service response shape
- [Phase 26-04]: KPI block reduced to Activos+Total only; MRR/Nuevos mes/Cancelaciones removed — no aggregates endpoint available
- [Phase 26]: kind!==contact guard renders próximamente placeholder for photo/creators inbox variants — CRM-by-type deferred
- [Phase 26]: STAGE_CONFIG array for ordered kanban columns; TYPE_TAG record for CrmType→CSS mapping; CRMDetailModal component with LOST stageReason guard
- [Phase 27-01]: GET /payments placed ABOVE POST :orderId/checkout to prevent route ambiguity; org ?? owner principal resolution for buyer identity; Hero title uses titleAccent ?? title chain

## Accumulated Context

### Roadmap Evolution

- Phase 28 added: Artículos con múltiples categorías — many-to-many schema, seed desde WP real, API, website, formularios y vistas públicas

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
| 260528-d82 | hacer funcionar los likes de las cards de noticias | 2026-05-28 | [260528-d82-hacer-funcionar-los-likes-de-las-cards-d](./quick/260528-d82-hacer-funcionar-los-likes-de-las-cards-d/) |

## Accumulated Context

### Roadmap Evolution

- Phase 16 added: Necesito que el formulario de eventos del dashboard sea igual al formulario de eventos del dashboard de /design
- Phase 23 added: Cleanup post-cambio de contexto org — eliminar concepto perfil organizador del usuario, implementar mis-avisos y mis-portadas reales, fix uploadImage X-Org-Context, sidebar condicional por contexto activo
- Phase 25 added: Dashboard admin real — UsersSection, FAQSection, LogsSection y SettingsSection conectados a API real con filtros funcionales
- Phase 26 added: Dashboard inbox, CRM y suscripciones con API real — InboxSection, CRMSection, SubsSection conectados
- Phase 27 added: Dashboard analytics, pagos y gráficos reales con Recharts — HomeSection, PaymentsSection, ReportsSection + reemplazo completo de charts mock

## Next Action

**Milestone v1.0 completo.** Archived to `.planning/milestones/`. Todas las fases completas.
Próximo: `/gsd:new-milestone` para definir el siguiente ciclo.

---
*State initialized: 2026-03-23 · Re-alineado: 2026-05-20*
