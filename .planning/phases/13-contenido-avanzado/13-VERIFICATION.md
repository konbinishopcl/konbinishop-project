---
phase: 13-contenido-avanzado
verified: 2026-05-25T00:00:00Z
status: passed
score: 17/17 must-haves verified
re_verification: false
---

# Phase 13: contenido-avanzado Verification Report

**Phase Goal:** Artículos patrocinados (flujo DRAFT→APPROVED), favoritos de eventos, perfil público v2 por handle, y Category v2 con campos admin e integración en carrito.
**Verified:** 2026-05-25
**Status:** passed
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | POST /articles/sponsored crea artículo con status=DRAFT, userId=ownerId | VERIFIED | `articles.service.ts:156` — `status: PublicationStatus.DRAFT`, `owner: { connect: { id: ownerId } }` |
| 2  | PATCH /articles/:id/approve → APPROVED + notificación ARTICLE_APPROVED | VERIFIED | `articles.service.ts:181+186` — update status + notifications.create type ARTICLE_APPROVED |
| 3  | PATCH /articles/:id/reject con reason → REJECTED + statusReason + notificación | VERIFIED | `articles.service.ts:205+210` — statusReason: reason + ARTICLE_REJECTED notification |
| 4  | PATCH /articles/:id/ban con reason → BANNED + statusReason + notificación | VERIFIED | `articles.service.ts:230+235` — statusReason: reason + ARTICLE_BANNED notification |
| 5  | GET /articles público filtra a status=APPROVED; admin ve todos los estados | VERIFIED | `articles.service.ts:41-48` — `!isAdmin && { status: PublicationStatus.APPROVED }` con OptionalJwtAuthGuard en controller |
| 6  | isSponsored: true en artículos donde userId != null | VERIFIED | `articles.service.ts:65` — `.map(a => ({ ...a, isSponsored: a.userId !== null }))` en todos los métodos de retorno |
| 7  | Moderación solo aplica a artículos patrocinados; editoriales retornan 400 | VERIFIED | `articles.service.ts:176-178` — `if (article.userId === null) throw new BadRequestException(...)` en approve/reject/ban |
| 8  | POST /events/:id/save crea SavedEvent (409 si duplicado) | VERIFIED | `events.service.ts:150-161` — crea con try/catch P2002 → ConflictException |
| 9  | DELETE /events/:id/save elimina SavedEvent (404 si no existe) | VERIFIED | `events.service.ts:163-169` — findUnique + NotFoundException si !existing |
| 10 | GET /users/me/saved-events devuelve eventos guardados paginados | VERIFIED | `users.controller.ts:38-50` + `users.service.ts:57-59` → delega a `events.findSavedByUser` |
| 11 | isSaved en respuestas de eventos con sesión activa; omitido sin sesión | VERIFIED | `events.service.ts:102-113` — batch query só cuando user?.sub; `findBySlug:127-132` mismo patrón |
| 12 | isSaved en findAll usa UNA SOLA query batch (sin N+1) | VERIFIED | `events.service.ts:104-106` — `savedEvent.findMany({ where: { userId, eventId: { in: ids } } })` |
| 13 | GET /users/:handle devuelve perfil público + eventos + artículos si org | VERIFIED | `users.service.ts:61-109` — findByHandle con UserType.ORGANIZATION check |
| 14 | GET /users/:handle retorna 404 si handle no existe o user bloqueado | VERIFIED | `users.service.ts:81` — `if (!user || user.blocked) throw new NotFoundException(...)` |
| 15 | PATCH /users/me/organizer actualiza bio/website con upsert en Profile | VERIFIED | `users.service.ts:111-135` — `prisma.profile.upsert` con fallbackSlug |
| 16 | PATCH /users/:id/verified requiere SUPER_ADMIN; ADMIN recibe 403 | VERIFIED | `users.controller.ts:80-81` — `@UseGuards(JwtAuthGuard, RolesGuard) @Roles('SUPER_ADMIN')` |
| 17 | OrdersService EVENT valida days contra Math.min(category.maxDays, EVENT_MAX_DAYS) | VERIFIED | `orders.service.ts:99-130` — categoryMinDays/categoryMaxDays cargados, effectiveMax = Math.min(globalMax, categoryMaxDays) |

