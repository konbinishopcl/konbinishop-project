# Requirements: Konbini

**Defined:** 2026-03-23 · **Re-aligned:** 2026-05-20
**Core Value:** Organizadores publican gratis sus eventos; tras la aprobación de un
administrador quedan visibles al público.

> Re-alineación 2026-05-20: el stack migró de Strapi/Nuxt a NestJS/Next.js y el producto
> dejó de cobrar (publicar es gratis en v1, sin venta de entradas). Los requisitos previos
> de Payments / Emails / Organizer Panel / Search del roadmap Strapi quedaron obsoletos.
> Los requisitos `SEC-*` históricos se archivan: aplicaban al stack Strapi/Nuxt.

## v1 Requirements — Milestone "Publicación gratuita de eventos"

### Auth (completado en quick tasks previas)

- [x] **AUTH-01**: Endpoints `POST /api/auth/register`, `POST /api/auth/login`,
  `GET /api/auth/me` con JWT (7d) + bcrypt
- [x] **AUTH-02**: Tres roles — `SUPER_ADMIN`, `ADMIN`, `AUTHENTICATED` — con `RolesGuard`
- [x] **AUTH-03**: CRUD de usuarios protegido: lectura ADMIN+, escritura solo SUPER_ADMIN

### Content API

- [ ] **API-01**: Endpoints de eventos en NestJS — listado público (solo aprobados), detalle
  por slug, y CRUD para organizador/admin
- [ ] **API-02**: Lectura pública de taxonomías — regiones, comunas, categorías, tags,
  artículos, heroes, spots
- [ ] **API-03**: Endpoints de moderación — aprobar / rechazar (con motivo) un evento,
  registrando `approvedBy` / `rejectedBy`
- [ ] **API-04**: Subida de imágenes de evento (banner, poster, galería) — proveedor de
  almacenamiento por decidir

### Public Site

- [ ] **SITE-01**: Home consume la API real (heroes, eventos destacados, rails por categoría)
  en vez de `lib/data.ts`
- [ ] **SITE-02**: `/categoria/[cat]` lista eventos aprobados reales de esa categoría
- [ ] **SITE-03**: `/evento/[id]` muestra el evento real; el CTA de entradas enlaza a
  `ticketUrl` (plataforma externa) — sin checkout en el sitio
- [ ] **SITE-04**: Eliminar el checkout y la UI de venta de entradas del diseño
  (`/checkout/[id]`, botones "Comprar entradas", "Konbini Pay")

### Event Publishing (organizador)

- [ ] **PUBL-01**: El formulario `/crear` envía el evento a la API; requiere sesión iniciada
  (rol `AUTHENTICATED`+)
- [ ] **PUBL-02**: Un evento recién creado queda en estado pendiente de moderación
  (`isApproved=false`, `isRejected=false`) y no es visible al público
- [ ] **PUBL-03**: El organizador puede subir banner, poster y galería del evento
- [ ] **PUBL-04**: El organizador ve sus eventos y su estado (en revisión / publicado /
  rechazado con motivo) en `/dashboard`

### Moderation & Admin

- [ ] **MOD-01**: `/admin/events` lista los eventos reales con su estado de moderación
- [ ] **MOD-02**: Un admin puede aprobar un evento → pasa a visible en el sitio público
- [ ] **MOD-03**: Un admin puede rechazar un evento indicando un motivo
- [ ] **MOD-04**: `/admin/users` es una UI funcional de gestión de usuarios (tabla + crear /
  editar / banear / eliminar), restringida a `SUPER_ADMIN`
- [ ] **MOD-05**: Retirar o re-perfilar las vistas admin obsoletas del diseño (p. ej.
  `/admin/payments`) acorde al alcance sin pagos

### Search

