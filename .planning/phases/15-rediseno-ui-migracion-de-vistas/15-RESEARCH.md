# Phase 15: Rediseño UI — migración de vistas - Research

**Researched:** 2026-05-25
**Domain:** Next.js 15 App Router — UI migration / design system adoption
**Confidence:** HIGH

## Summary

Phase 15 migrates all website views to the design defined in `design/Konbini.html`. The work is purely presentational: no API changes, no new business logic. The source of truth is a single 6410-line HTML file containing ~80 React component functions and all required CSS in inline `<style>` blocks.

The most important pre-planning finding is that **CSS design tokens (--bg, --surface, --accent, etc.) are already present and identical in `apps/website/app/globals.css`**. The "token replacement" described in D-01 is already done; Wave 1 work is adding NEW CSS classes absent from the current globals, not replacing variables. The admin panel is a complete rewrite: current `admin.css` uses a different class naming convention (`.admin`/`.sidebar`/`.content`) that conflicts with the design's new names (`.admin-shell`/`.admin-side`/`.admin-main`).

The design's mock infrastructure (`RouterProvider`, `ToastProvider`, `UserProvider`, `ThemeProvider`) must NOT be ported to Next.js — all of those roles are already fulfilled by `providers.tsx` (`useUser()`, `useTheme()`), Next.js routing, and a toast library that needs to be added (`sonner`).

