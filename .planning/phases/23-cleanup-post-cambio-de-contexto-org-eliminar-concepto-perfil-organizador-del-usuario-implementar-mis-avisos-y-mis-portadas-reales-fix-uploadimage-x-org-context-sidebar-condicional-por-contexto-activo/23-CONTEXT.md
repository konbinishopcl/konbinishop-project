# Phase 23: Cleanup post-cambio de contexto org — Context

**Gathered:** 2026-05-28
**Status:** Ready for planning
**Source:** Full codebase audit after Phase 22 (org context switching)

<domain>
## Phase Boundary

Eliminar todos los vestigios del modelo "perfil de organizador como modo especial del usuario" que quedaron pendientes después de Phase 22. Con el modelo actual, las organizaciones son entidades separadas — un usuario es siempre un usuario y puede operar como org vía `useUser().activeOrg`. No existe el concepto de "cuenta de organizador" en el usuario mismo.

**In scope:**
1. Eliminar página `/cuenta/organizador` y su directorio completo
2. Quitar tab "Organizador" del sidebar `AccountShell`
3. Implementar `/cuenta/mis-avisos` con datos reales (actualmente placeholder)
4. Implementar `/cuenta/mis-portadas` con datos reales (actualmente placeholder)
5. Fix `uploadImage` en `lib/api.ts` para incluir `X-Org-Context` header
6. Fix carrito/exito CTA: copy "perfil de organizador" → link a `/cuenta/perfil`
7. Eliminar endpoint backend `PATCH /users/me/organizer` (controller + service method + DTO)

**Out of scope:**
- Sidebar condicional por contexto activo (tabs distintos según personal/org) — deferido, no hay diseño
- Perfil de org editable desde `/cuenta` — deferido a futura fase de org management

</domain>

<decisions>
## Implementation Decisions

### 1. Eliminar /cuenta/organizador — LOCKED
- Borrar directorio completo: `apps/website/app/(site)/cuenta/organizador/`
- Quitar entrada del array TABS en AccountShell: `{ id: "organizador", href: "/cuenta/organizador", label: "Organizador" }`
- El concepto de "displayName" y "handle" del usuario personal ya no tiene UI — los campos existen en DB pero no se exponen. Futuro: moverlos a org settings cuando se implemente.

### 2. Carrito/exito CTA — LOCKED
- Archivo: `apps/website/app/(site)/carrito/exito/page.tsx` (línea ~154)
- Cambiar `<h3>¿Tu perfil de organizador está completo?</h3>` → `<h3>¿Tu perfil está completo?</h3>`
- Cambiar `<Link href="/cuenta?tab=org" ...>` → `<Link href="/cuenta/perfil" ...>`
- Cambiar copy del botón "Completar mi perfil" → se mantiene igual

### 3. mis-avisos implementación — LOCKED
- Archivo: `apps/website/app/(site)/cuenta/mis-avisos/page.tsx`
- Agregar `token` al destructure de `useUser()`
- Agregar estado: `const [spots, setSpots] = useState<ApiSpot[]>([])`
- Agregar `useEffect` que llame `api.mySpots(token)` cuando `ready && user && token`
- `api.mySpots(token)` ya incluye `X-Org-Context` automáticamente via `buildHeaders()`
- Renderizar lista de spots cuando `spots.length > 0`, mantener empty state cuando vacío
- Los tabs de filtro ("Todos", "En revisión", "Activos", "Expirados", "Rechazados") filtran `spots` por `status`:
  - Todos → sin filtro
  - En revisión → `PENDING_MODERATION`
  - Activos → `APPROVED`
  - Expirados → `expirationDate < now` (calculado en frontend)
  - Rechazados → `REJECTED | BANNED`
- Card row por spot: title, status badge, días, monto, expirationDate, link a editar si aplica
- Importar `ApiSpot` desde `@/lib/api`

### 4. mis-portadas implementación — LOCKED
- Archivo: `apps/website/app/(site)/cuenta/mis-portadas/page.tsx`
- Misma estructura que mis-avisos pero con `api.myHeroes(token)` y tipo `ApiHero`
- Los tabs ("Todos", "En revisión", "Activas", "Expiradas", "Rechazadas") filtran por `status`
- Card row por hero: title + titleAccent, status badge, días, monto, expirationDate
- Importar `ApiHero` desde `@/lib/api`

