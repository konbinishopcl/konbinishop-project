---
phase: 07-sistema-de-auditoria
plan: "05"
subsystem: api, audit, users, spots, heroes
tags: [nestjs, prisma, audit, jwt, roles, fire-and-forget]

# Dependency graph
requires:
  - phase: 07-03
    provides: AuditModule exportando AuditService con log() fire-and-forget
provides:
  - UsersService auditado: BAN/UNBAN/DELETE en setBanned/remove; UPDATE-de-rol en update
  - SpotsService auditado: APPROVE/REJECT/BAN con entity AVISO en moderación
  - HeroesService auditado: APPROVE/REJECT/BAN con entity PORTADA en moderación
  - Tres controllers pasan @CurrentUser() actor y @Req() req a los métodos de mutación/moderación
  - Tres módulos importan AuditModule
affects:
  - AUD-02: completado para usuarios, avisos y portadas

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "actor: JwtUser (no 'user') para evitar choques con variables locales llamadas 'user'"
    - "audit.log() posicionado DESPUÉS del prisma.update/delete y ANTES del bloque de mail"
    - "UPDATE de rol auditado SOLO si dto.role está presente y difiere del rol previo (evitar ruido)"
    - "ensure() refactorizada en UsersService para retornar el usuario (antes void) — permite leer before.role sin query extra"

key-files:
  created: []
  modified:
    - apps/api/src/users/users.service.ts
    - apps/api/src/users/users.controller.ts
    - apps/api/src/users/users.module.ts
    - apps/api/src/spots/spots.service.ts
    - apps/api/src/spots/spots.controller.ts
    - apps/api/src/spots/spots.module.ts
    - apps/api/src/heroes/heroes.service.ts
    - apps/api/src/heroes/heroes.controller.ts
    - apps/api/src/heroes/heroes.module.ts

key-decisions:
  - "ensure() en UsersService retorna el usuario en lugar de void para obtener before.role en update() sin query adicional"
  - "audit.log() para UPDATE de rol usa condicional: solo si dto.role !== undefined && dto.role !== before.role"
  - "actor como nombre de parámetro (no user) en todos los servicios para evitar colisión con variables locales"

# Metrics
duration: 8min
completed: 2026-05-22
---

# Phase 7 Plan 05: Instrumentación de UsersService, SpotsService y HeroesService con AuditService

**Tres servicios instrumentados con AuditService.log() fire-and-forget: UsersService (BAN/UNBAN/DELETE/UPDATE-de-rol con entity USER), SpotsService (APPROVE/REJECT/BAN con entity AVISO), HeroesService (APPROVE/REJECT/BAN con entity PORTADA); los tres controllers pasan actor y req; los tres módulos importan AuditModule; tsc --noEmit limpio**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-22T19:56:00Z
- **Completed:** 2026-05-22T20:04:47Z
- **Tasks:** 3
- **Files modified:** 9 (0 creados + 9 modificados)

## Accomplishments

- `UsersService`: inyecta `AuditService`; `setBanned` registra BAN o UNBAN según el flag; `remove` registra DELETE; `update` registra UPDATE solo cuando `dto.role` cambia (con `metadata: { prevRole, newRole }`)
- `UsersController`: `update`, `ban` y `remove` pasan `@CurrentUser() user: JwtUser` y `@Req() req: Request`
- `UsersModule`: importa `AuditModule`
- `SpotsService`: inyecta `AuditService`; `approve`/`reject`/`ban` registran APPROVE/REJECT/BAN con `entity: 'AVISO'`; log llamado antes del bloque de mail
- `SpotsController`: `approve`, `reject` y `ban` pasan `@CurrentUser()` y `@Req()`
- `SpotsModule`: importa `AuditModule`
- `HeroesService`: inyecta `AuditService`; `approve`/`reject`/`ban` registran APPROVE/REJECT/BAN con `entity: 'PORTADA'`
- `HeroesController`: `approve`, `reject` y `ban` pasan `@CurrentUser()` y `@Req()`
- `HeroesModule`: importa `AuditModule`
- `npx tsc --noEmit` pasa limpio (0 errores) con los nueve archivos modificados

## Task Commits

1. **Task 1: Instrumentar UsersService + UsersController** - `ee11ca7` (feat)
2. **Task 2: Instrumentar SpotsService + SpotsController (entity AVISO)** - `9a1e456` (feat)
3. **Task 3: Instrumentar HeroesService + HeroesController (entity PORTADA) y compilar** - `83eed00` (feat)

## Files Created/Modified

