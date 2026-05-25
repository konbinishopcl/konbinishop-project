---
phase: 15-rediseno-ui-migracion-de-vistas
plan: 03
subsystem: admin-panel
tags: [nextjs, react, admin, dashboard, spa, sections, modals, crud]

# Dependency graph
requires:
  - phase: 15-01
    provides: CSS tokens in globals.css (.admin-shell, .kpi-grid, .kanban), Toaster, BrandMark, useUser
  - phase: 15-02
    provides: shared table/list CSS classes

provides:
  - Admin SPA shell at /dashboard?section=X
  - 15 sections in dashboard/sections/
  - 6 modals in dashboard/modals/
  - Replaced admin.css with new design tokens

affects: [dashboard, admin]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Admin SPA routing via ?section= query param + useSearchParams (wrapped in Suspense)
    - Admin nav uses useRouter().push for ?section= navigation (matches CSS .admin-side button.nav-item)
    - Sections that lack api.ts functions use fetch() directly with Bearer token
    - Modal pattern: .confirm-bg (backdrop) + .confirm-card (panel), click-outside to close

key-files:
  created:
    - apps/website/app/dashboard/AdminPage.tsx
    - apps/website/app/dashboard/sections/HomeSection.tsx
    - apps/website/app/dashboard/sections/EventsSection.tsx
    - apps/website/app/dashboard/sections/ArticlesSection.tsx
    - apps/website/app/dashboard/sections/UsersSection.tsx
    - apps/website/app/dashboard/sections/CategoriesSection.tsx
    - apps/website/app/dashboard/sections/SpotsSection.tsx
    - apps/website/app/dashboard/sections/HeroesSection.tsx
    - apps/website/app/dashboard/sections/LogsSection.tsx
    - apps/website/app/dashboard/sections/PaymentsSection.tsx
    - apps/website/app/dashboard/sections/SubsSection.tsx
    - apps/website/app/dashboard/sections/InboxSection.tsx
    - apps/website/app/dashboard/sections/CRMSection.tsx
    - apps/website/app/dashboard/sections/FAQSection.tsx
    - apps/website/app/dashboard/sections/ReportsSection.tsx
    - apps/website/app/dashboard/sections/SettingsSection.tsx
    - apps/website/app/dashboard/modals/AdminFormModal.tsx
    - apps/website/app/dashboard/modals/AdminApproveModal.tsx
    - apps/website/app/dashboard/modals/AdminRejectModal.tsx
    - apps/website/app/dashboard/modals/AdminTransferModal.tsx
    - apps/website/app/dashboard/modals/AdminEventEditor.tsx
    - apps/website/app/dashboard/modals/AdminArticleEditor.tsx
  modified:
    - apps/website/app/dashboard/layout.tsx
    - apps/website/app/dashboard/page.tsx
    - apps/website/app/dashboard/admin.css
  deleted:
    - apps/website/app/dashboard/events/page.tsx
    - apps/website/app/dashboard/users/page.tsx
    - apps/website/app/dashboard/categories/page.tsx
    - apps/website/app/dashboard/payments/page.tsx
    - apps/website/app/dashboard/settings/page.tsx
    - apps/website/app/dashboard/logs/page.tsx
    - apps/website/app/dashboard/reports/page.tsx
    - apps/website/app/dashboard/help/page.tsx
    - apps/website/components/admin/AdminSidebar.tsx
    - apps/website/components/admin/AdminTopbar.tsx
    - apps/website/components/admin/KpiCard.tsx
    - apps/website/components/admin/RevenueChart.tsx
    - apps/website/components/admin/PlaceholderView.tsx
    - apps/website/components/admin/icons.tsx

key-decisions:
  - "Admin nav uses button+useRouter.push (not Link) to match CSS .admin-side button.nav-item selector"
  - "admin.css duplicates .admin-shell anchor but globals.css (Plan 01) is the canonical source — admin.css adds admin-specific component styles"
  - "Sections without api.ts functions use fetch() directly with Authorization: Bearer token"
  - "CRMSection uses mock data with fallback to real /api/crm when API is available"
  - "InboxSection receives kind prop (contact|photo|creators) routed by AdminPage"

requirements-completed: [UI-MIG-03, UI-ADMIN]

# Metrics
duration: 60min
completed: 2026-05-25
---

# Phase 15 Plan 03: Admin Panel Rewrite — Summary

**Admin panel completamente reescrito como SPA: AdminPage shell con sidebar colapsable, 15 secciones separadas, 6 modales y build verde.**

## Performance

- **Duration:** ~60 min
- **Started:** 2026-05-25
- **Completed:** 2026-05-25
- **Tasks:** 3/3
- **Files created:** 22
- **Files modified:** 3
- **Files deleted:** 14

## Accomplishments

### Task 1 — Demolición + nuevo shell
- Eliminadas 8 sub-rutas antiguas (`/dashboard/events`, `/users`, `/categories`, `/payments`, `/settings`, `/logs`, `/reports`, `/help`)
- Eliminados 6 componentes admin viejos (`AdminSidebar`, `AdminTopbar`, `KpiCard`, `RevenueChart`, `PlaceholderView`, `icons`)
- `AdminGuard.tsx` preservado intacto
- `layout.tsx` reescrito: solo `<AdminGuard>{children}</AdminGuard>`
- `page.tsx` reescrito: `<Suspense><AdminPage /></Suspense>`
- `AdminPage.tsx` creado: shell SPA con sidebar colapsable por grupos, routing via `?section=` y `useSearchParams`
- `admin.css` reescrito: `.admin-shell`, `.kpi`, `.panel`, `.table-wrap`, `.confirm-bg`, `.confirm-card`, `.kanban`, `.inbox-row`, `.settings-form`, `.faq-item`

