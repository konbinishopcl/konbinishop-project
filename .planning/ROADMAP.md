# Roadmap: Konbini — v1

**Created:** 2026-03-23 · **Re-aligned:** 2026-05-20
**Milestone:** v1 — Publicación gratuita de eventos

> **Re-alineación 2026-05-20.** El roadmap original (Strapi/Nuxt + milestone de pagos:
> Transbank, Mercado Pago, Stripe, emails MJML) quedó obsoleto: el stack migró a
> NestJS + Prisma + Next.js y el producto dejó de cobrar (publicar es gratis, sin venta de
> entradas). Este roadmap lo reemplaza por completo. La antigua "Phase 1 — Security
> Foundation" aplicaba al stack Strapi/Nuxt y queda archivada en
> `.planning/phases/_archive-strapi/`.

---

## Milestone Overview

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 0 | Re-alineación GSD | Re-alinear PROJECT, REQUIREMENTS, ROADMAP y docs de codebase al stack y alcance reales | — |
| 1 | API de contenido | Endpoints NestJS de eventos y taxonomías — la base que alimenta todo el sitio | API-01..04 |
| 2 | Sitio público con datos reales | Reemplazar la data mock por la API; quitar el checkout/venta de entradas | SITE-01..04 |
| 3 | Publicación de eventos | El organizador crea y envía eventos desde el sitio | PUBL-01..04 |
| 4 | Moderación y panel admin | Aprobar/rechazar eventos; gestión de usuarios | MOD-01..05 |
| 5 | Búsqueda | Búsqueda de eventos con filtros | SRCH-01..05 |
| 6 | Hardening para producción | CORS, secretos, revalidación de sesión, despliegue | HARD-01..04 |
| 7 | Sistema de auditoría | Registrar en base de datos cada acción relevante de admins y usuarios | AUD-01..04 |

---

## Phase 0: Re-alineación GSD

**Goal:** Dejar la documentación de planning (`.planning/`) consistente con la realidad del
proyecto tras la migración de stack — para que las fases siguientes se planeen sobre datos
correctos.

**Why first:** El roadmap previo describía Strapi/Nuxt y un milestone de pagos que ya no
existen. Planear cualquier fase sobre esa base produce trabajo equivocado.

**Status:** ✅ Complete (2026-05-20)

**Delivered:**
- `PROJECT.md`, `REQUIREMENTS.md`, `ROADMAP.md` reescritos
- `.planning/codebase/*.md` actualizados al stack NestJS + Next.js
- `STATE.md` re-inicializado; fase Strapi archivada

---

## Phase 1: API de contenido

**Goal:** La API NestJS expone los eventos y las taxonomías que el sitio necesita: listado
público de eventos aprobados, detalle por slug, CRUD para organizadores/admin, moderación, y
lectura de regiones/comunas/categorías/tags/artículos/heroes/spots.

**Why first:** Todo el sitio público y el flujo de publicación dependen de estos endpoints.
Hoy solo existen los módulos `auth` y `users`; el contenido vive en `lib/data.ts` (mock).

**Plans (estimado):**
1. **Módulo `events`** — controller + service Prisma: `GET /events` (público, solo
   aprobados, paginado), `GET /events/:slug`, `POST /events`, `PATCH /events/:id`,
   `DELETE /events/:id`. DTOs con class-validator. Incluye los componentes (prices, dates,
   socialLinks, videos).
2. **Endpoints de moderación** — `PATCH /events/:id/approve`, `PATCH /events/:id/reject`
   (con motivo). Setea `isApproved`/`isRejected`/`rejectedReason` y `approvedBy`/`rejectedBy`.
   Protegidos con `@Roles('ADMIN','SUPER_ADMIN')`.
3. **Taxonomías de lectura** — módulos read-only para regiones, comunas, categorías, tags,
   artículos, heroes, spots.
4. **Subida de imágenes** — endpoint de upload para banner/poster/galería.
   *Decisión abierta:* proveedor de almacenamiento (local en disco / Cloudinary / S3).

**UAT:**
- `GET /api/events` devuelve solo eventos aprobados, paginados
- `GET /api/events/:slug` devuelve un evento con sus componentes y relaciones
- Un organizador autenticado puede crear un evento; queda `isApproved=false`
- Un admin puede aprobar y rechazar; un `AUTHENTICATED` recibe `403`
- Las taxonomías responden sin token

---

## Phase 2: Sitio público con datos reales

