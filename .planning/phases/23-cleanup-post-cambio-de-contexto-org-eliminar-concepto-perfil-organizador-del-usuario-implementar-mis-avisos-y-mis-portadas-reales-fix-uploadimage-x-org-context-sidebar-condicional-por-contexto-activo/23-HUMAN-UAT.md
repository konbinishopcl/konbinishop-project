---
status: partial
phase: 23-cleanup-post-cambio-de-contexto-org
source: [23-VERIFICATION.md]
started: 2026-05-28T00:00:00Z
updated: 2026-05-28T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. 404 en /cuenta/organizador
expected: Navegar a `/cuenta/organizador` con la app corriendo debe retornar 404 (directorio eliminado)
result: [pending]

### 2. X-Org-Context header en upload de imagen
expected: Cambiar a contexto org, subir una imagen, verificar en DevTools > Network que el POST `/api/upload` incluye el header `X-Org-Context` con el ID de la org activa
result: [pending]

### 3. Filtrado por tab en mis-avisos con data real
expected: Un aviso (spot) APPROVED con `expirationDate` pasada debe aparecer solo en "Expirados", no en "Activos"
result: [pending]

### 4. Render de titleAccent en mis-portadas
expected: Una portada (hero) con `titleAccent` no-null debe mostrar el título concatenado en la tarjeta
result: [pending]

## Summary

total: 4
passed: 0
issues: 0
pending: 4
skipped: 0
blocked: 0

## Gaps
