---
phase: 07-sistema-de-auditoria
plan: "03"
subsystem: api, audit
tags: [nestjs, prisma, audit, jwt, roles, trust-proxy, jest]

# Dependency graph
requires:
  - phase: 07-01
    provides: Jest 29 + ts-jest configurado
  - phase: 07-02
    provides: Modelo AuditLog con enums AuditAction/AuditEntity, prisma.auditLog disponible
provides:
  - AuditService singleton con log() fire-and-forget y findAll() paginado con filtros
  - GET /api/admin/audit-logs restringido a ADMIN/SUPER_ADMIN
  - AuditModule exportando AuditService (listo para 07-04..07-06)
  - trust proxy 1 activo en main.ts (AUD-03)
affects:
  - 07-04..07-06: importarán AuditModule y llamarán AuditService.log()

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AuditService fire-and-forget: log() síncrono con .catch() interno — nunca propaga errores"
    - "Paginación con prisma.$transaction([findMany(), count()]) — idéntico a EventsService"
    - "AuditModule exporta AuditService para inyección en módulos consumidores"
    - "trust proxy 1 entre disable x-powered-by y helmet()"
    - "e2e tests con describe.skip cuando DB no está disponible localmente"

key-files:
  created:
    - apps/api/src/audit/audit.service.ts
    - apps/api/src/audit/audit.controller.ts
    - apps/api/src/audit/audit.module.ts
    - apps/api/src/audit/dto/query-audit.dto.ts
    - apps/api/src/audit/audit.service.spec.ts
    - apps/api/test/audit.e2e-spec.ts
  modified:
    - apps/api/src/app.module.ts
    - apps/api/src/main.ts

key-decisions:
  - "log() es síncrono (void, no async) — retorna inmediatamente; la promesa interna se traga con .catch()"
  - "e2e suite marcada como describe.skip — DB en VPS no disponible localmente; compila y está lista para CI/CD"
  - "metadata usa cast (params.metadata ?? {}) as Prisma.InputJsonValue para satisfacer el tipado de Prisma Json"

# Metrics
duration: 12min
completed: 2026-05-22
---

# Phase 7 Plan 03: AuditModule — AuditService, AuditController y trust proxy

**AuditService singleton (log fire-and-forget + findAll paginado), GET /api/admin/audit-logs restringido a ADMIN+, QueryAuditDto con 7 filtros, trust proxy 1 en main.ts y 9 tests unitarios verdes**

## Performance

- **Duration:** 12 min
- **Started:** 2026-05-22T19:52:59Z
- **Completed:** 2026-05-22T20:05:00Z
- **Tasks:** 3
- **Files modified:** 8 (6 creados + 2 modificados)

## Accomplishments

- `AuditService` singleton creado: `log()` síncrono con `.catch()` interno (nunca propaga), `findAll()` async con `$transaction` y 7 filtros opcionales
- `AuditController`: endpoint `GET /api/admin/audit-logs` con `JwtAuthGuard + RolesGuard(['ADMIN', 'SUPER_ADMIN'])`
- `AuditModule`: importa `AuthModule`, exporta `AuditService` para consumo en planes 07-04..07-06
- `QueryAuditDto`: 7 campos opcionales (page, pageSize, entity, action, userId, dateFrom, dateTo) con decoradores class-validator y class-transformer
- `AppModule` actualizado con `AuditModule` en imports
- `main.ts`: `app.set('trust proxy', 1)` insertado entre `disable('x-powered-by')` y `helmet()` (AUD-03)
- 9 tests unitarios verdes incluyendo el caso de fallo no-propagado (`expect(() => service.log(params)).not.toThrow()`)
- Test e2e compilable con `describe.skip` (DB en VPS) cubriendo 401/403/200

## Task Commits

1. **Task 1: QueryAuditDto y AuditService con tests unitarios** - `cc4a040` (feat)
2. **Task 2: AuditController, AuditModule, AppModule** - `2b70124` (feat)
3. **Task 3: trust proxy en main.ts y test e2e** - `d28b62b` (feat)

## Files Created/Modified

