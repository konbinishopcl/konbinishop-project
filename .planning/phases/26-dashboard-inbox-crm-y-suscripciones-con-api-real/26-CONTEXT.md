# Phase 26: Dashboard inbox, CRM y suscripciones con API real - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Conectar las 3 secciones de comunicación que actualmente usan datos mock a sus endpoints reales: `InboxSection`, `CRMSection`, `SubsSection`. No hay nuevas features — solo reemplazar data hardcodeada con fetch real y asegurarse de que las mutaciones (read, delete, stage change, add note) persistan al backend. Las secciones usan el patrón client-side `useEffect`+`useCallback`+token establecido en fases anteriores.

</domain>

<decisions>
## Implementation Decisions

### InboxSection
- `GET /contact` — cargar todos los mensajes en una sola llamada (sin paginación, como Phase 25)
- Filtro "Archivados" eliminado — no existe concepto de archivo en el backend; tabs quedan: Todos / No leídos
- Filtro "No leídos" — client-side filter de items con `read=false`
- Botón "Archivar" → `DELETE /contact/:id` con confirm dialog (el backend no tiene endpoint de archive)
- Columna "PIPELINE" eliminada — reemplazada con columna "ESTADO" (leído/no leído usando stat-pill)
- `PATCH /contact/:id/read` con `{ read: true }` al abrir un mensaje (marcar leído automáticamente)

### CRMSection
- `GET /crm?limit=50` — cargar todas las entradas en una sola llamada, agrupar por `stage` client-side
- Click en tarjeta kanban abre modal con: info de contacto, lista de notas, form para añadir nota, selector de stage
- Cambio de stage → `PATCH /crm/:id/stage` con `{ stage }` (o `{ stage, stageReason }` para LOST)
- Stage LOST requiere `stageReason` — mostrar input obligatorio cuando se selecciona "Cerrado perdido"
- Notas reales: `GET /crm/:id/notes` al abrir modal, `POST /crm/:id/notes` con `{ content }` para añadir
- Badge de tipo mapeado: CONTACT → "contact", PHOTOGRAPHY → "foto", CONTENT → "creat" (mismas CSS classes)

### SubsSection
- `GET /subscriptions?limit=50` — cargar lista completa
- KPIs computados desde la respuesta: Activos = `items.filter(s=>s.status==='ACTIVE').length`, Total = campo `total`; eliminar KPIs MRR y "Nuevos mes" (sin endpoint de agregados)
- Botón "Ver" abre modal con detalle: nombre usuario/org, email, estado, fechas ciclo (cycleStart, cycleEnd), créditos usados/total
- Sección "Configuración del plan" se mantiene sin cambios — ya funciona con /api/settings, fuera de scope

### Claude's Discretion
- Tipos TypeScript para respuestas API (ApiContactMessage, ApiCrmEntry, ApiCrmNote, ApiSubscription) — definir inline en cada sección o en lib/api.ts según volumen
- Orden exacto de los campos en los modales de detalle

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useUser()` hook de `@/components/providers` — provee `token` para llamadas autenticadas
- `api.*` en `lib/api.ts` — función `request()` base para todos los fetch
- `ConfirmDialog` — inline en InboxSection (patrón copy-paste aceptado en dashboard)
- `toast` de `sonner` — notificaciones de éxito/error
- `stat-pill`, `pill`, `a-table`, `panel`, `confirm-bg`, `confirm-card`, `kanban`, `kanban-col`, `kan-card` — clases CSS existentes del dashboard
- `btn dark` — botón primario del dashboard

### Established Patterns
- Secciones son `"use client"` con `useEffect` + `useCallback` + `useState` para datos
- `useEffect` con `[token]` dependency → re-fetch cuando el token cambia
- Error handling: `try/catch` + `toast.error()`
- Loading state: `setLoading(true)` antes del fetch, `setLoading(false)` en finally

### Integration Points
- `GET /contact` — lista ContactMessage[], admin/super_admin
- `PATCH /contact/:id/read` — `{ read: boolean }`, marca leído/no leído
- `DELETE /contact/:id` — elimina mensaje
- `GET /crm?limit=50` — lista CrmEntry[] paginada (type, stage, contactName, contactEmail, createdAt)
- `GET /crm/:id` — CrmEntry con notes[] y source
- `PATCH /crm/:id/stage` — `{ stage: CrmStage, stageReason?: string }` (stageReason requerido para LOST)
- `POST /crm/:id/notes` — `{ content: string }` — añadir nota
- `GET /crm/:id/notes` — listar notas
- `GET /subscriptions?limit=50` — lista paginada de Subscription con user/org

</code_context>

<specifics>
## Specific Ideas

- El CRM stage LOST requiere `stageReason` en el backend — mostrar un input de texto cuando el usuario selecciona "Cerrado perdido" antes de confirmar
- La columna PIPELINE en InboxSection pasa a ser ESTADO con stat-pill leído/no leído
- Los KPIs de SubsSection se reducen a solo Activos y Total (computable desde la respuesta)

</specifics>

<deferred>
## Deferred Ideas

- KPIs de MRR y "Nuevos este mes" en SubsSection — requiere endpoint de agregados no disponible
- Paginación en InboxSection y CRMSection — carga única suficiente por ahora
- Filtros avanzados de CRM (por tipo, stage, assignedTo) — UI adicional no requerida en esta fase

</deferred>
