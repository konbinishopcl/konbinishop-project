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
- [x] Phase 16: EventForm rewrite (1/1 plans) — Paridad visual con design/app.jsx: arrays dinámicos, uploads, footer sticky

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

**Plans:** 3/5 plans executed

Plans:

- [x] 20-01-PLAN.md — Backend: optional ?status= filter on GET /spots + /heroes (admin list) (wave 1)
- [x] 20-02-PLAN.md — lib/api.ts ApiSpot/ApiHero types + spot/hero methods + .field-error CSS (wave 1)
- [ ] 20-03-PLAN.md — CreateProductView spot + hero forms: upload, Zod, days-to-cart (wave 2)
- [x] 20-04-PLAN.md — UpsellView SpotForm + HeroForm: same fixes (wave 2)
- [ ] 20-05-PLAN.md — SpotsSection + HeroesSection dashboard wired to real API (wave 3)

---

### Phase 21: Dynamic content + complete checkout flow

**Goal:** (1) Expose a public `GET /settings/public` endpoint so the frontend can consume real prices and quotas — remove all hardcoded prices/quotas from PricingView, CreateProductView, UpsellView, upgrade, and subscription pages. (2) Rewrite CartView to load from `GET /orders/draft` and manage items via the real API. (3) Wire the full Transbank payment flow: "Pagar" button calls `POST /payments/:orderId/checkout`, receives redirectUrl, navigates to Transbank; success/error pages load and display real order data. (4) Move social links and contact emails to NEXT_PUBLIC env vars; connect about-page stats to real DB counts.

**Requirements**: PAY-01..PAY-08, DYN-01..DYN-06

**Depends on:** Phase 12 (orders/payments backend), Phase 20 (spots/heroes types in lib/api.ts)

**Plans:** 6 plans

Plans:

- [ ] 21-01-PLAN.md — Public settings/stats endpoints + lib/api.ts methods + NEXT_PUBLIC env vars (wave 1)
- [ ] 21-02-PLAN.md — Dynamic pricing: PricingView + HomeView + upgrade + subscription (wave 2)
- [ ] 21-03-PLAN.md — Dynamic price/quota in CreateProductView + UpsellView (wave 2)
- [ ] 21-04-PLAN.md — Site config: Footer + contact emails + about stats from env/DB (wave 2)
- [ ] 21-05-PLAN.md — CartView bound to real /orders/draft (load, adjust, remove, discount) (wave 2)
- [ ] 21-06-PLAN.md — Transbank payment flow + route reconciliation + dynamic result pages (wave 3)

---

*Roadmap creado: 2026-03-23 · v1.0 shipped: 2026-05-27*
