# Roadmap: Konbini

## Milestones

- ✅ **v1.0 MVP Konbini** — Phases 0-16 (shipped 2026-05-27)

---

## Phases

<details>
<summary>✅ v1.0 MVP Konbini (Phases 0-16) — SHIPPED 2026-05-27</summary>

### Milestone v1 — Publicación gratuita de eventos (Phases 0-7)

- [x] Phase 0: Re-alineación GSD (1/1 plans) — Re-alinear PROJECT, REQUIREMENTS, ROADMAP al stack y alcance reales
- [x] Phase 1: API de contenido (3/3 plans) — Endpoints NestJS de eventos y taxonomías
- [x] Phase 2: Sitio público con datos reales (4/4 plans) — Reemplazar data mock por API; quitar checkout
- [x] Phase 3: Publicación de eventos (3/3 plans) — Organizador crea y envía eventos desde el sitio
- [x] Phase 4: Moderación y panel admin (2/2 plans) — Aprobar/rechazar eventos; gestión de usuarios
- [x] Phase 5: Búsqueda (1/1 plans) — Búsqueda de eventos con filtros
- [x] Phase 6: Hardening para producción (0/0 plans) — **SKIPPED** — diferido (CORS, secretos, sesión) → Known gap HARD-01..04
- [x] Phase 7: Sistema de auditoría (5/5 plans) — AuditLog en DB con AuditService + endpoint admin

### Milestone v2 — Plataforma completa (Phases 8-16)

- [x] Phase 8: Schema v2 (6/6 plans) — Migración Prisma completa: orgs, geo 3-nivel, settings, sub, transfer, servicios, CRM
- [x] Phase 9: Organizaciones y transferencias (5/5 plans) — Orgs con membresías, X-Org-Context guard, transferencias polimórficas
- [x] Phase 10: Auth avanzado (3/3 plans) — 2FA por email, Google OAuth, change email/password
- [x] Phase 11: Notificaciones y Settings (3/3 plans) — Sistema de notificaciones internas + tabla Settings en DB
- [x] Phase 12: Suscripciones y carrito v2 (4/4 plans) — Plan mensual con créditos, descuentos para suscriptores
- [x] Phase 13: Contenido avanzado (4/4 plans) — Artículos patrocinados, favoritos, perfil público v2
- [x] Phase 14: Servicios y CRM (4/4 plans) — Cotizaciones fotografía/contenido + CRM pipeline unificado
- [x] Phase 15: Rediseño UI — migración de vistas (5/5 plans) — Todas las vistas al nuevo diseño Konbini.html

**Total:** 16 fases, 54 planes — shipped 2026-05-27

**Archive:** `.planning/milestones/v1.0-ROADMAP.md`

</details>

---

## ▶ Milestone v2 — Plataforma de contenido (Phases 17+)

### Gestión de contenido

- [x] Phase 17: Articles CRUD completo (4/4 plans) — CRUD de noticias en dashboard admin + cuenta organizador: formulario, permisos por rol, listado, moderación (completed 2026-05-27)

### Taxonomía y modelo de datos

- [x] Phase 18: Separar taxonomía eventos/artículos (0/4 plans) — Crear EventCategory, EventTag, ArticleCategory, ArticleTag independientes; eliminar Category y Tag compartidos; migrar datos y actualizar toda la capa API + frontend (completed 2026-05-27)

### Phase 17: Articles CRUD completo — CRUD de noticias en dashboard admin + cuenta organizador: formulario, permisos por rol, listado, moderación

**Goal:** Habilitar CRUD completo de artículos para ambos roles: ADMIN/SUPER_ADMIN gestiona TODOS los artículos desde `/dashboard/articles` (lista real + moderación + crear/editar editorial), y organizadores gestionan SUS PROPIOS artículos patrocinados desde `/cuenta/articulos` (crear via `/crear-articulo`, editar/eliminar los suyos). Comparten un único `<ArticleForm />` sin acordeón con 2 variants ('admin' y 'sponsored').

