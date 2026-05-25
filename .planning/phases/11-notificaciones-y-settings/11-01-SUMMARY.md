---
phase: 11-notificaciones-y-settings
plan: 01
subsystem: notifications
tags: [notifications, nestjs, rest-api, fire-and-forget, org-context]
dependency_graph:
  requires:
    - AuthModule (JwtAuthGuard)
    - PrismaModule (Notification model)
    - OrgContextModule (global, OrgContext decorator)
  provides:
    - NotificationsModule (exporta NotificationsService)
    - NotificationsService.create() (invocable por cualquier módulo que importe NotificationsModule)
  affects:
    - apps/api/src/app.module.ts (new import)
    - .planning/REQUIREMENTS.md (CFG-01..03 documentados)
tech_stack:
  added: []
  patterns:
    - fire-and-forget void (identical to AuditService.log)
    - Prisma.InputJsonValue cast for Json fields
    - OrgContext dual-mode (orgId vs userId based on X-Org-Context header)
    - Route order guard: static before dynamic (read-all before :id/read)
key_files:
  created:
    - apps/api/src/notifications/notifications.module.ts
    - apps/api/src/notifications/notifications.service.ts
    - apps/api/src/notifications/notifications.controller.ts
    - apps/api/src/notifications/dto/create-notification.dto.ts
    - apps/api/src/notifications/dto/query-notifications.dto.ts
  modified:
    - apps/api/src/app.module.ts
    - .planning/REQUIREMENTS.md
decisions:
  - "NotificationsService.create() es void (no Promise<void>) — patrón idéntico a AuditService.log() para garantizar fire-and-forget sin await accidental"
  - "payload usa Prisma.InputJsonValue cast obligatorio — lección Phase 07 para campos Json en Prisma"
  - "PATCH read-all declarado ANTES de PATCH :id/read — evita que NestJS intente parsear la string 'read-all' como Int con ParseIntPipe (fallaría con 400)"
  - "markRead devuelve 404 (no 403) cuando la notificación es de otro usuario — evita revelar la existencia de IDs ajenos"
  - "Validación: uno de userId/orgId required en create(); si ambos o ninguno → logger.warn y return sin insert"
metrics:
  duration: "3m 14s"
  completed_date: "2026-05-25"
  tasks_completed: 3
  files_created: 5
  files_modified: 2
---

# Phase 11 Plan 01: NotificationsModule (CFG-01 core) Summary

**One-liner:** Módulo `notifications` NestJS con `NotificationService.create()` fire-and-forget y 4 endpoints REST autenticados con soporte X-Org-Context.

## What Was Built

### Archivos creados

- **`apps/api/src/notifications/notifications.module.ts`** — `NotificationsModule` con imports `[AuthModule]`, exports `[NotificationsService]`. Patrón idéntico a `AuditModule`.

- **`apps/api/src/notifications/notifications.service.ts`** — `NotificationsService` con 5 métodos:
  - `create(params)` — void, fire-and-forget con `.catch()`. Valida que exactamente uno de `userId`/`orgId` esté presente.
  - `listMine(query, user, orgContext)` — listado paginado, filtrado por `orgId` u `userId` según `orgContext`.
  - `unreadCount(user, orgContext)` — conteo de no-leídas para el recipient.
  - `markRead(id, user, orgContext)` — marca una notificación como leída; lanza 404 si no es del caller.
  - `markAllRead(user, orgContext)` — `updateMany` con filtro `read: false` para eficiencia.

- **`apps/api/src/notifications/notifications.controller.ts`** — 4 endpoints:
  - `GET /notifications` — listado paginado con `QueryNotificationsDto`
  - `GET /notifications/unread-count` — conteo de no-leídas
  - `PATCH /notifications/read-all` — marcar todas como leídas (declarado ANTES de `:id/read`)
  - `PATCH /notifications/:id/read` — marcar una específica
  
  Decoradores: `@ApiTags('notifications')`, `@ApiBearerAuth()`, `@UseGuards(JwtAuthGuard)` a nivel de clase. Cada handler recibe `@CurrentUser() user` y `@OrgContext() orgContext`.

- **`apps/api/src/notifications/dto/create-notification.dto.ts`** — Interface `CreateNotificationParams` (tipo interno, no DTO HTTP). Incluye `payload?: Prisma.InputJsonValue`.

- **`apps/api/src/notifications/dto/query-notifications.dto.ts`** — `QueryNotificationsDto` con paginación `page>=1`, `limit<=50` (default 20), validadores `class-validator` + `@Type(() => Number)`.

### Archivos modificados

- **`apps/api/src/app.module.ts`** — `NotificationsModule` importado junto a `AuditModule`, `OrganizationsModule`, `TransfersModule`.

- **`.planning/REQUIREMENTS.md`** — Sección "Notificaciones y Settings (Phase 11)" con CFG-01, CFG-02, CFG-03 completos. Fila `CFG-01..03 | Phase 11 | Pending` en tabla de Traceability.

## Cómo lo consumirá el plan 11-02

El plan 11-02 inyectará `NotificationsService` en los módulos de negocio:

```typescript
// En events.module.ts, spots.module.ts, heroes.module.ts, organizations.module.ts, transfers.module.ts:
imports: [..., NotificationsModule],

// En el service correspondiente:
constructor(
  ...,
  private readonly notifications: NotificationsService,
) {}

// En los métodos de approve/reject/ban/invite/transfer:
this.notifications.create({
  type: NotificationType.EVENT_APPROVED,
  title: 'Tu evento fue aprobado',
  userId: event.userId ?? undefined,   // o
  orgId: event.orgId ?? undefined,     // exactamente uno
});
```

## Riesgos abiertos para 11-02

1. **Resolución del recipient (userId vs orgId):** Determinar si el dueño del ítem es `User.type=ORGANIZATION` requiere una query extra a `User` (o que los servicios existentes ya carguen el dueño). Plan 11-02 debe decidir si hacer la query en el momento o confiar en los datos existentes en el modelo (ej. `event.userId` vs `event.orgId` si el schema los tiene).

2. **Artículos:** `ARTICLE_*` types existen en el enum pero `ArticlesModule` no se tocará hasta Phase 13. Plan 11-02 puede omitirlos o agregar el hook ya para que se active cuando existan artículos.

3. **Items sin userId ni orgId:** Si un ítem fue creado sin userId (ej. evento de org sin `userId` seteado), `create()` loguea warning y omite la notificación. Plan 11-02 debe manejar este edge case.

## Deviations from Plan

None - plan executed exactly as written.

El controller fue creado junto con el module (Task 1 y Task 2 compilados juntos), aunque se commitearon por separado para cumplir el protocolo de commits atómicos por tarea.

## Self-Check: PASSED

All created files verified present on disk. All task commits exist:
- `e97b973` feat(11-01): crear NotificationsModule + Service + DTOs (CFG-01 core)
- `79030bb` feat(11-01): crear NotificationsController con 4 endpoints y Swagger
- `eb0dad5` feat(11-01): registrar NotificationsModule en AppModule + documentar CFG-01..03
