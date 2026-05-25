---
phase: 14-servicios-y-crm
verified: 2026-05-25T00:00:00Z
status: passed
score: 5/5 requirements verified
re_verification: false
gaps: []
---

# Phase 14: Servicios y CRM — Verification Report

**Phase Goal:** Formularios de cotización (photography/content-creators) con opciones configurables por admin, más CRM interno unificado con pipeline kanban. Integración: POST /contact y POST /services/* crean CrmEntry en la misma transacción.
**Verified:** 2026-05-25
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| #  | Truth                                                                                    | Status     | Evidence                                                                                                    |
|----|------------------------------------------------------------------------------------------|------------|-------------------------------------------------------------------------------------------------------------|
| 1  | POST /services/photography y POST /services/content-creators son públicos (sin guard)    | VERIFIED   | Controller lines 18–28: no @UseGuards on those endpoints                                                   |
| 2  | GET /services/*/options devuelve solo active=true ordenado por order asc (público)       | VERIFIED   | getActiveOptions() line 56: `where: { type, active: true }, orderBy: { order: 'asc' }`                    |
| 3  | GET /services/photography y content-creators (admin) listan paginado con options         | VERIFIED   | listRequests() lines 64–78: `include: { options: ... }`, paginated; endpoints guarded ADMIN+               |
| 4  | CRUD admin de ServiceOptions funcional con soft-delete                                   | VERIFIED   | createOption/updateOption/deleteOption all implemented; deleteOption checks `_count.requests` for soft-del |
| 5  | GET /crm paginado+filtrado, GET /crm/:id con source polimórfico                         | VERIFIED   | CrmService.list() with where filters; findOne() resolves CONTACT→contactMessage, else→serviceRequest       |
| 6  | PATCH /crm/:id/stage — stageReason requerido si stage=LOST                              | VERIFIED   | CrmService.updateStage() line 75: throws BadRequestException if LOST && !stageReason                       |
| 7  | POST /crm/:id/notes y GET /crm/:id/notes funcionan                                      | VERIFIED   | addNote() and listNotes() fully implemented; controller wired at lines 48–62                               |
| 8  | No existe DELETE /crm/:id                                                                | VERIFIED   | CrmController has no @Delete decorator anywhere                                                             |
| 9  | ContactService.create() crea ContactMessage + CrmEntry en $transaction callback form     | VERIFIED   | contact.service.ts line 18: `this.prisma.$transaction(async (tx) => {...})`; CrmEntry created inside       |
| 10 | ServicesService.createRequest() usa $transaction callback form (para connect many-to-many)| VERIFIED  | services.service.ts line 33: `this.prisma.$transaction(async (tx) => {...})`; options.connect inside tx    |
| 11 | ContactModule y ServicesModule NO importan CrmModule (usan prisma directamente)          | VERIFIED   | contact.module.ts imports: [AuthModule] only; services.module.ts imports: [AuthModule] only                |
| 12 | ServicesModule y CrmModule registrados en AppModule                                      | VERIFIED   | app.module.ts lines 34–35: `ServicesModule`, `CrmModule` imported; lines 66–67: in imports[] array         |

**Score:** 12/12 truths verified

---

### Required Artifacts

| Artifact                                                    | Expected                                         | Status     | Details                                               |
|-------------------------------------------------------------|--------------------------------------------------|------------|-------------------------------------------------------|
| `apps/api/src/services/services.module.ts`                 | NestJS module ServicesModule                     | VERIFIED   | Exists, imports AuthModule, exports ServicesService   |
| `apps/api/src/services/services.service.ts`                | ServicesService with createRequest, getActiveOptions, CRUD | VERIFIED | 120 lines, all methods implemented substantively |
| `apps/api/src/services/services.controller.ts`             | 12 endpoints (2 POST public, 2 GET options, 2 GET admin, 6 CRUD options admin) | VERIFIED | All 12 endpoints present and correctly guarded |
| `apps/api/src/crm/crm.module.ts`                           | NestJS module CrmModule                          | VERIFIED   | Exists, imports AuthModule                            |
| `apps/api/src/crm/crm.service.ts`                          | CrmService with list, findOne, updateStage, addNote, listNotes | VERIFIED | 111 lines, all 5 methods fully implemented |
| `apps/api/src/crm/crm.controller.ts`                       | 5 CRM endpoints all ADMIN+                       | VERIFIED   | @UseGuards at controller level, all 5 endpoints present |
| `apps/api/src/contact/contact.service.ts`                  | create() with $transaction creating CrmEntry     | VERIFIED   | Lines 18–31: callback transaction, CrmEntry created   |
| `apps/api/src/app.module.ts`                               | ServicesModule + CrmModule in imports[]          | VERIFIED   | Lines 34–35 imports, lines 66–67 in array             |
| `.planning/REQUIREMENTS.md`                                | SVC-01..05 documented in "Servicios y CRM" section | VERIFIED | Section present at line 230, all 5 requirements documented |

