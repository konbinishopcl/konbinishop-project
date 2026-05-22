---
phase: 07-sistema-de-auditoria
verified: 2026-05-22T20:30:00Z
status: passed
score: 4/4 must-haves verified
human_verification:
  - test: "Aprobar un evento en la API con un token de admin y confirmar que el registro AuditLog tiene action=APPROVE, entity=EVENT, entityId correcto, ip y url no nulos"
    expected: "La tabla audit_logs contiene la fila con todos los campos requeridos; ip refleja la IP real del cliente (no 127.0.0.1 del proxy)"
    why_human: "La suite e2e (apps/api/test/audit.e2e-spec.ts) está marcada describe.skip porque la DB MySQL vive en el VPS (165.22.12.106). No es posible ejecutarla en local. La verificación requiere una petición real contra el entorno de staging o producción."
  - test: "Banear un usuario desde /admin/users y verificar que el registro AuditLog contiene userId del admin actor, action=BAN, entity=USER"
    expected: "La tabla audit_logs contiene la fila; el userId registrado es el del admin, no el del usuario baneado"
    why_human: "Misma restricción de DB que el item anterior."
  - test: "Realizar GET /api/admin/audit-logs?entity=EVENT&action=APPROVE con token de admin y con token de usuario AUTHENTICATED"
    expected: "Admin recibe 200 con body { items, total, page, pageSize, totalPages }; AUTHENTICATED recibe 403"
    why_human: "El test e2e que cubre 401/403/200 está en describe.skip. Verificación de filtros también requiere datos reales en la DB."
---

# Phase 7: Sistema de auditoría — Verification Report

**Phase Goal:** Registrar en base de datos cada acción relevante de admins y usuarios sobre las entidades del sistema (eventos, usuarios, avisos, spots) para trazabilidad y auditoría.
**Verified:** 2026-05-22T20:30:00Z
**Status:** passed
**Re-verification:** No — verificación inicial

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Aprobar un evento crea registro `{ action: APPROVE, entity: EVENT, entityId, ip, url }` | VERIFIED | `events.service.ts` línea 264: `this.audit.log({ userId: user.sub, action: 'APPROVE', entity: 'EVENT', entityId: id, req })` — req porta ip/url via AuditService |
| 2 | Banear un usuario crea `{ action: BAN, entity: USER, entityId, userId (admin) }` | VERIFIED | `users.service.ts` línea 84: `this.audit.log({ userId: actor.sub, action: blocked ? 'BAN' : 'UNBAN', entity: 'USER', entityId: id, req })` |
| 3 | `GET /admin/audit-logs` filtra por entidad, acción y fechas, paginado | VERIFIED | `audit.controller.ts` expone `GET admin/audit-logs`; `audit.service.ts` líneas 56–101 implementan todos los filtros + paginación con `$transaction` |
| 4 | Un `AUTHENTICATED` recibe 403 al intentar acceder a los logs | VERIFIED | `audit.controller.ts` líneas 15–16: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN', 'SUPER_ADMIN')` — el guard rechaza AUTHENTICATED |

**Score:** 4/4 truths verificadas

---

### Required Artifacts

