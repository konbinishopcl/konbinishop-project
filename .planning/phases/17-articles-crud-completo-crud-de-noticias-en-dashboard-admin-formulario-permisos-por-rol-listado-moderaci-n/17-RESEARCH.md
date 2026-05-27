# Phase 17: Articles CRUD completo — Research

**Researched:** 2026-05-27
**Domain:** Next.js dashboard CRUD — react-hook-form + zod, NestJS articles API
**Confidence:** HIGH

> **Nota:** No existe CONTEXT.md para esta fase (el paso `/gsd:discuss-phase` no se ejecutó).
> Las restricciones de usuario documentadas abajo derivan del brief de la fase, no de un lock de usuario.

---

## User Constraints (del brief de la fase)

### Requisitos explícitos del usuario
1. Revisar noticias en TODA la web (público + dashboard) y hacerlo todo dinámico CRUD completo.
2. El formulario de noticias no existe en /design — crearlo considerando el de eventos pero SIN acordeón.
3. Permisos según usuarios (roles).
4. Considerar toda la información que necesita el artículo.

### Libertad de Claude
- Elección de campos específicos del ArticleForm (ver campo inventario abajo).
- Picker de tags: diseño no existe, Claude decide la UI.
- Editor de contenido: `<textarea>` Markdown es el mínimo viable; rich editor (TipTap etc.) es deferred salvo instrucción explícita.

### Fuera de alcance
- Vistas públicas `/noticias` y `/noticias/[slug]` — ya están dinámicas, no requieren cambios.
- Flujo de pago (DRAFT → PENDING_MODERATION vía carrito) — implementado en Phase 12-03.
- Sistema de likes de artículos — ya existe.

---

## CRITICAL OPEN QUESTION: Permisos de organizador vs. estructura del dashboard

**Esto el planner debe resolver antes de crear tareas.** El brief pide "Dashboard del organizador: crear, editar, eliminar sus propios artículos" pero la arquitectura actual tiene tres conflictos:

**Conflicto 1 — AdminGuard bloquea toda la ruta `/dashboard`.**
`AdminGuard` (`components/admin/AdminGuard.tsx`) sólo permite `ADMIN` y `SUPER_ADMIN`. Ningún organizador `AUTHENTICATED` puede acceder a `/dashboard/*` hoy.

**Conflicto 2 — Los endpoints de edición y borrado requieren rol ADMIN+.**
`PATCH /articles/:id` y `DELETE /articles/:id` tienen `@Roles('ADMIN', 'SUPER_ADMIN')`. Un organizador no puede llamarlos directamente.

**Conflicto 3 — No existe GET /articles/mine.**
Events tiene `GET /events/mine` (controller line 52). Articles no tiene equivalente — el organizador no tiene forma de listar sus propios artículos.

**Tres opciones para el planner:**

| Opción | Descripción | Impacto |
|--------|-------------|---------|
| A — Solo admin | Phase 17 scope: solo ADMIN+ en dashboard. El CRUD del organizador se difiere. | Mínimo esfuerzo. ArticlesSection queda operativa para moderación admin. |
| B — API + rutas nuevas | Agregar `GET /articles/mine`, `PATCH /articles/:id` con ownership check, y una ruta separada `/dashboard/mis-articulos` para organizadores (sin AdminGuard). | Alto impacto. Requiere tocar API, guard strategy, y rutas new. |
| C — Scope mixto | Admin CRUD completo en `/dashboard/articles`. Organizador tiene SOLO create via `/dashboard/articles/new` (POST /articles/sponsored), sin ver lista propia ni editar. | Parcial — cumple "crear" pero no "editar/eliminar". |

**Recomendación de investigación:** Opción A es la más coherente con el estado actual y el brief "panel admin: ver todos los artículos, aprobar/rechazar". La capacidad del organizador de editar/eliminar puede diferirse a Phase 18+. El planner debe confirmar.

---

## Summary

Phase 17 conecta el listado de artículos del dashboard admin con la API real, construye el `ArticleForm` (sin acordeón), y conecta las acciones de moderación. La mayor parte del trabajo es **frontend**: la API de articles ya tiene todos los endpoints admin necesarios (list, create, update, delete, approve, reject, ban).

El `ArticlesSection.tsx` actual usa datos mock (`const EVENTS = [...]`) y modales que no llaman a la API. El `EventsSection.tsx` es el patrón de referencia ya completo y funcional — la migración es una réplica adaptada.

