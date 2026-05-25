# Phase 14: Servicios y CRM - Context

**Gathered:** 2026-05-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Formularios de cotización para fotografía (`/fotografia`) y creadores de contenido
(`/creadores`), con opciones de servicio configurables por admin. CRM interno unificado
con pipeline kanban (Nuevo → Contactado → En negociación → Cerrado ganado/perdido) para
todos los tipos (CONTACT, PHOTOGRAPHY, CONTENT). Integración: `POST /contact` y
`POST /services/*` crean la CrmEntry correspondiente en la misma transacción.

Entregables concretos:
1. **SVC-01 + SVC-02: ServicesModule** — endpoints públicos `POST /services/photography` y
   `POST /services/content-creators`; `GET /services/*/options` (público); CRUD admin de
   opciones; GET admin de solicitudes.
2. **SVC-03: CrmModule** — `GET /crm` (paginado + filtros), `PATCH /crm/:id/stage`
   (stageReason requerido si stage=LOST), `POST /crm/:id/notes`, `GET /crm/:id/notes`.
3. **SVC-04: Contact → CRM** — `ContactService.create()` crea `ContactMessage` +
   `CrmEntry` en `prisma.$transaction`.
4. **SVC-05: Services → CRM** — `ServicesService.create()` crea `ServiceRequest` +
   `CrmEntry` en `prisma.$transaction`.

</domain>

<decisions>
## Implementation Decisions

### SVC-01: Endpoints públicos de servicios

- **D-01:** `POST /services/photography` crea `ServiceRequest` con `type=PHOTOGRAPHY`. Body:
  `name`, `email`, `eventName?`, `eventDate?`, `eventPlace?`, `optionIds?: number[]`
  (IDs de las opciones elegidas — many-to-many via `options: { connect }`). Público, sin auth.
  Responde `201 { id, type, name, email, createdAt }` (no exponer datos sensibles).
- **D-02:** `POST /services/content-creators` — idéntico pero `type=CONTENT`.
- **D-03:** `GET /services/photography/options` y `GET /services/content-creators/options`
  devuelven las opciones activas (`active=true`) ordenadas por `order`. **Público, sin auth.**
- **D-04:** `GET /services/photography` y `GET /services/content-creators` (ADMIN+) devuelven
  todas las solicitudes, paginadas, con las opciones seleccionadas incluidas.
- **D-05:** `ServicesModule` tiene un único controlador `ServicesController` con rutas
  `/services/photography` y `/services/content-creators`. No se crean dos módulos separados.

### SVC-02: Service options CRUD

- **D-06:** `POST /services/photography/options` — crea opción con `type=PHOTOGRAPHY`,
  `label`, `active?=true`, `order?=0`. ADMIN+.
- **D-07:** `PATCH /services/photography/options/:id` — actualiza `label`, `active`, `order`.
  ADMIN+. El tipo no se puede cambiar post-creación.
- **D-08:** `DELETE /services/photography/options/:id` — elimina la opción. Si tiene
  solicitudes vinculadas (`requests.length > 0`), **no borrar físicamente** — marcar
  `active=false` en su lugar. ADMIN+.
- **D-09:** Equivalentes para `/services/content-creators/options` (CRUD completo). Los 6
  endpoints de options son parte del mismo `ServicesController`.
- **D-10:** Las opciones no se exponen con `requests` en el listado público para no filtrar
  datos de solicitudes al exterior.

### SVC-03: CRM pipeline

- **D-11:** `GET /crm` (ADMIN+) — devuelve lista paginada con filtros opcionales `?type=`,
  `?stage=`, `?assignedTo=`. Incluye `contactName`, `contactEmail`, `type`, `stage`,
  `createdAt`, `updatedAt`. No incluye notas en el listado (solo en detalle).
