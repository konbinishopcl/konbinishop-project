---
phase: 8
slug: schema-v2
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-24
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (ya configurado en apps/api) |
| **Config file** | `apps/api/jest.config.js` |
| **Quick run command** | `cd apps/api && pnpm prisma validate` |
| **Full suite command** | `cd apps/api && pnpm prisma migrate dev --name dry-run && pnpm prisma generate && pnpm tsc --noEmit` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm prisma validate`
- **After every plan wave:** Run `pnpm prisma generate && pnpm tsc --noEmit`
- **Before `/gsd:verify-work`:** Full suite + `pnpm prisma migrate dev` debe completar sin error
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 8-01-01 | 01 | 1 | SCH-01 | schema | `pnpm prisma validate` | Y | pending |
| 8-02-00 | 02 | 2 | SCH-02 | checkpoint | (human-verify: confirmar DB seed-only) | Y | pending |
| 8-02-01 | 02 | 2 | SCH-02 | schema | `pnpm prisma validate` | Y | pending |
| 8-02-02 | 02 | 2 | SCH-02 | seed | `pnpm prisma:seed` | Y | pending |
| 8-02-03 | 02 | 2 | SCH-02 | compile | `pnpm tsc --noEmit && pnpm prisma:seed` | Y | pending |
| 8-03-01 | 03 | 3 | SCH-03 | schema | `pnpm prisma validate` | Y | pending |
| 8-04-01 | 04 | 4 | SCH-04 | schema | `pnpm prisma validate` | Y | pending |
| 8-05-01 | 05 | 5 | SCH-05 | schema | `pnpm prisma validate` | Y | pending |
| 8-05-02 | 05 | 5 | SCH-05 | schema+migrate | `pnpm prisma validate && pnpm prisma migrate dev && pnpm tsc --noEmit && pnpm prisma:seed` | Y | pending |
| 8-06-01 | 06 | 6 | SCH-06 | schema | `pnpm prisma validate` | Y | pending |
| 8-ALL   | ALL | — | ALL | compile | `pnpm tsc --noEmit` | Y | pending |
| 8-MIGRATE | ALL | — | ALL | migrate | `pnpm prisma migrate dev` | Y | pending |

*Status: pending / green / red / flaky*

**Wave numbering** alineado con frontmatter de cada PLAN (6 olas secuenciales: 01→02→03→04→05→06, cada plan depende del anterior por compartir `apps/api/prisma/schema.prisma`).

---

## Wave 0 Requirements

- [x] `apps/api/prisma/schema.prisma` — base existente, se modifica en cada plan (infraestructura Prisma + tsc cubre toda validación)
- [x] `apps/api/jest.config.js` — Jest configurado (no se usan tests unitarios en esta fase de schema; verificación es vía prisma validate + tsc)
- [x] `pnpm prisma` y `pnpm tsc` disponibles en `apps/api` (confirmado en SUMMARYs previos)

*Existing infrastructure covers all phase requirements — Prisma + TypeScript compiler son la suite de validación para una fase de schema. No se requiere Wave 0 setup adicional.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Confirmar que la DB es seed-only antes del migrate reset | SCH-02 | Requiere conocimiento del entorno (¿hay datos reales en VPS?) — no inspectable solo desde código | Plan 02 Task 0 (checkpoint:human-verify): el usuario confirma `approved seed-only`, `approved with backup`, o aborta |
| Seeder de geografía Chile ejecuta sin error | SCH-02 | Requiere conexión a DB real | `cd apps/api && pnpm prisma:seed` |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies (Task 0 de Plan 02 es checkpoint humano por diseño, no requiere automated)
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references (no hay MISSING en esta fase)
- [x] No watch-mode flags
- [x] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