**Score:** 17/17 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/articles/articles.service.ts` | createSponsored, approve, reject, ban, findAll con filtro de rol | VERIFIED | 243 líneas, 4 métodos nuevos implementados |
| `apps/api/src/articles/articles.controller.ts` | POST /articles/sponsored + PATCH /:id/{approve,reject,ban} | VERIFIED | 4 endpoints nuevos declarados correctamente |
| `apps/api/src/articles/articles.module.ts` | Importa NotificationsModule | VERIFIED | `imports: [AuthModule, LikesModule, NotificationsModule]` |
| `apps/api/src/articles/dto/create-sponsored-article.dto.ts` | DTO con eventId opcional | VERIFIED | Clase completa con todos los campos incluyendo eventId |
| `apps/api/src/articles/dto/reject-article.dto.ts` | DTO con reason requerido | VERIFIED | @IsString @MinLength(3) reason |
| `apps/api/src/articles/dto/query-articles.dto.ts` | Incluye campo status | VERIFIED | status?: PublicationStatus con @IsEnum |
| `apps/api/src/events/events.service.ts` | save(), unsave(), findSavedByUser(), isSaved en findAll/findBySlug | VERIFIED | Todos los métodos implementados |
| `apps/api/src/events/events.controller.ts` | POST /:id/save, DELETE /:id/save | VERIFIED | Rutas declaradas con JwtAuthGuard |
| `apps/api/src/users/users.service.ts` | findByHandle, updateOrganizer, setVerified, findSavedEventsForUser | VERIFIED | 4 métodos nuevos presentes |
| `apps/api/src/users/users.controller.ts` | GET /users/:handle, PATCH /me/organizer, PATCH /:id/verified | VERIFIED | 3 endpoints con guardas correctas y orden de rutas apropiado |
| `apps/api/src/users/dto/update-organizer.dto.ts` | bio y website con validaciones | VERIFIED | @IsString @MaxLength(500) @IsUrl |
| `apps/api/src/users/dto/set-verified.dto.ts` | isVerified: boolean | VERIFIED | @IsBoolean |
| `apps/api/src/catalog/dto/create-category.dto.ts` | icon, color, minDays, maxDays, order | VERIFIED | Los 5 campos v2 presentes con validaciones |
| `apps/api/src/catalog/dto/update-category.dto.ts` | Los mismos 5 campos opcionales | VERIFIED | Idéntico al create, todos opcionales |
| `apps/api/src/orders/orders.service.ts` | Usa category.maxDays/minDays para EVENT sin crédito | VERIFIED | effectiveMax = Math.min(globalMax, categoryMaxDays) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| ArticlesController.createSponsored | ArticlesService.createSponsored | POST /articles/sponsored con JwtAuthGuard + OrgContextGuard | WIRED | `articles.controller.ts:57-67` usa ambos guards y delega al service |
| ArticlesService.approve/reject/ban | NotificationsService.create | Notificaciones ARTICLE_APPROVED/REJECTED/BANNED fire-and-forget | WIRED | `articles.service.ts:185,209,234` — `this.notifications.create(...)` sin await |
| ArticlesService.findAll | PublicationStatus.APPROVED filter | Where clause condicional por rol del user | WIRED | `articles.service.ts:47` — `!isAdmin && { status: PublicationStatus.APPROVED }` |
| EventsController.save/unsave | EventsService.save/unsave | POST/DELETE /events/:id/save con JwtAuthGuard | WIRED | `events.controller.ts:158-172` |
| EventsService.findAll | prisma.savedEvent.findMany | Batch query por eventIds para inyectar isSaved | WIRED | `events.service.ts:104-110` |
| UsersController.findSavedEvents | UsersService.findSavedEventsForUser | GET /users/me/saved-events autenticado | WIRED | `users.controller.ts:38-50` + `users.service.ts:57-59` |
| UsersController.findByHandle | UsersService.findByHandle | GET /users/:handle sin guards (público) | WIRED | `users.controller.ts:133-137` — sin guards |
| UsersService.updateOrganizer | prisma.profile.upsert | Actualiza bio/website (upsert si no existe) | WIRED | `users.service.ts:117` |
| UsersController.setVerified | UsersService.setVerified | PATCH /users/:id/verified con @Roles('SUPER_ADMIN') | WIRED | `users.controller.ts:78-90` |
| CatalogService.createCategory | Category DTO con campos v2 | data: dto spread directo | WIRED | DTOs contienen los 5 campos; service no requiere cambios |
| OrdersService.addItem (EVENT) | category.maxDays + category.minDays | Cap calculation Math.min | WIRED | `orders.service.ts:99-130` |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status |
|-------------|-------------|-------------|--------|
| CNT-01 | 13-01 | Artículos patrocinados — flujo DRAFT→APPROVED + moderación admin + notificaciones | SATISFIED |
| CNT-02 | 13-02 | Favoritos de eventos — POST/DELETE save + GET saved-events + isSaved en respuestas | SATISFIED |
| CNT-03 | 13-03 | Perfil público v2 por handle — GET /users/:handle + PATCH organizer + PATCH verified | SATISFIED |
| CNT-04 | 13-04 | Category v2 DTOs + integración validación carrito EVENT con category.minDays/maxDays | SATISFIED |

---

## Anti-Patterns Found

No anti-patterns detectados. Todos los métodos implementados, sin stubs, placeholders, TODOs, ni returns vacíos.

---

## Build Verification

| Check | Result |
|-------|--------|
| `pnpm tsc --noEmit` | Exit 0 — sin errores de TypeScript |
| `pnpm build` | Exit 0 — compilación NestJS exitosa |

---

## Human Verification Required

### 1. Flujo E2E artículo patrocinado

**Test:** POST /articles/sponsored con JWT de organizador → verificar 201 con `status: "DRAFT"` y `isSponsored: true`; luego GET /articles sin JWT → respuesta no incluye el artículo; luego PATCH /articles/:id/approve con JWT admin → 200 con `status: "APPROVED"`; luego GET /articles sin JWT → artículo aparece
**Expected:** El flujo completo DRAFT → publicado funciona end-to-end con notificación enviada al usuario
**Why human:** Requiere base de datos activa, tokens reales y verificación de que la notificación llega al receptor correcto

### 2. isSaved toggle correcto en UI

**Test:** Autenticar usuario, GET /events → verificar `isSaved: false`; POST /events/:id/save → GET /events → verificar `isSaved: true`; DELETE /events/:id/save → GET /events → `isSaved: false`
**Expected:** El campo refleja el estado real del usuario en tiempo real
**Why human:** Requiere sesión activa y verificación de estado en base de datos

### 3. PATCH /users/me/organizer — upsert de Profile

**Test:** Usuario sin Profile existente: PATCH /users/me/organizer con `{"bio":"Hola"}` → 200 con bio; llamar de nuevo con `{"website":"https://example.cl"}` → 200 con bio + website preservados
**Expected:** Upsert no pierde campos existentes; slug fallback `user-{id}` se crea correctamente
**Why human:** Requiere verificación en BD de que el slug fallback no colisiona con profiles existentes

### 4. GET /users/:handle con org vs persona

**Test:** Perfil de organización: respuesta incluye campo `articles` con contenido. Perfil de persona: `articles` es array vacío. Handle inexistente → 404
**Expected:** Diferenciación correcta por UserType
**Why human:** Requiere datos de prueba reales con usuarios de ambos tipos

---

## Notas de Implementación

- `ArticlesService` documenta explícitamente en comentarios que D-04 es una simplificación intencional vs Events/Spots/Heroes (siempre notifica al `userId` del artículo sin verificar `User.type`)
- El orden de rutas en `UsersController` es correcto: rutas específicas (`recent`, `me/saved-events`, `me/organizer`) declaradas antes de patrones con parámetros (`:id/verified`, `:id`, `:handle`)
- `EventsModule` exporta `EventsService` para que `UsersModule` pueda inyectarlo sin circular imports
- El campo `blocked` se excluye del response público en `findByHandle` mediante destructuring (`const { blocked: _blocked, ...publicUser } = user`)

---

_Verified: 2026-05-25_
_Verifier: Claude (gsd-verifier)_
