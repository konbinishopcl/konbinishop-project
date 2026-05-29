# Phase 25: Dashboard admin real — usuarios, FAQ, logs y settings con API real - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Conectar las 4 secciones de administración que actualmente usan datos mock a sus endpoints reales: `UsersSection`, `FAQSection`, `LogsSection`, `SettingsSection`. No hay nuevas features — solo reemplazar data hardcodeada con fetch real y asegurarse de que las mutaciones (ban, CRUD FAQ, servicios) persistan al backend. Las secciones usan el patrón client-side `useEffect`+`useCallback`+token establecido en EventsSection/HeroesSection.

</domain>

<decisions>
## Implementation Decisions

### UsersSection
- Botón "Ver" abre un modal de detalle (no navega a nueva página): nombre, email, tipo, rol, handle, createdAt, banned status
- Sin paginación — cargar hasta 100 usuarios en una sola llamada a `GET /users`
- Ban/unban llama a `PATCH /users/:id/ban` con `{ blocked: true/false }`
- Modal de detalle solo muestra info básica (no org memberships ni última actividad)

### FAQSection
- CRUD completo conectado a la API: `GET /faq`, `POST /faq`, `PATCH /faq/:id`, `DELETE /faq/:id`
- El `AdminFormModal` ya existente se usa tal cual, solo los handlers llaman a la API en vez de mutar estado local
- Toast de éxito/error basado en resultado real del API call

### LogsSection
- Re-fetch desde `GET /admin/audit-logs` al cambiar filtros (no filter client-side)
- Filtro "Últimos 7 días": re-fetch con `dateFrom` = hace 7 días, `dateTo` = hoy
- Filtro "Todos los admins": dropdown cargado desde `GET /users` (admins solamente), filtra por `userId`
- Carga 50 logs más recientes por defecto (`pageSize=50`)

### SettingsSection — Botones de pago
- WebPay "Configurar": abre modal info-only — "Transbank está configurado vía variables de entorno. Para cambiar credenciales, actualiza las env vars del servidor."
- MercadoPago y Flow "Conectar": mostrar badge "Próximamente" y deshabilitar botones (no eliminar)
- Sin edición de credenciales desde UI

### SettingsSection — Servicios
- Fetch de opciones desde `/services/photography/options` y `/services/content-creators/options` al montar el componente
- CRUD persiste: `POST`, `PATCH`, `DELETE` a sus endpoints correspondientes
- Carga al montar (no lazy)

### Claude's Discretion
- Tipos TypeScript para las respuestas de API (ApiUser para users, ApiFaqItem, ApiAuditLog, ApiServiceOption) — definir inline en cada sección o en lib/api.ts según volumen
- Estructura del modal de detalle de usuario — seguir estilo confirm-card existente

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useUser()` hook de `@/components/providers` — provee `token` para llamadas autenticadas
- `api.*` en `lib/api.ts` — función `request()` base para todos los fetch
- `AdminFormModal` en `@/app/dashboard/modals/AdminFormModal.tsx` — formulario reutilizable con fields config
- `ConfirmDialog` — inline en varias secciones (patrón copy-paste aceptado)
- `toast` de `sonner` — notificaciones de éxito/error
- `stat-pill`, `pill`, `a-table`, `panel`, `confirm-bg`, `confirm-card` — clases CSS existentes del dashboard

### Established Patterns
- Secciones son `"use client"` con `useEffect` + `useCallback` + `useState` para datos
- `useEffect` con `[token]` dependency → re-fetch cuando el token cambia
- Error handling: `try/catch` + `toast.error()`
- Loading state: `setLoading(true)` antes del fetch, `setLoading(false)` en finally

### Integration Points
- `GET /users` — listado de usuarios (SUPER_ADMIN)
- `PATCH /users/:id/ban` — banear/desbanear (`{ blocked: boolean }`)
- `GET /faq` — listado público de FAQs
- `POST /faq`, `PATCH /faq/:id`, `DELETE /faq/:id` — CRUD admin de FAQ
- `GET /admin/audit-logs` — audit logs con query params: `page`, `pageSize`, `action`, `entity`, `userId`, `dateFrom`, `dateTo`
- `GET /services/photography/options` — opciones de fotografía
- `POST/PATCH/DELETE /services/photography/options[/:id]` — CRUD opciones fotografía
- `GET /services/content-creators/options` — opciones de content creators
- `POST/PATCH/DELETE /services/content-creators/options[/:id]` — CRUD opciones content creators

</code_context>

<specifics>
## Specific Ideas

- El filtro "Todos los admins" en LogsSection pasa a ser un dropdown selector con los admins cargados (no un toggle genérico)
- WebPay "Configurar" → modal informativo simple, no editable
- MercadoPago/Flow → botones con badge "Próximamente" visualmente claros pero no funcionales

</specifics>

<deferred>
## Deferred Ideas

- Paginación en UsersSection y LogsSection — diferido, carga única suficiente por ahora
- Edición de credenciales Transbank desde UI — diferido, se mantiene por env vars
- MercadoPago/Flow backend integration — diferido a milestone futuro
- Modal de usuario con org memberships y última actividad — diferido

</deferred>
