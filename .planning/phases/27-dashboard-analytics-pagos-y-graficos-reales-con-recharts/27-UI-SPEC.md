---
phase: 27
slug: dashboard-analytics-pagos-y-graficos-reales-con-recharts
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-29
---

# Phase 27 — UI Design Contract

> Visual and interaction contract for the Recharts migration and real-data wiring in HomeSection, PaymentsSection, and ReportsSection.
>
> **Important:** This phase does NOT introduce new pages, layouts, or design tokens. The full design system was established in globals.css and admin.css across Phases 15–26. This contract transcribes the inherited system and forbids new tokens. Every value below maps directly to an existing CSS variable or rule.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — custom CSS system (globals.css + admin.css) |
| Preset | not applicable |
| Component library | none — project-native CSS classes |
| Icon library | inline Unicode / none |
| Font | Space Grotesk (display), Inter (body), JetBrains Mono (mono) — via Google Fonts |

**shadcn gate verdict:** shadcn is not initialized and must not be introduced. The admin dashboard has an established custom CSS design system that satisfies cross-phase consistency. Adopting shadcn here would break that continuity.

---

## Spacing Scale

Source: globals.css `:root` and admin.css component rules. These values are inherited — no new tokens are added by this phase.

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Icon gaps, `.kpi .d` gap |
| sm | 8px | `.kanban-col .k-body` gap, filter chip gap |
| md | 16px | Section padding, `.kpi-grid` gap (14px ≈ md), `.filterbar` gap |
| lg | 24px | `.kpi-grid margin-bottom`, `.panel .ph margin-bottom` (18px falls here) |
| xl | 32px | Section margin-top between chart and bottom panels |
| 2xl | 48px | Not used in dashboard sections |
| 3xl | 64px | Not used in dashboard sections |

Exceptions:
- Chart container height: 140px (dictated by existing `.chart` CSS rule — Recharts ResponsiveContainer must match)
- KPI `.v` font-size: 36px (display token, not spacing)
- Confirm modal max-width: 420px (existing `.confirm-card` rule); Payment detail modal max-width: 560px (existing usage in PaymentsSection)

---

## Typography

Source: globals.css `:root` and admin.css. The real system uses multiple sizes. This table documents the **primary roles active in Phase 27 sections**. No new type tokens are introduced.

| Role | Size | Weight | Line Height | Font | CSS Class / Selector |
|------|------|--------|-------------|------|----------------------|
| KPI value (display) | 36px | 700 | 1 | Space Grotesk (`--font-display`) | `.kpi .v` |
| Panel heading | 18px | 700 | 1.2 | Space Grotesk (`--font-display`) | `.panel .ph h3` |
| Body / table cell | 13–13.5px | 400 | 1.5 | Inter (`--font-body`) | `table.a-table td`, queue item title |
| Mono label / eyebrow | 10–11px | 500 | 1 | JetBrains Mono (`--font-mono`) | `.kpi .l`, table `th`, `.cat-bar .v`, chart axis ticks |

Note: weights 500/600/700 are used in the existing system (`.row-act button`, `.kpi .v`, `strong`). Two-weight simplification does not apply here — inheriting the established system as-is.

---

## Color

Source: globals.css `:root` (dark default) and `[data-theme="light"]` override. **All colors must be expressed as CSS custom properties — never hardcoded hex values** — to preserve light-mode compatibility.

| Role | CSS Variable | Dark Value | Light Value | Usage |
|------|-------------|------------|-------------|-------|
| Dominant (60%) | `--bg` / `--bg-2` | `#0d0c0a` / `#161412` | `#f6f2ea` / `#efe9dd` | Page background |
| Secondary (30%) | `--surface` / `--surface-2` | `#1c1a17` / `#25221e` | `#ffffff` / `#faf6ee` | `.panel`, `.kpi`, modals, table rows |
| Accent (10%) | `--accent` | `#ff5b49` (dark) | `#e8331f` (light) | Reserved elements listed below |
| Success | `--ok` | `#4ec38a` | — | `.stat-pill.pub`, `.kpi .d.up`, approved status |
| Error / destructive | `--err` | `#ff5b5b` | — | `.stat-pill.rej`, refund button, failed payment indicator, error toast |
| Warning | `--warn` | `#ffae3b` | — | `.kpi .d.dn`, "En revisión" pill if used |
| Muted text | `--ink-3` | `#7a7367` | `#857d6f` | Table sub-labels, timestamps, axis ticks |

