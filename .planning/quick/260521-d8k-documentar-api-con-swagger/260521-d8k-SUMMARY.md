---
phase: quick
plan: d8k
subsystem: api-docs
tags: [api, nestjs, swagger, openapi]
status: complete
key_files:
  modified:
    - apps/api/package.json
    - apps/api/nest-cli.json
    - apps/api/src/main.ts
    - apps/api/src/auth/auth.controller.ts
    - apps/api/src/users/users.controller.ts
    - apps/api/src/events/events.controller.ts
    - apps/api/src/catalog/catalog.controller.ts
    - apps/api/src/uploads/uploads.controller.ts
metrics:
  completed: "2026-05-21"
---

# Quick Task d8k: Documentar la API con Swagger

**One-liner:** La API NestJS expone documentación OpenAPI/Swagger — UI navegable en `/docs`
y especificación JSON en `/docs-json`.

## Qué se hizo

- **`@nestjs/swagger`** instalado en `apps/api`.
- **`nest-cli.json`** — plugin `@nestjs/swagger` activado: introspecta los DTOs y documenta
  sus propiedades automáticamente (sin `@ApiProperty` manual).
- **`main.ts`** — `SwaggerModule` configurado con `DocumentBuilder` (título "Konbini API",
  versión 1.0, `addBearerAuth`); la UI se sirve en `/docs` y el JSON en `/docs-json`
  (fuera del prefijo `/api`).
- **Controllers anotados**: `@ApiTags` por controller (auth, users, events, catalog,
  uploads), `@ApiBearerAuth` en los endpoints protegidos por JWT, `@ApiOperation` con un
  resumen por endpoint, y `@ApiConsumes('multipart/form-data')` + `@ApiBody` en
  `POST /api/upload`.

## Verificación

- `nest build` compila sin errores.
- Smoke test (API en :3399): `GET /docs` → `200 text/html` (UI de Swagger);
  `GET /docs-json` → `200 application/json`. El OpenAPI lista las 23 rutas de la API
  (auth, events, moderación, catálogo, upload, users).

## Notas

- La UI queda en `http://localhost:3333/docs` (no lleva el prefijo `/api`, igual que los
  estáticos de `/uploads`).
- El plugin de `nest-cli.json` documenta los DTOs en cada build; no hace falta decorar las
  propiedades a mano.
