---
phase: 09-organizaciones-y-transferencias
plan: "04"
subsystem: transfers
tags: [transfers, organizations, polymorphic, ownership, email]
dependency_graph:
  requires: [09-01, 09-02]
  provides: [ORG-04]
  affects: [events, spots, heroes, articles, organizations]
tech_stack:
  added: []
  patterns:
    - "Transferencia polimórfica vía itemType+itemId (patrón AuditLog, sin FKs múltiples)"
    - "Auto-aprobación: OWNER de org destino → AUTO_ACCEPTED + ownership update inmediato"
    - "Switch exhaustivo sobre TransferItemType para resolución + actualización polimórfica"
    - "Fire-and-forget email notifications (catch silenciado para no revertir transacción)"
    - "Dos @Controller en mismo archivo (TransfersController + AdminTransfersController)"
key_files:
  created:
    - apps/api/src/transfers/dto/create-transfer.dto.ts
    - apps/api/src/transfers/dto/reject-transfer.dto.ts
    - apps/api/src/transfers/dto/admin-create-transfer.dto.ts
    - apps/api/src/transfers/transfers.service.ts
    - apps/api/src/transfers/transfers.controller.ts
    - apps/api/src/transfers/transfers.module.ts
  modified:
    - apps/api/utils/templates/mail.templates.ts
    - apps/api/services/mailgun/mail.service.ts
    - apps/api/src/app.module.ts
decisions:
  - "Plantillas email usando renderTemplate (MJML) en lugar de raw HTML del plan — consistencia con las otras 10 plantillas del proyecto"
  - "null-check en Event.userId y Article.userId antes del ownership check — mensaje explícito: 'Este ítem no tiene dueño asignado, no se puede transferir'"
  - "notifyFromUser extrae título del ítem en helper separado resolveItemTitle (no reutiliza resolveAndAssertOwnership que requiere ownership check)"
  - "adminCreate llama resolveItemForAdmin (wrapper de resolveAndAssertOwnership) para validar que el fromUserId declarado sea el dueño real"
metrics:
  duration: "~25 min"
  completed_date: "2026-05-24"
  tasks_completed: 3
  files_modified: 9
---

# Phase 9 Plan 04: Módulo de Transferencias — Summary

Módulo `transfers` con transferencias polimórficas de Event/Spot/Hero/Article entre cuentas personales y organizaciones. Auto-aprobación si el caller es OWNER de la org destino; cola PENDING + email a OWNERs si es MEMBER; admin puede forzar con `ADMIN_FORCED`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | DTOs + plantillas email + MailService wrappers | a5fb40e | 3 DTOs, mail.templates.ts, mail.service.ts |
| 2 | TransfersService con lógica polimórfica | 913902b | transfers.service.ts |
| 3 | TransfersController + Module + AppModule | bcdeb65 | transfers.controller.ts, transfers.module.ts, app.module.ts |

## Endpoints Implementados

| Método | Ruta | Guard | Descripción |
|--------|------|-------|-------------|
| POST | /transfers | JwtAuthGuard | Crea transferencia; AUTO_ACCEPTED si OWNER, PENDING si MEMBER |
| GET | /transfers/incoming | JwtAuthGuard + OrgContextGuard | Lista PENDING para la org (X-Org-Context requerido) |
| POST | /transfers/:id/accept | JwtAuthGuard | OWNER acepta → ownership update en transacción |
| POST | /transfers/:id/reject | JwtAuthGuard | OWNER rechaza + reason |
| POST | /admin/transfers | JwtAuthGuard + RolesGuard + @Roles(ADMIN,SUPER_ADMIN) | Admin fuerza ADMIN_FORCED |

## Lógica de Auto-aprobación

```
caller.role en targetOrg === 'OWNER'
  → status = AUTO_ACCEPTED
  → prisma.$transaction: transfer.create + item.update(userId = toOrgId)
  
caller.role === 'MEMBER'
  → status = PENDING
  → email.sendTransferRequest a cada OWNER de la org (fire-and-forget)
```

## applyOwnershipUpdate

Switch exhaustivo cubre los 4 tipos:
- EVENT → `prisma.event.update({ userId: toOrgId })`
- SPOT → `prisma.spot.update({ userId: toOrgId })`
- HERO → `prisma.hero.update({ userId: toOrgId })`
- ARTICLE → `prisma.article.update({ userId: toOrgId })`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Mejora de calidad] Plantillas email via MJML en lugar de raw HTML**
- **Found during:** Task 1
- **Issue:** El plan especificaba raw HTML inline para las 3 plantillas de transferencia. Las otras 10 plantillas del proyecto usan `renderTemplate()` con MJML via `mjml2html`.
- **Fix:** Se usó `renderTemplate({ title, greeting, body, ctaLabel?, ctaUrl? })` en las 3 nuevas plantillas para mantener consistencia visual y de mantenimiento.
- **Files modified:** apps/api/utils/templates/mail.templates.ts
- **Commit:** a5fb40e

**2. [Rule 2 - Mejora de robustez] Null-check explícito para Event.userId y Article.userId**
- **Found during:** Task 2
- **Issue:** Event.userId e Article.userId son `Int?` (nullable). La comparación `e.userId !== expectedOwnerId` es true cuando userId es null (null !== number), lo que lanzaría "No eres dueño" — mensaje confuso.
- **Fix:** Se agrega `if (e.userId == null) throw new ForbiddenException('Este ítem no tiene dueño asignado...')` antes del ownership check.
- **Files modified:** apps/api/src/transfers/transfers.service.ts
- **Commit:** 913902b

**3. [Rule 2 - Mejora de correctitud] Helper resolveItemTitle separado para notificaciones post-aceptar/rechazar**
- **Found during:** Task 2
- **Issue:** Al notificar al fromUser en `accept()`/`reject()`, el ownership ya cambió (o el ítem pertenece a la org). Reutilizar `resolveAndAssertOwnership` con el fromUserId original fallaría porque `userId !== fromUserId` después de applyOwnershipUpdate.
- **Fix:** Se creó `resolveItemTitle()` como helper sin ownership check, solo lee el título del ítem para la notificación.
- **Files modified:** apps/api/src/transfers/transfers.service.ts
- **Commit:** 913902b

## Known Stubs

Ninguno — los endpoints están completamente implementados con lógica de negocio real.

## Self-Check: PASSED

- apps/api/src/transfers/dto/create-transfer.dto.ts — FOUND
- apps/api/src/transfers/dto/reject-transfer.dto.ts — FOUND
- apps/api/src/transfers/dto/admin-create-transfer.dto.ts — FOUND
- apps/api/src/transfers/transfers.service.ts — FOUND
- apps/api/src/transfers/transfers.controller.ts — FOUND
- apps/api/src/transfers/transfers.module.ts — FOUND
- Commit a5fb40e — FOUND
- Commit 913902b — FOUND
- Commit bcdeb65 — FOUND
- pnpm tsc --noEmit → 0 errors
- pnpm build → EXIT 0