- `apps/api/src/users/users.service.ts` — inyecta AuditService; setBanned/remove/update reciben actor+req; ensure() retorna usuario
- `apps/api/src/users/users.controller.ts` — añade Req, CurrentUser, JwtUser; update/ban/remove pasan user+req
- `apps/api/src/users/users.module.ts` — agrega AuditModule a imports
- `apps/api/src/spots/spots.service.ts` — inyecta AuditService; approve/reject/ban reciben actor+req; 3x audit.log con entity AVISO
- `apps/api/src/spots/spots.controller.ts` — añade Req, Request; approve/reject/ban pasan user+req
- `apps/api/src/spots/spots.module.ts` — agrega AuditModule a imports
- `apps/api/src/heroes/heroes.service.ts` — inyecta AuditService; approve/reject/ban reciben actor+req; 3x audit.log con entity PORTADA
- `apps/api/src/heroes/heroes.controller.ts` — añade Req, Request; approve/reject/ban pasan user+req
- `apps/api/src/heroes/heroes.module.ts` — agrega AuditModule a imports

## Decisions Made

1. **ensure() en UsersService retorna el usuario**: La función `ensure()` original era `void` (no retornaba nada, solo lanzaba). Se cambió para que retorne el usuario encontrado. Esto permite que `update()` haga `const before = await this.ensure(id)` y obtenga `before.role` sin necesidad de una query adicional a la DB — eficiencia y limpieza.

2. **Condicional de UPDATE de rol**: El plan especifica "SOLO si `dto.role` está presente y es distinto del rol previo". La condición `if (dto.role !== undefined && dto.role !== before.role)` evita registrar auditoría en ediciones de nombre/email, reduciendo ruido en el log.

3. **Nombre `actor` en lugar de `user`**: Todos los servicios usan `actor: JwtUser` como nombre del parámetro que representa al admin ejecutor. Esto evita colisiones con variables locales `user`, `spot`, `hero` que ya existían en los métodos.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Refactor] ensure() en UsersService refactorizada para retornar usuario**
- **Found during:** Task 1 (implementación de update con prevRole)
- **Issue:** La firma original `private async ensure(id: number): Promise<void>` no retornaba el usuario. Para leer `before.role` en `update()` sin una query extra, se necesitaba que `ensure()` retornara el registro.
- **Fix:** Cambiado el tipo de retorno de `void` a `Promise<User>` (Prisma type inferido). El comportamiento de lanzar `NotFoundException` se mantiene idéntico.
- **Files modified:** `apps/api/src/users/users.service.ts`
- **Commit:** `ee11ca7`

---

**Total deviations:** 1 auto-fixed (1 refactor menor en ensure())
**Impact on plan:** Ninguno — la función cumple su contrato original más retorna el dato útil.

## Issues Encountered

- Ninguno. Los tres módulos (spots, heroes) ya existían con la estructura completa de moderación. La instrumentación fue directa.

## User Setup Required

None — no se requiere configuración adicional.

## Known Stubs

None — implementación completa. Todos los métodos de moderación instrumentados registran en la tabla `AuditLog` vía `AuditService.log()`.

## Self-Check: PASSED

- [x] `apps/api/src/users/users.service.ts` — FOUND, grep -c 'this.audit.log' = 3
- [x] `apps/api/src/users/users.controller.ts` — FOUND, grep -c '@Req()' = 3
- [x] `apps/api/src/users/users.module.ts` — FOUND, grep -q 'AuditModule' = OK
- [x] `apps/api/src/spots/spots.service.ts` — FOUND, grep -c 'this.audit.log' = 3, entity AVISO = 3
- [x] `apps/api/src/spots/spots.controller.ts` — FOUND, grep -c '@Req()' = 3
- [x] `apps/api/src/spots/spots.module.ts` — FOUND, grep -q 'AuditModule' = OK
- [x] `apps/api/src/heroes/heroes.service.ts` — FOUND, grep -c 'this.audit.log' = 3, entity PORTADA = 3
- [x] `apps/api/src/heroes/heroes.controller.ts` — FOUND, grep -c '@Req()' = 3
- [x] `apps/api/src/heroes/heroes.module.ts` — FOUND, grep -q 'AuditModule' = OK
- [x] `npx tsc --noEmit` — PASSED (0 errores)
- [x] Commit `ee11ca7` — Task 1
- [x] Commit `9a1e456` — Task 2
- [x] Commit `83eed00` — Task 3

## Next Phase Readiness

- AUD-02 completado: usuarios, avisos (Spots) y portadas (Heroes) instrumentados
- Los tres servicios llaman `AuditService.log()` en sus acciones de moderación/mutación relevantes
- `tsc --noEmit` limpio — el API compila sin errores de tipos con las nuevas firmas

---
*Phase: 07-sistema-de-auditoria*
*Completed: 2026-05-22*
