# Konbini

## What This Is

Plataforma chilena de publicación de eventos donde organizadores se registran y pagan para publicar sus eventos. Los administradores moderan y gestionan el contenido desde un dashboard interno (Next.js) y Strapi. El público general puede explorar y buscar eventos en el sitio web (Nuxt).

## Core Value

Organizadores pueden publicar eventos pagando por cada publicación, que queda visible al público tras aprobación del administrador.

## Requirements

### Validated

- ✓ Registro y autenticación de usuarios (organizadores y admins) — existente
- ✓ Creación de eventos en formulario multi-paso desde el sitio web — existente
- ✓ Flujo de aprobación de eventos (is_approved, is_rejected, expiration_date) en dashboard — existente
- ✓ Panel de administración (dashboard Next.js) para gestión de eventos, usuarios, categorías, regiones, comunas, spots, artículos, heroes y tags — existente
- ✓ Sitio web público (Nuxt) con listado de eventos — existente
- ✓ Integración con Cloudinary para imágenes y Strapi como CMS headless — existente
- ✓ Monorepo Turborepo con tres apps: strapi, dashboard, website — existente

### Active

- [ ] Integración de pagos por evento — múltiples pasarelas (Mercado Pago, Stripe, Transbank/Webpay); flujo: Crear → Pagar → Moderar
- [ ] Sistema de emails transaccionales con MJML + Mailgun (mismo stack que waldo-project, con colores de marca Konbini); notificaciones: pago confirmado, evento aprobado/rechazado, etc.
- [ ] Búsqueda de eventos funcional en el sitio web público (SearchDefault.vue actualmente es un stub vacío)
- [ ] Panel del organizador — el organizador puede ver y gestionar sus propios eventos desde su cuenta
- ✓ Seguridad — restaurar role enforcement (dashboard), JWT HttpOnly cookie, restringir CORS en Strapi, proxy + reCAPTCHA que oculta Strapi del browser — Validated in Phase 1: Security Foundation

### Out of Scope

- Tickets / venta de entradas a asistentes — el cobro es solo para publicar, no para asistir
- App móvil — web-first
- Chat en tiempo real — no es parte del valor core
- OAuth / login social — email/password es suficiente para v1

## Context

- **Stack:** Turbo monorepo — Strapi 5 (backend/CMS), Next.js 15 (dashboard admin), Nuxt 4 (website público)
- **Auth:** JWT vía Strapi Users & Permissions plugin; cookie `strapi_jwt` con flags HttpOnly+Secure+SameSite=Strict (Phase 1); role enforcement restaurado; CORS restringido; proxies de dashboard y website ocultan Strapi del browser
- **Email reference:** `../waldo-project` usa MJML + Mailgun via plugin de Strapi; templates en `apps/strapi/src/services/mjml/templates/`; adaptar mismo patrón con colores Konbini
- **Pagos:** Sin implementación actual. El modelo es pago único por evento, precio único. Flujo: el organizador llena el formulario → paga → el evento queda en estado pendiente de moderación
- **Deuda técnica conocida:** `populate=*` y `pageSize=1000` en todos los queries del dashboard; `entityService.count()` deprecado en Strapi v5; ETag roto en media proxy; debug component expuesto; settings page stub vacío
- **Producción:** PM2, MySQL, Cloudinary, Sentry (Strapi activo, dashboard/website deshabilitados)

## Constraints

- **Tech stack:** Mantener Strapi 5 + Next.js 15 + Nuxt 4 — no migrar frameworks
- **Email:** Usar MJML + Mailgun como waldo-project (misma tecnología, diferente marca)
- **Pagos:** Soportar múltiples pasarelas desde el inicio (Mercado Pago, Stripe, Transbank/Webpay)
- **Compatibilidad:** El sistema de pagos debe integrarse con el flujo multi-paso de creación de eventos ya existente en el website

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Pago por evento (no suscripción) | Modelo más simple para v1; organizadores pagan según lo que usan | — Pending |
| Precio único para todos los eventos | Simplifica implementación y UX inicial | — Pending |
| MJML + Mailgun para emails | Mismo stack validado en waldo-project; evita reaprender otra tecnología | — Pending |
| Múltiples pasarelas de pago desde v1 | Cobertura de mercado chileno (Transbank), LatAm (MercadoPago), global (Stripe) | — Pending |
| Flujo Crear → Pagar → Moderar | El pago confirma intención antes de usar tiempo de moderación | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-23 after initialization*