El `ArticleForm` es considerablemente más simple que `EventForm`: un solo campo de imagen (no banner/poster/gallery), sin fechas, sin precios, sin ubicación, sin redes sociales. La instrucción "sin acordeón" es coherente — no hay secciones lógicamente separables.

**Primary recommendation:** Replicar el patrón EventsSection → ArticlesSection (datos reales, paginación, filtros, modales), luego construir ArticleForm con los campos del DTO, y agregar las rutas `/dashboard/articles/new` y `/dashboard/articles/[id]/edit`.

---

## Standard Stack

### Core (ya instalado, NO agregar deps)

| Library | Version | Purpose | Source |
|---------|---------|---------|--------|
| react-hook-form | instalado | Gestión de formulario | EventForm.tsx |
| zod | instalado | Validación de schema | EventForm.tsx |
| @hookform/resolvers | instalado | Puente RHF+Zod | EventForm.tsx |
| sonner | instalado | Toast notifications | EventForm.tsx, EventsSection.tsx |
| next/navigation | builtin | useRouter, redirect | EventForm.tsx |

### Patrones del proyecto

| Pattern | Source | Usage |
|---------|--------|-------|
| `useUser()` | providers.tsx | `token`, `user`, `user.role` |
| `api.uploadImage(file, token)` | lib/api.ts | Upload de imagen a `/api/upload` |
| `imageUrl(path)` | lib/api.ts | Convierte path relativo → URL proxied |
| `fetch('/api/articles', { headers: { Authorization: Bearer } })` | EventsSection.tsx pattern | Llamadas directas al proxy Next.js |
| `AdminGuard` | components/admin/AdminGuard.tsx | Protege todas las rutas `/dashboard` |

**Instalación:** Ninguna — todo ya está en el proyecto.

---

## Architecture Patterns

### Estructura de rutas para articles (a crear)

```
apps/website/app/dashboard/
├── articles/
│   ├── page.tsx              # Ya existe — importa ArticlesSection (mock → real)
│   ├── new/
│   │   └── page.tsx          # NUEVO — <ArticleForm mode="create" />
│   └── [id]/
│       └── edit/
│           └── page.tsx      # NUEVO — fetch article by id → <ArticleForm mode="edit" initial={...} />
└── sections/
    └── ArticlesSection.tsx   # Reescribir: mock → API real (patrón EventsSection)
```

### Pattern 1: ArticlesSection — migración mock → real

**Qué:** Reemplazar el mock `const EVENTS = [...]` por fetch real a `/api/articles` con paginación, filtros por status, y acciones que llaman a la API.

**Diferencias respecto a EventsSection:**
- No hay columna "FECHA" de evento (articles no tienen fechas).
- No hay columna "PRECIO" (articles no tienen precio propio visible en la lista).
- Columnas: ARTÍCULO | AUTOR (userId/owner) | ESTADO | CREADO | ACCIONES.
- Filtros: Todos, Borrador, En revisión, Publicado, Rechazado, Baneado.
- Acciones por estado — idéntico lógicamente al EventsSection:
  - DRAFT: Editar, Publicar (approve), Eliminar
  - PENDING_MODERATION: Editar, Aprobar, Rechazar
  - APPROVED: Editar, Banear
  - REJECTED: Editar, Re-revisar, Eliminar
  - BANNED: Editar, Restaurar

**Endpoints usados:**
```
GET  /api/articles?page=&pageSize=&status=   → lista paginada (admin ve todos)
PATCH /api/articles/:id/approve              → aprobar
PATCH /api/articles/:id/reject  body:{reason}→ rechazar
PATCH /api/articles/:id/ban     body:{reason}→ banear
DELETE /api/articles/:id                     → eliminar
```

**Nota importante:** `GET /api/articles` retorna todos los estados cuando el token es de admin (via `OptionalJwtAuthGuard` + `isAdmin` check en service). No requiere endpoint separado.

### Pattern 2: ArticleForm — sin acordeón, campos planos

**Qué:** Formulario de artículo con campos directos (sin `AccItem`/`form-acc`), mismo stack RHF+Zod, mismo sticky footer, mismo `ImageUploadBox`.

**Campo inventario completo:**

