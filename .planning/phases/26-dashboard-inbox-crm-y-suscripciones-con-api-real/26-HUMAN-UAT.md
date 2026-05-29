---
status: partial
phase: 26-dashboard-inbox-crm-y-suscripciones-con-api-real
source: [26-VERIFICATION.md]
started: 2026-05-29T00:00:00Z
updated: 2026-05-29T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Archive → Delete behavior
expected: Clicking "Eliminar" en un mensaje de contacto muestra confirm dialog, y al confirmar llama DELETE /contact/:id eliminando el mensaje permanentemente. El mensaje desaparece de la lista. Behavior intencional documentado en CONTEXT.md (no existe endpoint de archive en el backend).

result: [pending]

### 2. "Ver" suscriptor abre modal (no navega)
expected: El botón "Ver" en SubsSection abre un modal inline con detalle del suscriptor (usuario/org, email, estado, fechas ciclo, créditos). No navega a una ruta diferente. Behavior intencional: sigue el patrón modal del dashboard (Phase 25).

result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