- **D-12:** `GET /crm/:id` (ADMIN+) — devuelve la CrmEntry con sus notas (`notes: []`) y
  los datos del source (`ContactMessage` o `ServiceRequest`) según `sourceType`.
  Usar `sourceType + sourceId` para la consulta del source (patrón polymorphic — igual que
  `AuditLog` y `Transfer`).
- **D-13:** `PATCH /crm/:id/stage` (ADMIN+) — body `{ stage: CrmStage, stageReason?: string }`.
  Validación: si `stage === 'LOST'`, `stageReason` es **requerido** (400 si ausente).
  Actualiza también `updatedAt` (Prisma lo hace automáticamente).
- **D-14:** `POST /crm/:id/notes` (ADMIN+) — crea `CrmNote` con `content`, `authorId = actor.sub`.
  Returns la nota creada.
- **D-15:** `GET /crm/:id/notes` (ADMIN+) — lista notas de la CrmEntry, ordenadas por
  `createdAt asc`.
- **D-16:** No hay endpoint `DELETE /crm/:id` — las entradas CRM no se eliminan (conservar
  historial). El admin puede mover a LOST.
- **D-17:** `assignedTo` en CrmEntry — no se implementa endpoint de asignación en Phase 14
  (es campo del schema pero la UI de asignación queda para Phase 15 o posterior).

### SVC-04: Contact → CRM integration

- **D-18:** Extender `ContactService.create()` para que en el mismo `prisma.$transaction([...])`:
  1. `prisma.contactMessage.create(...)` → `contactMsg`
  2. `prisma.crmEntry.create({ data: { type: 'CONTACT', sourceType: 'CONTACT', sourceId: contactMsg.id, stage: 'NEW', contactName: dto.name, contactEmail: dto.email } })`
  La transacción devuelve ambos. El service retorna solo el `contactMsg` (no exponer CrmEntry al remitente).
- **D-19:** `ContactModule` importa `CrmModule` — no. Para evitar acoplamiento, `ContactService`
  usa `PrismaService` directamente para crear `CrmEntry` (la misma `PrismaService` ya inyectada,
  igual que `AuditService` que no importa módulos externos). La alternativa de importar `CrmModule`
  crea dependencia circular potencial. **DECISIÓN:** usar `prisma.crmEntry.create` directamente
  desde `ContactService`.
- **D-20:** Esta es la única modificación a `ContactModule`. El endpoint `POST /contact` no
  cambia su signature ni su response. Backward compatible.

### SVC-05: Services → CRM integration

- **D-21:** En `ServicesService.create(dto, type)`, crear `ServiceRequest` + `CrmEntry` en
  `prisma.$transaction([...])`:
  1. `prisma.serviceRequest.create(...)` → `serviceReq`
  2. `prisma.crmEntry.create({ data: { type: crmTypeMap[type], sourceType: crmTypeMap[type], sourceId: serviceReq.id, stage: 'NEW', contactName: dto.name, contactEmail: dto.email } })`
  donde `crmTypeMap = { PHOTOGRAPHY: 'PHOTOGRAPHY', CONTENT: 'CONTENT' }`.
- **D-22:** El many-to-many `options` en ServiceRequest no puede hacerse directamente dentro
  del `$transaction` de Prisma (los relations connect no están disponibles en transacciones
  secuenciales de batch). **SOLUCIÓN:** crear `ServiceRequest` sin options en la transacción,
  luego `prisma.serviceRequest.update({ where: { id }, data: { options: { connect: optionIds.map(id => ({id})) } } })` post-transacción. O usar `prisma.$transaction(async (tx) => { ... })` (función callback) que sí soporta chaining. **DECISIÓN:** usar la forma callback de `$transaction`.
- **D-23:** `ServicesService` usa `PrismaService` directamente para `crmEntry.create` (mismo
  patrón que D-19 — sin importar CrmModule).

### Documentación SVC-01..05 en REQUIREMENTS.md

- **D-24:** El primer plan de Phase 14 agrega SVC-01..05 a `REQUIREMENTS.md` (patrón Phase 11-01/12-01). Sin esto las verificaciones de cobertura falllan.

