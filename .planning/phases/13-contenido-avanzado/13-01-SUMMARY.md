---
phase: 13-contenido-avanzado
plan: "01"
subsystem: articles
tags: [sponsored-articles, moderation, notifications, content]
dependency_graph:
  requires: [12-03]
  provides: [CNT-01]
  affects: [articles-module]
tech_stack:
  added: []
  patterns: [optional-jwt-auth, org-context, fire-and-forget-notifications, pub-status-filter]
key_files:
  created:
    - apps/api/src/articles/dto/create-sponsored-article.dto.ts
    - apps/api/src/articles/dto/reject-article.dto.ts
  modified:
    - apps/api/src/articles/articles.service.ts
    - apps/api/src/articles/articles.controller.ts
    - apps/api/src/articles/articles.module.ts
    - apps/api/src/articles/dto/query-articles.dto.ts
decisions:
  - "D-04 simplificación intencional: notificaciones ARTICLE_* usan siempre userId del artículo, sin verificar User.type (Article no tiene orgId, a diferencia de Events/Spots/Heroes)"
  - "findBySlug recibe user opcional para gate de status — visitantes no pueden leer DRAFT/PENDING/REJECTED/BANNED por slug"
  - "findById NO tiene gate de status — usado internamente por approve/reject/ban que requieren ver todos los estados"
  - "POST /articles/sponsored declarado antes de POST /articles para evitar ambigüedad de rutas en NestJS"
metrics:
  duration_minutes: 18
  completed_date: "2026-05-25"
  tasks_completed: 3
  files_changed: 6
requirements:
  - CNT-01
---

# Phase 13 Plan 01: Artículos Patrocinados + Moderación Admin Summary

**One-liner:** Flujo completo de artículos patrocinados con DRAFT→moderación ADMIN, endpoints approve/reject/ban, notificaciones ARTICLE_APPROVED/REJECTED/BANNED fire-and-forget, campo derivado `isSponsored`, y filtrado dual público/admin en GET /articles.

## What Was Built

### DTOs nuevos
- `CreateSponsoredArticleDto` — extiende CreateArticleDto con campo `eventId?: number` para vincular evento relacionado (D-01)
- `RejectArticleDto` — DTO reutilizado para reject y ban con `reason: string` requerido
- `QueryArticlesDto` extendido con `status?: PublicationStatus` para filtrado admin

### ArticlesService extendido
- `createSponsored(dto, user, orgContext)` — crea artículo con `status=DRAFT`, `userId=ownerId` (o `orgId` si X-Org-Context). La transición DRAFT→PENDING_MODERATION ocurre al pagar (Phase 12-03).
- `approve(id, user)` — actualiza a APPROVED + emite ARTICLE_APPROVED al userId del artículo
- `reject(id, reason, user)` — actualiza a REJECTED + statusReason + emite ARTICLE_REJECTED
- `ban(id, reason, user)` — actualiza a BANNED + statusReason + emite ARTICLE_BANNED
- `findAll(query, user?)` extendido — admin/SUPER_ADMIN ve todos los estados (filtrable por `?status=`); público solo APPROVED
- `findBySlug(slug, user?)` extendido — gate de status para visitantes públicos (seguridad)
- `findById(id)` — inyecta `isSponsored` sin gate (uso interno)
- Campo derivado `isSponsored: a.userId !== null` en todas las respuestas

### ArticlesController extendido
- `GET /articles` — `OptionalJwtAuthGuard` + user opcional → admin ve todos los estados
- `GET /articles/:slug` — `OptionalJwtAuthGuard` + gate de status para público
- `POST /articles/sponsored` — `JwtAuthGuard + OrgContextGuard` → crea artículo patrocinado
- `PATCH /articles/:id/approve` — `RolesGuard ADMIN+` → aprueba artículo patrocinado
- `PATCH /articles/:id/reject` — `RolesGuard ADMIN+` + RejectArticleDto → rechaza con motivo
- `PATCH /articles/:id/ban` — `RolesGuard ADMIN+` + RejectArticleDto → banea con motivo

### ArticlesModule
- Agrega `NotificationsModule` a imports (NotificationsService no es global)

## Deviations from Plan

None — plan executed exactly as written, with one minor addition: `create()` y `update()` también retornan `isSponsored` para consistencia de respuesta (no estaba explícito en el plan pero es necesario para coherencia de la API).

## Known Stubs

None — todos los endpoints están completamente implementados y cableados.

## Self-Check: PASSED

- `apps/api/src/articles/dto/create-sponsored-article.dto.ts` — FOUND
- `apps/api/src/articles/dto/reject-article.dto.ts` — FOUND
- Commit `6d2d358` — FOUND (`git log --oneline -1` confirma)
- `pnpm build` — exits 0
- `pnpm tsc --noEmit` — exits 0
- grep PublicationStatus.APPROVED count >= 2 — count: 3 (findAll where, findBySlug gate, findById comment context)