| Artifact | Provides | Status | Details |
|----------|----------|--------|---------|
| `apps/api/src/audit/audit.service.ts` | AuditService singleton: `log()` fire-and-forget + `findAll()` con filtros | VERIFIED | 103 líneas; `.catch()` en línea 47 garantiza fire-and-forget; sin `Scope.REQUEST` |
| `apps/api/src/audit/audit.controller.ts` | GET /api/admin/audit-logs restringido a ADMIN/SUPER_ADMIN | VERIFIED | 22 líneas; `@Controller('admin/audit-logs')` + guards correctos |
| `apps/api/src/audit/dto/query-audit.dto.ts` | DTO de filtros y paginación | VERIFIED | 7 campos opcionales con decoradores class-validator/transformer |
| `apps/api/src/audit/audit.module.ts` | AuditModule exportando AuditService | VERIFIED | `exports: [AuditService]` presente |
| `apps/api/prisma/schema.prisma` | Modelo AuditLog y enums AuditAction/AuditEntity | VERIFIED | Líneas 452–492; todos los campos requeridos; `userId Int?` sin FK |
| `apps/api/prisma/migrations/20260522194527_add_audit_log/migration.sql` | Migración SQL que crea audit_logs | VERIFIED | `CREATE TABLE audit_logs` con 4 índices de rendimiento |
| `apps/api/src/events/events.service.ts` | 6 llamadas audit.log en mutaciones de eventos | VERIFIED | `grep -c "this.audit.log"` = 6; CREATE, UPDATE, DELETE, APPROVE, REJECT, BAN |
| `apps/api/src/users/users.service.ts` | 3 llamadas audit.log en BAN/UNBAN/DELETE/UPDATE-rol | VERIFIED | `grep -c "this.audit.log"` = 3; condicional UPDATE-de-rol implementado |
| `apps/api/src/spots/spots.service.ts` | 3 llamadas audit.log con entity AVISO | VERIFIED | `grep -c "entity: 'AVISO'"` = 3 |
| `apps/api/src/heroes/heroes.service.ts` | 3 llamadas audit.log con entity PORTADA | VERIFIED | `grep -c "entity: 'PORTADA'"` = 3 |
| `apps/api/src/main.ts` | `trust proxy 1` antes de helmet | VERIFIED | Línea 20: `app.set('trust proxy', 1)` — antes de `app.use(helmet())` en línea 23 |
| `apps/api/src/app.module.ts` | AuditModule registrado en AppModule | VERIFIED | Línea 27: import + línea 51: `AuditModule` en array imports |
| `apps/api/jest.config.js` | Configuración Jest con ts-jest | VERIFIED | Contiene `testRegex` y `ts-jest` |
| `apps/api/src/audit/audit.service.spec.ts` | 9 tests unitarios de AuditService | VERIFIED | `npx jest --passWithNoTests`: 9/9 tests pasan |
| `apps/api/test/audit.e2e-spec.ts` | Suite e2e con casos 401/403/200 | VERIFIED (compilable) | Existe y compila; marcada `describe.skip` por DB en VPS — ver Human Verification |
| `.planning/REQUIREMENTS.md` | AUD-01..04 definidos con trazabilidad | VERIFIED | Sección `### Audit` con 4 requisitos `[x]` marcados |
| `apps/api/prisma/seed.ts` | LegalDocument PRIVACY_POLICY con declaración Ley 21.719 | VERIFIED | "Registros de auditoría", "24 meses" y "21.719" presentes |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `audit.service.ts` | `prisma.auditLog` | `.create()` en `log()` y `$transaction([findMany,count])` en `findAll()` | VERIFIED | Línea 34: `this.prisma.auditLog.create(...)` + líneas 85–93: `$transaction` |
| `app.module.ts` | `AuditModule` | `imports[]` | VERIFIED | Línea 51 de app.module.ts |
| `main.ts` | `trust proxy` | `app.set('trust proxy', 1)` | VERIFIED | Línea 20 de main.ts, antes de helmet (línea 23) |
| `events.service.ts` | `AuditService.log` | `this.audit.log(...)` en 6 mutaciones | VERIFIED | Sin `await` en ninguna llamada — fire-and-forget correcto |
| `events.module.ts` | `AuditModule` | `imports: [AuthModule, LikesModule, AuditModule]` | VERIFIED | Línea 9 de events.module.ts |
| `users.service.ts` | `AuditService.log` | `this.audit.log(...)` en setBanned/remove/update | VERIFIED | Sin `await`; UPDATE-de-rol condicional (`dto.role !== before.role`) |
| `users.module.ts` | `AuditModule` | `imports: [AuthModule, AuditModule]` | VERIFIED | Línea 8 de users.module.ts |
| `spots.service.ts` | `AuditService.log` con `entity: 'AVISO'` | `this.audit.log(...)` en approve/reject/ban | VERIFIED | 3 llamadas con entity AVISO confirmadas |
| `spots.module.ts` | `AuditModule` | `imports: [AuthModule, AuditModule]` | VERIFIED | Línea 8 de spots.module.ts |
| `heroes.service.ts` | `AuditService.log` con `entity: 'PORTADA'` | `this.audit.log(...)` en approve/reject/ban | VERIFIED | 3 llamadas con entity PORTADA confirmadas |
| `heroes.module.ts` | `AuditModule` | `imports: [AuthModule, AuditModule]` | VERIFIED | Línea 8 de heroes.module.ts |
| `audit.controller.ts` | `AuditService.findAll` | `return this.audit.findAll(query)` | VERIFIED | Único endpoint delegando correctamente al servicio |

---

### Requirements Coverage

| Requirement | Plan | Descripción | Status | Evidencia |
|-------------|------|-------------|--------|-----------|
| AUD-01 | 07-02 | Modelo AuditLog y enums en schema.prisma + migración | SATISFIED | schema.prisma líneas 452–492; migration.sql con `CREATE TABLE audit_logs` |
| AUD-02 | 07-03, 07-04, 07-05 | AuditService singleton; instrumentación de EventsService, UsersService, SpotsService, HeroesService | SATISFIED | 15 llamadas `this.audit.log()` distribuidas en 4 servicios; log() es void sin Scope.REQUEST |
| AUD-03 | 07-03 | trust proxy 1 en main.ts | SATISFIED | main.ts línea 20 antes de helmet |
| AUD-04 | 07-03 | GET /api/admin/audit-logs con filtros, paginado, ADMIN+ | SATISFIED | audit.controller.ts + audit.service.ts findAll() con 7 filtros opcionales |

