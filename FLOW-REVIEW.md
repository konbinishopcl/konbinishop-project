# Flow Review — API Konbini

**Fecha:** 2026-05-21  
**Branch:** `feat/migrate-to-neon`  
**Método:** Testing manual con curl contra `http://localhost:3333/api`

---

## Resumen ejecutivo

Se probaron todos los flujos principales de la API con tres tipos de usuario (anónimo, `AUTHENTICATED`, `ADMIN`). Se encontraron **4 bugs reales**, todos corregidos durante la revisión. No quedaron bugs pendientes.

---

## Bugs encontrados y corregidos

### BUG 1 — `addressNumber` requerido en CreateEventDto
**Archivo:** `src/events/dto/create-event.dto.ts`  
**Severidad:** Alta (bloqueaba la creación de eventos)

`addressNumber` estaba marcado con `@IsString()` y `@MinLength(1)` sin `@IsOptional()`, haciendo que cualquier POST a `/events` sin ese campo fallara con 400.

Un número de dirección es opcional por naturaleza (locales sin número, eventos en parques, etc.).

**Fix:** Se marcó `@IsOptional()` en el DTO y `String?` en el schema de Prisma con migración correspondiente.

---

### BUG 2 — `GET /spots/quota` requería autenticación
**Archivo:** `src/spots/spots.controller.ts`  
**Severidad:** Media

El endpoint tenía `@UseGuards(JwtAuthGuard)` y devolvía 401 sin token. La quota es información pública que el frontend necesita mostrar antes de que el usuario se loguee (para que sepa si hay cupos disponibles).

**Fix:** Se removió el guard del endpoint.

---

### BUG 3 — `GET /heroes/quota` requería autenticación
**Archivo:** `src/heroes/heroes.controller.ts`  
**Severidad:** Media

Mismo problema que bug 2, misma causa, mismo fix.

**Fix:** Se removió el guard del endpoint.

---

### BUG 4 — Hero DTO usaba `linkType`/`linkValue` en vez de `link`
**Archivos:** `src/heroes/dto/create-hero.dto.ts`, `src/heroes/dto/update-hero.dto.ts`, `src/heroes/heroes.service.ts`, `prisma/schema.prisma`, `prisma/seed.ts`  
**Severidad:** Alta (bloqueaba creación de heroes)

Los DTOs de Hero importaban `SpotLinkType` del schema y usaban `linkType: SpotLinkType` y `linkValue: string`, que son los campos del modelo Spot. El modelo Hero tiene un campo `link: String?` simple (URL directa).

Además el seed tenía la misma confusión mezclando ambos formatos.

**Fix:**
- DTOs actualizados a `link?: string` simple
- Schema corregido: `linkType`/`linkValue` → `link String?`
- Migración aplicada (datos de heroes existentes migrados, `link` queda null para los 2 heroes del seed → se corrigió el seed)
- Service actualizado para usar `dto.link`

---

## Resultados por flujo

| Flujo | Estado | Notas |
|---|---|---|
| Auth: registro | ✅ OK | Devuelve token + user |
| Auth: login | ✅ OK | Contraseña incorrecta → 401 |
| Auth: /me | ✅ OK | Sin token → 401 |
| Auth: duplicado | ✅ OK | Email duplicado → 409 |
| Regions GET | ✅ OK | 16 regiones |
| Communes GET | ✅ OK | 346 comunas, filtro por region slug funciona |
| Categories GET | ✅ OK | |
| Tags GET | ✅ OK | |
| Catalog CRUD (admin) | ✅ OK | POST/PATCH/DELETE operan correctamente |
| Catalog escritura (user) | ✅ OK | Devuelve 403 como esperado |
| Catalog escritura (sin token) | ✅ OK | Devuelve 401 como esperado |
| Articles GET | ✅ OK | |
| Articles CRUD (admin) | ✅ OK | Slug auto-generado desde título |
| Articles escritura (sin token) | ✅ OK | 401 |
| Events GET público | ✅ OK | Solo APPROVED + activos |
| Events GET admin | ✅ OK | Todos los estados, incluye owner |
| Events GET búsqueda | ✅ OK | `?q=` filtra por título y descripción |
| Events POST (user) | ✅ OK (fix bug 1) | Queda en DRAFT |
| Events GET slug (DRAFT) | ✅ OK | 404 para el público |
| Events GET slug (APPROVED) | ✅ OK | 200 con datos completos |
| Events /mine | ✅ OK | Devuelve solo eventos del usuario |
| Events approve (admin) | ✅ OK | Pasa a APPROVED |
| Events reject (admin) | ✅ OK | Pasa a REJECTED con motivo |
| Events DELETE (dueño) | ✅ OK | |
| Events DELETE (ajeno) | ✅ OK | 403 |
| Spots GET público | ✅ OK | Solo APPROVED |
| Spots quota GET | ✅ OK (fix bug 2) | max/active/available/pricePerDay/maxDays |
| Spots POST (user) | ✅ OK | Queda en DRAFT |
| Spots /mine | ✅ OK | |
| Spots PATCH (dueño) | ✅ OK | |
| Spots POST (sin token) | ✅ OK | 401 |
| Spots DELETE (dueño) | ✅ OK | |
| Heroes GET público | ✅ OK | Solo APPROVED |
| Heroes quota GET | ✅ OK (fix bug 3) | |
| Heroes POST (user) | ✅ OK (fix bug 4) | Sin linkType/linkValue |
| Heroes /mine | ✅ OK | |
| Heroes PATCH (dueño) | ✅ OK | |
| Heroes DELETE (dueño) | ✅ OK | |
| Orders draft GET (crear) | ✅ OK | Idempotente |
| Orders draft GET (recuperar) | ✅ OK | Devuelve mismo ID |
| Orders PUT items (agregar) | ✅ OK | Calcula subtotal y total |
| Orders PUT items (reemplazar) | ✅ OK | Upsert por tipo |
| Orders GET por ID | ✅ OK | |
| Orders GET por ID (admin) | ✅ OK | Admin puede ver cualquier orden (por diseño, soporte) |
| Orders DELETE items | ✅ OK | |
| Orders DELETE items inexistente | ✅ OK | 404 |
| Orders PUT días > máximo | ✅ OK | 400 con mensaje |

---

## Observaciones (no bugs, puntos de mejora)

### Slug de Región Metropolitana
El slug en la BD es `region-metropolitana-de-santiago`, no `region-metropolitana`. El frontend debe obtener el slug desde `GET /regions` y usarlo exactamente, no construirlo a mano.

### Admin ve órdenes de otros usuarios
`GET /orders/:id` con token ADMIN devuelve 200. Es intencional para soporte, pero no hay endpoint de listado de todas las órdenes para el admin. Si se necesita en el futuro, habría que agregar `GET /admin/orders` o similar.

### Paginación en events
`GET /events` devuelve paginación (`total`, `page`, `pageSize`, `totalPages`) pero `GET /spots` y `GET /heroes` devuelven array plano sin paginación. Consistencia deseable a futuro.

### Eventos sin expirationDate son "activos para siempre"
Un evento APPROVED sin `expirationDate` nunca expira y siempre aparece en el listado público. Puede ser intencional, pero vale la pena documentarlo.

---

## Migraciones aplicadas durante el review

| Migración | Cambio |
|---|---|
| `20260521_make_address_number_optional` | `Event.addressNumber` → `String?` |
| `20260521200000_hero_link_simple` | `Hero.linkType` + `Hero.linkValue` → `Hero.link String?` |