| Campo | Tipo RHF | API field | Requerido | Notas |
|-------|----------|-----------|-----------|-------|
| title | string | `title` | Sí (≥3) | Input texto |
| slug | string | `slug` | No | Auto-generado; editable solo en admin |
| excerpt | string | `excerpt` | No | Textarea corta (resumen para cards) |
| content | string | `content` | Sí (≥10) | Textarea larga (Markdown) |
| image | ImageSlot (fuera RHF) | `image` | No | UN slot (no banner/poster/gallery). Variant "banner" 16:9 |
| tagIds | number[] | `tagIds` | No | Multi-select de tags del catalog |
| eventId | number? | `eventId` | No | Solo sponsored — select de eventos del usuario |
| status | enum | vía endpoint | Admin only | APPROVED / PENDING_MODERATION / DRAFT |

**Lo que NO existe en ArticleForm:**
- Sin accordion `AccItem`
- Sin dates array
- Sin prices/isFree
- Sin location (country/state/city)
- Sin address/ticketUrl
- Sin socialLinks
- Sin videos array
- Sin gallery (8 slots)

### Pattern 3: Rutas create/edit — igual que events

```typescript
// /dashboard/articles/new/page.tsx
import { ArticleForm } from "../ArticleForm";
export default function Page() {
  return <ArticleForm mode="create" />;
}

// /dashboard/articles/[id]/edit/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/components/providers";
import { ArticleForm, type InitialArticle } from "../../ArticleForm";

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const { token } = useUser();
  const [initial, setInitial] = useState<InitialArticle | null>(null);

  useEffect(() => {
    if (!token || !id) return;
    fetch(`/api/articles/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then(setInitial)
      .catch(() => {});
  }, [token, id]);

  if (!initial) return <div style={{ padding: 32 }}>Cargando…</div>;
  return <ArticleForm mode="edit" initial={initial} />;
}
```

**Nota:** El endpoint `GET /api/articles/:slug` busca por slug. Para edición por ID se necesita `GET /api/articles/:id` — pero el controller expone `:slug` no `:id`. Opciones: (a) buscar por slug usando el slug del artículo, o (b) filtrar desde la lista. El planner debe elegir. Recomendación: usar el listado de admin y pasar el objeto completo via localStorage/state, o agregar `GET /api/articles/id/:id` al controller.

### Pattern 4: DashboardShell — entradas de breadcrumb

`DashboardShell.tsx:117-127` define `SUB_PAGES` para mostrar el breadcrumb correcto en rutas como `/dashboard/events/new` y `/dashboard/events/:id/edit`. Se deben agregar entradas para articles:

```typescript
// En DashboardShell.tsx — SUB_PAGES
"/dashboard/articles/new":          { label: "Crear artículo",  crumb: "ARTÍCULOS / NUEVO" },
// + el editMatch regex para articles/:id/edit
const articleEditMatch = pathname.match(/^\/dashboard\/articles\/(\d+)\/edit$/);
if (articleEditMatch) {
  SUB_PAGES[pathname] = { label: "Editar artículo", crumb: "ARTÍCULOS / EDITAR" };
}
```

### Pattern 5: Tags picker

`GET /api/tags` existe (catalog.controller.ts:220). No hay diseño de referencia para el picker. Opciones:
- Multi-select nativo `<select multiple>` — rápido pero UX básico.
- Checkboxes con búsqueda inline — coherente con el design system.
- Chips con X removibles — más rico pero más código.

**Recomendación:** Checkboxes con input de búsqueda (mismo patrón que el picker de usuarios en AdminTransferModal de EventsSection, adaptado para tags). No usar librerías externas.

### Anti-Patterns a evitar

- **No tocar api.ts** — Phase 15-05 decision bloqueada: "api.ts sin métodos articles/userByHandle — server pages usan fetch() directo". Las llamadas del dashboard usan `fetch('/api/...')` directo con `Authorization` header.
- **No agregar dependencias** — todo el stack ya está instalado.
- **No usar `AccItem`/`form-acc`** — el brief explícitamente pide sin acordeón.
- **No duplicar modales** — los modales (AdminApproveModal, AdminRejectModal, ConfirmDialog) ya existen en ArticlesSection. Limpiar y conectar los existentes en vez de re-crear.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Upload de imagen | Custom fetch multipart | `api.uploadImage(file, token)` | Maneja FormData, errors, URL normalize |
| URL de imagen | String concat manual | `imageUrl(path)` | Maneja /api/media proxy |
| Formulario validation | Custom validators | zod + zodResolver + react-hook-form | Ya en EventForm — copiar schema |
| Toast notifications | Custom UI | `toast.success/error` (sonner) | Ya importado |
| Paginación con ellipsis | Re-implementar | Copiar `pageWindows()` de EventsSection | Función pura, ya testeada |

---

## API Endpoints — inventario completo

### Existentes (NO requieren cambios en API)

| Method | Path | Guard | Uso en dashboard |
|--------|------|-------|-----------------|
| GET | /articles | OptionalJwt | Lista todos (admin ve todos los estados) |
| GET | /articles/:slug | OptionalJwt | Detalle por slug (para edit page) |
| POST | /articles | JwtAuth + Admin | Crear artículo editorial |
| POST | /articles/sponsored | JwtAuth + OrgContext | Crear artículo patrocinado |
| PATCH | /articles/:id | JwtAuth + Admin | Editar artículo |
| DELETE | /articles/:id | JwtAuth + Admin | Eliminar artículo |
| PATCH | /articles/:id/approve | JwtAuth + Admin | Aprobar |
| PATCH | /articles/:id/reject | JwtAuth + Admin | Rechazar con motivo |
| PATCH | /articles/:id/ban | JwtAuth + Admin | Banear con motivo |
| GET | /tags | Público | Listado de tags para el form |

### GAP — endpoint de detalle por ID

El controller expone `GET /articles/:slug` (busca por slug). Para la edit page necesitamos buscar por ID (la lista retorna `id`, no slug). El servicio tiene `findById(id)` pero no está expuesto en el controller.

**Opciones:**
1. Agregar `GET /articles/by-id/:id` al controller (simple, no rompe rutas existentes ya que `:slug` primero).
2. Usar el slug que viene en la lista para construir la edit URL como `/dashboard/articles/:slug/edit`.
3. Pasar el objeto completo vía query param serializado (anti-pattern).

**Recomendación:** Opción 1 — agregar `GET /articles/by-id/:id` con `@Roles('ADMIN','SUPER_ADMIN')`. O preferiblemente: usar el slug como param en la URL de edición (opción 2, zero API changes).

### GAP — GET /articles/mine (si el scope incluye organizador)

Si el planner elige Opción B/C del conflicto de permisos, se necesita:
```typescript
// articles.controller.ts
@Get('mine')
@UseGuards(JwtAuthGuard, OrgContextGuard)
findMine(@CurrentUser() user: JwtUser, @OrgContext() ctx: OrgContextDto | null) {
  return this.articles.findMine(user, ctx);
}