**Accent (`--accent`) reserved for:**
- Active filter chip (`.sel.on` background)
- Bar chart fill: `color-mix(in oklab, var(--accent) 60%, transparent)` (resting), `var(--accent)` (hover/active)
- Category bar track fill (`.cat-bar .track > div`)
- Accent-colored entity names in activity feed
- `--accent-2` (`#f3c053`) used for avatar gradient alongside `--accent`

Accent must NOT be used for: table borders, general text, KPI labels, or status pills.

---

## Recharts Component Contract

This section is specific to Phase 27. It defines the `RevenueBarChart` visual contract so the Recharts replacement is visually invisible compared to the CSS `.chart .bar` it replaces.

### RevenueBarChart.tsx — Visual Specifications

| Property | Value | Rationale |
|----------|-------|-----------|
| Component | `<BarChart>` inside `<ResponsiveContainer>` | CONTEXT.md decision; matches existing bar design |
| ResponsiveContainer width | `100%` | Fills `.panel` container |
| ResponsiveContainer height | `160px` | 140px chart + 20px bottom margin for XAxis tick labels (existing `.lbl` was `bottom: -20px`) |
| Bar fill (resting) | `color-mix(in oklab, var(--accent) 60%, transparent)` | Matches existing `.chart .bar` |
| Bar fill (active/hover) | `var(--accent)` | Matches existing `.chart .bar:hover` |
| Bar radius | `[4, 4, 0, 0]` | Matches existing `border-radius: 4px 4px 0 0` |
| XAxis | Visible; tick font-family `var(--font-mono)`, font-size 9px, color `var(--ink-3)`, no axis line, no tick line | Matches existing `.lbl` styling |
| YAxis | Hidden (`hide={true}`) | Existing chart has no Y axis |
| CartesianGrid | Hidden | Existing chart has no grid lines |
| Tooltip | Custom: background `var(--surface)`, border `1px solid var(--line)`, border-radius `var(--r-sm)`, font `var(--font-mono)`, value formatted as CLP (e.g. `$3.8M`) | Per CONTEXT.md "specific ideas" |
| Tooltip CLP formatter | Shorten: ≥1,000,000 → `$Xm`, ≥1,000 → `$Xk`, else `$X` | Consistent with existing KPI display `$3.8M` |
| Legend | None | Existing chart has no legend |
| Animation | Default Recharts enter animation; disabled on period filter change to avoid jarring re-render | UX preference |

### Empty State — Chart with No Data

When the selected period (Día/Semana/Mes/Año) yields zero payments, `RevenueBarChart` receives an empty `data` array. In this case:

- Replace `<RevenueBarChart />` with the `.empty` panel pattern:
  - Icon container: `.empty .ic` (60×60px circle, `var(--surface-2)` background)
  - Heading: "Sin ventas en este período" — `.empty h3`
  - Body: "No hubo pagos registrados para el período seleccionado." — `.empty p`

---

## Data Loading States

Source: established pattern from LogsSection (Phase 25) and SubsSection (Phase 26). All three Phase 27 sections must follow this pattern exactly.