---

### Key Link Verification

| From                          | To                          | Via                           | Status   | Details                                                        |
|-------------------------------|-----------------------------|-------------------------------|----------|----------------------------------------------------------------|
| `app.module.ts`               | `ServicesModule`            | import + imports[] array      | WIRED    | Line 34 import, line 66 in array                              |
| `app.module.ts`               | `CrmModule`                 | import + imports[] array      | WIRED    | Line 35 import, line 67 in array                              |
| `services.controller.ts`      | `ServicesService`           | constructor injection         | WIRED    | `private readonly services: ServicesService`                   |
| `crm.controller.ts`           | `CrmService`                | constructor injection         | WIRED    | `private readonly crm: CrmService`                             |
| `contact.service.ts`          | `prisma.$transaction`       | callback form, creates CrmEntry | WIRED  | No CrmModule import — uses PrismaService directly (D-19)       |
| `services.service.ts`         | `prisma.$transaction`       | callback form with connect     | WIRED    | No CrmModule import — uses PrismaService directly (D-23)       |
| `crm.service.ts` `findOne()`  | `contactMessage` / `serviceRequest` | polymorphic by sourceType | WIRED | Lines 58–66: branches on CrmType.CONTACT vs others             |

---

### Requirements Coverage

| Requirement | Source Plan | Description                                             | Status    | Evidence                                                             |
|-------------|-------------|---------------------------------------------------------|-----------|----------------------------------------------------------------------|
| SVC-01      | 14-01       | Public POST endpoints + public GET options              | SATISFIED | Controller lines 18–40: no guards on 4 public endpoints              |
| SVC-02      | 14-01       | Admin CRUD ServiceOptions + admin GET requests          | SATISFIED | Controller lines 42–112: all guarded ADMIN+; service all 4 methods   |
| SVC-03      | 14-02       | CRM list/findOne/updateStage/notes endpoints            | SATISFIED | CrmController 5 endpoints; CrmService 5 methods; LOST validation     |
| SVC-04      | 14-03       | ContactService.create() → transaction ContactMessage+CrmEntry | SATISFIED | contact.service.ts lines 18–31; backwards-compatible response   |
| SVC-05      | 14-04       | ServicesService.createRequest() → callback $transaction | SATISFIED | services.service.ts lines 33–49; connect inside tx (D-22 compliant)  |

---

### Anti-Patterns Found

None detected. No TODO/FIXME/placeholder comments found in key files. No stub return patterns (return null, return [], empty handlers). Both transaction implementations are substantive with real DB operations.

---

### Human Verification Required

1. **GET /services/photography/options route ordering**
   - Test: Send GET /services/photography before and after GET /services/photography/options to confirm NestJS resolves the specific route `photography/options` correctly (not matched as `:id` param on a hypothetical `/:id` route).
   - Expected: Both routes resolve independently; `options` is not treated as a path param.
   - Why human: NestJS route precedence is deterministic by declaration order. Declaration order in controller is correct (options routes declared before bare GET routes), but functional confirmation requires a running server.

2. **stageReason enforcement at runtime**
   - Test: PATCH /crm/1/stage with `{"stage":"LOST"}` (no stageReason).
   - Expected: 400 Bad Request with message "stageReason es requerido cuando stage=LOST".
   - Why human: Validation is in service layer, not DTO — a running test would confirm the guard path executes.

---

## Summary

All 5 requirements (SVC-01 through SVC-05) are fully implemented and wired:

- **SVC-01/SVC-02**: ServicesModule has 12 endpoints correctly separated between public (no guards) and admin (JwtAuthGuard + RolesGuard + @Roles). The `getActiveOptions()` method filters `active=true` and orders by `order asc`. Soft-delete logic in `deleteOption()` correctly checks linked requests before deciding.

- **SVC-03**: CrmModule exposes all 5 required endpoints with ADMIN+ protection at controller class level. The `findOne()` method resolves source polymorphically (CONTACT → ContactMessage, PHOTOGRAPHY/CONTENT → ServiceRequest with options). The LOST stage validation is enforced at the service layer. No DELETE /crm/:id endpoint exists.

- **SVC-04**: ContactService.create() uses the callback form of `$transaction`, creating both ContactMessage and CrmEntry atomically. CrmModule is not imported (PrismaService used directly, D-19 compliant). Response remains unchanged (only ContactMessage returned).

- **SVC-05**: ServicesService.createRequest() uses the callback form of `$transaction` (not the batch array form), which is required for the many-to-many `options: { connect }` operation (D-22 compliant). CrmModule is not imported (D-23 compliant). The `crmTypeMap` is used explicitly as specified by D-21.

The phase goal is fully achieved.

---

_Verified: 2026-05-25_
_Verifier: Claude (gsd-verifier)_
