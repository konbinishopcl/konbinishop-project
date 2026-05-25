# Phase 13: Contenido avanzado - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Extensión del módulo de artículos para soportar artículos patrocinados (organizadores
envían contenido, admin lo modera), sistema de favoritos de eventos (guardar/desguardar),
perfil público por handle (`/@handle` para personas y orgs), y extender Category CRUD con
los campos v2 ya presentes en el schema (icon, color, minDays, maxDays, order) plus
integración de esos límites en la validación del carrito.

Entregables concretos:
1. **CNT-01: Artículos patrocinados** — flujo DRAFT→PENDING_MODERATION→APPROVED (o REJECTED/BANNED); endpoint `POST /articles/sponsored` para organizadores; endpoints admin de aprobación/rechazo/baneo; notificaciones ARTICLE_APPROVED/REJECTED/BANNED.
2. **CNT-02: Favoritos** — `POST /events/:id/save`, `DELETE /events/:id/save`, `GET /users/me/saved-events`; campo `isSaved` en respuestas de eventos cuando hay sesión.
3. **CNT-03: Perfil público v2** — `GET /users/:handle` (persona u org, público); `PATCH /users/me/organizer` (actualizar bio, website, logo, banner del perfil); `PATCH /users/:id/verified` (SUPER_ADMIN asigna/revoca badge Verificado).
4. **CNT-04: Category v2** — extender DTOs de CreateCategory/UpdateCategory con icon, color, minDays, maxDays, order; la lectura pública ya devuelve estos campos; integración en carrito para EVENT: usar `category.maxDays` como cap si la clave `EVENT_MAX_DAYS` global no es más restrictiva.

</domain>

<decisions>
## Implementation Decisions

### CNT-01: Artículos patrocinados

- **D-01:** `POST /articles/sponsored` es el endpoint del organizador autenticado — crea artículo con `status=DRAFT`, vincula `userId` del owner (o `userId` de la org si `X-Org-Context`). El body incluye: title, slug?, excerpt?, content, image?, tagIds?, eventId? (para vincular el evento relacionado). No es el flujo admin legacy `POST /articles` que crea artículo publicado directamente.
- **D-02:** El estado DRAFT→PENDING_MODERATION lo dispara el pago en carrito (ya implementado en Phase 12-03 — `activateOrderItems` pone el artículo en PENDING_MODERATION). El organizador no puede transicionar el status manualmente.
- **D-03:** Admin endpoints: `PATCH /articles/:id/approve` (APPROVED + notificación), `PATCH /articles/:id/reject` (REJECTED + motivo + notificación), `PATCH /articles/:id/ban` (BANNED + motivo + notificación). Solo aplican a artículos patrocinados (userId != null).
- **D-04:** Notificaciones ARTICLE_APPROVED, ARTICLE_REJECTED, ARTICLE_BANNED — fire-and-forget (mismo patrón que EVENT_APPROVED/REJECTED). Recipient: `userId` del artículo (o `orgId` si el artículo fue creado en contexto de org — verificar campo `orgId` en Article... el schema no tiene `orgId` en Article, solo `userId`). Por ahora, siempre notificar al `userId` del artículo.
- **D-05:** `GET /articles` (público) devuelve solo artículos con `status=APPROVED`. Si el JWT presente tiene role ADMIN o SUPER_ADMIN, devuelve todos los estados (filtrable opcionalmente por `?status=`). El mecanismo es **role-based detection automática** (no `?all=true` explícito) — el admin panel no necesita pasar ningún parámetro especial. Los artículos patrocinados (`userId != null`) se distinguen por el campo `isSponsored: true` en la respuesta (campo derivado, no persistido).
- **D-06:** Artículos editoriales legacy (userId=null) siguen gestionados vía `POST /articles` (admin only). No se tocan en Phase 13.

### CNT-02: Favoritos

