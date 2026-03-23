# Requirements: Konbini

**Defined:** 2026-03-23
**Core Value:** Organizadores pueden publicar eventos pagando por cada publicación, que queda visible al público tras aprobación del administrador.

## v1 Requirements

### Security

- [x] **SEC-01**: Dashboard restringe acceso solo a usuarios con rol `dashboard` (role enforcement restaurado)
- [x] **SEC-02**: Cookie JWT del dashboard tiene flags `HttpOnly` y `Secure` (no accesible desde JavaScript)
- [x] **SEC-03**: Strapi CORS restringido a dominios conocidos (no wildcard `origin: ['*']`)
- [x] **SEC-04**: Proxy API del dashboard tiene allowlist de rutas permitidas (no pass-through irrestricto)
- [x] **SEC-05**: Website tiene proxy Nuxt server-side (`server/api/[...].ts`) que oculta la URL de Strapi — el browser nunca llama directo a Strapi
- [x] **SEC-06**: Proxy del website valida token reCAPTCHA v3 en POST/PUT/DELETE (`x-recaptcha-token` header) antes de forwardear a Strapi
- [x] **SEC-07**: Proxy del dashboard (Next.js) valida token reCAPTCHA v3 en POST/PUT/DELETE antes de forwardear a Strapi
- [x] **SEC-08**: Strapi no valida reCAPTCHA — la validación es responsabilidad exclusiva de los proxies del website y dashboard

### Payments

- [ ] **PAY-01**: Evento tiene campo `payment_status` con estados: `pending_payment`, `payment_processing`, `payment_confirmed`, `payment_failed`, `pending_approval`, `approved`, `rejected`
- [ ] **PAY-02**: Evento tiene campos `payment_provider`, `payment_provider_id` para trazabilidad
- [ ] **PAY-03**: Existe colección `payment_transactions` para idempotencia de webhooks (evitar procesamiento duplicado)
- [ ] **PAY-04**: Endpoint `POST /api/payment/initiate` crea sesión de pago con el proveedor y retorna URL de redirección
- [ ] **PAY-05**: Integración con Transbank/Flow — redirect, return URL handler, commit transaction
- [ ] **PAY-06**: Integración con Mercado Pago — checkout, webhook con re-fetch server-side para verificar estado
- [ ] **PAY-07**: Integración con Stripe — Checkout Session, webhook con verificación de firma (raw body)
- [ ] **PAY-08**: Cada gateway tiene middleware de verificación de firma antes de procesar el webhook
- [ ] **PAY-09**: El organizador puede seleccionar pasarela de pago en el resumen del formulario
- [ ] **PAY-10**: Página `/anunciar/gracias` muestra resultado del pago (confirmado / fallido con opción de reintentar)
- [ ] **PAY-11**: Eventos en `pending_payment` por más de 30 minutos son marcados automáticamente como `payment_failed` (cleanup job)
- [ ] **PAY-12**: Dashboard muestra badge de `payment_status` en listado y detalle de eventos
- [ ] **PAY-13**: Cola de moderación del dashboard filtra por `payment_status: pending_approval` (no solo `is_approved: false`)

### Emails

- [ ] **EMAIL-01**: Strapi tiene plugin de email configurado con Mailgun y soporte MJML (mismo stack que waldo-project)
- [ ] **EMAIL-02**: Template `event-payment-confirmed.mjml` — enviado al organizador cuando el pago se confirma
- [ ] **EMAIL-03**: Template `event-submitted-admin.mjml` — enviado a admins cuando un evento pago queda en revisión
- [ ] **EMAIL-04**: Template `event-approved.mjml` — enviado al organizador cuando el admin aprueba el evento
- [ ] **EMAIL-05**: Template `event-rejected.mjml` — enviado al organizador con el motivo del rechazo
- [ ] **EMAIL-06**: Todos los templates usan colores y branding de Konbini (no Waldo)

### Organizer Panel

