---
status: partial
phase: 19-rediseno-completo-de-noticias
source: [19-VERIFICATION.md]
started: 2026-05-27T22:30:00Z
updated: 2026-05-27T22:30:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Mega menú hover animation
expected: Al hacer hover sobre "Noticias" en el navbar, aparece el mega menú con animación megaIn (fadeIn + translateY), se cierra al mover el mouse fuera del wrapper .mega-bg
result: [pending]

### 2. Hub page /noticias con datos reales
expected: La página muestra hero con el primer artículo con imagen, columna "Picks de la redacción" con 3 artículos numerados, grid "Lo último", sección sponsored si existe, rails por categoría (anime/manga/cine)
result: [pending]

### 3. Página de categoría /noticias/categoria/anime
expected: Header con eyebrow "NOTICIAS · アニメ", h1 "Anime." con punto accent, conteo de artículos, decoración .jp; filtros funcionan (Origen, Buscar, Grid/Lista, Ordenar)
result: [pending]

### 4. notFound() para slug inválido
expected: /noticias/categoria/slug-inexistente retorna 404 de Next.js
result: [pending]

### 5. Like button toast cuando no autenticado
expected: Al hacer click en el corazón del ArticleCard sin sesión → toast "Inicia sesión para dar like"
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0
blocked: 0

## Gaps