- **D-07:** `POST /events/:id/save` → crea `SavedEvent`. Si ya existe → 409 Conflict (o silencioso 200 — **decisión de implementación**: 409 para claridad). `DELETE /events/:id/save` → elimina. Si no existe → 404.
- **D-08:** `GET /users/me/saved-events` — devuelve la lista de eventos guardados del usuario autenticado (paginada, misma forma que `GET /events`). Soporta `?page=1&limit=20`.
- **D-09:** Campo `isSaved: boolean` en la respuesta de `GET /events/:slug` y `GET /events` cuando hay JWT presente. Si no hay sesión → `isSaved` ausente o `false`. Implementación: consultar `SavedEvent` con join en la query de eventos si `userId` está disponible (no N+1 — hacerlo vía include o sub-query agrupada).
- **D-10:** Endpoint de favoritos vive en EventsModule (add/remove save como acción sobre un evento). `GET /users/me/saved-events` vive en UsersModule. `isSaved` se inyecta en EventsService con `userId` opcional.

### CNT-03: Perfil público v2

- **D-11:** `GET /users/:handle` es un endpoint **público** (sin JWT). Devuelve: datos básicos del user/org (handle, name/firstname+lastname, avatar, banner, bio, website, isVerified, type) + eventos aprobados más recientes (paginados) + si es organización, la lista de artículos patrocinados aprobados.
- **D-12:** `PATCH /users/me/organizer` — permite actualizar campos de perfil del organizador autenticado: `bio`, `website`. Los campos `avatar`, `banner` se manejan vía subida de imagen (fuera de scope Phase 13 — estos campos ya existen en Profile). `firstname`, `lastname`, `email` quedan en `PATCH /users/me` (existente).
- **D-13:** `PATCH /users/:id/verified` — solo SUPER_ADMIN. Body: `{ isVerified: boolean }`. Emite notificación... no hay `VERIFICATION_GRANTED` en el schema NotificationType. **DECISIÓN DE IMPLEMENTACIÓN:** no emitir notificación (NotificationType no lo cubre). Solo actualizar el campo. El admin lo confirma visualmente en el panel.
- **D-14:** Namespace global de handles — `handle` es único en tabla `User` (ya tiene `@unique` en schema). Personas y organizaciones comparten el namespace. `GET /users/:handle` debe devolver 404 si no existe o si el usuario está baneado/desactivado.

### CNT-04: Category v2

- **D-15:** Los campos `icon`, `color`, `minDays`, `maxDays`, `order` ya están en el schema Prisma con valores por defecto (icon=null, color=null, minDays=1, maxDays=30, order=0). El CRUD admin de categorías ya existe en `CatalogController` pero los DTOs `CreateCategoryDto` y `UpdateCategoryDto` no incluyen estos campos. Phase 13 los agrega.
- **D-16:** La lectura pública `GET /categories` ya devuelve todos los campos del modelo — no hay selección restrictiva. Los nuevos campos ya aparecen en las respuestas (sin cambios necesarios en la lectura).
- **D-17:** Integración en carrito (EVENT): `OrdersService.resolveItem` para EVENT puede leer `category.minDays` y `category.maxDays` en lugar de solo el global `EVENT_MAX_DAYS`. Regla: `actualMaxDays = Math.min(category.maxDays, globalEventMaxDays)`. Si el evento no tiene categoría, usar solo el global. La validación de `days >= category.minDays` también aplica (si la categoría tiene `minDays > 1`, el default global de 1 ya lo soporta pero el service debe verificar).
- **D-18:** Seed: las categorías existentes no tienen icon/color seteados (null). Phase 13 puede dejar eso para que el admin los configure vía dashboard. No es necesario agregar valores de icon/color al seed.

### Claude's Discretion

- Forma exacta del response de `GET /users/:handle` (qué campos del Profile incluir)
- Si `GET /articles` devuelve `isSponsored` como campo calculado o si se usa `userId !== null`
- Cómo inyectar `userId` en `EventsService.findAll` para el campo `isSaved` (join vs subquery)
- Si el endpoint de favoritos en EventsController usa el guard de OrgContext o solo JwtAuth

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema y modelos v2
- `apps/api/prisma/schema.prisma` — Article (status, userId, statusReason), SavedEvent (userId+eventId unique), Category (icon, color, minDays, maxDays, order), User (handle @unique, isVerified)

### Módulo artículos existente (a extender)
- `apps/api/src/articles/articles.service.ts` — Lógica actual (sin moderation ni status management)
- `apps/api/src/articles/articles.controller.ts` — Endpoints actuales (sin sponsored ni moderation)
- `apps/api/src/articles/dto/create-article.dto.ts` — DTO actual (sin userId, sin eventId)

