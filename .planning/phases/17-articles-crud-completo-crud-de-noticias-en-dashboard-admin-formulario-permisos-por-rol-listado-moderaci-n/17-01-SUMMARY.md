---
phase: 17-articles-crud
plan: 01
status: complete
commit: 590cf04
---

# 17-01 SUMMARY — API: GET /articles/mine + ownership PATCH/DELETE

## What was done

- Agregado endpoint `GET /articles/mine` (JwtAuthGuard + OrgContextGuard) antes de `@Get(':slug')` para evitar match de ruta
- Agregado `findMine(user, orgContext)` en `ArticlesService` — filtra por `userId = orgContext?.orgId ?? user.sub`
- Agregado helper privado `assertOwnerOrAdmin(article, user, orgContext)` — ForbiddenException si no es owner ni admin; editoriales (userId=null) solo ADMIN
- `PATCH /articles/:id` y `DELETE /articles/:id` relajados de `RolesGuard (ADMIN+)` a `JwtAuthGuard + OrgContextGuard`, con ownership check en service
- Moderación (`approve`, `reject`, `ban`) y `POST /` (create editorial) siguen siendo ADMIN-only — 4 ocurrencias de `@Roles` sin cambio

## Files modified

- `apps/api/src/articles/articles.controller.ts` — nuevo endpoint mine, guards relajados en PATCH/DELETE
- `apps/api/src/articles/articles.service.ts` — findMine, assertOwnerOrAdmin, update/remove con user+orgContext

## Verification

- Build limpio: `pnpm build` sin errores TS
- `@Get('mine')` en línea 46, antes de `@Get(':slug')` en línea 54
- `assertOwnerOrAdmin` definido + 2 usos (update:157, remove:179)
- `@Roles` aparece exactamente 4 veces (POST, approve, reject, ban)