**Goal:** Las vistas públicas (home, categoría, detalle de evento) consumen la API real en
vez de `lib/data.ts`. Se elimina del diseño el flujo de checkout y la venta de entradas.

**Why second:** Es lo primero que ve el público; valida los endpoints de la Phase 1 contra una
UI real. El checkout es un error de diseño documentado y debe salir antes de seguir.

**Plans (estimado):**
1. **Capa de datos del website** — extender `lib/api.ts` con `events`, `categories`, etc.;
   tipos compartidos; helpers de fetch SSR.
2. **Home + categorías reales** — `(site)/page.tsx` y `(site)/categoria/[cat]/page.tsx`
   consumen la API; estados de carga y vacío.
3. **Detalle de evento real** — `(site)/evento/[id]/page.tsx` con datos reales; el CTA de
   entradas enlaza a `ticketUrl` (plataforma externa).
4. **Quitar el checkout** — eliminar `(site)/checkout/[id]`, los botones "Comprar entradas" y
   el componente "Konbini Pay" del diseño.

**UAT:**
- La home y las categorías muestran eventos reales de la base
- El detalle de evento enlaza fuera para comprar entradas; no hay checkout en el sitio
- No queda ninguna ruta ni botón de compra de entradas
- `lib/data.ts` ya no alimenta las vistas públicas

---

## Phase 3: Publicación de eventos

**Goal:** Un organizador autenticado crea y envía un evento desde `/crear`; el evento queda
pendiente de moderación y el organizador ve su estado en `/dashboard`.

**Why third:** Cierra el lado de oferta del bucle. Depende de la API (Phase 1) y de que el
sitio público ya esté cableado (Phase 2) para mostrar el evento una vez aprobado.

**Plans (estimado):**
1. **Formulario `/crear` conectado** — el formulario multi-paso envía a `POST /events`;
   requiere sesión; manejo de errores de validación.
2. **Subida de imágenes en el formulario** — banner, poster y galería usando el endpoint de
   upload de la Phase 1.
3. **Panel del organizador** — `(site)/dashboard` lista los eventos del usuario con su estado
   (en revisión / publicado / rechazado con motivo).

**UAT:**
- Un usuario sin sesión es enviado a `/login` al entrar a `/crear`
- Un evento creado aparece en `/dashboard` como "en revisión" y no en el sitio público
- El organizador ve el motivo si su evento fue rechazado

---

## Phase 4: Moderación y panel admin

**Goal:** Los admins gestionan eventos y usuarios desde `/admin`: aprobar/rechazar eventos
reales y administrar cuentas.

**Why fourth:** Cierra el lado de demanda del bucle (moderación → publicación). Depende de los
endpoints de moderación (Phase 1) y de que existan eventos creados (Phase 3).

**Plans (estimado):**
1. **`/admin/events` conectado** — listado real con filtros por estado; acciones de aprobar y
   rechazar (con motivo) contra la API.
2. **`/admin/users` funcional** — tabla + crear/editar/banear/eliminar; restringido a
   `SUPER_ADMIN` (la API CRUD ya existe).
3. **Limpieza de vistas admin obsoletas** — retirar o re-perfilar `/admin/payments` y otras
   vistas placeholder acorde al alcance sin pagos.

**UAT:**
- Un admin aprueba un evento y este aparece en el sitio público
- Un admin rechaza con motivo y el organizador lo ve en su panel
- `/admin/users` permite gestionar cuentas; solo SUPER_ADMIN accede
- No quedan vistas admin de pagos/venta de entradas

---

## Phase 5: Búsqueda

**Goal:** Búsqueda funcional de eventos en el sitio público con filtros y resultados
paginados.

**Why fifth:** Mejora de UX independiente del bucle principal; el sitio funciona sin ella.

**Plans (estimado):**
1. **Endpoint de búsqueda** — `GET /events` acepta `q`, `categoria`, `region`, `desde`,
   `hasta`; texto vía `ILIKE`/Prisma sobre título y descripción.
2. **Página `/busqueda`** — lee query params, muestra resultados reutilizando `EventCard`,
   con estado vacío.
3. **Filtros y URL** — sidebar de filtros sincronizado con la URL (links compartibles).

**UAT:**
- Buscar desde el header navega a `/busqueda?q=` con resultados
- Filtrar por categoría + región + fechas acota correctamente
- La URL refleja todos los filtros activos
- Sin resultados se muestra el estado vacío

---

## Phase 6: Hardening para producción

**Goal:** Dejar ambas apps listas para un despliegue seguro: CORS acotado, secretos
gestionados, sesión revalidada y build/deploy verificados.

