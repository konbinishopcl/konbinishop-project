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
| 7 | 5/5 | Complete   | 2026-05-22 |

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

## Dependencies

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