**Requirements**: ART-01..ART-14 (definidos inline en los 4 PLAN.md de la fase)

**Depends on:** Phase 13 (sponsored articles base), Phase 15 (UI rediseño), Phase 16 (form patterns)

**Plans:** 4/4 plans complete

Plans:

- [x] 17-01-PLAN.md — API: GET /articles/mine + ownership en PATCH/DELETE (wave 1)
- [x] 17-02-PLAN.md — Shared: MarkdownEditor + ArticleForm sin acordeón (wave 2)
- [x] 17-03-PLAN.md — Admin dashboard: ArticlesSection real + rutas + breadcrumbs + eliminar modal roto (wave 3)
- [x] 17-04-PLAN.md — Organizador /cuenta/articulos + /crear-articulo + edit page (wave 3)

### Phase 18: Separar taxonomía eventos/artículos — EventCategory, EventTag, ArticleCategory, ArticleTag independientes

**Goal:** Desacoplar completamente la taxonomía de eventos y artículos: crear modelos `EventCategory`, `EventTag`, `ArticleCategory`, `ArticleTag` independientes; migrar datos desde `Category` y `Tag` actuales; eliminar los modelos compartidos; actualizar toda la capa backend (DTOs, servicios, controladores) y frontend (api.ts, formularios, filtros, páginas públicas) para usar la nueva taxonomía separada.

**Requirements**: TAX-01..TAX-12 (definidos inline en los 4 PLAN.md de la fase)

**Depends on:** Phase 17 (Articles CRUD), Phase 1 (API taxonomías original)

**Plans:** 4/4 plans complete

Plans:

- [x] 18-01-PLAN.md — Schema Prisma + migración aditiva sch08 con copia de datos preservando IDs (wave 1)
- [x] 18-02-PLAN.md — Backend API split: endpoints /event-categories /event-tags /article-categories /article-tags + OrdersService pricing migrado + EventsService/HeroesService/ArticlesService usando los nuevos modelos (wave 2)
- [x] 18-03-PLAN.md — Frontend split: api.ts tipos + Header/sitemap/CategoryView/SearchView/EventForm/ArticleForm/Step1Client (wave 3)
- [x] 18-04-PLAN.md — Dashboard CategoriesSection real + cleanup: drop tablas legacy con migración sch09, eliminar referencias `category` y `tags` (wave 4)

### Rediseño y UX de Noticias

- [x] Phase 19: Rediseño completo de Noticias (4/4 plans) — Mega menú en navbar, hub page con hero + rails por categoría + sección patrocinado, nueva ruta /noticias/categoria/[slug], filtros renovados (Tipo + Origen + Buscar + Lista/Grid), ArticleCard con likes y read-time (completed 2026-05-28)

### Phase 19: Rediseño completo de Noticias — Mega menú, hub redesign, categorías, filtros avanzados

**Goal:** Implementar el rediseño completo de la sección Noticias según design/Konbini.html: (1) mega menú hover en el navbar con grid de categorías agrupadas, (2) hub page /noticias con hero destacado + picks de redacción + rails por categoría + sección artículo patrocinado + CTA explora por categoría, (3) nueva ruta /noticias/categoria/[slug] con header de categoría + filtros avanzados (Tipo, Origen, Buscar, Grid/Lista, Ordenar) + paginación, (4) ArticleCard actualizado con botón like + contador + tiempo de lectura.

**Requirements**: NEWS-01..NEWS-10 (distribuidos en los 4 PLAN.md de la fase)

**Depends on:** Phase 18 (ArticleCategory, ArticleTag), Phase 17 (Articles CRUD), Phase 15 (UI system)

**Plans:** 4/4 plans complete

Plans:

- [x] 19-01-PLAN.md — CSS globals (.mega-*, .a-like) + tipos lib/api.ts (ApiArticle, nameJa) + ArticleCard compartido con like + reading time (wave 1)
- [x] 19-02-PLAN.md — Navbar mega menú: NewsMegaMenu.tsx + trigger hover en Header.tsx (wave 2)
- [x] 19-03-PLAN.md — Hub page /noticias: NoticiasHubView con hero + picks + grid + sponsored + rails + explore (wave 3)
- [x] 19-04-PLAN.md — Nueva ruta /noticias/categoria/[slug]: page.tsx + NewsCategoryView con fbar + grid/lista + paginación (wave 3)

---

### Phase 20: Flujo completo de Avisos y Portadas — Spots y Heroes end-to-end

**Goal:** Implementar el flujo completo de Avisos (Spots) y Portadas (Heroes) de punta a punta: (1) formularios públicos /crear-producto/spot y /crear-producto/hero con validación Zod, errores bajo cada campo, subida de imagen real, y envío correcto a la API; (2) flujo upsell /crear/upsell con mismas validaciones; (3) SpotsSection y HeroesSection del dashboard conectadas a API real (listar, aprobar, rechazar, banear); (4) tipos ApiSpot/ApiHero completos en lib/api.ts; (5) campos description y buttonText del Spot agregados al DTO si son relevantes o removidos del frontend si no.

**Requirements**: SPOT-01..SPOT-10, HERO-01..HERO-08

**Depends on:** Phase 15 (UI system), Phase 13 (sponsored articles pattern), Phase 12 (orders/cart integration)

**Plans:** 5/5 plans complete

Plans:

- [x] 20-01-PLAN.md — Backend: optional ?status= filter on GET /spots + /heroes (admin list) (wave 1)
- [x] 20-02-PLAN.md — lib/api.ts ApiSpot/ApiHero types + spot/hero methods + .field-error CSS (wave 1)
- [x] 20-03-PLAN.md — CreateProductView spot + hero forms: upload, Zod, days-to-cart (wave 2)
- [x] 20-04-PLAN.md — UpsellView SpotForm + HeroForm: same fixes (wave 2)
- [x] 20-05-PLAN.md — SpotsSection + HeroesSection dashboard wired to real API (wave 3)

---

### Phase 21: Dynamic content + complete checkout flow

**Goal:** (1) Expose a public `GET /settings/public` endpoint so the frontend can consume real prices and quotas — remove all hardcoded prices/quotas from PricingView, CreateProductView, UpsellView, upgrade, and subscription pages. (2) Rewrite CartView to load from `GET /orders/draft` and manage items via the real API. (3) Wire the full Transbank payment flow: "Pagar" button calls `POST /payments/:orderId/checkout`, receives redirectUrl, navigates to Transbank; success/error pages load and display real order data. (4) Move social links and contact emails to NEXT_PUBLIC env vars; connect about-page stats to real DB counts.

**Requirements**: PAY-01..PAY-08, DYN-01..DYN-06

**Depends on:** Phase 12 (orders/payments backend), Phase 20 (spots/heroes types in lib/api.ts)

**Plans:** 6/6 plans complete

Plans:

- [x] 21-01-PLAN.md — Public settings/stats endpoints + lib/api.ts methods + NEXT_PUBLIC env vars (wave 1)
- [x] 21-02-PLAN.md — Dynamic pricing: PricingView + HomeView + upgrade + subscription (wave 2)
- [x] 21-03-PLAN.md — Dynamic price/quota in CreateProductView + UpsellView (wave 2)
- [x] 21-04-PLAN.md — Site config: Footer + contact emails + about stats from env/DB (wave 2)
- [x] 21-05-PLAN.md — CartView bound to real /orders/draft (load, adjust, remove, discount) (wave 2)
- [ ] 21-06-PLAN.md — Transbank payment flow + route reconciliation + dynamic result pages (wave 3)

---

### Phase 22: Organization context switching — complete identity switch

**Goal:** Switching to an org via the UserMenu is a full identity switch: (1) avatar and name in the navbar change to the org; (2) `activeOrg` stored in UserContext and persisted in localStorage; (3) all API calls include `X-Org-Context: orgId`; (4) /cuenta sidebar and header reflect the org; (5) "Mis eventos/avisos/portadas" show the org's content; (6) event/spot/hero creation attributed to the org; (7) switching back to personal works everywhere.

