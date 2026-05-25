---
phase: 11-notificaciones-y-settings
plan: "02"
subsystem: api
tags: [nestjs, notifications, events, spots, heroes, organizations, transfers, prisma]

# Dependency graph
requires:
  - phase: 11-notificaciones-y-settings-01
    provides: NotificationsModule con NotificationsService.create() exportado

provides:
  - NotificationsService wired en 5 módulos (events/spots/heroes/organizations/transfers)
  - 13 llamadas a notifications.create() en puntos de moderación y flujo de negocio
  - EVENT_APPROVED/REJECTED/BANNED → owner del evento
  - SPOT_APPROVED/REJECTED/BANNED → owner del aviso
  - HERO_APPROVED/REJECTED/BANNED → owner de la portada
  - ORG_INVITATION → usuario invitado (solo si ya es usuario registrado)
  - TRANSFER_REQUEST → orgId destino (1 notif, no N a OWNERs individuales)
  - TRANSFER_ACCEPTED → fromUserId
  - TRANSFER_REJECTED → fromUserId

affects:
  - phase-12 (suscripciones — SUBSCRIPTION_* no tocados aquí)
  - phase-13 (contenido avanzado — ARTICLE_* diferidos aquí)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Recipient rule: User.type=ORGANIZATION → orgId, PERSON → userId"
    - "Fire-and-forget void: this.notifications.create() sin try/catch, igual que audit.log()"
    - "NotificationsModule import pattern: mismo que MailgunModule/AuditModule en cada módulo feature"
    - "Conditional notification: if (existing) antes de notifications.create() en inviteMember"
    - "1 notificación interna al orgId + N emails a OWNERs individuales (patrón transfer)"

key-files:
  created: []
  modified:
    - apps/api/src/events/events.module.ts
    - apps/api/src/events/events.service.ts
    - apps/api/src/spots/spots.module.ts
    - apps/api/src/spots/spots.service.ts
    - apps/api/src/heroes/heroes.module.ts
    - apps/api/src/heroes/heroes.service.ts
    - apps/api/src/organizations/organizations.module.ts
    - apps/api/src/organizations/organizations.service.ts
    - apps/api/src/transfers/transfers.module.ts
    - apps/api/src/transfers/transfers.service.ts

key-decisions:
  - "Recipient: User.type=ORGANIZATION → orgId; PERSON → userId — consistente en todos los services"
  - "TRANSFER_REQUEST: 1 notificación al orgId, no N a OWNERs individuales — emails siguen siendo N"
  - "AUTO_ACCEPTED (caller=OWNER): no emite TRANSFER_REQUEST — no hay nada que avisar al propio OWNER"
  - "adminCreate(): sin notificación — transferencia forzada es operacional, auditoría cubre el rastro"
  - "ORG_INVITATION condicional: si invitado no es usuario, no hay destinatario interno — solo email"
  - "ARTICLE_* diferido a Phase 13 — ArticlesService no existe aún"
  - "SUBSCRIPTION_* diferido a Phase 12"

patterns-established:
  - "Recipient helper inline: 2 líneas en cada service, no módulo común (YAGNI)"
  - "Notifications fire-and-forget: sin await, sin try/catch — igual que AuditService"

requirements-completed:
  - CFG-02

# Metrics
duration: 15min
completed: "2026-05-25"
---

# Phase 11 Plan 02: Integrar NotificationsService en 5 módulos de negocio Summary

**NotificationsService wired en Events/Spots/Heroes/Organizations/Transfers: 13 llamadas de notificación en puntos de moderación, invitación y transferencia, con regla recipient ORGANIZATION→orgId / PERSON→userId**

## Performance