- [ ] **SRCH-01**: La búsqueda del header navega a `/busqueda?q=` y muestra resultados reales
- [ ] **SRCH-02**: Búsqueda por texto en título y descripción del evento
- [ ] **SRCH-03**: Filtros por categoría, región y rango de fechas
- [ ] **SRCH-04**: Los filtros activos se reflejan en la URL (links compartibles)
- [ ] **SRCH-05**: Estado vacío cuando no hay resultados

### Production Hardening

- [ ] **HARD-01**: CORS de la API restringido al origen del website (no `origin: true`)
- [ ] **HARD-02**: `JWT_SECRET` y credenciales gestionados como secretos de entorno (no valores
  por defecto en código)
- [ ] **HARD-03**: El website revalida el token contra `/auth/me` al cargar (no confía
  ciegamente en `localStorage`)
- [ ] **HARD-04**: Configuración de build y despliegue de ambas apps documentada y verificada

### Audit

- [x] **AUD-01**: Migración Prisma que crea el modelo `AuditLog` con los campos
  `userId` (Int?, sin FK), `action` (enum `AuditAction`), `entity` (enum `AuditEntity`),
  `entityId` (Int), `metadata` (Json), `ip` (String?), `userAgent` (String?),
  `url` (String?), `createdAt` — más índices de consulta
- [x] **AUD-02**: `AuditService` singleton inyectable que registra acciones (CREATE,
  UPDATE, APPROVE, REJECT, BAN, UNBAN, DELETE) sobre las entidades del sistema, integrado
  manualmente en los service methods de mutación de eventos, usuarios, avisos y portadas;
  el fallo del registro nunca revierte la operación de negocio
- [x] **AUD-03**: Captura de la IP real del cliente detrás de Nginx mediante
  `app.set('trust proxy', 1)` y `req.ip` (sin parsear `x-forwarded-for` manualmente)
- [x] **AUD-04**: Endpoint `GET /api/admin/audit-logs` con filtros (entity, action,
  userId, dateFrom, dateTo), paginado, restringido a roles ADMIN y SUPER_ADMIN

## v2 Requirements (diferido)

- **PAY-V2-01**: Cobro al organizador por publicar un evento (pasarela por definir)
- **EMAIL-V2-01**: Emails transaccionales — evento enviado, aprobado, rechazado
- **OAUTH-V2-01**: Login social (Google / Instagram / Apple) — conectar los botones de RRSS
- **MOBILE-V2-01**: App móvil

## Out of Scope

| Feature | Reason |
|---------|--------|
| Venta de entradas a asistentes | Ocurre en una plataforma externa; el sitio solo enlaza |
| Pasarelas de pago en v1 | Publicar es gratis en v1; el cobro se difiere a v2 |
| Emails transaccionales en v1 | Diferido a v2 |
| OAuth / login social en v1 | Email/password es suficiente para v1 |
| App móvil | Web-first |
| Motor de búsqueda externo (Algolia / Meilisearch) | El filtro SQL `ILIKE`/Prisma alcanza para la escala actual |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01..03 | (quick 260520-r3t / w8k) | Complete |
| API-01..04 | Phase 1 | Pending |
| SITE-01..04 | Phase 2 | Pending |
| PUBL-01..04 | Phase 3 | Pending |
| MOD-01..05 | Phase 4 | Pending |
| SRCH-01..05 | Phase 5 | Pending |
| HARD-01..04 | Phase 6 | Pending |
| AUD-01..04 | Phase 7 | Complete |
| CFG-01..03 | Phase 11 | Pending |
| COM-01..04 | Phase 12 | Pending |

**Coverage:** v1 requirements (excluyendo AUTH ya completado): 29 — todos mapeados a fases ✓

---

## v2 Requirements — Milestone "Plataforma completa"

> v2 introduce cobro al organizador, organizaciones con membresías, 2FA + Google OAuth,
> notificaciones internas, transferencias, servicios y CRM. El schema cambia
> sustancialmente — esta sección documenta los requirements de cada fase.

### Schema v2 (Phase 8)