**Requirements**: ORG-01..ORG-08

**Depends on:** Phase 9 (org backend), Phase 20 (spots/heroes), Phase 21 (cart/checkout)

**Plans:** 2/2 plans complete

Plans:

- [x] 22-01-PLAN.md — UserContext: activeOrg + OrgEntry export, localStorage kb-org persistence, api.ts sync, logout clear (wave 1)
- [ ] 22-02-PLAN.md — Visual identity switch: context-driven UserMenu + navbar avatar + /cuenta sidebar badge, human-verify end-to-end (wave 2)

### Phase 23: Cleanup post-cambio de contexto org — eliminar concepto perfil organizador del usuario, implementar mis-avisos y mis-portadas reales, fix uploadImage X-Org-Context, sidebar condicional por contexto activo

**Goal:** Eliminar todos los vestigios del modelo "perfil de organizador como modo especial del usuario" y completar los gaps de Phase 22 (org context switching): (1) borrar la página /cuenta/organizador y su tab del sidebar; (2) corregir el CTA de carrito/exito hacia /cuenta/perfil; (3) implementar /cuenta/mis-avisos y /cuenta/mis-portadas con datos reales (api.mySpots/myHeroes + filtros por tab); (4) corregir uploadImage para incluir X-Org-Context; (5) eliminar el endpoint backend PATCH /users/me/organizer (controller + service + DTO).

**Requirements**: CLEAN-01..CLEAN-07 (IDs locales a Phase 23, derivados de los 7 ítems in-scope de 23-CONTEXT.md; sin backref en ROADMAP)
**Depends on:** Phase 22
**Plans:** 3/3 plans complete

Plans:
- [x] 23-01-PLAN.md - Frontend cleanup: eliminar /cuenta/organizador + quitar tab AccountShell + fix carrito/exito CTA (wave 1)
- [x] 23-02-PLAN.md - Frontend data: mis-avisos + mis-portadas con API real + fix uploadImage X-Org-Context (wave 1)
- [x] 23-03-PLAN.md - Backend cleanup: eliminar endpoint PATCH /users/me/organizer (controller + service + DTO) (wave 2)

---

### Phase 24: Real org account switching via JWT — replace fake activeOrg overlay with full identity switch

**Goal:** Replace the fake org-context overlay (activeOrg + X-Org-Context header) with a real identity switch: switching to an org changes the JWT token and the `user` object completely, so every page (including /cuenta/perfil, /cuenta/mis-avisos, etc.) automatically shows the org's data. Backend adds `POST /auth/switch-org` which issues a new JWT with `{ sub: orgId, orgRole, actingAs: personalUserId }`; `OrgContextGuard` auto-populates `req.orgContext` from JWT instead of reading X-Org-Context header; `refreshToken` preserves org claims; `JwtUser` type extended with `orgRole?`/`actingAs?`; audit logs use `actingAs ?? sub` for correct attribution. Frontend rewrites `providers.tsx` with `switchToOrg(orgId)` (saves personal token + user for switch-back), `switchBack()`, `isOrgContext`, and `personalUser`; removes all X-Org-Context machinery from `api.ts`; rewrites `UserMenu.tsx` to use real switches; updates `AccountShell.tsx` to use `user` directly; updates `perfil/page.tsx` with conditional Danger Zone (no password change in org context); extends `ApiUser`/`sanitize()` to include `type` and `handle`. Goal: any page visited after switching to an org sees that org's JWT sub and responds with org data — no special-casing anywhere.

**Requirements**: SWITCH-01..SWITCH-12

**Depends on:** Phase 22 (org context base), Phase 23 (overlay cleanup)

**Plans:** 4/4 plans complete

Plans:

- [x] 24-01-PLAN.md — Backend auth foundation: JwtUser extension + POST /auth/switch-org + refreshToken org claims + OrgContextGuard rewrite (wave 1)
- [x] 24-02-PLAN.md — Backend service fixes: orders/payments/orgs userId via actingAs + org-can't-create-org guard + audit attribution across 5 services (wave 2)
- [x] 24-03-PLAN.md — Frontend foundation: api.ts cleanup + ApiUser/User type extension + providers.tsx real switchToOrg/switchBack (wave 2)
- [x] 24-04-PLAN.md — Frontend UI consumers: UserMenu + AccountShell + perfil Danger Zone + human-verify round-trip (wave 3)

### Phase 25: Dashboard admin real — usuarios, FAQ, logs y settings con API real

**Goal:** Conectar las secciones de administración a la API real: `UsersSection` hace fetch a `GET /users` y `PATCH /users/:id/ban`; `FAQSection` persiste crear/editar/eliminar vía API; `LogsSection` lee audit logs reales desde `GET /admin/audit-logs` con filtros por período y admin funcionales; `SettingsSection` persiste el CRUD de servicios al backend y habilita los botones de integración de pagos (WebPay info-only, MercadoPago/Flow "Próximamente").

**Requirements**: DASH-ADM-01..DASH-ADM-12 (definidos inline en los 5 PLAN.md de la fase)

**Depends on:** Phase 24
**Plans:** 5/5 plans complete

Plans:
- [x] 25-01-PLAN.md — lib/api.ts: tipos admin (ApiAdminUser/ApiFaqItem/ApiAuditLog/ApiServiceOption) + 15 métodos flat (wave 1)
- [x] 25-02-PLAN.md — UsersSection: fetch real GET /users + ban/unban PATCH + modal "Ver" detalle (wave 2)
- [x] 25-03-PLAN.md — FAQSection: CRUD real GET/POST/PATCH/DELETE /faq (wave 2)
- [x] 25-04-PLAN.md — LogsSection: GET /admin/audit-logs + filtros período/admin + columnas degradadas (wave 2)
- [x] 25-05-PLAN.md — SettingsSection: CRUD servicios real + botones de pago (WebPay modal / MP-Flow "Próximamente") (wave 2)

### Phase 26: Dashboard inbox, CRM y suscripciones con API real

**Goal:** Conectar las secciones de comunicación a la API real: `InboxSection` fetch `GET /contact` con filtros leer/archivar que persisten; `CRMSection` kanban conectado a `GET /crm` con cambios de etapa persistidos vía `PATCH /crm/:id/stage` y notas reales; `SubsSection` carga suscriptores desde `GET /subscriptions` con el botón "Ver" navegando al detalle.

**Requirements**: DASH-CRM-01..DASH-CRM-10

**Depends on:** Phase 25
**Plans:** 4/4 plans complete

Plans:
- [x] 26-01-PLAN.md — lib/api.ts: tipos Phase 26 (ApiContactMessage/ApiCrmEntry/ApiCrmNote/ApiSubscription) + 9 métodos flat (wave 1)
- [x] 26-02-PLAN.md — InboxSection: fetch real GET /contact + PATCH read + DELETE + tabs Todos/No leídos (wave 2)
- [x] 26-03-PLAN.md — CRMSection: kanban real GET /crm + modal detalle + notas + cambio de stage (wave 2)
- [x] 26-04-PLAN.md — SubsSection: GET /subscriptions + KPIs Activos/Total + modal Ver detalle (wave 2)

### Phase 27: Dashboard analytics, pagos y graficos reales con Recharts

**Goal:** Reemplazar todos los datos mock de analytics y pagos con datos reales: `HomeSection` conecta queue de revisión y actividad reciente a endpoints reales; `PaymentsSection` carga historial real desde un nuevo `GET /payments`; `ReportsSection` computa el gráfico de ventas desde el historial de pagos real con filtro de período client-side y exportación CSV real; instalar Recharts como librería de gráficos única, reemplazando los charts CSS mock de HomeSection y ReportsSection con un componente `<RevenueBarChart />` reutilizable. KPIs de ingresos, stats de categorías y rankings de top organizadores quedan mock (no existen endpoints de agregados).

