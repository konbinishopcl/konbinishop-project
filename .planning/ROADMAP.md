# Roadmap: Konbini — v1

**Created:** 2026-03-23
**Milestone:** v1 — Payments, Emails, Organizer Panel, Search

---

## Milestone Overview

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 1 | Security Foundation | Arreglar las 4 vulnerabilidades críticas antes de cualquier trabajo de pagos | SEC-01..04 |
| 2 | Payment Schema + Email Infrastructure | Schema de estados de pago, idempotencia, e infraestructura de emails MJML | PAY-01..03, EMAIL-01..06 |
| 3 | Transbank/Flow Integration | Primera pasarela funcional end-to-end con el flujo completo de pago | PAY-04..05, PAY-08, PAY-10..11 |
| 4 | Mercado Pago + Stripe + Dashboard Updates | Pasarelas restantes, selección de gateway, actualizar dashboard | PAY-06..07, PAY-09, PAY-12..13 |
| 5 | Organizer Panel | Panel de cuenta para que los organizadores gestionen sus eventos | ORG-01..06 |
| 6 | Search | Búsqueda funcional con filtros en el sitio público | SRCH-01..05 |

---

## Phase 1: Security Foundation

**Goal:** Eliminar las 4 vulnerabilidades de seguridad críticas identificadas en CONCERNS.md que son prerequisitos bloqueantes para lanzar pagos.

**Why first:** Los pagos amplifican el blast radius de cualquier brecha de seguridad. CORS wildcard + JWT cookie sin flags + role enforcement deshabilitado son bloqueantes para producción con dinero real.

### Plans

1. **Restore dashboard role enforcement** — Re-habilitar `role.type === 'dashboard'` en `useUserStore`, `hasDashboardRole`, layout guard, y middleware. Remover el blocklist hardcodeado por username.
2. **Fix JWT cookie security** — Mover el set de cookie del dashboard a una API route de Next.js server-side con flags `HttpOnly; Secure; SameSite=Strict`.
3. **Restrict Strapi CORS + API proxy** — Cambiar `origin: ['*']` a los dominios del dashboard y website. Agregar allowlist de rutas al proxy catch-all del dashboard.

**UAT:**
- Un usuario Strapi sin rol `dashboard` no puede acceder a ninguna ruta protegida del dashboard
- La cookie `strapi_jwt` no es accesible desde `document.cookie` en el browser del dashboard
- Strapi rechaza requests de orígenes no permitidos con 403
- El proxy del dashboard rechaza rutas no allowlisteadas

---

## Phase 2: Payment Schema + Email Infrastructure

**Goal:** Extender el schema de eventos con estados de pago y construir toda la infraestructura de emails MJML antes de integrar las pasarelas.

**Why second:** Las pasarelas (Phase 3+) dependen del schema. Los emails se disparan desde los webhooks — necesitan existir antes. Esto es infraestructura pura, sin UI visible todavía.

### Plans

1. **Event payment schema extension** — Agregar `payment_status` (enum 7 estados), `payment_provider`, `payment_provider_id` al `schema.json` del evento. Script de bootstrap para setear `approved` en eventos ya aprobados. Mantener `is_approved`/`is_rejected` en sync.
2. **Payment transactions collection** — Crear colección `payment_transaction` en Strapi con campos: `gateway_payment_id` (unique), `provider`, `event_documentId`, `status`, `raw_payload`. Esto garantiza idempotencia para webhooks.
3. **MJML email infrastructure** — Instalar `@strapi/provider-email-mailgun`, configurar en `plugins.ts`. Copiar el servicio `sendMjmlEmail` de waldo-project. Crear 5 templates MJML con branding Konbini: `event-payment-confirmed.mjml`, `event-submitted-admin.mjml`, `event-approved.mjml`, `event-rejected.mjml`, `reset-password.mjml` (reutilizar).

**UAT:**
- El schema de eventos tiene `payment_status` con default `pending_payment` sin romper eventos existentes
- Existe la colección `payment_transaction` y puede persistir registros únicos por `gateway_payment_id`
- El servicio `sendMjmlEmail` puede enviar un email de prueba con el template `event-payment-confirmed.mjml`
- Los templates renderizan correctamente con colores Konbini

---

## Phase 3: Transbank/Flow Integration

**Goal:** Primera pasarela de pago completamente funcional end-to-end: el organizador llena el formulario, paga vía Transbank/Flow, el evento queda en moderación y recibe emails.

**Why third:** Flow es la pasarela chilena nativa. Es la que más probabilidades tiene de ser usada primero. Sirve como referencia para las otras dos.

### Plans

1. **Strapi payment API module** — Crear `apps/strapi/src/api/payment/` siguiendo el patrón de `stats`: controller, service, routes. Incluye: `POST /api/payment/initiate`, `GET /api/payment/status/:documentId`. Raw body middleware para webhooks. Transición de estados con guard function.
2. **Transbank/Flow webhook + return URL** — Instalar `transbank-nodejs-lib`. Implementar `POST /api/payment/webhook/flow` con middleware de verificación de firma y deduplicación via `payment_transaction`. Return URL handler que hace commit de la transacción.
3. **Website payment flow** — Actualizar `CartDefault.vue`: reemplazar redirect directo por `POST /api/payment/initiate → redirect a Flow`. Actualizar `/anunciar/gracias` para mostrar estado del pago (confirmado / fallido con retry).
4. **Email triggers** — Conectar `sendMjmlEmail` al webhook handler: `event-payment-confirmed.mjml` al organizador, `event-submitted-admin.mjml` a admins. Conectar a acciones de aprobación/rechazo del dashboard: `event-approved.mjml`, `event-rejected.mjml`.