### Claude's Discretion

- Estructura interna de `ServicesController` (rutas planas vs sub-routers)
- Si usar un único `ServicesService` o dos (photography.service.ts + content.service.ts)
- Forma del response de `GET /crm/:id` (cuántos campos del source incluir)
- Paginación de `GET /crm/:id/notes` (opcional — puede ser sin paginar si el volumen es bajo)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema existente Phase 8 (todos los modelos ya en DB)
- `apps/api/prisma/schema.prisma` — ServiceOption, ServiceRequest, CrmEntry, CrmNote,
  ContactMessage, enums: ServiceType, CrmType, CrmStage

### ContactModule existente (a extender en SVC-04)
- `apps/api/src/contact/contact.service.ts` — `create()` actual (sin CrmEntry)
- `apps/api/src/contact/contact.controller.ts` — endpoints actuales
- `apps/api/src/contact/contact.module.ts` — dependencias actuales

### Patrones de referencia
- `apps/api/src/events/events.service.ts` — patrón de approve/reject con moderación
- `apps/api/src/notifications/notifications.service.ts` — fire-and-forget
- `apps/api/src/audit/audit.service.ts` — uso directo de PrismaService para cross-module sin importar módulo externo
- `apps/api/src/orders/orders.service.ts` — `prisma.$transaction` callback form (Phase 12-03)
- `apps/api/src/subscriptions/subscriptions.service.ts` — `prisma.$transaction` batch (Phase 12)

### Design Brief (reglas de negocio y UI)
- `docs/DESIGN-BRIEF.md` §3.10 (/fotografia), §3.11 (/creadores), §3.35 (/dashboard/crm),
  §3.36 (settings → service options CRUD)

</canonical_refs>

<code_context>
## Existing Code Insights

### Lo que ya existe
- `ContactModule`: `POST /contact` (public), `GET/GET/:id/PATCH/:id/read/DELETE /contact` (admin)
- `ContactMessage`: modelo simple, sin CrmEntry todavía
- `ServiceOption`, `ServiceRequest`, `CrmEntry`, `CrmNote`: en schema, sin módulos NestJS

### Patrones establecidos
- `$transaction` callback form: `prisma.$transaction(async (tx) => { ... })` — ya usado en OrdersService
- Paginación: `{ items, total, page, pageSize/limit, totalPages }` — estándar del proyecto
- ADMIN guard: `@UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN', 'SUPER_ADMIN')`
- Swagger: `@ApiTags`, `@ApiOperation`, `@ApiBearerAuth()` en cada endpoint protegido
- DTOs: class-validator + @nestjs/swagger sin @nestjs/mapped-types (patrón establecido)

### Integration Points
- `apps/api/src/app.module.ts` — importar `ServicesModule` + `CrmModule`
- `apps/api/src/contact/contact.service.ts` — extender `create()` (SVC-04)

</code_context>

<specifics>
## Specific Ideas

- Design Brief §3.35: mover a LOST requiere motivo (`stageReason` requerido)
- Design Brief §3.37: opciones de fotografía/creadores editables desde `/dashboard/settings`
- `ServiceOption.active` — cuando se borra una opción vinculada, soft-delete (`active=false`)
- `CrmEntry.sourceType + sourceId` — polymorphic sin FKs (igual que AuditLog.entityId)
- Formularios en `/fotografia` y `/creadores` consumen `GET /services/*/options` para mostrar los checkboxes

</specifics>

<deferred>
## Deferred Ideas

- Asignación de CrmEntry a admin (`assignedTo`) — campo en schema, endpoint en Phase 15
- Notificaciones internas al equipo cuando llega nueva solicitud (podría ser email vía MailService)
- Export CSV de solicitudes
- Estadísticas de conversión del CRM (Phase 15)

</deferred>

---

*Phase: 14-servicios-y-crm*
*Context gathered: 2026-05-25*