**Requirements**: DASH-ANLT-01..DASH-ANLT-12 (definidos inline a continuación y distribuidos en los 5 PLAN.md de la fase)

- DASH-ANLT-01: Recharts instalado en apps/website como librería de gráficos única.
- DASH-ANLT-02: Componente `RevenueBarChart` reutilizable (ResponsiveContainer 160px, accent fill, eje mono, sin Y/grid/legend) con empty-state.
- DASH-ANLT-03: HomeSection cola de revisión desde `GET /events?status=PENDING_MODERATION&pageSize=5`.
- DASH-ANLT-04: HomeSection aprobar/rechazar real (approveEvent/rejectEvent) + actividad reciente desde `GET /admin/audit-logs?pageSize=5`.
- DASH-ANLT-05: Backend `GET /payments` admin (JwtAuthGuard + RolesGuard) que retorna órdenes PAID/FAILED normalizadas.
- DASH-ANLT-06: `findAllForAdmin()` en PaymentsService con buyer + items resueltos server-side.
- DASH-ANLT-07: Tipo `ApiPayment` + método `api.adminPayments` + reemplazo del chart CSS por `RevenueBarChart` en HomeSection y ReportsSection.
- DASH-ANLT-08: KPI "En Revisión" de HomeSection derivado del total real de eventos pendientes.
- DASH-ANLT-09: PaymentsSection tabla cargada desde `GET /payments` con loading/empty states.
- DASH-ANLT-10: PaymentsSection modal de detalle real + export CSV client-side desde datos cargados.
- DASH-ANLT-11: ReportsSection gráfico de ventas computado desde pagos reales con filtro de período client-side (Día/Semana/Mes/Año).
- DASH-ANLT-12: ReportsSection export CSV real desde los pagos del período seleccionado.

**Depends on:** Phase 26
**Plans:** 5/5 plans complete

Plans:
- [x] 27-01-PLAN.md — Backend: GET /payments admin (controller + service findAllForAdmin) (wave 1)
- [x] 27-02-PLAN.md — Frontend foundation: recharts + RevenueBarChart + api.ts (ApiPayment/adminPayments/EventsQuery.status/ApiEvent.status) (wave 1)
- [x] 27-03-PLAN.md — HomeSection: queue + actividad + KPI reales + RevenueBarChart (wave 2)
- [x] 27-04-PLAN.md — PaymentsSection: tabla + modal reales + CSV (wave 2)
- [x] 27-05-PLAN.md — ReportsSection: gráfico period-bucketed real + CSV (wave 2)

### Phase 27.1: Dashboard gap fixes — KPIs reales, catálogos geo con API real, breadcrumb, modal aprobar limpio

**Goal:** Eliminar todos los datos mock y funcionalidades falsas que quedaron en el dashboard tras las fases 25-27: computar KPIs desde datos ya cargados (ingresos mes, total pagos, publicados, suscriptores); conectar catálogos geo (Países/Divisiones/Ciudades) a la API real; fijar breadcrumb para mostrar grupo padre en lugar de "DASHBOARD"; limpiar el modal de aprobación de eventos/artículos (quitar IA falsa); cargar config del plan desde /api/settings al montar SubsSection; renombrar columna "ORGANIZADOR" → "COMPRADOR" en pagos; computar top-organizadores desde pagos reales; hacer real "Ver toda →".

**Requirements**: DASH-FIX-01..DASH-FIX-09 (inline a continuación)