// articles.service.ts
findMine(user: JwtUser, orgContext: OrgContextDto | null = null) {
  const ownerId = orgContext?.orgId ?? user.sub;
  return this.prisma.article.findMany({
    where: { userId: ownerId },
    include: ARTICLE_INCLUDE,
    orderBy: { createdAt: 'desc' },
  });
}
```

---

## Common Pitfalls

### Pitfall 1: GET /articles/:slug vs /:id en la edit page
**Qué sale mal:** La lista retorna `id: number` y `slug: string`. Si la ruta de edición es `/dashboard/articles/:id/edit`, el controller no tiene un endpoint para buscar por ID desde el cliente.
**Por qué pasa:** El controller solo expone `:slug` públicamente. `findById()` existe en el service pero no en el controller.
**Cómo evitar:** Usar slug como param de la URL de edición, o agregar `GET /articles/by-id/:id` con guard admin antes del `:slug` route.

### Pitfall 2: ArticlesSection usa datos mock — los modales no llaman a la API
**Qué sale mal:** Los modales `AdminApproveModal`, `AdminRejectModal` etc. ya existen en `ArticlesSection.tsx` pero sus callbacks son `onApprove={() => {}}` — no hacen nada. Fácil de olvidar conectar.
**Cómo evitar:** Tratar ArticlesSection como una reescritura completa, no un patch parcial. Copiar el patrón completo de EventsSection.

### Pitfall 3: DashboardShell no conoce las rutas de artículos
**Qué sale mal:** Al navegar a `/dashboard/articles/new`, el breadcrumb muestra "Artículos" en vez de "Artículos / Nuevo" y el título H1 queda genérico.
**Cómo evitar:** Agregar entradas en `SUB_PAGES` y el regex de `editMatch` en `DashboardShell.tsx`.

### Pitfall 4: api.ts no debe tocar para artículos
**Qué sale mal:** Agregar métodos `articles*` a `api.ts` viola la decisión de Phase 15-05 (preservar api.ts intacto para no romper las páginas de servidor que dependen de su shape).
**Cómo evitar:** Todas las llamadas del dashboard usan `fetch('/api/articles/...')` directamente con `Authorization: Bearer ${token}`.

### Pitfall 5: Tags — tagIds vs tag names
**Qué sale mal:** La API recibe `tagIds: number[]` pero en el form se necesita mostrar nombres. Requiere fetch de `/api/tags` para mostrar la UI y mapear name → id.
**Cómo evitar:** Cargar tags al montar el form (`useEffect` con fetch `/api/tags`), mostrar con nombres, guardar IDs seleccionados en estado local fuera de RHF (como las imágenes en EventForm).

### Pitfall 6: PENDING_PAYMENT no es un estado visible en la lista de admin
**Qué sale mal:** `PublicationStatus` incluye `PENDING_PAYMENT` pero en la lista de artículos de admin este estado es transitorio (carrito). Incluirlo en los filtros confunde al admin.
**Cómo evitar:** Filtros del dashboard: Todos, Borrador (DRAFT), En revisión (PENDING_MODERATION), Publicado (APPROVED), Rechazado (REJECTED), Baneado (BANNED). Omitir PENDING_PAYMENT del selector.

---

## Code Examples

### ArticleForm — Zod schema base

```typescript
// Source: pattern from apps/website/app/dashboard/events/EventForm.tsx
const dashArticleSchema = z.object({
  title:   z.string().min(3, "Mínimo 3 caracteres"),
  slug:    z.string().min(3).optional().or(z.literal("")),
  excerpt: z.string().optional(),
  content: z.string().min(10, "El contenido es requerido (mín 10 caracteres)"),
  // tagIds manejados fuera del schema (number[] no serializable en RHF nativamente)
  eventId: z.string().optional(), // string para select, convertir a number al enviar
  status:  z.enum(["APPROVED", "PENDING_MODERATION", "DRAFT"]),
});
```

### ArticleForm — submit payload

```typescript
// Análogo a EventForm onSubmit — source: EventForm.tsx lines 369-468
const onSubmit = async (values: DashArticleValues) => {
  if (!token) { toast.error("No autenticado"); return; }
  setBusy(true);
  try {
    let imagePathUrl = image.url;
    if (image.file) {
      const r = await api.uploadImage(image.file, token);
      imagePathUrl = r.url;
      setImage({ file: null, url: r.url });
    }

    const payload = {
      title:   values.title.trim(),
      slug:    values.slug?.trim() || undefined,
      excerpt: values.excerpt?.trim() || undefined,
      content: values.content.trim(),
      image:   imagePathUrl || undefined,
      tagIds:  selectedTagIds.length ? selectedTagIds : undefined,
      ...(values.eventId ? { eventId: Number(values.eventId) } : {}),
    };

    const url    = mode === "create" ? "/api/articles" : `/api/articles/${initial!.id}`;
    const method = mode === "create" ? "POST" : "PATCH";
    const r = await fetch(url, {
      method,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) { const err = await r.json().catch(() => ({})); throw new Error(err.message ?? "Error"); }

    const saved = await r.json() as { id: number; status?: string };
    if (values.status === "APPROVED" && saved.status !== "APPROVED") {
      await fetch(`/api/articles/${saved.id}/approve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
    }

    toast.success(mode === "create" ? "Artículo creado" : "Artículo actualizado");
    router.push("/dashboard/articles");
  } catch (ex) {
    toast.error(ex instanceof Error ? ex.message : "Error al guardar");
  } finally {
    setBusy(false);
  }
};
```

### ArticlesSection — fetch real (patrón EventsSection)

```typescript
// Source: apps/website/app/dashboard/sections/EventsSection.tsx lines 405-428
const fetchArticles = useCallback(async (p: number, ps: number, filter: string) => {
  if (!token) return;
  setLoading(true);
  try {
    const statusParam = STATUS_API[filter]; // misma lógica que EventsSection
    const params = new URLSearchParams({
      page: String(p), pageSize: String(ps),
      ...(statusParam ? { status: statusParam } : {}),
    });
    const r = await fetch(`/api/articles?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) throw new Error("Error al cargar artículos");
    const data = await r.json();
    setArticles(data.items ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
  } catch (ex) {
    toast.error(ex instanceof Error ? ex.message : "Error al cargar artículos");
  } finally {
    setLoading(false);
  }
}, [token]);
```

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | No hay suite de test frontend detectada |
| Config file | No existe jest.config / vitest.config en apps/website |
| Quick run command | N/A — pruebas manuales en navegador |
| Full suite command | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Notes |
|--------|----------|-----------|-------|
| ART-01 | ArticlesSection carga datos reales de /api/articles | manual-smoke | Verificar en browser: filtros, paginación |
| ART-02 | Approve/reject/ban llaman a la API y recargan lista | manual-smoke | Verificar modales y toasts |
| ART-03 | ArticleForm crea artículo via POST /api/articles | manual-smoke | Verificar en browser + Swagger |
| ART-04 | ArticleForm edita artículo via PATCH /api/articles/:id | manual-smoke | Verificar en browser |
| ART-05 | ImageUploadBox sube imagen y persiste en save | manual-smoke | Verificar con imagen real |
| ART-06 | Tags se cargan y se envían como tagIds[] | manual-smoke | Verificar con Swagger |
| ART-07 | Rutas /dashboard/articles/new y /[id]/edit muestran crumbs correctos | manual-smoke | Verificar DashboardShell |

**Justificación manual-only:** No existe infraestructura de test en el website. Las pruebas de integración frontend requieren un entorno con API real. Smoke manual es la validación viable para esta fase.

### Wave 0 Gaps

None — no se requiere nueva infraestructura de test. Pruebas son manuales contra la API local.

---

## Sources

### Primary (HIGH confidence)
- `apps/api/src/articles/articles.controller.ts` — endpoints completos verificados
- `apps/api/src/articles/articles.service.ts` — lógica de negocio, ownership, estados
- `apps/api/src/articles/dto/` — todos los DTOs leídos directamente
- `apps/website/app/dashboard/events/EventForm.tsx` — patrón de referencia del formulario
- `apps/website/app/dashboard/sections/EventsSection.tsx` — patrón de referencia de la lista
- `apps/website/app/dashboard/sections/ArticlesSection.tsx` — estado actual (mock)
- `apps/website/app/dashboard/DashboardShell.tsx` — navegación, breadcrumbs, AdminGuard
- `apps/website/components/admin/AdminGuard.tsx` — restricción de acceso verificada
- `apps/api/prisma/schema.prisma` — modelo Article, PublicationStatus enum

### Secondary (MEDIUM confidence)
- `apps/website/lib/api.ts` — `uploadImage`, `imageUrl` helpers — leídos directamente
- `apps/website/components/providers.tsx` — `useUser()` API — leído directamente

---

## Open Questions

1. **¿El scope incluye CRUD del organizador o solo admin?**
   - Qué sabemos: AdminGuard bloquea toda la ruta `/dashboard` a no-admins. Articles API no tiene `/articles/mine`. PATCH/DELETE requieren rol admin.
   - Qué falta aclarar: ¿Se agrega una sección separada para organizadores? ¿O Phase 17 es admin-only?
   - Recomendación: Aclarar con el usuario. Si admin-only → cero cambios en la API. Si organizadores → requiere 3 cambios en API + nueva estrategia de rutas.

2. **¿URL de edición por ID o por slug?**
   - Qué sabemos: Controller tiene GET /articles/:slug. Service tiene findById(). La lista retorna ambos.
   - Qué falta aclarar: ¿Agregar GET /articles/by-id/:id o usar slug en la URL?
   - Recomendación: Usar slug en la edit URL (`/dashboard/articles/:slug/edit`) → cero cambios en API.

3. **¿Rich text editor o textarea para content?**
   - Qué sabemos: La API acepta string (Markdown). El `ArticleView.tsx` público renderiza como texto plano.
   - Qué falta aclarar: ¿El usuario quiere WYSIWYG o Markdown raw?
   - Recomendación: Textarea en Phase 17, rich editor como mejora futura. Si el usuario quiere WYSIWYG, investigar TipTap (no instalar sin confirmar).

---

## Metadata

**Confidence breakdown:**
- API inventory: HIGH — leído directamente del source
- Form fields: HIGH — derivados de los DTOs reales
- Architecture: HIGH — basado en EventForm/EventsSection existentes
- Permission conflicts: HIGH — verificado en AdminGuard + controller decorators
- Pitfalls: HIGH — derivados de lectura directa del código

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (30 días — stack estable)