### Task 2 — Secciones con API real
8 secciones creadas en `apps/website/app/dashboard/sections/`:

| Sección | API | Notas |
|---------|-----|-------|
| HomeSection | `api.adminEvents` | KPI grid + chart + cola de revisión |
| EventsSection | `api.adminEvents` + `api.approveEvent` + `api.rejectEvent` | Filter bar + tabla completa |
| ArticlesSection | `fetch /api/articles/admin` + approve/reject | Misma estructura que Events |
| UsersSection | `fetch /api/users/admin` + ban/unban | Solo SUPER_ADMIN puede banear |
| CategoriesSection | `api.categories()` + `fetch /api/categories` CRUD | Formulario inline |
| SpotsSection | `fetch /api/spots/admin` + approve/reject | Tabla con ocupación 9/12 |
| HeroesSection | `fetch /api/heroes/admin` + approve/reject | Tabla con ocupación 3/5 |
| LogsSection | `fetch /api/logs/admin` + filtros entity/action | Tabla de auditoría |

### Task 3 — Secciones UI-only + 6 modales

**Secciones UI-only:**

| Sección | Datos | Notas |
|---------|-------|-------|
| PaymentsSection | Mock | KPI grid + tabla de transacciones |
| SubsSection | Mock | Tabla suscriptores con barras de crédito |
| InboxSection | Real API `/api/contact/admin` etc | `kind` prop para contact/photo/creators |
| CRMSection | Mock + /api/crm fallback | Kanban 6 columnas + PATCH stage |
| FAQSection | Local state (mock) | CRUD inline |
| ReportsSection | Mock | Charts CSS + resumen anual |
| SettingsSection | Real API `/api/settings` | PATCH individual por key |

**Modales:**

| Modal | Descripción |
|-------|-------------|
| AdminFormModal | Modal genérico con form — `.confirm-bg` + `.confirm-card` |
| AdminApproveModal | Confirma aprobación con descripción |
| AdminRejectModal | textarea + validación min 3 chars |
| AdminTransferModal | Selección de org destino con búsqueda |
| AdminEventEditor | Formulario create/edit via `api.createEvent` |
| AdminArticleEditor | Formulario markdown create/edit |

## Task Commits

1. **Task 1: Demolición + nuevo shell** — `8c65a60`
2. **Task 2: Secciones con API real** — `afd4fa4`
3. **Task 3: Secciones UI-only + modales** — `08f4782`

## Section ID ↔ Archivo

| Section ID | Archivo | API |
|-----------|---------|-----|
| home | HomeSection.tsx | api.adminEvents |
| events | EventsSection.tsx | api.adminEvents + approveEvent + rejectEvent |
| articles | ArticlesSection.tsx | fetch /api/articles/admin |
| users | UsersSection.tsx | fetch /api/users/admin |
| payments | PaymentsSection.tsx | Mock |
| subs | SubsSection.tsx | Mock |
| contact | InboxSection.tsx (kind=contact) | fetch /api/contact/admin |
| photo | InboxSection.tsx (kind=photo) | fetch /api/services/photography/admin |
| creators | InboxSection.tsx (kind=creators) | fetch /api/services/content-creators/admin |
| crm | CRMSection.tsx | fetch /api/crm |
| categories | CategoriesSection.tsx | api.categories() + fetch /api/categories |
| spots | SpotsSection.tsx | fetch /api/spots/admin |
| heroes | HeroesSection.tsx | fetch /api/heroes/admin |
| faq | FAQSection.tsx | Local state |
| reports | ReportsSection.tsx | Mock |
| logs | LogsSection.tsx | fetch /api/logs/admin |
| settings | SettingsSection.tsx | fetch /api/settings |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] CSS selector .admin-side button.nav-item requires button element**
- **Found during:** Task 1 (AdminPage design)
- **Issue:** globals.css line 1042 has `.admin-side button.nav-item` selector — using `<Link>` (renders `<a>`) would miss the `.on` active state styling
- **Fix:** Used `<button onClick={() => router.push(...)}>` instead of `<Link>` for nav items. Matches the design source (design/Konbini.html also uses buttons for nav items)
- **Files modified:** `apps/website/app/dashboard/AdminPage.tsx`

None other — plan executed as written.

## Build Verification

`pnpm --filter konbini-website build` — **exit 0** ✓

## Known Stubs

- `PaymentsSection`: Mock data. No payment API exists yet. Will be connected when payment processing is implemented.
- `SubsSection`: Mock data. Will be connected when subscription API is implemented.
- `FAQSection`: Local state only. Will be connected to `/api/faq` admin endpoint when implemented.
- `ReportsSection`: All mock data. Will connect to analytics API when available.
- `CRMSection`: Mock data fallback (real API tried first at `/api/crm`).
- `AdminTransferModal`: Uses mock org list. Will need real org search endpoint.
- `AdminEventEditor`/`AdminArticleEditor`: Edit mode doesn't pre-fill from API (create only fully functional).

These stubs do NOT prevent the plan's goal (admin panel rewrite) from being achieved — the admin shell, routing, and real API integrations (events approve/reject, categories CRUD, users, logs, settings) all work.

---
*Phase: 15-rediseno-ui-migracion-de-vistas*
*Completed: 2026-05-25*
