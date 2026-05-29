# Phase 27: Dashboard analytics, pagos y gráficos reales con Recharts - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Conectar las 3 secciones de analytics/pagos que actualmente usan datos mock: `HomeSection` conecta cola de revisión y actividad reciente a endpoints reales; `PaymentsSection` carga historial real añadiendo `GET /payments` al backend; `ReportsSection` usa datos reales de pagos para el gráfico con filtro de período funcional. Instalar Recharts y reemplazar los gráficos de barras CSS mock con componentes `<RevenueBarChart />` reutilizables. KPIs de ingresos y rankings de top organizadores quedan mock — no hay endpoints de agregados.

</domain>

<decisions>
## Implementation Decisions

### HomeSection — Fuentes de datos reales
- Cola de revisión: `GET /events?status=PENDING&pageSize=5` — el admin ve todos los estados, ya existe
- Feed de actividad reciente: `GET /admin/audit-logs?pageSize=5` — los 5 logs más recientes
- Stats de categorías (cat-bar): mantener mock — no existe endpoint de aggregate
- KPIs "En Revisión" y "Eventos publicados": derivar del array ya fetcheado (queue.length, count APPROVED); KPI de ingresos permanece mock

### PaymentsSection — Backend y datos reales
- Añadir `GET /payments` endpoint admin en NestJS — retorna órdenes con status PAID/FAILED, incluye id, sub (user/org), amount, gateway, createdAt, items[]
- KPIs de ingresos y totales: mantener mock — no hay endpoint de agregados
- Exportación CSV: client-side desde los datos ya cargados (datos reales, descarga real)
- Detail modal: mostrar datos reales del endpoint

### ReportsSection — Período y datos reales
- Datos del gráfico: computar desde el historial de pagos para el período seleccionado
- Filtro de período (Día/Semana/Mes/Año): client-side filter sobre el historial de pagos ya cargado
- Top organizadores (ingresos y eventos): mantener mock — requiere agregaciones complejas no disponibles
- CSV export: client-side desde los pagos filtrados por período (datos reales)

### Recharts — Integración
- Instalar `recharts` en `apps/website`
- Usar `BarChart` (no LineChart) para consistencia con diseño actual de barras
- Reemplazar gráfico CSS en HomeSection y ReportsSection con componente reutilizable
- Crear `components/charts/RevenueBarChart.tsx` — wrapper reutilizable
- Barras de categorías (`cat-bar` CSS en HomeSection) NO migran a Recharts — son rankings, no gráficos

### Claude's Discretion
- Estructura exacta del tipo `ApiPayment` — campos de la respuesta del endpoint nuevo
- Responsividad del `<RevenueBarChart />` — usar `ResponsiveContainer` de Recharts
- Formato de ejes del gráfico (tooltips, formato CLP) — a criterio

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useUser()` hook de `@/components/providers` — provee `token` para llamadas autenticadas
- `api.*` en `lib/api.ts` — función `request()` base para todos los fetch; ya tiene `adminEvents`, `adminAuditLogs`
- `AdminApproveModal`, `AdminRejectModal` en `@/app/dashboard/modals/` — reutilizables para el queue
- `toast` de `sonner` — notificaciones de éxito/error
- `stat-pill`, `pill`, `a-table`, `panel`, `cat-bar`, `confirm-bg`, `confirm-card` — clases CSS existentes
- `btn dark`, `btn ghost`, `sel`, `sel on` — botones del dashboard

### Established Patterns
- Secciones son `"use client"` con `useEffect` + `useCallback` + `useState`
- `useEffect` con `[token]` dependency → re-fetch cuando el token cambia
- `try/catch` + `toast.error()` para error handling
- Loading state: `setLoading(true)` antes del fetch, `setLoading(false)` en finally
- `api.adminEvents(token, { status: 'PENDING', pageSize: 5 })` — patrón existente en api.ts
- `api.adminAuditLogs(token, { pageSize: 5 })` — ya existe en api.ts

### Integration Points
- `GET /events?status=PENDING&pageSize=5` — HomeSection queue (admin JWT)
- `GET /admin/audit-logs?pageSize=5` — HomeSection activity (admin JWT)
- `GET /payments` — **NUEVO** — PaymentsSection + ReportsSection (admin JWT)
- Backend: `apps/api/src/payments/payments.controller.ts` + `payments.service.ts` — añadir GET list
- Backend: `apps/api/src/orders/` — fuente de datos para el nuevo endpoint de pagos

</code_context>

<specifics>
## Specific Ideas

- El `<RevenueBarChart />` debe usar `ResponsiveContainer` de Recharts para que se adapte al panel
- El tooltip del gráfico debe mostrar el monto en formato CLP (ej: "$3.8M")
- El nuevo `GET /payments` endpoint debe ser ADMIN+ protegido con JwtAuthGuard + RolesGuard
- El endpoint de pagos retorna las órdenes desde la tabla Order que tengan status PAID o FAILED, con sus items

</specifics>

<deferred>
## Deferred Ideas

- KPIs reales de ingresos (MRR, histórico) — requiere endpoint de agregados no disponible en v1.0
- Top organizadores reales en ReportsSection — requiere GROUP BY complejo
- Analytics por período desde backend (dateFrom/dateTo server-side) — computación client-side es suficiente para v1.0
- Migrar cat-bar de categorías a Recharts — son rankings, no gráficos; CSS actual es apropiado

</deferred>