**Primary recommendation:** Treat `design/Konbini.html` as a pixel-perfect spec. Extract CSS classes and component JSX directly from it. Preserve all existing hooks, `lib/api.ts`, and `AdminGuard.tsx` untouched.

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Sistema de diseño (tokens CSS)
- **D-01:** Reemplazar el sistema de variables CSS actual por el del diseño:
  `--bg`, `--bg-2`, `--surface`, `--surface-2`, `--line`, `--line-2`, `--ink`, `--ink-2`,
  `--ink-3`, `--accent` (#ff5b49), `--accent-2` (#f3c053), `--accent-3` (#6c5cff),
  `--ok`, `--warn`, `--err`, `--shadow`, `--ring`, `--r-sm`, `--r`, `--r-lg`, `--r-xl`
- **D-02:** Tipografía del diseño: Space Grotesk (display/headings), Inter (body),
  Zen Kaku Gothic New (elementos japoneses), JetBrains Mono (mono). Cargar desde Google Fonts.
- **D-03:** El diseño tiene modo oscuro (default) y modo claro con `[data-theme="light"]`.
  Se implementa el toggle en el Header. El modo oscuro es el default.

#### Separación de vistas
- **D-04:** Cada vista/página en su propio archivo. No se mezclan páginas en un mismo archivo.
  El código del diseño es una SPA de referencia — hay que traducirlo a la estructura de
  Next.js App Router con rutas separadas.
- **D-05:** Los subcomponentes de vista grandes (ej. pasos del formulario, secciones de
  AccountPage) también van en archivos separados dentro de la carpeta de su ruta.

#### Mapeo de rutas: diseño → Next.js

**Vistas existentes a actualizar:**
- `home` → `(site)/page.tsx` — actualizar con nuevo layout/componentes
- `category` → `(site)/categoria/[cat]/page.tsx` — actualizar
- `event` → `(site)/evento/[slug]/page.tsx` — actualizar (vista muy expandida en el diseño)
- `search` → `(site)/busqueda/` — actualizar
- `form` (multi-step) → `crear/` — actualizar Step1..4 + layouts
- `login` / `auth` → `login/` y `registro/` — rediseñar con nueva `AuthPage`/`AuthShell`

**Admin completamente rediseñado:**
- `admin` → `dashboard/` — rediseñar desde cero con la nueva `AdminPage` del diseño.
  El admin actual usa `AdminSidebar`/`AdminTopbar` separados; el nuevo diseño
  tiene su propio sidebar integrado con secciones: events, articles, users, payments,
  subscriptions, CRM, inbox, categories, spots, heroes, FAQ, reports, logs, settings.

**Vistas de usuario:**
- `dashboard` (organizador) → `(site)/cuenta/publicaciones/page.tsx` — la vista
  "Mis publicaciones" del organizador (DashboardPage del diseño) es nueva sección de cuenta.
- `account` → `(site)/cuenta/page.tsx` — expandir con todas las pestañas del diseño:
  perfil, organizaciones, suscripción, eventos, artículos, favoritos, mensajes, pagos.
  Cada pestaña en su propio archivo dentro de `cuenta/`.

**Nuevas vistas a crear:**
- `news` → `(site)/noticias/page.tsx`
- `article` → `(site)/noticias/[slug]/page.tsx`
- `organizer` → `(site)/u/[handle]/page.tsx`
- `pricing` → `(site)/precios/page.tsx`
- `photo` → `(site)/servicios/fotografia/page.tsx`
- `creators` → `(site)/servicios/creadores/page.tsx`
- `photoThanks` / `creatorsThanks` / `contactThanks` → `(site)/gracias/[kind]/page.tsx`
- `cart` → `(site)/carrito/page.tsx`
- `cartSuccess` → `(site)/carrito/exito/page.tsx`
- `cartFail` → `(site)/carrito/error/page.tsx`
- `createSpot` / `createHero` / `createArticle` → `(site)/crear/[kind]/page.tsx` o dentro de cuenta
- `about` → `(site)/nosotros/page.tsx`
- `help` → `(site)/ayuda/page.tsx`
- `tag` → `(site)/tag/[tag]/page.tsx`
- `expired` → `(site)/evento/expirado/page.tsx`
- `upsell` → `(site)/upgrade/page.tsx`
- `notfound` → `app/not-found.tsx`

#### Componentes compartidos a actualizar
- **D-06:** `Header` — completamente actualizado: nuevo logo con `BrandMark` (imagen SVG),
  nav de categorías como pills/botones, buscador, menú de usuario con avatar y dropdown,
  toggle de tema oscuro/claro, mega-menú de categorías.
- **D-07:** `Footer` — actualizar con nueva estructura y links del diseño.
- **D-08:** `EventCard` — actualizar con nuevo diseño de poster (aspect-ratio 4/5,
  esquinas redondeadas 22px, chips de categoría + "hoy", botón de favorito).
- **D-09:** `Poster` — actualizar/unificar con el nuevo diseño de card.
- **D-10:** `Rail` — actualizar con nuevo header de sección (título + label japonés + "ver todos").
- **D-11:** `HeroBlock` → renombrar/refactorizar a `HeroCarousel` con el nuevo diseño
  (grid de 2 cols, texto + arte con poster diagonal, flechas de navegación).

#### Admin dashboard
- **D-12:** El dashboard admin (`/dashboard/`) se rediseña completamente. La nueva
  estructura es una SPA dentro de la ruta con un sidebar lateral y contenido principal
  que cambia de sección sin navegar de ruta. El sidebar tiene:
  - Eventos, Artículos, Usuarios, Pagos, Suscripciones, CRM, Mensajes/Inbox,
    Categorías, Avisos (spots), Portadas (heroes), FAQ, Reportes, Logs, Configuración.
- **D-13:** Las vistas de cada sección del admin van en archivos separados dentro de
  `dashboard/` (ej. `dashboard/sections/EventsSection.tsx`, `ArticlesSection.tsx`, etc.).
- **D-14:** El admin actual tiene integraciones reales (aprobar/rechazar eventos con API).
  Estas integraciones se preservan en las secciones correspondientes del nuevo admin.
  Las secciones sin API real (pagos, suscripciones, CRM visual) quedan con UI del diseño.

#### Nuevas vistas — nivel de integración
- **D-15:** Las vistas nuevas se implementan con la UI del diseño fiel al HTML.
  Los datos que ya tienen API (noticias/artículos, perfil de organizador, búsqueda,
  categorías) se conectan a las APIs existentes. Los datos sin API (carrito completo,
  precios, servicios con cotización) usan datos de ejemplo/mock del diseño.
- **D-16:** Los formularios de servicios (fotografía, creadores) usan el mismo patrón
  que el formulario de contacto existente — envían a la API de servicios de Phase 14.

### Claude's Discretion
- Estructura exacta de archivos dentro de cada carpeta de ruta
- Decisión sobre si `CreateProductPage` va dentro de `/crear/` o `/cuenta/`
- Manejo de estados de carga y error en vistas nuevas (skeleton vs spinner)
- Responsive breakpoints para las nuevas vistas (seguir el patrón del diseño)

### Deferred Ideas (OUT OF SCOPE)
- Nuevas integraciones API para las vistas nuevas (noticias con API real, carrito real,
  suscripción conectada) — esto es scope de fases futuras.
- `CheckoutPage` del diseño hace referencia a venta de entradas (eliminada en Phase 2) —
  se omite o se implementa solo como referencia visual sin funcionalidad real.
- `UpsellPage` (upgrade/suscripción) — implementar UI pero sin flujo de pago real.
</user_constraints>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| next | ^15.1.0 | App Router framework | Already installed, locked |
| react | ^19.0.0 | Component rendering | Already installed, locked |
| react-hook-form | ^7.76.0 | Form state management | Already installed, existing pattern |
| zod | ^4.4.3 | Schema validation | Already installed, existing pattern |
| @hookform/resolvers | ^5.4.0 | RHF+Zod bridge | Already installed |
| @react-oauth/google | ^0.13.5 | Google OAuth | Already installed |

### Supporting (to add)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| sonner | ^1.x | Toast notifications | Any action feedback (approve/reject, form submit, copy) |

**Version verification:**
```bash
# Already installed — verified via package.json
# To add:
npm view sonner version  # verify before install
```

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| sonner | react-hot-toast | sonner has better Next.js App Router support (Toaster in layout) |
| hand-rolled MarkdownArea | @uiw/react-md-editor | design's MarkdownArea is ~30 lines, no dep needed |
| hand-rolled ConfirmDialog | @radix-ui/react-alert-dialog | design pattern `.confirm-bg/.confirm-card` is complete, no dep needed |

**Installation (new deps only):**
```bash
cd apps/website && pnpm add sonner
```

---

## Architecture Patterns

### Recommended Project Structure

```
apps/website/
├── app/
│   ├── (site)/
│   │   ├── page.tsx                        # Home (update: HeroCarousel + Rails)
│   │   ├── categoria/[cat]/page.tsx        # Category (update)
│   │   ├── evento/
│   │   │   ├── [slug]/page.tsx             # Event detail (update)
│   │   │   └── expirado/page.tsx           # NEW: expired event
│   │   ├── busqueda/page.tsx               # Search (update)
│   │   ├── noticias/
│   │   │   ├── page.tsx                    # NEW: articles list
│   │   │   └── [slug]/page.tsx             # NEW: article detail
│   │   ├── u/[handle]/page.tsx             # NEW: organizer profile
│   │   ├── cuenta/
│   │   │   ├── page.tsx                    # Account (expand with tabs)
│   │   │   ├── publicaciones/page.tsx      # NEW: my publications (DashboardPage)
│   │   │   ├── tabs/                       # NEW: sub-components per tab
│   │   │   │   ├── PerfilTab.tsx
│   │   │   │   ├── OrganizacionesTab.tsx
│   │   │   │   ├── SuscripcionTab.tsx
│   │   │   │   ├── EventosTab.tsx
│   │   │   │   ├── ArticulosTab.tsx
│   │   │   │   ├── FavoritosTab.tsx
│   │   │   │   ├── MensajesTab.tsx
│   │   │   │   └── PagosTab.tsx
│   │   ├── carrito/
│   │   │   ├── page.tsx                    # NEW: cart
│   │   │   ├── exito/page.tsx              # NEW: cart success
│   │   │   └── error/page.tsx              # NEW: cart fail
│   │   ├── precios/page.tsx                # NEW: pricing
│   │   ├── servicios/
│   │   │   ├── fotografia/page.tsx         # NEW: photography service
│   │   │   └── creadores/page.tsx          # NEW: content creators service
│   │   ├── gracias/[kind]/page.tsx         # NEW: thanks page (photo/creators/contact)
│   │   ├── nosotros/page.tsx               # NEW: about
│   │   ├── ayuda/page.tsx                  # NEW: help
│   │   ├── tag/[tag]/page.tsx              # NEW: tag listing
│   │   └── upgrade/page.tsx               # NEW: upsell (UI only, deferred payment)
│   ├── crear/
│   │   └── (existing steps, update)
│   ├── login/page.tsx                      # Redesign with AuthShell
│   ├── registro/page.tsx                   # Redesign with AuthShell
│   ├── dashboard/
│   │   ├── layout.tsx                      # Replace: AdminGuard only (no sidebar/topbar components)
│   │   ├── page.tsx                        # Replace: AdminPage with ?section= routing
│   │   ├── admin.css                       # Replace entirely: new admin shell classes
│   │   └── sections/                       # NEW: one file per admin section
│   │       ├── EventsSection.tsx
│   │       ├── ArticlesSection.tsx
│   │       ├── UsersSection.tsx
│   │       ├── PaymentsSection.tsx
│   │       ├── SubscriptionsSection.tsx
│   │       ├── CrmSection.tsx
│   │       ├── InboxSection.tsx
│   │       ├── CategoriesSection.tsx
│   │       ├── SpotsSection.tsx
│   │       ├── HeroesSection.tsx
│   │       ├── FaqSection.tsx
│   │       ├── ReportsSection.tsx
│   │       ├── LogsSection.tsx
│   │       └── SettingsSection.tsx
│   └── not-found.tsx                       # NEW
├── components/
│   ├── Header.tsx                          # Update (new logo, pills, mega-menu, theme toggle)
│   ├── Footer.tsx                          # Update (new structure)
│   ├── EventCard.tsx                       # Update (new poster design)
│   ├── Poster.tsx                          # Update (unify with new card)
│   ├── Rail.tsx                            # Update (title + JP label + ver-todos)
│   ├── HeroCarousel.tsx                    # NEW (rename from HeroBlock)
│   ├── icons.tsx                           # NEW: centralize SVG icons from design
│   ├── MarkdownArea.tsx                    # NEW: hand-rolled markdown editor
│   ├── ConfirmDialog.tsx                   # NEW: hand-rolled confirm modal
│   ├── providers.tsx                       # DO NOT TOUCH
│   └── admin/
│       └── AdminGuard.tsx                  # DO NOT TOUCH
└── app/globals.css                         # ADD new CSS classes (tokens already done)
```

**Files to DELETE (old admin, now replaced):**
- `components/admin/AdminSidebar.tsx`
- `components/admin/AdminTopbar.tsx`
- `components/admin/KpiCard.tsx`
- `components/admin/RevenueChart.tsx`
- `components/admin/PlaceholderView.tsx`
- `components/admin/icons.tsx`
- `app/dashboard/events/page.tsx`
- `app/dashboard/categories/page.tsx`
- `app/dashboard/users/page.tsx`
- `app/dashboard/payments/page.tsx`
- `app/dashboard/settings/page.tsx`
- `app/dashboard/logs/page.tsx`
- `app/dashboard/reports/page.tsx`
- `app/dashboard/help/page.tsx`

### Pattern 1: Admin SPA via `?section=` query param

The admin panel uses a single `dashboard/page.tsx` that reads `searchParams.section` and renders the corresponding section component. Section navigation is handled by `<Link href="/dashboard?section=events">` — no `useRouter` or client-side state needed.

```tsx
// dashboard/page.tsx  (Server Component)
import { redirect } from 'next/navigation'
import AdminPage from './AdminPage'

export default function DashboardPage({ searchParams }: { searchParams: { section?: string } }) {
  const section = searchParams.section ?? 'events'
  return <AdminPage section={section} />
}
```

```tsx
// dashboard/AdminPage.tsx  ("use client")
import EventsSection from './sections/EventsSection'
import ArticlesSection from './sections/ArticlesSection'
// ... etc

const SECTIONS: Record<string, React.ComponentType> = {
  events: EventsSection,
  articles: ArticlesSection,
  // ...
}

export default function AdminPage({ section }: { section: string }) {
  const Section = SECTIONS[section] ?? EventsSection
  return (
    <div className="admin-shell">
      <aside className="admin-side">
        {/* ADMIN_NAV from design — Link hrefs use ?section=X */}
      </aside>
      <main className="admin-main">
        <Section />
      </main>
    </div>
  )
}
```

### Pattern 2: Theme toggle via `data-theme` attribute on `<html>`

```tsx
// From providers.tsx — useTheme() returns { theme, toggleTheme }
// Header uses it:
const { theme, toggleTheme } = useTheme()
// On mount: document.documentElement.setAttribute('data-theme', theme)
// Toggle: toggleTheme() → updates state + localStorage + data-theme attribute
```

CSS in globals.css uses `:root` for dark (default) and `[data-theme="light"]` for light override.

### Pattern 3: Service forms connect to existing `api.ts`

```tsx
// servicios/fotografia/page.tsx
// Uses existing pattern from contact form
import { api } from '@/lib/api'

async function handleSubmit(data: ServiceFormData) {
  await api.createServiceRequest({ type: 'PHOTOGRAPHY', ...data })
  router.push('/gracias/foto')
}
```

### Pattern 4: New CSS classes — add to globals.css, not new files

The project uses CSS globals only (no CSS Modules). All new CSS classes from the design are appended to `globals.css`. The old `admin.css` is deleted and admin CSS is either merged into `globals.css` or a new `dashboard/admin.css` with the new class names.

### Anti-Patterns to Avoid

- **Porting design mock providers:** `RouterProvider`, `ToastProvider`, `UserProvider`, `ThemeProvider` in `design/Konbini.html` are test harness code. NEVER port these to Next.js.
- **Creating new `useRouter` hook:** The design has its own `useRouter()` returning `{ nav }` — this is NOT Next.js's router. Use `next/navigation` `useRouter` + `useSearchParams` + `<Link>` instead.
- **Using sub-routes for admin sections:** `dashboard/events/page.tsx` is old pattern. New pattern is `dashboard/page.tsx?section=events`. Delete old sub-route folders.
- **Mixing `useUser()` into Server Components:** Pages that need user state must be "use client" or pass user data as props from a client boundary.
- **Replacing globals.css tokens:** Tokens are already identical to design. Only ADD new classes; don't replace existing token definitions.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Toast notifications | Custom toast system | `sonner` | Stacking, positioning, animation, a11y edge cases |
| Google OAuth flow | Custom OAuth | `@react-oauth/google` (already installed) | Token validation, PKCE, refresh |
| Form validation | Custom validators | `react-hook-form` + `zod` (already installed) | Dirty tracking, async validation, nested errors |

**What IS fine to hand-roll (because design provides complete code):**
- `MarkdownArea` component — design has a ~30-line implementation with toolbar + textarea
- `ConfirmDialog` component — design's `.confirm-bg/.confirm-card` pattern is self-contained
- Admin section components — they're just table + filter UI, no complex state

**Key insight:** This phase is translation work, not engineering work. The design provides every pixel of CSS and every component function. The job is to extract, adapt (remove mock providers, use Next.js routing), and place files correctly.

---

## Runtime State Inventory

> UI-only migration phase — no data stores, services, or OS registrations are affected.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no data schema changes | None |
| Live service config | None — no external service config touched | None |
| OS-registered state | None — no process managers or schedulers | None |
| Secrets/env vars | None — existing env vars unchanged | None |
| Build artifacts | `apps/website/.next/` — stale after component renames | `pnpm build` clears automatically |

---

## Common Pitfalls

### Pitfall 1: Confusing design mock routing with Next.js routing
**What goes wrong:** Design has `const useRouter = () => ({ nav: (page, params) => ... })`. Copying this into Next.js causes all navigation to be no-ops or throw.
**Why it happens:** The design is a single-file SPA with its own router mock for presentation purposes.
**How to avoid:** Always use `import { useRouter, useSearchParams } from 'next/navigation'` and `<Link href="...">`. Never copy the design's `useRouter` function.
**Warning signs:** Navigation clicks do nothing, or URL never changes when clicking sidebar items.

### Pitfall 2: Treating admin sub-routes as still valid
**What goes wrong:** New `dashboard/page.tsx` renders `AdminPage` but old `dashboard/events/page.tsx` still exists and catches `/dashboard/events` URL, bypassing the new design.
**Why it happens:** Next.js App Router resolves the most specific route — a sub-folder with `page.tsx` wins over `page.tsx?section=`.
**How to avoid:** Delete ALL old admin sub-route folders (`events/`, `categories/`, `users/`, `payments/`, `settings/`, `logs/`, `reports/`, `help/`) before or as part of Wave 2.
**Warning signs:** Navigating to `/dashboard?section=events` works, but `/dashboard/events` still shows old UI.

### Pitfall 3: Breaking existing real admin integrations
**What goes wrong:** New `EventsSection.tsx` renders the design's UI but loses the real approve/reject API calls.
**Why it happens:** Design's `EventsSection` in the HTML file uses mock data and mock actions. Copying it verbatim drops the real `api.approveEvent()` / `api.rejectEvent()` calls.
**How to avoid:** For sections with real APIs (events, articles, users, categories, spots, heroes, logs), port the API calls from the OLD section files before deleting them.
**Warning signs:** Approve/reject buttons appear but do nothing (or no toasts, no state change).

### Pitfall 4: CSS class name collisions during migration
**What goes wrong:** Old `.admin` (grid container) in `admin.css` and new `.admin-shell` in design coexist, causing layout breakage.
**Why it happens:** Incremental replacement — if old CSS file is not fully deleted, both sets of rules apply.
**How to avoid:** Delete `admin.css` entirely in Wave 2 Step 1, and add the complete new admin CSS block to `globals.css` in the same commit.
**Warning signs:** Admin sidebar appears but is unstyled, or page layout shows two grids.

### Pitfall 5: `"use client"` missing on interactive new pages
**What goes wrong:** New page (e.g. `cuenta/page.tsx` with tabs) crashes with "You're importing a component that needs useState" error.
**Why it happens:** Next.js App Router defaults to Server Components. Any page using hooks or browser APIs needs `"use client"`.
**How to avoid:** Add `"use client"` at the top of any page/component that uses hooks (`useState`, `useEffect`, `useUser()`, `useTheme()`, `useSearchParams()`).
**Warning signs:** Build error mentioning `useState` or `useEffect` in a Server Component.

### Pitfall 6: Font import conflicts or FOUT
**What goes wrong:** Google Fonts loaded via `<link>` in layout.tsx cause Flash of Unstyled Text (FOUT) or CLS issues.
**Why it happens:** External font loading blocks render.
**How to avoid:** Use Next.js `next/font/google` for all four fonts (Space Grotesk, Inter, Zen Kaku Gothic New, JetBrains Mono) and apply them as CSS variables in the `<html>` className. This is Next.js's built-in font optimization.
**Warning signs:** Fonts flash from fallback to design fonts on load, or Lighthouse CLS score degrades.

### Pitfall 7: SVG logo not found at build time
**What goes wrong:** `<img src="/konbini-logo.svg">` shows broken image.
**Why it happens:** SVG file not placed in `apps/website/public/` (or has wrong name).
**How to avoid:** Verify `apps/website/public/konbini-logo.svg` exists before implementing `BrandMark`. If missing, create it (design includes the SVG).
**Warning signs:** Header shows broken image instead of logo.

---

## Code Examples

Verified patterns from existing codebase and design:

### Adding sonner Toaster to app layout
```tsx
// apps/website/app/layout.tsx
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
```

### Theme toggle (existing pattern in providers.tsx)
```tsx
// Already implemented in providers.tsx — useTheme() returns:
const { theme, toggleTheme } = useTheme()
// theme: 'dark' | 'light'
// toggleTheme(): void  — updates localStorage + document.documentElement.dataset.theme
```

### Admin section routing (design pattern adapted for Next.js)
```tsx
// dashboard/page.tsx  (Server Component is fine — reads searchParams)
export default function Page({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  // In Next.js 15, searchParams is async
  return <AdminPageClient />
}

// dashboard/AdminPage.tsx  ("use client")
import { useSearchParams } from 'next/navigation'
const params = useSearchParams()
const section = params.get('section') ?? 'events'
```

### New CSS classes to add to globals.css (from design)
```css
/* Admin shell */
.admin-shell { display: grid; grid-template-columns: 260px 1fr; min-height: 100vh; }
.admin-side { position: sticky; top: 0; height: 100vh; overflow-y: auto; background: var(--bg-2); border-right: 1px solid var(--line); }
.admin-main { display: flex; flex-direction: column; overflow: hidden; }
.admin-top { padding: 16px 24px; border-bottom: 1px solid var(--line); display: flex; align-items: center; gap: 12px; }
.admin-body { flex: 1; overflow-y: auto; padding: 24px; }
.grp { margin-bottom: 8px; }
.grp-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: var(--ink-3); padding: 8px 16px 4px; }
.nav-item { display: flex; align-items: center; gap: 10px; padding: 8px 16px; border-radius: var(--r); cursor: pointer; color: var(--ink-2); transition: background .15s, color .15s; }
.nav-item:hover, .nav-item.active { background: var(--surface-2); color: var(--ink); }

/* Hero Carousel */
.pcar { position: relative; overflow: hidden; border-radius: var(--r-xl); }
.pcar-track { display: flex; transition: transform .5s cubic-bezier(.4,0,.2,1); }
.pcar-slide { flex: 0 0 100%; }

/* Confirm dialog */
.confirm-bg { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 999; }
.confirm-card { background: var(--surface); border-radius: var(--r-lg); padding: 24px; max-width: 400px; width: calc(100% - 32px); }

/* Auth shell */
.auth-shell { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
.auth-card { background: var(--surface); border-radius: var(--r-xl); padding: 40px; width: 100%; max-width: 420px; }
```

### HeroCarousel auto-advance (design pattern)
```tsx
// components/HeroCarousel.tsx  ("use client")
// Replaces HeroBlock — auto-advances every 7s
useEffect(() => {
  const id = setInterval(() => setIdx(i => (i + 1) % items.length), 7000)
  return () => clearInterval(id)
}, [items.length])
```

### Next.js font optimization (replaces `<link>` in layout)
```tsx
// apps/website/app/layout.tsx
import { Space_Grotesk, Inter, Zen_Kaku_Gothic_New, JetBrains_Mono } from 'next/font/google'

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-display' })
const inter = Inter({ subsets: ['latin'], variable: '--font-body' })
const zenKaku = Zen_Kaku_Gothic_New({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-jp' })
const jetbrains = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={`${spaceGrotesk.variable} ${inter.variable} ${zenKaku.variable} ${jetbrains.variable}`}>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `<link rel="stylesheet">` Google Fonts | `next/font/google` | Next.js 13 | No FOUT, better CLS, self-hosted automatically |
| Admin sub-routes (`/dashboard/events`) | Single page + `?section=` param | Phase 15 | No full-page navigation, simpler layout |
| `HeroBlock` with static content | `HeroCarousel` with auto-advance | Phase 15 | Dynamic hero, multiple featured items |
| Old token names (if any) | Design token names | Already done | globals.css already has correct tokens |

**Deprecated/outdated (to delete):**
- `AdminSidebar.tsx`, `AdminTopbar.tsx`: replaced by inline admin sidebar in `AdminPage`
- `KpiCard.tsx`, `RevenueChart.tsx`, `PlaceholderView.tsx`: replaced by new section components
- `components/admin/icons.tsx`: replaced by centralized `components/icons.tsx`
- `dashboard/admin.css`: class names incompatible with new design — delete and replace
- All `dashboard/*/page.tsx` sub-routes: replaced by `?section=` pattern

---

## Open Questions

1. **`next/font` vs Google Fonts `<link>` tag**
   - What we know: `globals.css` currently has `@import url('https://fonts.googleapis.com/...')` — this works but has FOUT risk.
   - What's unclear: Whether the current implementation causes performance issues in production.
   - Recommendation: Migrate to `next/font/google` in Wave 1 alongside the CSS update. The four font families are already defined in the design.

2. **`searchParams` async in Next.js 15**
   - What we know: In Next.js 15, `searchParams` in Server Components is a Promise.
   - What's unclear: Whether dashboard page currently uses searchParams (it doesn't — admin is currently multi-route).
   - Recommendation: Implement `AdminPage` as `"use client"` using `useSearchParams()` hook — sidesteps the async searchParams issue entirely.

3. **Konbini logo SVG existence**
   - What we know: Context says `konbini-logo.svg` should be at `public/konbini-logo.svg`.
   - What's unclear: Whether it actually exists in the repo (git status doesn't show it as new).
   - Recommendation: Wave 1 planner should verify file existence. If missing, extract SVG from design.

4. **`CreateProductPage` location**
   - What we know: Design has `createSpot/createHero/createArticle` views. Context says Claude's discretion for placement.
   - What's unclear: Whether these should be inside `/crear/[kind]/` or inside `/cuenta/`.
   - Recommendation: Place under `(site)/crear/[kind]/page.tsx` — consistent with existing `/crear/` pattern for event creation.

---

## Validation Architecture

> nyquist_validation: true — section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | None installed in `apps/website` |
| Config file | None — Wave 0 gap |
| Quick run command | `pnpm --filter website build` (type-check + build) |
| Full suite command | `pnpm --filter website build && pnpm --filter website lint` |

### Phase Requirements → Test Map

Phase 15 has no explicit requirement IDs in REQUIREMENTS.md (it is a UI migration phase). Behavior coverage is visual/manual — automated checks focus on build correctness.

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UI-BUILD | All pages compile without TypeScript errors | build | `pnpm --filter website build` | ✅ |
| UI-LINT | No ESLint errors in new/updated files | lint | `pnpm --filter website lint` | ✅ |
| UI-ROUTES | All new routes render without 404 | smoke/manual | Manual browser check | ❌ Wave 0 |
| UI-ADMIN | Admin sections render + real integrations work | manual | Manual browser check | ❌ Wave 0 |
| UI-THEME | Dark/light toggle persists across navigation | manual | Manual browser check | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm --filter website build` (ensures TS compiles)
- **Per wave merge:** `pnpm --filter website build && pnpm --filter website lint`
- **Phase gate:** Full build green + manual smoke of all new routes before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] No automated UI test framework (Playwright, Cypress) — acceptable for this phase; manual smoke checklist is sufficient
- [ ] `sonner` package not yet installed — must be added before Wave 1

*(If Playwright is desired in a future phase, install: `pnpm add -D @playwright/test` + `npx playwright install`)*

---

## Sources

### Primary (HIGH confidence)
- `design/Konbini.html` — complete reference implementation (6410 lines, all components + CSS)
- `apps/website/app/globals.css` — current token state (verified identical to design)
- `apps/website/app/dashboard/admin.css` — current admin CSS (verified incompatible class names)
- `apps/website/package.json` — verified installed dependencies and versions
- `apps/website/components/providers.tsx` — verified `useUser()` and `useTheme()` API
- `.planning/phases/15-rediseno-ui-migracion-de-vistas/15-CONTEXT.md` — locked decisions

### Secondary (MEDIUM confidence)
- Next.js 15 App Router docs — `searchParams` async behavior, `next/font/google` pattern
- `sonner` npm registry — toast library for Next.js App Router

### Tertiary (LOW confidence)
- None

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified via package.json, no version uncertainty
- Architecture: HIGH — verified by reading actual source files and design HTML
- Pitfalls: HIGH — derived from direct code inspection (admin.css class name mismatch, design mock providers)
- CSS token state: HIGH — read globals.css in full, confirmed tokens identical to design

**Research date:** 2026-05-25
**Valid until:** 2026-06-25 (stable framework versions)