- **Duration:** ~15 min
- **Started:** 2026-05-25T04:10:00Z
- **Completed:** 2026-05-25T04:25:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- Módulos Events/Spots/Heroes ya tenían NotificationsModule importado y notificaciones implementadas (commit `ed1b59d`)
- OrganizationsService emite `ORG_INVITATION` condicionalmente solo si el invitado ya es usuario registrado
- TransfersService emite `TRANSFER_REQUEST` al orgId destino (1 notif), `TRANSFER_ACCEPTED`/`TRANSFER_REJECTED` al fromUserId
- 13 llamadas totales verificadas: 3 (events) + 3 (spots) + 3 (heroes) + 1 (organizations) + 3 (transfers)
- `pnpm tsc --noEmit` + `pnpm build` pasan sin errores

## Task Commits

1. **Task 1: Events/Spots/Heroes** - `ed1b59d` (feat) — ya commitado en wave anterior
2. **Task 2: OrganizationsService ORG_INVITATION** - `f22a7d7` (feat)
3. **Task 3: TransfersService TRANSFER_REQUEST/ACCEPTED/REJECTED** - `85cee4d` (feat)

**Plan metadata:** pending

## Files Created/Modified

- `apps/api/src/events/events.module.ts` — importa NotificationsModule
- `apps/api/src/events/events.service.ts` — inyecta NotificationsService, EVENT_APPROVED/REJECTED/BANNED
- `apps/api/src/spots/spots.module.ts` — importa NotificationsModule
- `apps/api/src/spots/spots.service.ts` — inyecta NotificationsService, SPOT_APPROVED/REJECTED/BANNED
- `apps/api/src/heroes/heroes.module.ts` — importa NotificationsModule
- `apps/api/src/heroes/heroes.service.ts` — inyecta NotificationsService, HERO_APPROVED/REJECTED/BANNED
- `apps/api/src/organizations/organizations.module.ts` — importa NotificationsModule
- `apps/api/src/organizations/organizations.service.ts` — inyecta NotificationsService, ORG_INVITATION condicional
- `apps/api/src/transfers/transfers.module.ts` — importa NotificationsModule
- `apps/api/src/transfers/transfers.service.ts` — inyecta NotificationsService, TRANSFER_REQUEST/ACCEPTED/REJECTED

## Decisions Made

1. **Recipient rule**: `User.type === UserType.ORGANIZATION ? { orgId: owner.id } : { userId: owner.id }` — aplicado inline en cada service (no módulo común — YAGNI).

2. **TRANSFER_REQUEST = 1 notificación al orgId**: Los emails siguen siendo N (uno por OWNER), pero la notificación interna es 1 sola dirigida a la org. Cualquier OWNER la verá vía X-Org-Context. Evita N notificaciones duplicadas para la misma org.

3. **AUTO_ACCEPTED sin notificación**: La rama `if (!isOwner)` ya excluye las transferencias AUTO_ACCEPTED. Cuando el OWNER crea y acepta simultáneamente no hay nada que notificar — él mismo tomó la decisión.

4. **adminCreate() sin notificación**: Transferencia forzada por admin es operacional. La auditoría (`audit.log`) ya deja el rastro. Notificar al usuario afectado no es parte de CFG-02 (diferido).

5. **ORG_INVITATION condicional**: Si `existing` es null, el invitado no tiene cuenta — no hay `userId` donde entregar la notificación. Solo se envía el email transaccional.

6. **ARTICLE_* diferido a Phase 13**: ArticlesService no tiene endpoints de moderación implementados aún.

7. **SUBSCRIPTION_* diferido a Phase 12**: Fuera del scope de CFG-02.

## Deviations from Plan

None — plan ejecutado exactamente como estaba especificado. Task 1 ya venía parcialmente commitada como `ed1b59d feat(11-02): integrar notifications en Events/Spots/Heroes` desde un agente anterior.

## Issues Encountered

None.

## Known Stubs

None — todas las llamadas a `notifications.create()` están completamente wired con tipos, títulos, payloads y recipients reales.

## Next Phase Readiness

- CFG-02 completado: sistema de notificaciones ya no es silencioso
- 13/13 notification calls wired en los 5 módulos de negocio
- Próximo: Plan 11-03 (SettingsModule — migrar precios de env vars a DB)

---
*Phase: 11-notificaciones-y-settings*
*Completed: 2026-05-25*
