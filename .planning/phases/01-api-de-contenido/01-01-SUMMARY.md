---
phase: 1
plan: "01-01"
subsystem: api-events
tags: [api, nestjs, prisma, events, moderation]
status: complete
provides: [events-endpoints, event-moderation]
affects: [apps/api/src/events, apps/api/src/app.module.ts]
key_files:
  created:
    - apps/api/src/events/events.module.ts
    - apps/api/src/events/events.controller.ts
    - apps/api/src/events/events.service.ts
    - apps/api/src/events/dto/create-event.dto.ts
    - apps/api/src/events/dto/update-event.dto.ts
    - apps/api/src/events/dto/query-events.dto.ts
    - apps/api/src/events/dto/reject-event.dto.ts
  modified:
    - apps/api/src/app.module.ts
metrics:
  completed: "2026-05-20"
  files_changed: 8
  endpoints_added: 9
---

# Phase 1 · Summary 01-01: Módulo `events` de la API

**One-liner:** El módulo `events` quedó operativo en la API NestJS — 9 endpoints que cubren
el listado público, el detalle, el CRUD del organizador y la moderación por rol; verificado
con un smoke test end-to-end contra la base local.

## Qué se construyó

### Endpoints (`/api/events`)

| Método | Ruta | Acceso | Resultado |
|--------|------|--------|-----------|
| GET | `/events` | público | Eventos aprobados, paginado; filtros `q` / `category` / `region` |
| GET | `/events/admin` | ADMIN+ | Todos los eventos (cualquier estado) + organizador |
| GET | `/events/mine` | autenticado | Eventos del usuario actual |
| GET | `/events/:slug` | público | Detalle de un evento aprobado (404 si no lo está) |
| POST | `/events` | autenticado | Crea evento → `isApproved=false` |
| PATCH | `/events/:id` | dueño o admin | Edita evento + componentes |
| DELETE | `/events/:id` | dueño o admin | Elimina (componentes por cascade) |
| PATCH | `/events/:id/approve` | ADMIN+ | Aprueba; limpia rechazo previo |
| PATCH | `/events/:id/reject` | ADMIN+ | Rechaza con `reason` obligatorio |

### Detalles de implementación

- **Service Prisma** con `EVENT_INCLUDE` (región, comuna, categorías y los 4 componentes).
  Listados públicos paginados vía `$transaction([findMany, count])`.
- **Slug único** generado del título (`slugify` + sufijo numérico ante colisión).
- **Componentes repetibles** (prices/dates/socialLinks/videos): `create` anidado al crear;
  `deleteMany + create` al actualizar (reemplazo completo) solo si vienen en el DTO.
- **Autorización:** `JwtAuthGuard` en las mutaciones; `RolesGuard` + `@Roles()` en la
  moderación y el listado admin; chequeo dueño-o-admin para editar/borrar.
- **DTOs** validados con class-validator, incluidos DTOs anidados para los componentes.
  `UpdateEventDto` se escribió a mano (todo opcional) para no añadir `@nestjs/mapped-types`.

## Verification

`nest build` limpio. Smoke test con la API corriendo + base local (seed):

- `GET /events` → solo eventos aprobados, paginado ✓
- `POST /events` (organizador) → crea con `isApproved=false`; el evento NO aparece en el
  listado público hasta ser aprobado ✓
- `POST /events` sin token → `401`; con DTO inválido → `400` ✓
- `PATCH /:id/approve` → organizador `403`, admin `200`; tras aprobar aparece en `/events` y
  `GET /events/:slug` responde `200` ✓
- `PATCH /:id/reject` sin `reason` → `400`; con motivo → `200`; tras rechazar
  `GET /events/:slug` → `404` ✓
- `DELETE /:id` por el dueño → `{deleted:true}` ✓
- Base devuelta a su estado de seed (3 eventos) tras limpiar los datos de prueba.

## Deviations from Plan

Ninguna. Se añadió `GET /events/admin` (ya contemplado en el plan) para que la moderación sea
testeable de punta a punta sin esperar a la UI.

## Known Stubs / Follow-ups

- **Plan 01-02:** módulos de lectura de taxonomías (regiones, comunas, categorías, tags,
  heroes, spots, artículos).
- **Plan 01-03:** subida de imágenes de evento (decisión de proveedor de almacenamiento
  pendiente).
- `GET /events/:slug` solo sirve eventos aprobados; el organizador todavía no tiene un
  endpoint de detalle de un evento propio sin aprobar (se evaluará en Phase 3).

## Self-Check: PASSED

- `apps/api/src/events/` (module, controller, service, 4 DTOs) — FOUND
- `EventsModule` registrado en `app.module.ts` — CONFIRMED
- `nest build` → `dist/` plano — CONFIRMED
- 9 endpoints probados con códigos esperados (200/400/401/403/404) — CONFIRMED