| State | Visual | CSS / Implementation |
|-------|--------|---------------------|
| Loading (table) | Single `<tr>` spanning all columns with centered text "Cargando…" in `var(--ink-3)`, `padding: "16px 0"` | Matches LogsSection pattern |
| Loading (chart) | Show chart container at 160px height with a centered `<div>` at `color: var(--ink-3)`: "Cargando…" | No spinner component — text only |
| Loading (queue) | Render zero queue items; no skeleton | Queue derives from fetch; empty means no items |
| Empty (table) | Single `<tr>` spanning all columns: "Sin registros" centered in `var(--ink-3)` | Matches LogsSection pattern |
| Empty (chart) | `.empty` panel pattern — see Recharts contract above | |
| Empty (queue) | Panel with `.empty`: heading "Sin eventos pendientes", body "No hay eventos esperando revisión." | |
| Empty (activity) | Panel with `.empty`: heading "Sin actividad reciente", body "No hay registros de actividad disponibles." | |
| Error (fetch) | `toast.error(message)` via `sonner` — no inline error state | Matches existing pattern in all sections |

**Loading state implementation:**
```
setLoading(true)          // before fetch
...await api.fetch()
} catch { toast.error() }
} finally { setLoading(false) }
```

---

## Copywriting Contract

| Element | Copy | Context |
|---------|------|---------|
| Primary CTA — queue | "✓ Aprobar" / "✕ Rechazar" | Existing queue action buttons in HomeSection |
| Primary CTA — export | "↓ Exportar CSV" | Existing in PaymentsSection and ReportsSection |
| Primary CTA — detail | "Detalle" | Payments table row action |
| Empty — queue | Heading: "Sin eventos pendientes" / Body: "No hay eventos esperando revisión." | HomeSection queue panel when queue is empty |
| Empty — activity | Heading: "Sin actividad reciente" / Body: "No hay registros de actividad disponibles." | HomeSection activity panel |
| Empty — payments | Heading: "Sin pagos registrados" / Body: "No hay órdenes pagadas para mostrar." | PaymentsSection table |
| Empty — chart period | Heading: "Sin ventas en este período" / Body: "No hubo pagos registrados para el período seleccionado." | ReportsSection chart zero-data |
| Loading | "Cargando…" (ellipsis included) | All loading table cells and chart container |
| Error (fetch) | Toast: "[Sección] no disponible — intenta de nuevo" | `toast.error()` via sonner |
| Destructive — refund | "Reembolsar" button label; **this phase wires the button as a stub** (fires `toast.warning("Iniciando reembolso…")`) — real confirmation dialog deferred | PaymentsSection detail modal |
| Modal close | "Cerrar" (btn dark) | Payment detail modal |
| Comprobante download | "Descargar comprobante" | Payment detail modal action — stub this phase |
| Period filter labels | "Día" / "Semana" / "Mes" / "Año" | ReportsSection chip filters — existing copy |
| Queue link | "Ver toda →" | HomeSection queue panel header |
| Chart period label | "ÚLTIMOS 12 MESES" / "PERÍODO: {label}" | HomeSection panel subtitle — update dynamically based on active period filter in ReportsSection |

**Destructive action pattern:** "Reembolsar" is present in the existing PaymentsSection modal. The current stub fires `toast.warning`. If wired in a future phase, the pattern established by `AdminRejectModal` (reason-required text input, minimum length validation, confirm button) must be followed. This phase does not add a confirmation dialog.

---

## Component Inventory

Components already present — do not recreate:

| Component | Path | Phase 27 Usage |
|-----------|------|----------------|
| `AdminApproveModal` | `app/dashboard/modals/AdminApproveModal.tsx` | HomeSection queue approve |
| `AdminRejectModal` | `app/dashboard/modals/AdminRejectModal.tsx` | HomeSection queue reject |
| `toast` (sonner) | `sonner` npm package | All error/success notifications |

New component to create:

| Component | Path | Spec |
|-----------|------|------|
| `RevenueBarChart` | `components/charts/RevenueBarChart.tsx` | Recharts `<BarChart>` wrapper per Recharts contract above; accepts `data: { label: string; value: number }[]` prop; renders empty state when `data.length === 0` |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| shadcn official | none | not applicable — shadcn not initialized |
| recharts (npm) | `BarChart`, `Bar`, `XAxis`, `ResponsiveContainer`, `Tooltip` | npm package install — not a shadcn registry block; no vetting gate required |

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