- `apps/api/src/audit/audit.service.ts` — AuditService: log() fire-and-forget + findAll() paginado
- `apps/api/src/audit/audit.controller.ts` — GET /api/admin/audit-logs protegido ADMIN+
- `apps/api/src/audit/audit.module.ts` — módulo con AuthModule, exporta AuditService
- `apps/api/src/audit/dto/query-audit.dto.ts` — QueryAuditDto con 7 filtros opcionales
- `apps/api/src/audit/audit.service.spec.ts` — 9 tests unitarios (todos verdes)
- `apps/api/test/audit.e2e-spec.ts` — suite e2e con describe.skip (compila, listo para CI)
- `apps/api/src/app.module.ts` — agregado AuditModule a imports
- `apps/api/src/main.ts` — agregado trust proxy 1 antes de helmet

## Decisions Made

1. **log() es síncrono (void, no async)**: El plan especifica que `log()` es fire-and-forget. Al ser síncrono, el caller no puede awaitearlo por accidente y el comportamiento de no-propagación queda garantizado — `expect(() => service.log(params)).not.toThrow()` es el test correcto.

2. **e2e con describe.skip**: La DB MySQL está en el VPS (165.22.12.106); no hay conexión local. El test compilará y correrá en el próximo deploy/CI. Según el PLAN.md esta es la solución explícitamente aprobada.

3. **metadata cast a Prisma.InputJsonValue**: Prisma genera tipos estrictos para campos `Json`. El campo `metadata?: Record<string, unknown>` requiere cast explícito en el `create()` para satisfacer `tsc --noEmit`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Mock de findMany/count en test unitario de $transaction**
- **Found during:** Task 1 (ejecución de tests)
- **Issue:** El test `arma el where con entity, action y userId cuando se pasan` fallaba porque `$transaction` recibía `[undefined, undefined]` — los mocks de `findMany` y `count` no estaban configurados con `mockResolvedValue`, por lo que devolvían `undefined` al ser llamados como argumentos del array.
- **Fix:** En el `beforeEach` del bloque `findAll()`, se agregaron `mockPrismaService.auditLog.findMany.mockResolvedValue([])` y `mockPrismaService.auditLog.count.mockResolvedValue(0)`. La aserción se simplificó para verificar directamente la llamada a `findMany` con el `where` correcto, en lugar de verificar el argumento de `$transaction`.
- **Files modified:** `apps/api/src/audit/audit.service.spec.ts`
- **Commit:** `cc4a040` (incluido en Task 1)

---

**Total deviations:** 1 auto-fixed (1 bug en tests)
**Impact on plan:** Ninguno — el bug estaba en el test, no en el código de producción. El comportamiento de la implementación es correcto.

## Issues Encountered

- Test e2e marcado como `describe.skip` por falta de DB local. El archivo existe y compila; está listo para ejecutarse en CI/CD o en el VPS.

## User Setup Required

None — no se requiere configuración de servicios externos para este plan.

## Known Stubs

None — no stubs. El módulo audit está completamente implementado. Los planes 07-04..07-06 llamarán `AuditService.log()` desde EventsService, UsersService, SpotsService y HeroesService.

## Self-Check: PASSED

- [x] `apps/api/src/audit/audit.service.ts` — FOUND
- [x] `apps/api/src/audit/audit.controller.ts` — FOUND
- [x] `apps/api/src/audit/audit.module.ts` — FOUND
- [x] `apps/api/src/audit/dto/query-audit.dto.ts` — FOUND
- [x] `apps/api/src/audit/audit.service.spec.ts` — FOUND
- [x] `apps/api/test/audit.e2e-spec.ts` — FOUND
- [x] Commit `cc4a040` — Task 1
- [x] Commit `2b70124` — Task 2
- [x] Commit `d28b62b` — Task 3
- [x] `npx jest audit.service --no-coverage` — 9/9 PASSED
- [x] `npx tsc --noEmit` — clean (0 errors)
- [x] `grep "trust proxy" apps/api/src/main.ts` — line 20, before helmet (line 23)

## Next Phase Readiness

- `AuditModule` exporta `AuditService` — listo para importar en EventsModule, UsersModule, SpotsModule, HeroesModule (07-04..07-06)
- `AuditService.log(params)` acepta `req?: Request` — los controllers pasarán `@Req() req` para capturar IP real (vía trust proxy)
- Trust proxy activo — `req.ip` ya refleja la IP del cliente, no la del proxy Nginx

---
*Phase: 07-sistema-de-auditoria*
*Completed: 2026-05-22*