- [x] **SCH-01**: Modelo `User` extendido con `type: UserType (PERSON|ORGANIZATION)`,
  `handle` (String unique global), `isVerified` (Boolean default false), `twoFactorCode`
  (String?), `twoFactorExpiry` (DateTime?). Migración Prisma aplicada y `prisma generate`
  regenera el cliente sin errores de tipo.
- [x] **SCH-02**: Modelos `Country`, `State`, `City` (jerarquía 3-nivel) reemplazan
  `Region` y `Commune`. `Event.cityId` reemplaza `Event.regionId`/`Event.communeId`.
  Seeder con datos de Chile (1 país + 16 states + ~350 cities). Catalog module y DTOs
  actualizados; `pnpm tsc --noEmit` pasa.
- [x] **SCH-03**: Modelos `OrgMember` (userId, orgId, role: OWNER|MEMBER, unique
  (userId, orgId)) y `OrgInvitation` (token unique, email, orgId, expiresAt). El enum
  `OrgRole` se define en este plan.
- [x] **SCH-04**: Modelos `Settings` (key PK, value String), `Notification` (userId u
  orgId, read, type, payload Json), `SavedEvent` (userId+eventId unique), `Subscription`
  (userId u orgId, status, cycle dates, credits), `Transfer` (itemType enum + itemId Int
  polymórfico, status, fromUserId, toOrgId).
- [x] **SCH-05**: `Category` extendida con `icon`, `color`, `minDays`, `maxDays`,
  `order`. Enum `OrderItemType` agrega `ARTICLE`. `OrderItem` agrega FK opcional
  `articleId`. `Order` agrega `orgId` (FK opcional a User type ORGANIZATION,
  validación en service layer). `Article` agrega `status: PublicationStatus`,
  `statusReason: String?`, `userId: Int?` para artículos patrocinados.
- [x] **SCH-06**: Modelos `ServiceRequest` (type: ServiceType, name, email, eventName,
  eventDate, eventPlace, stage: CrmStage), `ServiceOption` (type: ServiceType, label,
  active, order), `CrmEntry` (modelo nuevo — pipeline unificado para CONTACT,
  PHOTOGRAPHY, CONTENT con stage: CrmStage), `CrmNote` (FK a CrmEntry, autor, content).
  `ContactMessage` se mantiene sin cambios para backwards compatibility (decisión D8-CRM
  del RESEARCH: CrmEntry independiente, no extensión de ContactMessage).

### Notificaciones y Settings (Phase 11)

- [x] **CFG-01**: Módulo `notifications` con `NotificationService.create()` interno
  (fire-and-forget void) y endpoints autenticados:
  `GET /notifications` (paginado, soporta X-Org-Context),
  `GET /notifications/unread-count`,
  `PATCH /notifications/:id/read`,
  `PATCH /notifications/read-all`.
  Validación: paginación `page>=1`, `limit<=50` (default 20).
- [x] **CFG-02**: Auto-notificaciones en módulos existentes —
  `NotificationsModule` inyectado en `EventsModule`, `SpotsModule`, `HeroesModule`,
  `OrganizationsModule`, `TransfersModule`. Los services llaman a
  `notifications.create()` en aprobar/rechazar/banear (EVENT/SPOT/HERO),
  invitar miembro (ORG_INVITATION), y crear/aceptar/rechazar transferencia
  (TRANSFER_REQUEST/ACCEPTED/REJECTED). Recipient: si el dueño es `User.type=ORGANIZATION`
  → `orgId`, si no → `userId`.
- [x] **CFG-03**: Módulo `settings` con CRUD admin (`GET /settings`, `PATCH /settings`),
  endpoint público `GET /settings/public` que expone solo claves `SPOT_*` y `HERO_*`,
  y métodos internos `get/getNum/set/getPublic/getAll`. `SpotsService` y `HeroesService`
  migrados de `ConfigService.get()` a `SettingsService.getNum()` para todas las claves
  `SPOT_*` y `HERO_*`. Seed en `prisma/seed.ts` ya existe con las 8 claves requeridas
  (más 4 extras toleradas) — verificar sin duplicar.

