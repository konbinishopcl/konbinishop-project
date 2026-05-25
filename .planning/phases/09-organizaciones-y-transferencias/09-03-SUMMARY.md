---
phase: 09-organizaciones-y-transferencias
plan: "03"
subsystem: organizations/memberships
tags: [organizations, invitations, members, email, mailgun]
dependency_graph:
  requires: [09-01, 08-03]
  provides: [ORG-03]
  affects: [organizations-module, mail-service]
tech_stack:
  added: []
  patterns: [crypto.randomUUID, prisma.$transaction, fire-and-forget mail, last-OWNER enforcement]
key_files:
  created:
    - apps/api/src/organizations/dto/invite-member.dto.ts
    - apps/api/src/organizations/dto/update-member-role.dto.ts
  modified:
    - apps/api/src/organizations/organizations.service.ts
    - apps/api/src/organizations/organizations.controller.ts
    - apps/api/utils/templates/mail.templates.ts
    - apps/api/services/mailgun/mail.service.ts
decisions:
  - "token UUID plano en URL (no hash) — single-use 72h, aceptable para invitaciones de org"
  - "mail.sendOrgInvitation en try/catch fire-and-forget — fallo de email no revierte la invitación"
  - "ConfigModule es global (isGlobal:true) — no se agrega a OrganizationsModule.imports"
metrics:
  duration: "~15 min"
  completed: "2026-05-24"
  tasks_completed: 3
  files_changed: 6
---

# Phase 09 Plan 03: Membresías e invitaciones de organizaciones — Summary

Token UUID 72h con email Mailgun, 5 endpoints REST para el ciclo completo de membresías: listar, invitar, aceptar, cambiar rol y eliminar con enforcement de último OWNER.

## What Was Built

Extensión del módulo `organizations` con el ciclo completo de membresías:

- **InviteMemberDto** — valida `email` con `@IsEmail()`
- **UpdateMemberRoleDto** — valida `role` con `@IsEnum(OrgRole)` (OWNER | MEMBER)
- **orgInvitationTemplate** — plantilla MJML reutilizando `renderTemplate`, CTA "Aceptar invitación"
- **MailService.sendOrgInvitation** — método que consume la plantilla y la envía vía Mailgun
- **5 métodos en OrganizationsService**:
  - `listMembers` — requiere membresía o ADMIN+
  - `inviteMember` — OWNER only, genera token UUID, expiresAt+72h, envía email fire-and-forget
  - `acceptInvitation` — valida token, expiración, email match; crea OrgMember + borra invitación en `$transaction`
  - `changeMemberRole` — OWNER only, enforcement último OWNER (ownerCount ≤ 1 → 400)
  - `removeMember` — OWNER only, enforcement último OWNER (ownerCount ≤ 1 → 400)
- **5 endpoints en OrganizationsController** con JwtAuthGuard, ApiBearerAuth y ApiOperation

## Endpoints

| Method   | Path                                      | Guard       | Description                         |
|----------|-------------------------------------------|-------------|-------------------------------------|
| GET      | /organizations/:id/members                | JWT (MEMBER+) | Lista miembros de la org            |
| POST     | /organizations/:id/members/invite         | JWT (OWNER) | Invita por email con token UUID 72h |
| POST     | /organizations/invitations/:token/accept  | JWT (any)   | Acepta invitación, crea OrgMember   |
| PATCH    | /organizations/:id/members/:userId        | JWT (OWNER) | Cambia rol del miembro              |
| DELETE   | /organizations/:id/members/:userId        | JWT (OWNER) | Elimina miembro                     |

## Commits

| Task | Commit  | Description                                                            |
|------|---------|------------------------------------------------------------------------|
| 1    | d4148a0 | DTOs invite-member + update-member-role, orgInvitationTemplate, sendOrgInvitation |
| 2    | ed1e09d | 5 métodos de membresía e invitación en OrganizationsService            |
| 3    | d230f27 | Wire 5 endpoints en OrganizationsController                            |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed `as Prisma.InputJsonValue` casts in audit.log calls**
- **Found during:** Task 2 compilation
- **Issue:** `audit.log({ metadata })` acepta `Record<string, unknown>`, no `Prisma.InputJsonValue`. El cast causaba `TS2322`.
- **Fix:** Eliminados los 4 casts — el service de auditoría aplica el cast internamente.
- **Files modified:** `apps/api/src/organizations/organizations.service.ts`
- **Commit:** ed1e09d

## Known Stubs

None — todos los endpoints están conectados a la base de datos y al servicio de email. No hay mocks ni valores hardcodeados de retorno.

## Self-Check: PASSED

- FOUND: apps/api/src/organizations/dto/invite-member.dto.ts
- FOUND: apps/api/src/organizations/dto/update-member-role.dto.ts
- FOUND: .planning/phases/09-organizaciones-y-transferencias/09-03-SUMMARY.md
- FOUND commit d4148a0: DTOs + mail
- FOUND commit ed1e09d: Service methods
- FOUND commit d230f27: Controller endpoints
- pnpm tsc --noEmit: EXIT 0
- pnpm build: EXIT 0