**Why last:** Endurecer tiene sentido cuando la superficie funcional ya está completa.

**Plans (estimado):**
1. **Seguridad de la API** — CORS restringido al origen del website; `JWT_SECRET` y
   credenciales solo desde entorno, sin defaults en código.
2. **Sesión del website** — revalidar el token contra `/auth/me` al cargar; logout limpio si
   es inválido.
3. **Build y despliegue** — verificar `pnpm build` de ambas apps; documentar el proceso de
   despliegue y las variables de entorno requeridas.

**UAT:**
- La API rechaza requests de orígenes no permitidos
- La app no arranca con un `JWT_SECRET` por defecto
- Un token inválido en `localStorage` produce logout en la primera carga
- Ambas apps compilan limpio y el despliegue está documentado

---

## Phase 7: Sistema de auditoría

**Goal:** Registrar en base de datos cada acción relevante de admins y usuarios sobre las
entidades del sistema (eventos, usuarios, avisos, spots) para trazabilidad y auditoría.

**Why:** Compliance, debugging operacional y visibilidad de qué admin hizo qué y cuándo.
Depende de que existan entidades que auditar (Phases 1–4).

**Status:** ✅ Complete (2026-05-22)

**Plans:** 5/5 plans complete

Plans:
- [x] 07-01-PLAN.md — Definir AUD-01..04 en REQUIREMENTS.md, configurar Jest en el API y declarar el logging de auditoría en la Política de Privacidad (Ley 21.719)
- [x] 07-02-PLAN.md — Migración Prisma del modelo `AuditLog` y los enums `AuditAction` / `AuditEntity` (EVENT, USER, AVISO, PORTADA)
- [x] 07-03-PLAN.md — Módulo `audit`: `AuditService` singleton, endpoint `GET /api/admin/audit-logs` (ADMIN+) y `trust proxy 1` en main.ts
- [x] 07-04-PLAN.md — Instrumentar `EventsService` (CREATE, UPDATE, APPROVE, REJECT, BAN, DELETE) con auditoría
- [x] 07-05-PLAN.md — Instrumentar usuarios (BAN/UNBAN/DELETE/cambio de rol), avisos (AVISO) y portadas (PORTADA) con auditoría

**UAT:**
- Aprobar un evento crea un registro `{ action: APPROVE, entity: EVENT, entityId, ip, url }`
- Banear un usuario crea `{ action: BAN, entity: USER, entityId, userId (admin) }`
- `GET /admin/audit-logs` filtra correctamente por entidad, acción y fechas
- Un `AUTHENTICATED` recibe 403 al intentar acceder a los logs

---

## Dependencies (Milestone v1)

```
Phase 0 (Re-alineación) → todo lo demás — planear sobre datos correctos
Phase 1 (API)           → Phase 2, 3, 4, 5 — los endpoints alimentan todo
Phase 2 (Sitio público) → Phase 3 — el evento aprobado debe poder mostrarse
Phase 3 (Publicación)   → Phase 4 — debe haber eventos que moderar
Phase 5 (Búsqueda)      — depende solo de Phase 1
Phase 6 (Hardening)     — al final, sobre la superficie completa
```

---

*Roadmap creado: 2026-03-23 · Re-alineado: 2026-05-20*
*Basado en: PROJECT.md, REQUIREMENTS.md y la encuesta de codebase de 2026-05-20*

---
---

# Milestone v2 — Plataforma completa

**Created:** 2026-05-24
**Milestone:** v2 — Plataforma completa con organizaciones, suscripción, servicios y CRM

> **v2 introduce cobro real al organizador** (suscripción mensual, avisos y portadas pagados),
> organizaciones con membresías (modelo GitHub), 2FA + Google OAuth, notificaciones,
> transferencia de contenido entre cuentas, servicios de fotografía y creadores de contenido,
> y un CRM interno. El schema cambia sustancialmente — Region/Commune se reemplaza por
> País/División/Ciudad; el modelo User gana `type`, `handle` y datos de perfil.

---

## Milestone v2 Overview

| Phase | Name | Goal | Requirements |
|-------|------|------|--------------|
| 8 | 6/6 | Complete    | 2026-05-25 |
| 9 | 5/5 | Complete    | 2026-05-25 |
| 10 | 3/3 | Complete    | 2026-05-25 |
| 11 | 3/3 | Complete   | 2026-05-25 |
| 12 | Suscripciones y carrito v2 | Plan mensual con créditos, carrito con org context y tipo ARTICLE | COM-01..04 |
| 13 | Contenido avanzado | Artículos patrocinados, favoritos, perfil público con handle y badge Verificado | CNT-01..04 |
| 14 | Servicios y CRM | Fotografía y creadores de contenido con opciones configurables, CRM pipeline unificado | SVC-01..05 |