- [ ] **ORG-01**: `/cuenta` redirige a `/cuenta/eventos`
- [ ] **ORG-02**: `/cuenta/eventos` muestra lista de eventos del organizador con estado legible (Pendiente de pago / En revisión / Publicado / Rechazado / Pago fallido)
- [ ] **ORG-03**: Organizador puede ver motivo de rechazo directamente desde su panel
- [ ] **ORG-04**: Organizador puede editar su evento solo si aún no está aprobado (`payment_status: pending_approval`)
- [ ] **ORG-05**: Organizador puede reintentar pago para eventos con `payment_status: payment_failed`
- [ ] **ORG-06**: `/cuenta/perfil` permite cambiar nombre, email y contraseña

### Search

- [ ] **SRCH-01**: `SearchDefault.vue` navega a `/busqueda?q=` al enviar el formulario
- [ ] **SRCH-02**: `/busqueda` muestra resultados de eventos con búsqueda por texto en título y descripción (`$containsi`)
- [ ] **SRCH-03**: `/busqueda` tiene filtros por categoría, región y rango de fechas
- [ ] **SRCH-04**: Los filtros de búsqueda se reflejan en la URL (shareable links)
- [ ] **SRCH-05**: `/busqueda` muestra estado vacío cuando no hay resultados

## v2 Requirements

### Payments

- **PAY-V2-01**: Renovación / re-publicación — organizador paga para extender un evento ya vencido
- **PAY-V2-02**: Factura / RUT empresa — recolección de datos de facturación post-aprobación

### Emails

- **EMAIL-V2-01**: Email de recordatorio 7 días antes del vencimiento del evento (`expiration_date`)
- **EMAIL-V2-02**: Email de bienvenida al registrarse

### Search

- **SRCH-V2-01**: Auto-complete / type-ahead en la búsqueda
- **SRCH-V2-02**: Búsqueda por ubicación (geolocalización)

### Notifications

- **NOTF-V2-01**: Notificaciones in-app para el organizador

## Out of Scope

| Feature | Reason |
|---------|--------|
| Venta de tickets a asistentes | El cobro es solo para publicar; los asistentes no compran a través de la plataforma |
| App móvil | Web-first; diferir a post-v1 |
| Chat en tiempo real | Fuera del valor core |
| OAuth / login social | Email/password suficiente para v1 |
| Motor de búsqueda externo (Algolia, Meilisearch) | El filtro `$containsi` de Strapi es suficiente para la escala actual |
| Autocompletado / type-ahead en búsqueda | Complejidad alta para v1; diferir |
| Formulario de tarjeta custom (PCI) | Siempre redirigir a la pasarela; nunca manejar datos de tarjeta |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Complete |
| SEC-02 | Phase 1 | Complete |
| SEC-03 | Phase 1 | Complete |
| SEC-04 | Phase 1 | Complete |
| SEC-05 | Phase 1 | Complete |
| SEC-06 | Phase 1 | Complete |
| SEC-07 | Phase 1 | Complete |
| SEC-08 | Phase 1 | Complete |
| PAY-01 | Phase 2 | Pending |
| PAY-02 | Phase 2 | Pending |
| PAY-03 | Phase 2 | Pending |
| EMAIL-01 | Phase 2 | Pending |
| EMAIL-02 | Phase 2 | Pending |
| EMAIL-03 | Phase 2 | Pending |
| EMAIL-04 | Phase 2 | Pending |
| EMAIL-05 | Phase 2 | Pending |
| EMAIL-06 | Phase 2 | Pending |
| PAY-04 | Phase 3 | Pending |
| PAY-05 | Phase 3 | Pending |
| PAY-08 | Phase 3 | Pending |
| PAY-10 | Phase 3 | Pending |
| PAY-11 | Phase 3 | Pending |
| PAY-06 | Phase 4 | Pending |
| PAY-07 | Phase 4 | Pending |
| PAY-09 | Phase 4 | Pending |
| PAY-12 | Phase 4 | Pending |
| PAY-13 | Phase 4 | Pending |
| ORG-01 | Phase 5 | Pending |
| ORG-02 | Phase 5 | Pending |
| ORG-03 | Phase 5 | Pending |
| ORG-04 | Phase 5 | Pending |
| ORG-05 | Phase 5 | Pending |
| ORG-06 | Phase 5 | Pending |
| SRCH-01 | Phase 6 | Pending |
| SRCH-02 | Phase 6 | Pending |
| SRCH-03 | Phase 6 | Pending |
| SRCH-04 | Phase 6 | Pending |
| SRCH-05 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 31
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 after initial definition*