**UAT:**
- Organizador completa formulario → paga con Transbank → recibe email de confirmación → evento aparece en dashboard como `pending_approval`
- Admin aprueba evento → organizador recibe email de aprobación
- Admin rechaza con motivo → organizador recibe email con el motivo
- Webhook duplicado del mismo pago es ignorado sin crear estado inconsistente

---

## Phase 4: Mercado Pago + Stripe + Dashboard Updates

**Goal:** Agregar las pasarelas restantes, permitir al organizador elegir, y actualizar el dashboard para reflejar los nuevos estados de pago.

**Why fourth:** Transbank ya valida la arquitectura de pagos. MP y Stripe comparten la misma infraestructura — solo agregan nuevos handlers.

### Plans

1. **Mercado Pago integration** — Instalar `mercadopago@2.x`. Implementar `POST /api/payment/webhook/mercadopago` con re-fetch server-side del pago para verificar estado (no confiar en payload). Checkout Preference + redirect flow.
2. **Stripe integration** — Instalar `stripe`. Implementar `POST /api/payment/webhook/stripe` con `constructEvent()` usando raw body. Checkout Session + webhook handler.
3. **Gateway selection UI** — Agregar selección de pasarela en `CartDefault.vue` (radio buttons: Transbank/Flow, Mercado Pago, Stripe). Pasar `provider` al endpoint `/api/payment/initiate`.
4. **Dashboard payment status** — Agregar badge de `payment_status` en listado de eventos (`/dashboard/events`). Actualizar filtro de cola de moderación a `payment_status: pending_approval`. Agregar counts por estado en el stats controller (reemplazar `entityService.count()` por `strapi.documents().count()`).

**UAT:**
- Organizador puede elegir entre Transbank, Mercado Pago y Stripe al pagar
- Pago con cada pasarela funciona end-to-end con su propio webhook y emails
- Dashboard muestra `payment_status` en la lista de eventos
- Cola de moderación solo muestra eventos con pago confirmado (no `pending_payment`)

---

## Phase 5: Organizer Panel

**Goal:** Panel de cuenta donde los organizadores pueden ver y gestionar sus eventos publicados.

**Why fifth:** Los pagos ya están funcionando — los organizadores necesitan un lugar para ver el estado de sus publicaciones. El auth ya existe (`/cuenta` ruta guardada, `useStrapiUser` disponible).

### Plans

1. **Account routing + layout** — `/cuenta` redirige a `/cuenta/eventos`. Layout con navegación (Mis Eventos / Perfil). Auth guard vía middleware existente.
2. **Events list page (`/cuenta/eventos`)** — Fetch de eventos del usuario autenticado con `filters[user][id][$eq]=me`. Mostrar status badge legible mapeado desde `payment_status` + `is_approved` + `is_rejected`. Link a evento publicado. Link a detalle/edición.
3. **Event detail + edit (`/cuenta/eventos/[slug]`)** — Vista del evento con todos sus datos. Si `payment_status === 'pending_approval'`: formulario editable (pre-fill desde event data, POST a `/api/events/:documentId`). Si `payment_status === 'payment_failed'`: botón "Reintentar pago" que vuelve al flujo de `POST /api/payment/initiate`. Si aprobado: solo vista.
4. **Profile page (`/cuenta/perfil`)** — Formulario con nombre, email, cambio de contraseña via `PUT /api/users/me`.

**UAT:**
- Organizador ve solo sus propios eventos con estados correctos
- Puede editar un evento en revisión y los cambios se guardan
- Puede reintentar el pago de un evento fallido
- No puede editar un evento ya aprobado
- Puede cambiar su contraseña exitosamente

---

## Phase 6: Search

**Goal:** Búsqueda funcional de eventos en el sitio público con filtros y resultados paginados.

**Why last:** Independiente de todos los otros features. El sitio funciona sin ella, pero es un gap UX importante para el público.

### Plans

1. **SearchDefault.vue + routing** — Al enviar el formulario navegar a `/busqueda?q=`. Conectar el componente de búsqueda del header al router.
2. **Search results page (`/busqueda`)** — Leer query params (`q`, `categoria`, `region`, `desde`, `hasta`). Construir query de Strapi con `$containsi` para texto, filtros relacionales para categoría/región, filtro de fecha en componente `dates`. Mostrar resultados con `EventsArchive.vue` reutilizado. Empty state con `EmptyEvents.vue`.
3. **Filters sidebar (`FiltersSearch.vue`)** — Dropdowns de categoría y región (fetch desde Strapi). Date range picker para `desde`/`hasta`. Toggle free/paid. Sincronizar estado de filtros con URL via `useRoute`/`useRouter`.

**UAT:**
- Buscar "rock" desde el header navega a `/busqueda?q=rock` con resultados
- Filtrar por categoría + región + fechas muestra solo eventos que cumplan todos los filtros
- La URL refleja todos los filtros activos (shareable)
- Cuando no hay resultados se muestra el empty state
- Los filtros se resetean correctamente al limpiar la búsqueda

---

## Dependencies

```
Phase 1 (Security) ──► Phase 3 (Transbank) — security is prerequisite for payments
Phase 2 (Schema)   ──► Phase 3 (Transbank) — schema must exist before payment flow
Phase 3 (Transbank)──► Phase 4 (MP+Stripe) — gateway abstraction validated by Phase 3
Phase 3 (Transbank)──► Phase 5 (Organizer) — payment_status field needed for panel
Phase 4 (Dashboard)──► Phase 5 (Organizer) — payment states need to be complete

Phase 6 (Search) — Independent, no dependencies
```

---

*Roadmap created: 2026-03-23*
*Based on: PROJECT.md, REQUIREMENTS.md, research/ (STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md)*