### 5. uploadImage fix — LOCKED
- Archivo: `apps/website/lib/api.ts`, función `uploadImage` (línea ~383)
- Problema: usa `fetch()` directo con solo `Authorization` header, no incluye `X-Org-Context`
- Fix: agregar `if (_activeOrgId) headers["X-Org-Context"] = String(_activeOrgId)` después de línea `Authorization`
- NO usar `buildHeaders()` porque multipart no puede tener `Content-Type` manual (el browser lo fija con boundary)

### 6. Backend: eliminar endpoint PATCH /users/me/organizer — LOCKED
- Eliminar método `updateOrganizer` de `users.controller.ts` (líneas ~70-76)
- Eliminar método `updateOrganizer` de `users.service.ts` (líneas ~111-135)
- Eliminar archivo `apps/api/src/users/dto/update-organizer.dto.ts`
- Eliminar import `UpdateOrganizerDto` en controller y service
- Verificar que nada más en el backend importe `UpdateOrganizerDto`

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning o implementing.**

### Contexto de org
- `apps/website/components/providers.tsx` — `useUser()`, `OrgEntry`, `activeOrg`, `setActiveOrg`, `setOrgContext` (source of truth del contexto)
- `apps/website/lib/api.ts` — `buildHeaders()`, `uploadImage`, `mySpots`, `myHeroes`, `ApiSpot`, `ApiHero`

### Archivos a modificar/eliminar
- `apps/website/app/(site)/cuenta/AccountShell.tsx` — TABS array, quitar entrada organizador
- `apps/website/app/(site)/cuenta/organizador/page.tsx` — ELIMINAR
- `apps/website/app/(site)/cuenta/mis-avisos/page.tsx` — implementar
- `apps/website/app/(site)/cuenta/mis-portadas/page.tsx` — implementar
- `apps/website/app/(site)/carrito/exito/page.tsx` — fix CTA
- `apps/api/src/users/users.controller.ts` — quitar updateOrganizer
- `apps/api/src/users/users.service.ts` — quitar updateOrganizer
- `apps/api/src/users/dto/update-organizer.dto.ts` — ELIMINAR

</canonical_refs>

<specifics>
## Datos técnicos clave

### ApiSpot (lib/api.ts:221)
```ts
status: "DRAFT" | "PENDING_PAYMENT" | "PENDING_MODERATION" | "APPROVED" | "REJECTED" | "BANNED"
title, image, linkType, linkValue, days, amount, expirationDate, createdAt
```

### ApiHero (lib/api.ts:249)
```ts
status: "DRAFT" | "PENDING_PAYMENT" | "PENDING_MODERATION" | "APPROVED" | "REJECTED" | "BANNED"
title, titleAccent, lead, image, date, place, link, eventCategory, days, amount, expirationDate
```

### uploadImage actual (línea 383-402)
```ts
uploadImage: async (file: File, token: string) => {
  const form = new FormData();
  form.append("file", file);
  res = await fetch(`${apiBase()}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },  // ← falta X-Org-Context
    body: form,
  });
}
```

### Estado actual mis-avisos / mis-portadas
- Ambas son páginas "use client" con shell, tabs UI y empty state hardcodeado
- No hacen ninguna llamada a la API — `spots` y `heroes` nunca se cargan
- Los tabs de filtro están pero sin data que filtrar

</specifics>

<deferred>
## Deferred

- Sidebar condicional según activeOrg (mostrar tabs distintos para personal vs org) — requiere diseño, deferido
- Perfil de org editable desde /cuenta — deferido a futura fase
- Campos `displayName`/`handle` del usuario personal en `/cuenta/perfil` — deferido, los campos existen en DB pero sin UI por ahora

</deferred>

---

*Phase: 23-cleanup-post-cambio-de-contexto-org*
*Context gathered: 2026-05-28 via codebase audit post-Phase-22*