### Módulo events (para favoritos + isSaved)
- `apps/api/src/events/events.service.ts` — findAll + findBySlug (a extender con isSaved)
- `apps/api/src/events/events.controller.ts` — Para agregar POST/DELETE /:id/save

### Módulo users (para perfil público + isVerified)
- `apps/api/src/users/users.service.ts` — Para agregar findByHandle + updateOrganizer + setVerified
- `apps/api/src/users/users.controller.ts` — Para agregar GET /:handle + PATCH /me/organizer

### Catálogo (categorías v2)
- `apps/api/src/catalog/catalog.service.ts` — createCategory + updateCategory (a extender)
- `apps/api/src/catalog/dto/create-category.dto.ts` — A extender con campos v2
- `apps/api/src/catalog/dto/update-category.dto.ts` — A extender

### Patrones de referencia
- `apps/api/src/events/events.service.ts` — Patrón de approve/reject/ban (aplicar en ArticlesService)
- `apps/api/src/notifications/notifications.service.ts` — Fire-and-forget create()
- `apps/api/src/common/org-context/org-context.guard.ts` — OrgContextGuard para favoritos
- `apps/api/src/orders/orders.service.ts` — resolveItem EVENT (para D-17 integración de minDays/maxDays)

### Notificaciones Phase 11-02 (diferidas a Phase 13)
- ARTICLE_APPROVED, ARTICLE_REJECTED, ARTICLE_BANNED — ya en NotificationType enum
- `.planning/phases/11-notificaciones-y-settings/11-CONTEXT.md` — "ARTICLE_* diferido a Phase 13"

</canonical_refs>

<code_context>
## Existing Code Insights

### Lo que ya existe
- `ArticlesModule`: CRUD básico sin status management, sin notificaciones, sin sponsored flow
- `Category`: todos los campos v2 en schema, pero DTOs sin ellos; `CatalogService.createCategory/updateCategory` existen
- `SavedEvent`: modelo en schema, sin endpoints
- `User.handle` + `User.isVerified`: campos en schema, sin endpoints que los expongan
- `Profile` model: avatar, bio, website, etc. — vinculado 1:1 con User
- `PublicationStatus.BANNED` existe en enum (comprobado en schema)
- Phase 12-03: `activateOrderItems` ya activa ARTICLE→PENDING_MODERATION cuando se paga

### Patrones establecidos
- Moderation: `EventsService.approve()`, `EventsService.reject()`, `EventsService.ban()` — misma estructura para artículos
- Notifications: void fire-and-forget en Events/Spots/Heroes
- OrgContextGuard + @OrgContext(): para endpoints duales persona/org
- SettingsService.getNum(): para claves numéricas en Settings
- Paginación: `page` + `limit`/`pageSize` + `totalPages` en respuestas de lista

### Integration Points
- `apps/api/src/notifications/notifications.module.ts` — ArticlesModule debe importarlo
- `apps/api/src/orders/orders.module.ts` — Para la integración D-17 (Category minDays/maxDays)
- `apps/api/src/catalog/catalog.module.ts` — Para actualizar DTOs de Category

</code_context>

<specifics>
## Specific Ideas

- Design Brief §3.2: artículo patrocinado tiene badge "Artículo patrocinado" y campo `isSponsored` derivado de `userId !== null`
- Design Brief §3.13: artículo patrocinado en carrito tiene precio fijo (ARTICLE_PRICE), días fijos sin selector
- Design Brief §/cuenta/favoritos: lista de eventos guardados; empty state con CTA
- Design Brief §/cuenta: perfil del organizador incluye bio, website, handle; PATCH /users/me/organizer
- Design Brief §admin/articles: panel de moderación de artículos patrocinados (PENDING_MODERATION)

</specifics>

<deferred>
## Deferred Ideas

- Integración artículo patrocinado ↔ evento relacionado (Article.events) — el modelo ya lo soporta; el organizador puede vincular un evento al crear el artículo (via eventId en el DTO)
- Subida de avatar/banner del organizador — fuera de scope Phase 13 (requiere diseño de upload flow)
- Perfil público con historial de pagos / estadísticas — Phase 14 o posterior
- Notificación para badge Verificado — NotificationType no lo cubre aún
- Category con pricePerDay por categoría usado en events resolveItem — ya implementado en EventsService; Phase 13 solo expone los nuevos campos admin

</deferred>

---

*Phase: 13-contenido-avanzado*
*Context gathered: 2026-05-25*