### Comercio: Suscripciones y Carrito v2 (Phase 12)

- [x] **COM-01**: Módulo `subscriptions` con CRUD: `POST /subscriptions` (crea Order
  especial con item type=SUBSCRIPTION, reutiliza `GatewayFactory.initiate()`, devuelve
  `redirectUrl` de Transbank, NO crea `Subscription` row aún), `GET /subscriptions/me`
  (estado, créditos, ciclo del recipient según X-Org-Context), `DELETE /subscriptions/me`
  (marca `cancelledAt`+`status=CANCELLED`, no termina el ciclo), `GET /subscriptions`
  (ADMIN/SUPER_ADMIN, paginado, filtros por status). `SUBSCRIPTION` agregado al enum
  `OrderItemType` (Prisma + DTO). `ARTICLE` agregado al enum DTO (Prisma ya lo tenía).
  Re-suscripción soportada: sub CANCELLED/EXPIRED se borra antes de crear nueva (sortea
  el `@unique` en `userId`/`orgId`). Conflict 409 si sub ACTIVE existe.

- [x] **COM-02**: Orders v2 — `OrderItemType.ARTICLE` operativo en carrito vía patrón
  upsert (`@@unique([orderId, type])`): `unitPrice = ARTICLE_PRICE`, `days = 0` fijo,
  `subtotal = unitPrice`. `AddItemDto.days` se vuelve opcional (`@IsOptional() @IsInt()
  @Min(0)`) — para ARTICLE el service fuerza `days = 0`; para EVENT/SPOT/HERO el service
  valida `days >= 1` y `days <= *_MAX_DAYS`. `OrdersService` migrado de `ConfigService`
  a `SettingsService` para todas las claves `*_MAX_DAYS` y `*_MAX_ACTIVE`. Seed agrega
  `ARTICLE_PRICE=5000` y `EVENT_MAX_DAYS=60` si no existen.

- [ ] **COM-03**: Créditos de suscripción en carrito — al agregar un EVENT con suscripción
  activa y `creditsUsed < creditsTotal`: `unitPrice = 0`, `days = Math.min(45,
  daysUntilCycleEnd, daysUntilEventExpiration)`, `subtotal = 0`. Si la sub está
  CANCELLED con `cycleEnd` futuro, los créditos siguen aplicando (D-09). Descuentos para
  suscriptores en SPOT/HERO: `unitPrice = precioBase * (1 - SUBSCRIPTION_*_DISCOUNT/100)`
  aplicado automáticamente al `addItem`. Al confirmar pago de un Order con EVENT cubierto
  por crédito (`unitPrice=0 && subtotal=0`), `Subscription.creditsUsed` se incrementa en 1
  dentro del mismo `prisma.$transaction` que activa los ítems.

- [ ] **COM-04**: Pago de suscripción — callback dedicado `POST /subscriptions/confirm`
  y `GET /subscriptions/confirm` (públicos, sin guards) que recibe el token de Transbank,
  confirma el pago vía `GatewayFactory.confirm()`, y en un `prisma.$transaction` marca el
  Order como PAID + crea la `Subscription` row (`status=ACTIVE`, `cycleStart=now`,
  `cycleEnd=now+30d`, `creditsTotal=SUBSCRIPTION_CREDITS`, `creditsUsed=0`). Emite
  `SUBSCRIPTION_ACTIVATED` notification fire-and-forget. Idempotente: callback duplicado
  sobre Order ya PAID con Subscription existente devuelve URL de success sin duplicar.
  Si Transbank rechaza el pago (`responseCode != 0`), Order pasa a FAILED y NO se crea
  Subscription (D-03). El refactor de guards en `SubscriptionsController` mueve
  `@UseGuards(JwtAuthGuard, OrgContextGuard)` de clase a método para permitir endpoints
  públicos de callback.

---
*Requirements defined: 2026-03-23 · Re-aligned: 2026-05-20 after the stack migration*
