---
phase: 07-sistema-de-auditoria
plan: 01
subsystem: testing, api, docs
tags: [jest, ts-jest, nestjs, prisma, ley-21719, audit, requirements]

# Dependency graph
requires:
  - phase: 06-hardening-produccion
    provides: estructura base API NestJS lista para tests
provides:
  - AUD-01..04 definidos formalmente en REQUIREMENTS.md con trazabilidad a Phase 7
  - Jest 29 + ts-jest configurado y ejecutable en apps/api (jest.config.js)
  - LegalDocument PRIVACY_POLICY seeder con declaración de auditoría (Ley 21.719)
affects:
  - 07-02 (tests de AuditService usan esta config Jest)
  - 07-03 (e2e tests del endpoint usan esta config Jest)

# Tech tracking
tech-stack:
  added:
    - jest@^29.7.0
    - ts-jest@^29.1.0
    - "@types/jest@^29.5.0"
    - "@nestjs/testing@^11.0.1"
    - supertest@^7.0.0
    - "@types/supertest@^6.0.0"
  patterns:
    - "Jest configurado con ts-jest en CommonJS mode para NestJS 11"
    - "LegalDocument seeder como upsert idempotente"
    - "Ley 21.719: IP/userAgent declarados como datos personales con retención 24 meses"

key-files:
  created:
    - apps/api/jest.config.js
  modified:
    - .planning/REQUIREMENTS.md
    - apps/api/package.json
    - apps/api/prisma/seed.ts
    - pnpm-lock.yaml

key-decisions:
  - "pnpm se usa para instalar deps en el monorepo (npm falla por postinstall de @nestjs/cli que llama a husky)"
  - "AuditLog.userId sin FK explícita en Prisma para preservar historial ante borrado de usuario"
  - "Enum AuditEntity usa SPOT y HERO (nombres de modelo Prisma, no nombres comerciales UI)"
  - "Retención de AuditLog establecida en 24 meses en Política de Privacidad"

patterns-established:
  - "Jest: usar pnpm --filter konbini-nest-api add -D para instalar en el monorepo"
  - "Ley 21.719: cualquier nuevo campo de dato personal requiere actualizar PRIVACY_POLICY en seed.ts"

requirements-completed: [AUD-01, AUD-02, AUD-03, AUD-04]

# Metrics
duration: 3min
completed: 2026-05-22
---

# Phase 7 Plan 1: Preparación auditoría — requisitos, Jest y Política de Privacidad

**AUD-01..04 formalizados en REQUIREMENTS.md, Jest 29 + ts-jest operativo en apps/api, y declaración de auditoría (IP/userAgent, retención 24 meses) agregada al seeder de PRIVACY_POLICY conforme a Ley 21.719**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-22T19:45:17Z
- **Completed:** 2026-05-22T19:48:45Z
- **Tasks:** 3
- **Files modified:** 5 (REQUIREMENTS.md, jest.config.js, package.json, seed.ts, pnpm-lock.yaml)

## Accomplishments

- AUD-01..04 definidos en sección `### Audit` de REQUIREMENTS.md con trazabilidad a Phase 7 y cobertura actualizada a 29 requisitos v1
- `apps/api/jest.config.js` creado con ts-jest, testRegex para `.spec.ts` y `.e2e-spec.ts`, y scripts `test`, `test:audit`, `test:e2e` agregados a package.json
- Seeder `PRIVACY_POLICY` agregado a seed.ts como `upsert` idempotente con párrafo de auditoría Ley 21.719 (IP/userAgent, retención 24 meses)

## Task Commits

1. **Task 1: Definir AUD-01..04 en REQUIREMENTS.md** - `6371970` (docs)
2. **Task 2: Configurar Jest en el API NestJS** - `b0a687f` (chore)
3. **Task 3: Declarar logging de auditoría en PRIVACY_POLICY** - `b8a2da1` (docs)

## Files Created/Modified

- `apps/api/jest.config.js` — configuración base de Jest con ts-jest para NestJS
- `apps/api/package.json` — scripts test/test:audit/test:e2e + devDeps Jest
- `.planning/REQUIREMENTS.md` — sección ### Audit con AUD-01..04, trazabilidad y cobertura 29
- `apps/api/prisma/seed.ts` — upsert LegalDocument PRIVACY_POLICY con declaración de auditoría
- `pnpm-lock.yaml` — lockfile actualizado con nuevas devDeps

## Decisions Made

- **pnpm en vez de npm para instalar deps**: el monorepo usa `"packageManager": "pnpm@10.11.0"`; `npm install` falla por el script `prepare: husky` del CLI de NestJS. Se usó `pnpm --filter konbini-nest-api add -D`.
- **AuditEntity usa SPOT y HERO** (no AVISO/PORTADA): los enums siguen el nombre del modelo Prisma, no el nombre comercial de UI. Más mantenible cuando los nombres de UI cambien.
- **Retención 24 meses**: definida en la Política de Privacidad; la limpieza automática se difiere a v2.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Creación de upsert PRIVACY_POLICY desde cero**
- **Found during:** Task 3 (Declarar logging de auditoría en PRIVACY_POLICY)
- **Issue:** El plan asumía que el seed.ts ya contenía un LegalDocument PRIVACY_POLICY existente. En realidad el modelo `LegalDocument` existe en el schema de Prisma y hay controladores legales, pero el seed.ts nunca creó ningún LegalDocument.
- **Fix:** Se agregó un `prisma.legalDocument.upsert` completo con content mínimo que incluye exactamente el párrafo de auditoría especificado. Tanto `create` como `update` usan el mismo `content` para que re-ejecutar el seed actualice la declaración.
- **Files modified:** `apps/api/prisma/seed.ts`
- **Verification:** `grep -q "Registros de auditoría"` y `grep -q "24 meses"` pasan
- **Committed in:** `b8a2da1` (Task 3 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Desviación necesaria para cumplir el objetivo del plan. El resultado final es equivalente al esperado y cumple todos los acceptance criteria.

## Issues Encountered

Ninguno — todas las deviaciones manejadas automáticamente.

## User Setup Required

Ninguno — no se requiere configuración de servicios externos.

## Next Phase Readiness

- Jest está operativo: los planes 07-02 y 07-03 pueden escribir tests inmediatamente
- AUD-01..04 formalizados: la trazabilidad de Phase 7 está completa
- PRIVACY_POLICY declara la auditoría: agregar columnas `ip`/`userAgent` a AuditLog no viola Ley 21.719

---
*Phase: 07-sistema-de-auditoria*
*Completed: 2026-05-22*