---

## Phase 8: Schema v2

**Goal:** Migrar el schema Prisma al modelo de datos completo que soporta todas las
funcionalidades de v2: organizaciones, geografía 3-nivel, settings, suscripciones,
notificaciones, transferencias, favoritos, servicios y CRM.

**Why first:** Todo el código de v2 depende de los modelos. Sin la migración no se puede
implementar ninguna otra fase.

**Status:** 🔄 Planning (6 plans creados, ejecución pendiente)

**Plans:** 6/6 plans complete

Plans:
- [x] 08-01-PLAN.md — User v2 (SCH-01): type, handle, isVerified, twoFactorCode, twoFactorExpiry + agregar SCH-01..06 a REQUIREMENTS.md
- [x] 08-02-PLAN.md — Geografía 3-nivel (SCH-02): Country/State/City + seeder Chile + reescritura catalog/events/profiles
- [x] 08-03-PLAN.md — Organizaciones (SCH-03): OrgMember, OrgInvitation, enum OrgRole
- [x] 08-04-PLAN.md — Sistemas core (SCH-04): Settings, Notification, SavedEvent, Subscription, Transfer + seed de 12 defaults
- [x] 08-05-PLAN.md — Category v2 + Orders v2 + Article v2 (SCH-05): Category metadata, ARTICLE en OrderItemType, Order.orgId, Article.status/userId
- [x] 08-06-PLAN.md — Servicios y CRM (SCH-06): ServiceRequest, ServiceOption, CrmEntry (NUEVO independiente), CrmNote — ContactMessage SIN CAMBIOS

