---
status: partial
phase: 18-separar-taxonomia-eventos-articulos
source: [18-VERIFICATION.md]
started: 2026-05-27T00:00:00Z
updated: 2026-05-27T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. GET /api/event-categories devuelve 200 y GET /api/categories devuelve 404
expected: El endpoint nuevo responde con 200 y una lista de 5 categorías de eventos. El endpoint legacy ya no existe y devuelve 404.
result: [pending]

### 2. Estado real de la DB — tablas legacy eliminadas
expected: Las tablas `categories`, `tags`, `_ArticleToTag` ya no existen. `event_categories` tiene 5 filas, `article_tags` tiene N filas con los datos migrados.
result: [pending]

### 3. Dashboard CRUD de categorías persiste en DB
expected: Un admin puede crear/editar/eliminar una categoría de evento desde el dashboard y el cambio se refleja en el sitio público al recargar.
result: [pending]

### 4. sitemap.xml contiene URLs /categoria/* de EventCategories
expected: Las URLs `/categoria/[slug]` de las EventCategories aparecen en el sitemap generado por Next.js.
result: [pending]

### 5. Flujo /crear con eventCategoryId correcto y precio de orden > 0
expected: Al crear un evento desde `/crear` y asignarle una categoría, el campo `eventCategoryId` se envía correctamente. Al crear una orden para ese evento, `unitPrice > 0` (no NaN, no 0).
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