---

### Anti-Patterns Found

No se encontraron anti-patterns bloqueantes. Verificaciones realizadas:

- Sin `await` delante de ninguna llamada `this.audit.log()` en los 4 servicios instrumentados
- Sin `TODO/FIXME/PLACEHOLDER` en los archivos del módulo audit
- Sin `return null` ni `return {}` sin datos reales en AuditService
- `log()` es `void` (no `async`) — imposible hacer `await` por accidente
- `metadata` solo incluye `{ reason }` en REJECT/BAN — sin dto completo ni `req.body`
- `userId` sin FK en schema.prisma — historial sobrevive al borrado de usuarios

---

### TypeScript y Tests

| Check | Resultado |
|-------|-----------|
| `npx tsc --noEmit -p tsconfig.json` | PASS — 0 errores |
| `npx jest --passWithNoTests --no-coverage` | PASS — 9 tests pasan, 1 suite skipped (e2e DB) |
| `apps/api/test/audit.e2e-spec.ts` compila | VERIFIED — existe y compila; `describe.skip` por DB en VPS |

---

### Human Verification Required

Los checks de código pasan completamente. Los items siguientes necesitan verificación con la base de datos real del VPS porque la suite e2e está marcada `describe.skip` (decisión documentada en 07-03-SUMMARY.md — DB no disponible localmente):

#### 1. UAT: Aprobar un evento genera AuditLog completo

**Test:** Autenticarse como ADMIN en el entorno de staging, hacer `PATCH /api/events/:id/approve`, luego consultar `GET /api/admin/audit-logs?entity=EVENT&action=APPROVE`.
**Expected:** Registro con `action=APPROVE`, `entity=EVENT`, `entityId` correcto, `ip` no nulo (debe reflejar IP real, no 127.0.0.1), `url` = `/api/events/:id/approve`.
**Why human:** La suite e2e está en `describe.skip` — no hay DB MySQL accesible localmente.

#### 2. UAT: Banear un usuario genera AuditLog con userId del admin

**Test:** Como SUPER_ADMIN, hacer `POST /api/users/:id/ban` y consultar los logs.
**Expected:** Registro con `action=BAN`, `entity=USER`, `entityId` = id del usuario baneado, `userId` = id del admin (no del usuario).
**Why human:** Misma restricción de DB.

#### 3. UAT: Control de acceso al endpoint de logs

**Test:** Hacer `GET /api/admin/audit-logs` con token de rol `AUTHENTICATED` y con token de rol `ADMIN`.
**Expected:** AUTHENTICATED recibe 403; ADMIN recibe 200 con `{ items, total, page, pageSize, totalPages }`.
**Why human:** El test e2e que cubre estos casos está en `describe.skip`. El guard está correctamente implementado en código pero la verificación de integración requiere la DB.

---

### Detalles adicionales de implementación verificados

**AuditService.log() fire-and-forget confirmado:**
El método es `void` (no `async`). Internamente llama `this.prisma.auditLog.create(...).catch(err => this.logger.error(...))`. Un fallo de la DB no propaga excepción al caller. Los 9 tests unitarios incluyen el caso de rechazo de promesa — `expect(() => service.log(params)).not.toThrow()` — y pasan.

**AuditEntity con nombres comerciales (AVISO/PORTADA):**
Por decisión de producto documentada en 07-02-SUMMARY.md, los enums usan AVISO (= Spot) y PORTADA (= Hero) en lugar de los nombres de modelo Prisma. Esto es correcto e intencional.

**UsersService.update() audita solo cambios de rol:**
La llamada a `audit.log()` está envuelta en `if (dto.role !== undefined && dto.role !== before.role)` — evita ruido en ediciones de nombre/email sin cambio de rol.

---

### Resumen

Phase 7 completada. Los 5 planes se ejecutaron, todos los artefactos existen y están correctamente conectados, TypeScript compila sin errores, y los 9 tests unitarios pasan. Los 4 UAT criteria del ROADMAP están cubiertos a nivel de código. Tres items quedan para verificación humana en el VPS porque la suite e2e no puede conectar a la DB MySQL local — esta limitación está documentada y es una decisión de diseño aceptada del proyecto.

**ROADMAP.md** actualizado: fila Phase 7 en la tabla de milestone corregida (estaba corrupta con "5/5 | Complete | 2026-05-22"), sección Phase 7 tiene `**Status:** ✅ Complete (2026-05-22)`.
**REQUIREMENTS.md** actualizado: fila `AUD-01..04` en la tabla de Traceability cambiada de `Pending` a `Complete`.

---

_Verified: 2026-05-22T20:30:00Z_
_Verifier: Claude (gsd-verifier)_