- DASH-FIX-01: HomeSection KPIs calculados desde APIs reales (EVENTOS PUBLICADOS desde events API total, SUSCRIPTORES desde subscriptions total, INGRESOS MES desde payments mes actual).
- DASH-FIX-02: HomeSection panel "Por categoría" cargado desde GET /event-categories con _count.events real.
- DASH-FIX-03: HomeSection botón "Ver toda →" navega a /dashboard/events.
- DASH-FIX-04: PaymentsSection KPIs calculados desde rows cargadas (INGRESOS MES, HISTÓRICO, fallidos), columna renombrada a "COMPRADOR", botones "Descargar comprobante" y "Reembolsar" eliminados (sin backend).
- DASH-FIX-05: ReportsSection top-organizadores calculados desde pagos reales (group by buyer, barras proporcionales a valor real).
- DASH-FIX-06: SubsSection carga configuración del plan desde GET /api/settings al montar.
- DASH-FIX-07: DashboardShell breadcrumb muestra "GRUPO / LABEL" en lugar de "DASHBOARD / LABEL".
- DASH-FIX-08: Catálogos Países/Divisiones/Ciudades conectados a API real (GET/POST/PATCH/DELETE /countries, /states, /cities) con columnas reales (sin iso/flag).
- DASH-FIX-09: Modal de aprobación de eventos/artículos limpiado — quitar generador de tags IA falso (regenAI/Math.random), reemplazar por ConfirmDialog simple.

**Depends on:** Phase 27

**Plans:** 7/7 plans complete

Plans:
- [ ] 27.1-01-PLAN.md — lib/api.ts: métodos admin CRUD geo (createCountry/State/City + update/delete) (wave 1)
- [ ] 27.1-02-PLAN.md — DashboardShell breadcrumb grupo padre + SubsSection carga settings al montar (wave 1)
- [ ] 27.1-03-PLAN.md — HomeSection: KPIs reales + barras por categoría reales + "Ver toda →" link (wave 1)
- [ ] 27.1-04-PLAN.md — PaymentsSection: KPIs desde rows + columna COMPRADOR + quitar botones falsos (wave 1)
- [ ] 27.1-05-PLAN.md — ReportsSection: top-compradores desde pagos reales + quitar panel eventos (wave 1)
- [ ] 27.1-06-PLAN.md — EventsSection + ArticlesSection: quitar modal IA falso, usar ConfirmDialog (wave 1)
- [ ] 27.1-07-PLAN.md — SimpleCRUDSection: RealCountries/States/CitiesSection con API real (wave 2)

### Phase 28: Artículos con múltiples categorías — many-to-many schema, seed desde WP real, API, website, formularios y vistas públicas

**Goal:** Cambiar la relación Article↔ArticleCategory de FK única (`articleCategoryId`) a many-to-many implícita de Prisma (replicando el patrón `ArticleTag`), reconstruir la capa de datos desde la WP API real (script `update-article-categories.ts` → `categorySlugs[]` en articles.json → seed por slug), actualizar la API (include `articleCategories`, filtro `some`, 3 DTOs a `articleCategoryIds[]`), y propagar al website (tipo `ApiArticle.articleCategories`, helper `getCat` por primera categoría, rails del hub, selector múltiple en `ArticleForm`, y badge primera-categoría+conteo en `ArticlesSection`).

**Requirements**: D-01..D-13 (decisiones bloqueadas en 28-CONTEXT.md, distribuidas en los 5 PLAN.md)

**Depends on:** Phase 27, Phase 18 (taxonomía separada), Phase 17 (Articles CRUD)

**Plans:** 5/5 plans complete

Plans:
- [x] 28-01-PLAN.md — Schema Prisma m2m implícito + migración sch11 hand-crafted + regenerar cliente (wave 1)
- [x] 28-02-PLAN.md — Datos: update-article-categories.ts + articles.json categorySlugs[] + seed.ts + export-wp + delete recategorize (wave 2)
- [x] 28-03-PLAN.md — API: articles.service include/where/create/update/createSponsored + 3 DTOs a articleCategoryIds[] (wave 2)
- [x] 28-04-PLAN.md — Website display: lib/api.ts tipo + getCat + NoticiasHubView/ArticleView/SearchLightbox + NewsCategoryView x2 (wave 3)
- [x] 28-05-PLAN.md — Website forms: ArticleForm multi-select categorías + edit page + ArticlesSection badge D-11 (wave 4)

---

*Roadmap creado: 2026-03-23 · v1.0 shipped: 2026-05-27*
