# Phase 11: Notificaciones y Settings - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Crear el módulo `notifications` (endpoints GET/PATCH para el usuario autenticado, más `NotificationService.create()` interno) e inyectar el servicio en los 5-6 módulos que generan eventos notificables. Crear el módulo `settings` con seed de 8 claves (valores actuales de env vars de spots/heroes/suscripción) y migrar Spots/Heroes para leer precio/cupo desde DB en vez de env. Todo en la API NestJS — sin cambios en el website.

</domain>

<decisions>
## Implementation Decisions

### Disparadores y destinatarios

- Los 19 tipos del enum `NotificationType` se usan: mapeo 1:1 con acciones ya auditadas (EVENT_APPROVED/REJECTED/BANNED, SPOT_*, HERO_*, ARTICLE_*, ORG_INVITATION, TRANSFER_REQUEST/ACCEPTED/REJECTED, SUBSCRIPTION_ACTIVATED/CANCELLED, SYSTEM)
- `NotificationService.create()` es síncrono void, fire-and-forget dentro del servicio llamador — sin try/catch externo (mismo patrón que email)
- Destinatario: si el ítem pertenece a una org → `orgId`; si pertenece a persona → `userId`
- Paginación en `GET /notifications`: `?page=1&limit=20` (default 20, max 50)

### Settings — claves y acceso

- Seed inicial de 8 claves con sus defaults actuales de env var:
  - `SPOT_MAX_ACTIVE=10`, `SPOT_MAX_DAYS=30`, `SPOT_PRICE_PER_DAY=8000`
  - `HERO_PRICE_PER_DAY=15000`, `HERO_MAX_ACTIVE=5`, `HERO_MAX_DAYS=30`
  - `SUBSCRIPTION_CREDITS=10`, `SUBSCRIPTION_PRICE=9990`
- Claves públicas (sin auth): `SPOT_*` y `HERO_*` (el frontend muestra precios y cupos)
- Claves admin-only: `SUBSCRIPTION_*`
- Lectura en Spots/Heroes: query en vivo a Settings en cada request — sin caché (volumen bajo)
- `Settings.value` es String; los servicios parsean con `parseInt()` según la clave

### Endpoints de notificaciones

- `GET /notifications` (autenticado, paginado con ?page&limit, soporta X-Org-Context)
- `GET /notifications/unread-count` (autenticado, soporta X-Org-Context)
- `PATCH /notifications/:id/read` (marca una como leída)
- `PATCH /notifications/read-all` (marca todas como leídas)
- Sin auto-delete: las notificaciones persisten hasta que el usuario las marque leídas; sin TTL automático
- `GET /notifications` con header `X-Org-Context` devuelve notificaciones del `orgId`; sin header, las del `userId`

### Módulo notifications

- No es `@Global()` — se importa donde se necesita (igual que `MailgunModule`)
- `NotificationsModule` exporta `NotificationService`
- Los módulos que lo importan: EventsModule, SpotsModule, HeroesModule, OrganizationsModule, TransfersModule (ArticlesModule en Phase 13)

### Claude's Discretion
- Estructura interna del CRUD de settings (método `get(key)`, `getNum(key)`, `set(key, value)`)
- Formato de respuesta de `GET /settings` (array de `{key, value, updatedAt}` o mapa `{[key]: value}`)
- Nombre del método interno de NotificationService (`create` vs `notify`)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `MailService` pattern: `@Injectable()` exportado desde su módulo, importado en AppModule y demás módulos
- `OrgContextGuard` + `@OrgContext()` decorator: disponible para leer orgContext en NotificationsController
- `JwtAuthGuard` + `@CurrentUser()`: patrón para endpoints autenticados
- `PrismaService`: `Notification` y `Settings` modelos ya disponibles en el cliente
- `ConfigService`: ya en uso en Spots/Heroes para leer env vars (será reemplazado por SettingsService)

### Established Patterns
- Módulos NestJS: `module.ts` + `controller.ts` + `service.ts` + `dto/` en `apps/api/src/{name}/`
- Prisma upsert pattern para seed: `prisma.settings.upsert({ where: { key }, update: {}, create: { key, value } })`
- Fire-and-forget email: `await this.mail.send...` dentro de un try/catch en organizationsService — replicar para notificaciones pero sin try/catch (más simple)

### Integration Points
- `apps/api/src/events/events.service.ts` — agregar notificaciones en approve/reject/ban
- `apps/api/src/spots/spots.service.ts` — agregar notificaciones + migrar config a SettingsService
- `apps/api/src/heroes/heroes.service.ts` — agregar notificaciones + migrar config a SettingsService
- `apps/api/src/organizations/organizations.service.ts` — notificación ORG_INVITATION en inviteMember
- `apps/api/src/transfers/transfers.service.ts` — notificaciones TRANSFER_REQUEST/ACCEPTED/REJECTED
- `apps/api/src/app.module.ts` — importar NotificationsModule y SettingsModule

</code_context>

<specifics>
## Specific Ideas

- El seed de Settings debe usar `upsert` con `update: {}` — no sobreescribir valores que el admin ya modificó (mismo patrón que Phase 8-04)
- `GET /settings/public` devuelve solo las claves `SPOT_*` y `HERO_*` como un objeto plano `{SPOT_PRICE_PER_DAY: "8000", ...}` — fácil de consumir en el frontend sin auth
- `PATCH /settings` acepta un array `[{key, value}]` o un objeto `{[key]: value}` — el array es más explícito

</specifics>

<deferred>
## Deferred Ideas

- Auto-delete de notificaciones leídas después de 90 días (posible cron en Phase 14)
- Notificaciones push (WebSocket/SSE) — fuera del scope de v2
- ARTICLE_* notifications se generan en Phase 13 cuando se complete ArticlesService

</deferred>
