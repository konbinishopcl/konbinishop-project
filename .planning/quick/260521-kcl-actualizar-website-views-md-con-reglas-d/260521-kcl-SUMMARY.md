---
phase: quick
plan: 260521-kcl
type: doc-update
tags: [documentation, website-views, spots, heroes, orders, payments, auth, catalog]
key-files:
  modified:
    - docs/WEBSITE-VIEWS.md
decisions: []
metrics:
  duration: ~15min
  completed: 2026-05-21
  tasks: 1
  files_modified: 1
---

# Quick Task 260521-kcl: Actualizar WEBSITE-VIEWS.md

**One-liner:** WEBSITE-VIEWS.md expandido con flujos de carrito/pago (Transbank), upsell post-wizard, spots/heroes (precios y cuotas), dashboard de taxonomías y páginas de recuperación de contraseña.

## Sections Added or Updated

| Section | Change |
| --- | --- |
| `/crear` — Selección de región y comuna | Nueva subsección: cascada `GET /regions` → `GET /communes?region=<slug>` |
| Upsell post-wizard de evento | Nueva sección: lógica de cuotas spots/heroes post-`POST /events` |
| `/carrito` — Carrito de compras | Nueva sección: `GET /orders/draft`, ítems por tipo, precios congelados, CRUD, flujo de pago |
| Pasarelas de pago | Nueva sección: Transbank WebPay Plus, arquitectura multi-gateway, vistas `/checkout/success` y `/checkout/failed` |
| `/dashboard/regions` | Nueva entrada: CRUD de regiones (PlaceholderView, ADMIN+) |
| `/dashboard/communes` | Nueva entrada: CRUD de comunas con filtro por slug (PlaceholderView, ADMIN+) |
| `/dashboard/categories` | Actualizada: agregado detalle de `pricePerDay`, campos CRUD completos |
| `/dashboard/tags` | Nueva entrada: CRUD de tags, nota sobre asociación a artículos (PlaceholderView, ADMIN+) |
| `/recuperar-contrasena` | Nueva auth page: `POST /auth/forgot-password`, respuesta 200 siempre |
| `/reset-password/:token` | Nueva auth page: `POST /auth/reset-password`, token SHA-256 con expiración |
| `/login` — nota sin OTP | Agregada nota explícita: solo email + contraseña, sin código ni 2FA |
| Flujo organizador | Actualizado con carrito, pago y moderación como pasos reales (no "pendiente") |
| Notas de implementación futura | Eliminada línea obsoleta sobre flujo de pago sin vista |

## Deviations from Plan

None — plan executed exactly as written.

## Commit

- `669daaa`: docs(quick-260521-kcl): actualizar WEBSITE-VIEWS.md con flujos de spots, heroes, carrito y pagos

## Self-Check: PASSED

- `docs/WEBSITE-VIEWS.md` — FOUND and modified
- Commit `669daaa` — FOUND
- Verification grep (9 terms, min 7 matches) — PASSED: 15 matches