**Requirements:**
- SCH-01: User con type, handle, 2FA fields
- SCH-02: Country/State/City (reemplaza Region/Commune)
- SCH-03: OrgMember, OrgInvitation
- SCH-04: Settings, Notification, SavedEvent, Subscription, Transfer
- SCH-05: Category v2, Order/OrderItem v2 (ARTICLE type), Article v2 (status + userId — KEY DECISION #4)
- SCH-06: ServiceRequest, ServiceOption, CrmEntry (NUEVO, independiente — KEY DECISION #2), CrmNote

**UAT:**
- `pnpm prisma migrate dev` corre sin error (6 migraciones aplicadas: sch01..sch06)
- `pnpm prisma generate` genera el cliente
- `pnpm tsc --noEmit` pasa (blast radius de Region/Commune resuelto)
- `pnpm prisma:seed` corre end-to-end con datos de Chile en jerarquía 3-nivel


---

## Phase 9: Organizaciones y transferencias

**Goal:** Cualquier usuario puede crear una organización, invitar miembros, operar con
contexto de org (header `X-Org-Context`) y transferir contenido entre su cuenta personal y
sus organizaciones.

**Why second (in v2):** La mayoría de fases siguientes usan el contexto de org. El middleware
X-Org-Context debe estar listo antes de que spots, heroes, eventos y pedidos lo consuman.

**Plans:** 5/5 plans complete

Plans:
- [x] 09-01-PLAN.md — Módulo `organizations` CRUD (POST/GET/PATCH/DELETE /organizations) (ORG-02) — Wave 1
- [x] 09-02-PLAN.md — OrgContextGuard + decorator + tipo en common/org-context, módulo global (ORG-01) — Wave 1
- [x] 09-03-PLAN.md — Membresías e invitaciones (list, invite, accept, role, remove) + plantilla email (ORG-03) — Wave 2
- [x] 09-04-PLAN.md — Módulo `transfers` polimórfico + auto-aprobación OWNER + admin direct (ORG-04) — Wave 2
- [x] 09-05-PLAN.md — Integración orgContext en events, spots, heroes, orders services/controllers (ORG-05) — Wave 2

**Requirements:**
- ORG-01: Middleware X-Org-Context
- ORG-02: CRUD organizaciones
- ORG-03: Membresías e invitaciones
- ORG-04: Transferencias
- ORG-05: Módulos existentes con contexto de org

**UAT:**
- Crear org → usuario queda como OWNER; org sin credenciales de login
- `X-Org-Context: <orgId>` con user MEMBER → req.orgContext resuelto
- Invitación expirada o token inválido → 401
- Transfer de OWNER → auto-aprobada; de MEMBER → pendiente con notificación al OWNER
- Admin puede transferir directamente cualquier ítem

---

## Phase 10: Auth avanzado

**Goal:** 2FA obligatorio tras login/registro (excepto Google OAuth), flujo completo de
Google OAuth con mini-onboarding para nuevos usuarios, y endpoints de cambio de email y
contraseña.

**Why third:** La seguridad de sesión es base para todo lo demás. El Google OAuth es una vía
alternativa de registro que impacta el flujo de onboarding.

**Plans (estimado):**
1. **2FA por email** — generar código de 6 dígitos, enviar por email (Mailgun), endpoint verify + resend; login/register devuelven token pendiente de 2FA.
2. **Google OAuth** — `passport-google-oauth20`; callback distingue usuario nuevo vs existente; token de onboarding para nuevos.
3. **Onboarding Google** — endpoint `POST /auth/google/onboarding` completa el registro (país, T&C); devuelve token definitivo.
4. **Change email/password** — `PATCH /auth/change-password` (requiere pass actual), `POST /auth/change-email/request` + `POST /auth/change-email/confirm` con token por email.

**Requirements:**
- AUTH-01: 2FA por email (verify + resend)
- AUTH-02: Google OAuth flow
- AUTH-03: Google onboarding
- AUTH-04: Change email/password

**UAT:**
- Login → devuelve token pendiente → `POST /auth/2fa/verify` con código correcto → token definitivo
- Google OAuth usuario existente → login directo sin 2FA
- Google OAuth usuario nuevo → token onboarding → POST onboarding → token definitivo
- Change password con contraseña incorrecta → 401
- Change email → email enviado al nuevo email → confirm con token → email actualizado

---

## Phase 11: Notificaciones y Settings

**Goal:** Sistema de mensajes internos generados automáticamente por el sistema (aprobación,
rechazo, transferencias, invitaciones); y tabla Settings en DB para los valores configurables
del sistema (precios, cupos, créditos de suscripción).

**Why:** Notificaciones son el mecanismo de comunicación entre el sistema y el usuario.
Settings permite que el admin cambie precios sin tocar código ni reiniciar el servidor.

**Status:** 🔄 Planning (3 plans creados, ejecución pendiente)

**Plans:** 3/3 plans complete

Plans:
- [x] 11-01-PLAN.md — Módulo `notifications`: NotificationsModule + Service (create fire-and-forget) + 4 endpoints REST + documentar CFG-01..03 en REQUIREMENTS.md (CFG-01) — Wave 1
- [x] 11-02-PLAN.md — Inyectar NotificationsModule en Events/Spots/Heroes/Organizations/Transfers y emitir notifications.create() en aprobar/rechazar/banear/invitar/transferir (CFG-02) — Wave 2
- [x] 11-03-PLAN.md — Módulo `settings` (admin GET/PATCH + público GET /public) + migrar SpotsService/HeroesService de ConfigService a SettingsService + verificar seed (CFG-03) — Wave 3

**Requirements:**
- CFG-01: Módulo notifications
- CFG-02: Auto-notificaciones en módulos
- CFG-03: Módulo settings + integración spots/heroes

**UAT:**
- Aprobar un evento → notificación al organizador aparece en `GET /notifications`
- `GET /notifications/unread-count` devuelve número correcto
- `PATCH /settings` cambia el precio de spot → `GET /spots/quota` devuelve el nuevo precio
- `GET /settings/public` no expone claves internas

---

## Phase 12: Suscripciones y carrito v2

**Goal:** Plan de suscripción mensual con créditos de eventos, descuentos en spots/heroes para
suscriptores, y carrito actualizado con contexto de org, tipo ARTICLE y lógica de créditos.

**Plans (estimado):**
1. **Módulo `subscriptions`** — activar (genera orden especial + pasarela), cancelar (fin de ciclo), GET estado + créditos; admin GET lista.
2. **Orders v2** — contexto de org en Order (orgId), tipo ARTICLE en OrderItemType, upsert ARTICLE; validaciones de cupo re-verificadas al pagar.
3. **Créditos de suscripción en carrito** — al agregar EVENT con suscripción activa: sin costo, 45 días fijos; descuentos en spots/heroes al pagar.
4. **Pago suscripción** — flujo checkout para suscripción; callback activa el plan y registra ciclo.

**Requirements:**
- COM-01: Subscriptions CRUD
- COM-02: Orders v2 con org context + ARTICLE
- COM-03: Créditos en carrito
- COM-04: Pago suscripción

**UAT:**
- Usuario suscrito agrega EVENT al carrito → subtotal = 0, days = 45 fijos
- Pago exitoso de suscripción → `GET /subscriptions/me` muestra créditos = SUBSCRIPTION_CREDITS
- Usar 1 crédito → créditos restantes = N-1
- `DELETE /subscriptions/me` → suscripción cancela al fin del ciclo, sin cobro siguiente

---

## Phase 13: Contenido avanzado

**Goal:** Artículos patrocinados (flujo DRAFT→...→APPROVED igual que eventos), favoritos
(guardar eventos), y perfil público con handle único y badge Verificado asignado por SUPER_ADMIN.

**Plans (estimado):**
1. **Artículos patrocinados** — `POST /articles/sponsored`; estados PublicationStatus; flujo admin de aprobar/rechazar/banear artículos patrocinados.
2. **Favoritos** — `POST/DELETE /events/:id/save`; `GET /users/me/saved-events`; campo `isSaved` en respuestas de eventos con sesión.
3. **Perfil público v2** — `GET /users/:handle` (persona u org); `PATCH /users/me/organizer`; `PATCH /users/:id/verified` (SUPER_ADMIN only).
4. **Category v2** — campos `minDays`, `maxDays`, `icon`, `color`, `order` en CRUD de categorías; integrar en validación de carrito.

**Requirements:**
- CNT-01: Artículos patrocinados
- CNT-02: Favoritos
- CNT-03: Perfil público v2
- CNT-04: Category v2 en catálogo

**UAT:**
- `POST /articles/sponsored` → artículo en DRAFT, no visible públicamente
- `POST /events/:id/save` → aparece en `GET /users/me/saved-events`
- `GET /users/:handle` de una org → devuelve sus eventos aprobados
- SUPER_ADMIN asigna `isVerified: true`; otro rol recibe 403

---

## Phase 14: Servicios y CRM

**Goal:** Formularios de cotización para fotografía y creadores de contenido (con opciones
configurables desde el dashboard), y CRM interno unificado con pipeline kanban para
Contacto, Fotografía y Creadores.

**Plans (estimado):**
1. **Módulo `services`** — `POST /services/photography` y `POST /services/content-creators` (públicos); GET/PATCH admin; `GET /services/*/options` (público).
2. **Service options CRUD** — `POST/PATCH/DELETE /services/photography/options` y equivalentes para content-creators (admin).
3. **Módulo `crm`** — `GET /crm`, `PATCH /crm/:id/stage`, `POST /crm/:id/notes`, `GET /crm/:id/notes`; todos los tipos CONTACT/PHOTOGRAPHY/CONTENT en una sola vista.
4. **Contact → CRM** — `POST /contact` crea entrada CRM con tipo CONTACT + estado NEW; `GET /contact` como alias de `GET /crm?type=CONTACT`.
5. **Integración services → CRM** — cuando llega un form de fotografía o creadores, también se crea entrada CRM con tipo correspondiente.

**Requirements:**
- SVC-01: Services endpoints públicos (photography + content-creators)
- SVC-02: Service options CRUD
- SVC-03: CRM pipeline
- SVC-04: Contact integrado con CRM
- SVC-05: Services integrados con CRM

**UAT:**
- `POST /services/photography` → solicitud guardada + entrada CRM en estado NEW con tipo PHOTOGRAPHY
- `PATCH /crm/:id/stage` a LOST sin reason → 400
- `POST /crm/:id/notes` → nota guardada con timestamp y autor
- `GET /crm?type=CONTACT` devuelve solo los mensajes de contacto
- `GET /services/photography/options` devuelve la lista pública sin auth

---

## Dependencies (Milestone v2)

```
Phase 8  (Schema v2)          → todo v2 — los modelos deben existir antes
Phase 9  (Orgs)               → Phase 11 (notificaciones de org), Phase 12 (carrito con org)
Phase 10 (Auth)               → Phase 9 (OrgMember usa sesión robusta)
Phase 11 (Notificaciones)     → Phase 9, 10, 12, 13 — los eventos generan notificaciones
Phase 12 (Suscripciones)      → Phase 8 — Subscription model
Phase 13 (Contenido avanzado) → Phase 8, 11 (isSaved requiere sesión)
Phase 14 (Servicios y CRM)    → Phase 8 (ServiceRequest model)
```
