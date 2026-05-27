# Phase 18: Separar taxonomía eventos/artículos — Research

**Researched:** 2026-05-27
**Domain:** Prisma schema migration, NestJS taxonomy split, Next.js frontend taxonomy refactor
**Confidence:** HIGH (based on direct source code inspection)

---

## Summary

Phase 18 separa la taxonomía compartida de eventos y artículos. El estado actual es más complejo de lo que la descripción de fase sugiere: `Category` es usada por `Event` Y `Hero` (no por `Article`), y `Tag` es usada SOLO por `Article` (no por `Event`). Esto significa que "EventTag" y "ArticleCategory" serían relaciones NUEVAS que se añaden, no simples renombrados.

El riesgo más crítico está en `OrdersService`: lee `event.category?.pricePerDay`, `category.minDays` y `category.maxDays` para calcular precios de órdenes. Cualquier `EventCategory` que reemplace a `Category` para eventos DEBE preservar estos campos o el sistema de pagos se rompe. Adicionalmente, `Hero.categoryId` apunta a `Category`; el destino de Hero después del split es una decisión de diseño que la fase no menciona.

La estrategia de migración recomendada es aditiva-primero: crear las nuevas tablas, copiar datos, crear FKs nuevas, migrar lectura/escritura, y solo al final eliminar las tablas viejas. Esto permite rollback en cada paso.

**Recomendación principal:** Implementar en 4 planes: (1) schema Prisma + migración de datos, (2) backend API split, (3) frontend split, (4) eliminación de modelos compartidos + cleanup.

---

<phase_requirements>
## Phase Requirements

Los requisitos TAX-01..TAX-12 NO están definidos en REQUIREMENTS.md (el archivo no existe). El planner DEBE definirlos inline en los PLAN.md, siguiendo el patrón de Phase 17. A continuación se propone el mapping basado en el análisis del código:

| ID | Descripción Propuesta | Research Support |
|----|----------------------|-----------------|
| TAX-01 | Crear modelo `EventCategory` en Prisma con campos pricePerDay, minDays, maxDays, icon, color, order, slug, description (todos heredados de Category actual) | schema.prisma Category model; orders.service.ts lines 104-128, 278 |
| TAX-02 | Crear modelo `EventTag` en Prisma (name, slug únicos) y relación Event ↔ EventTag many-to-many | Nuevo — actualmente Event no tiene tags |
| TAX-03 | Crear modelo `ArticleCategory` en Prisma (name, slug únicos, description?) | Nuevo — actualmente Article no tiene categoría |
| TAX-04 | Crear modelo `ArticleTag` en Prisma renombrando Tag (name, slug únicos) y re-apuntando relación Article ↔ ArticleTag | Tag actual solo usado por Article |
| TAX-05 | Migración de datos: copiar filas de Category → EventCategory, copiar filas de Tag → ArticleTag, actualizar FKs Event.eventCategoryId y Article.articleTagIds | Prisma migration + seed data |
| TAX-06 | Backend: endpoints /event-categories y /event-tags (renombrar /categories y /tags) con DTOs propios | catalog.controller.ts, catalog.service.ts |
| TAX-07 | Backend: endpoints /article-categories y /article-tags | Nuevos endpoints |
| TAX-08 | Backend events: DTOs, service, filtros usan eventCategoryId/eventTagIds en lugar de categoryId | events.service.ts, create-event.dto.ts |
| TAX-09 | Backend articles: DTOs, service, filtros usan articleCategoryId/articleTagIds en lugar de tagIds | articles.service.ts, create-article.dto.ts |
| TAX-10 | Frontend api.ts: ApiEventCategory, ApiArticleCategory, ApiEventTag, ApiArticleTag types; actualizar todas las llamadas | apps/website/lib/api.ts |
| TAX-11 | Frontend UI: Header, sitemap, CategoryView, SearchView, EventForm, ArticleForm, Step1Client usan nuevos tipos | múltiples archivos |
| TAX-12 | Dashboard CategoriesSection y TagsSection reales (conectados a API) o decisión explícita de dejarlos como mock | CategoriesSection.tsx, SimpleCRUDSection.tsx — actualmente mock hardcoded |

**Nota para el planner:** La suerte de `Hero.categoryId` es una decisión de diseño BLOQUEANTE que debe resolverse en Plan 1. Opciones: (A) Hero reutiliza EventCategory, (B) Hero obtiene su propio HeroCategory, (C) Category compartida persiste solo para Hero. La opción A (reutilizar EventCategory) es la más simple y coherente.
</phase_requirements>

---

## Standard Stack

### Core (sin cambios — stack existente)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Prisma | 6.x | Schema + migrations + ORM | Ya en uso en el proyecto |
| NestJS | 11.x | Backend framework | Ya en uso |
| Next.js | 15.x | Frontend App Router | Ya en uso |
| TypeScript | 5.x | Type safety cross-stack | Ya en uso |

### Herramientas de migración

| Tool | Purpose | Notes |
|------|---------|-------|
| `prisma migrate dev` | Generar y aplicar migraciones SQL | Genera SQL additive-first automáticamente |
| `prisma db seed` o SQL directo | Copiar datos entre tablas durante migración | Usar SQL `INSERT INTO ... SELECT FROM` para datos en producción |
| `prisma generate` | Regenerar Prisma Client después de schema changes | Requerido después de cada cambio de schema |

**Instalación:** No se requieren paquetes adicionales.

---

## Architecture Patterns

### Estructura de archivos afectados

```
apps/api/
├── prisma/
│   └── schema.prisma                  # EDIT: añadir EventCategory, EventTag, ArticleCategory, ArticleTag
├── src/catalog/
│   ├── catalog.controller.ts          # EDIT: añadir rutas /event-categories, /event-tags, /article-categories, /article-tags
│   ├── catalog.service.ts             # EDIT: métodos para los 4 nuevos modelos
│   ├── dto/
│   │   ├── create-event-category.dto.ts    # NEW
│   │   ├── update-event-category.dto.ts    # NEW
│   │   ├── create-event-tag.dto.ts         # NEW
│   │   ├── create-article-category.dto.ts  # NEW
│   │   ├── create-article-tag.dto.ts       # NEW
│   │   └── (mantener create-category.dto.ts para Hero si se reusa EventCategory)
├── src/events/
│   ├── dto/create-event.dto.ts        # EDIT: categoryId → eventCategoryId; añadir eventTagIds?
│   └── events.service.ts              # EDIT: EVENT_INCLUDE, create, update, findAll filter
└── src/articles/
    ├── dto/create-article.dto.ts      # EDIT: tagIds → articleTagIds (o mantener nombre)
    └── articles.service.ts            # EDIT: ARTICLE_INCLUDE, create, update, findAll filter

apps/website/
├── lib/api.ts                         # EDIT: ApiEventCategory, ApiArticleTag types; api.eventCategories(), etc.
├── components/Header.tsx              # EDIT: usar ApiEventCategory
├── app/(site)/layout.tsx              # EDIT: llamar api.eventCategories()
├── app/sitemap.ts                     # EDIT: usar api.eventCategories() para slug SEO
├── app/(site)/categoria/[cat]/
│   └── CategoryView.tsx               # EDIT: ApiEventCategory
├── app/(site)/busqueda/
│   └── SearchView.tsx                 # EDIT: filtro usa EventCategory
├── app/crear/1/
│   └── Step1Client.tsx               # EDIT: category dropdown usa EventCategory
├── app/dashboard/events/
│   └── EventForm.tsx                  # EDIT: categoría dropdown + tags (si EventTag se añade UI)
└── app/dashboard/articles/
    └── ArticleForm.tsx                # EDIT: tags usa ArticleTag endpoint
```

### Pattern 1: Schema Aditivo — Crear antes de eliminar

**Qué es:** Añadir nuevas tablas (EventCategory, EventTag, ArticleCategory, ArticleTag) sin eliminar las tablas viejas (Category, Tag) en la misma migración. Crear FKs opcionales nuevas, backfill, luego en una migración separada hacer las columnas requeridas y finalmente eliminar lo viejo.

**Cuándo usar:** Siempre en migraciones que afectan tablas con datos en producción y FKs cross-model.

**Ejemplo (schema.prisma):**

```prisma
// Paso 1: Añadir nuevos modelos (NO eliminar Category/Tag todavía)
model EventCategory {
  id          Int      @id @default(autoincrement())
  name        String
  slug        String   @unique
  description String?
  pricePerDay Int      @default(1000)   // ← CRÍTICO para orders.service.ts
  icon        String?
  color       String?
  minDays     Int      @default(1)      // ← CRÍTICO para orders.service.ts
  maxDays     Int      @default(30)     // ← CRÍTICO para orders.service.ts
  order       Int      @default(0)
  events      Event[]
  heroes      Hero[]   // Si Hero reutiliza EventCategory
  @@map("event_categories")
}

model EventTag {
  id     Int     @id @default(autoincrement())
  name   String  @unique
  slug   String  @unique
  events Event[] // relación many-to-many
  @@map("event_tags")
}

model ArticleCategory {
  id          Int       @id @default(autoincrement())
  name        String
  slug        String    @unique
  description String?
  articles    Article[]
  @@map("article_categories")
}

model ArticleTag {
  id       Int       @id @default(autoincrement())
  name     String    @unique
  slug     String    @unique
  articles Article[]
  @@map("article_tags")
}
```

**Nota:** Prisma genera join tables implícitas `_EventToEventTag` y `_ArticleToArticleTag` para las relaciones many-to-many sin `@relation(fields:...)`.

### Pattern 2: Migración SQL con INSERT INTO ... SELECT FROM

**Qué es:** Copiar datos de las tablas viejas a las nuevas dentro de la migración SQL de Prisma, antes de crear las FKs obligatorias.

**Ejemplo (SQL en la migración generada):**

```sql
-- Copiar Category → EventCategory (preservando IDs para que Event.categoryId siga válido)
INSERT INTO event_categories (id, name, slug, description, price_per_day, icon, color, min_days, max_days, `order`)
SELECT id, name, slug, description, price_per_day, icon, color, min_days, max_days, `order`
FROM categories;

-- Copiar Tag → ArticleTag (preservando IDs para que _ArticleToTag siga válido)
INSERT INTO article_tags (id, name, slug)
SELECT id, name, slug
FROM tags;
```

**Por qué:** Preservar IDs permite que las FKs existentes (`Event.categoryId`, `_ArticleToTag.B`) apunten a las nuevas tablas sin necesidad de backfill adicional.

### Pattern 3: Renombrar FK columns en Event y Article

Después de crear las nuevas tablas con los mismos IDs, actualizar las FKs:

```sql
-- Event: añadir eventCategoryId como copia de categoryId
ALTER TABLE events ADD COLUMN event_category_id INT;
UPDATE events SET event_category_id = category_id WHERE category_id IS NOT NULL;
ALTER TABLE events ADD CONSTRAINT fk_event_event_category
  FOREIGN KEY (event_category_id) REFERENCES event_categories(id);
```

### Pattern 4: Separar endpoints en CatalogController

```typescript
// catalog.controller.ts — ejemplo para nuevos controllers
@Controller('event-categories')
@ApiTags('event-categories')
export class EventCategoriesController {
  @Get()    getAll() { return this.service.findAllEventCategories(); }
  @Post()   @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMIN', 'SUPER_ADMIN')
            create(@Body() dto: CreateEventCategoryDto) { ... }
  // etc.
}
```

### Anti-Patterns a evitar

- **Eliminar Category/Tag en la misma migración que crea los nuevos modelos:** Rompe FKs existentes antes de backfill. Siempre aditivo-primero.
- **Cambiar endpoint URL /categories → /event-categories sin redireccionamiento:** Rompe el frontend antes de que el frontend se actualice. Mantener /categories como alias durante la transición.
- **Hacer EventTag obligatorio en EventForm sin UX:** El EventForm actual no tiene tags. Añadir campo de tags al formulario requiere diseño UX (¿checkbox list como en ArticleForm? ¿pills?). Si no se añade UI, el modelo existe en schema pero sin acceso desde el dashboard.
- **Cambiar pricePerDay/minDays/maxDays fuera de EventCategory:** OrdersService los lee de `event.category`. Si se renombra a EventCategory, el `EVENT_INCLUDE` en events.service.ts debe incluir `eventCategory: true` (no `category: true`).

---

## Don't Hand-Roll

| Problema | No construir | Usar en cambio | Por qué |
|----------|-------------|----------------|---------|
| Generación de SQL de migración | Scripts SQL manuales | `prisma migrate dev` | Prisma genera SQL correcto para MySQL, maneja índices, FKs, naming conventions |
| Copiar datos entre tablas durante migración | Script Node.js separado | SQL `INSERT INTO ... SELECT` dentro del archivo de migración Prisma | Transaccional, reproducible, sin dependencias externas |
| Slug único en EventCategory | Validación manual en servicio | `@unique` en schema + error handling existente (`assertUniqueSlug` en CatalogService) | El patrón ya existe en CatalogService |
| Join tables many-to-many | Modelo intermedio explícito | Relación implícita Prisma (sin `@relation(fields:...)`) | Prisma gestiona la join table automáticamente |

---

## Runtime State Inventory

| Categoría | Items encontrados | Acción requerida |
|-----------|------------------|-----------------|
| **Stored data — DB rows** | Filas en tabla `categories` (Category model) con pricePerDay, minDays, maxDays reales; filas en tabla `tags` (Tag model); filas en join table `_ArticleToTag` (Prisma implicit many-to-many) | Migración de datos: SQL INSERT INTO event_categories SELECT FROM categories; INSERT INTO article_tags SELECT FROM tags. La join table `_ArticleToTag` debe ser reemplazada por `_ArticleToArticleTag` con los mismos datos. |
| **FKs en DB** | `Event.categoryId INT` → `categories.id`; `Hero.categoryId INT` → `categories.id` | Code edit en schema + migración para añadir `eventCategoryId`; Hero necesita decisión (ver Open Questions) |
| **Live service config** | N/A — no hay n8n workflows ni servicios externos que referencien Category/Tag por nombre | Ninguna |
| **OS-registered state** | N/A | Ninguna |
| **Secrets/env vars** | N/A — no hay variables de entorno que referencien los nombres de taxonomía | Ninguna |
| **Build artifacts** | `apps/api/node_modules/.prisma/client` — Prisma Client generado; se invalida con `prisma generate` | `prisma generate` después de cada cambio de schema |

**Nota crítica sobre la join table `_ArticleToTag`:** Esta tabla tiene naming implícito de Prisma basado en los nombres de modelo. Al renombrar Tag → ArticleTag, Prisma generará `_ArticleToArticleTag` como nueva join table. Los datos de `_ArticleToTag` deben copiarse a la nueva tabla. El SQL de migración debe incluir este paso explícitamente.

---

## Common Pitfalls

### Pitfall 1: orders.service.ts rompe silenciosamente si EventCategory no tiene los campos correctos

**Qué falla:** `event.category?.pricePerDay` en OrdersService retorna `undefined` si el include cambia a `eventCategory` pero el código sigue leyendo `.category`. El precio de la orden se calcula como `undefined * days = NaN`.
**Por qué ocurre:** El developer actualiza el schema y el service de events, pero olvida actualizar OrdersService que también hace includes de event con category.
**Cómo evitar:** En el plan de backend, OrdersService es un touch point EXPLÍCITO. Buscar todos los lugares que usan `event.category` con `grep -r "event\.category" apps/api/src/`. Actualizar en la misma wave que events.service.ts.
**Señales de alerta:** Tests de órdenes pasan pero precios son 0 o NaN.

### Pitfall 2: Join table renaming rompe relaciones existentes

**Qué falla:** Al renombrar `Tag` → `ArticleTag`, Prisma crea una nueva join table `_ArticleToArticleTag` vacía y deja `_ArticleToTag` sin usar. Los artículos pierden todos sus tags.
**Por qué ocurre:** Prisma no hace `ALTER TABLE ... RENAME TO` para join tables implícitas; crea una tabla nueva.
**Cómo evitar:** En la migración SQL, antes de `DROP TABLE _ArticleToTag`, copiar datos: `INSERT INTO _ArticleToArticleTag SELECT * FROM _ArticleToTag`.
**Señales de alerta:** Articles se cargan pero `.tags` retorna array vacío.

### Pitfall 3: Endpoint URL change rompe frontend antes de que el frontend se actualice

**Qué falla:** Si el backend renombra `/categories` → `/event-categories` antes de que el frontend actualice las llamadas, el Header, sitemap, y búsqueda se rompen en producción.
**Por qué ocurre:** Backend y frontend se despliegan juntos en el monorepo pero el orden de cambios importa.
**Cómo evitar:** Mantener el endpoint `/categories` como alias (redirige a `/event-categories`) en un plan intermedio, o asegurarse de que el plan de backend y frontend estén en la misma wave/deployment. Alternativamente, hacer el cambio de frontend PRIMERO (apuntar a `/event-categories`) y el backend SEGUNDO (añadir el nuevo endpoint sin quitar el viejo).
**Señales de alerta:** Header no muestra categorías, sitemap.ts lanza 404.

### Pitfall 4: SEO — slug collision entre EventCategory y ArticleCategory

**Qué falla:** Si `/categoria/[slug]` sigue siendo una ruta genérica que busca en ambas taxonomías, slugs idénticos en EventCategory y ArticleCategory causan ambigüedad.
**Por qué ocurre:** La ruta actual `/categoria/[cat]` fue diseñada para Category compartida.
**Cómo evitar:** Mantener `/categoria/[slug]` apuntando a EventCategory únicamente (preserva SEO existente). Si ArticleCategory tiene rutas, usar `/categoria/articulo/[slug]` para nuevas rutas. Los slugs actuales de Category se preservan en EventCategory 1:1.
**Señales de alerta:** Google Search Console reporta 404s en URLs indexadas.

### Pitfall 5: Dashboard CategoriesSection y TagsSection son mock — no fallan pero engañan

**Qué falla:** El dashboard admin muestra CRUD de categorías y tags pero usa datos hardcoded (CATS array). Los admins creen que están editando datos reales.
**Por qué ocurre:** Phase 15 (rediseño UI) implementó el layout pero no la conexión real a la API.
**Cómo evitar:** Phase 18 debe decidir EXPLÍCITAMENTE si conecta estos dashboards o los deja como mock con un placeholder. No es aceptable terminar la fase con mock silencioso.
**Señales de alerta:** Admin edita una categoría en el dashboard y no ve el cambio en el sitio.

### Pitfall 6: Hero.categoryId queda huérfano después del split

**Qué falla:** Si Category se elimina al final de la fase pero Hero.categoryId sigue apuntando a Category, la migración falla con FK constraint violation.
**Por qué ocurre:** La fase description no menciona Hero. Es fácil olvidarlo.
**Cómo evitar:** Decidir el destino de Hero ANTES de Plan 1 (ver Open Questions). Incluir Hero en el plan de schema.

---

## Critical Constraint: OrdersService

Este es el riesgo más alto de la fase. Archivo: `apps/api/src/orders/orders.service.ts`.

```typescript
// apps/api/src/orders/orders.service.ts — líneas ~104-128
// Lee category.minDays y category.maxDays para validar días de evento
const category = await this.prisma.category.findUnique({ where: { id: event.categoryId } });
// ... usa category.minDays, category.maxDays para caps

// apps/api/src/orders/orders.service.ts — línea ~278
unitPrice = event.category?.pricePerDay ?? 1000;
```

Después del split, estas líneas deben leer de `EventCategory` (no de `Category`). El `EVENT_INCLUDE` en events.service.ts que actualmente incluye `category: true` debe cambiar a `eventCategory: true`, y OrdersService debe actualizar su acceso de `event.category` a `event.eventCategory`.

---

## Code Examples

### Patrón actual (Category compartida)

```typescript
// Source: apps/api/src/events/events.service.ts
const EVENT_INCLUDE = {
  city: { include: { state: { include: { country: true } } } },
  category: true,  // ← apunta a Category compartida
  prices: true,
  dates: true,
  socialLinks: true,
  videos: true,
  _count: { select: { likes: true } },
};

// Filtro por categoría
if (query.category) {
  where.category = { slug: query.category };
}

// Create event
category: dto.categoryId ? { connect: { id: dto.categoryId } } : undefined,

// Update event
data.category = dto.categoryId ? { connect: { id: dto.categoryId } } : { disconnect: true };
```

### Patrón objetivo (EventCategory separada)

```typescript
// Source: patrón a implementar
const EVENT_INCLUDE = {
  city: { include: { state: { include: { country: true } } } },
  eventCategory: true,  // ← nuevo nombre de relación
  // ...
};

// Filtro por categoría
if (query.category) {
  where.eventCategory = { slug: query.category };
}

// Create event
eventCategory: dto.eventCategoryId ? { connect: { id: dto.eventCategoryId } } : undefined,
```

### Patrón actual (Tag → Article many-to-many)

```typescript
// Source: apps/api/src/articles/articles.service.ts
const ARTICLE_INCLUDE = {
  tags: true,  // ← apunta a Tag compartida
  _count: { select: { likes: true } },
};

// Create article
tags: dto.tagIds?.length ? { connect: dto.tagIds.map((id) => ({ id })) } : undefined,

// Update article
tags: { set: dto.tagIds.map((tagId) => ({ id: tagId })) },
```

### Patrón objetivo (ArticleTag)

```typescript
// Mismo patrón, pero la relación se llama 'articleTags' y el DTO usa 'articleTagIds'
const ARTICLE_INCLUDE = {
  articleTags: true,  // o mantener 'tags' si el campo en schema usa @@relation("ArticleToArticleTag")
  // ...
};
```

---

## State of the Art

| Enfoque actual | Enfoque objetivo | Cuándo cambiar | Impacto |
|---------------|-----------------|----------------|---------|
| `Category` compartida Event+Hero | `EventCategory` para Event+Hero | Plan 1 schema + Plan 2 backend | Orders pricing preservado |
| `Tag` solo Article | `ArticleTag` renombrado | Plan 1 schema + Plan 2 backend | Join table data migration |
| `/categories` endpoint | `/event-categories` (+ alias `/categories`) | Plan 2 backend | SEO slugs preservados |
| `/tags` endpoint | `/article-tags` | Plan 2 backend | ArticleForm uses new endpoint |
| Dashboard CategoriesSection mock | Real o placeholder explícito | Plan 3 frontend | Admin UX honesta |

---

## Open Questions

1. **Hero.categoryId — ¿Qué modelo usa Hero después del split?**
   - Lo que sabemos: Hero.categoryId → Category (FK). HeroesService incluye `category: true`. La categoría en Hero es decorativa (visual label en hero carousel), NO se usa para pricing.
   - Lo que falta: La fase description no menciona Hero. El planner debe decidir: (A) Hero reutiliza EventCategory (`eventCategory` en schema), (B) Hero tiene su propio HeroCategory model, (C) Category compartida persiste SOLO para Hero.
   - Recomendación: Opción A (Hero reutiliza EventCategory) — simplifica el split, las categorías de eventos son las mismas que se muestran en heroes del carousel. Si futuro requiere categorías propias de Hero, se puede añadir después.

2. **¿EventTag se añade al EventForm o queda solo en el schema?**
   - Lo que sabemos: Actualmente Event NO tiene tags. ArticleForm tiene checkbox list de tags. EventForm no tiene UI de tags.
   - Lo que falta: ¿El phase 18 incluye UI para asignar EventTags desde el dashboard? El formulario de eventos ya tiene sección "Redes sociales y tags" (label) pero sin tags UI.
   - Recomendación: Añadir EventTag al schema y endpoint pero marcar el UI en EventForm como DEFERRED si el scope ya es grande. Un campo tags en EventForm (igual que ArticleForm checkbox list) puede ser un TAX-02b separado.

3. **¿ArticleCategory tiene rutas públicas o es solo metadata?**
   - Lo que sabemos: Actualmente Article no tiene categoría. Header y sitemap usan solo EventCategory.
   - Lo que falta: ¿Habrá una ruta `/categoria/articulo/[slug]` para artículos por categoría? ¿O ArticleCategory es solo metadata para búsqueda/filtro interno?
   - Recomendación: En Phase 18, ArticleCategory es solo metadata. No crear rutas públicas nuevas para artículos por categoría (esto sería Phase 19+). El filtro en SearchView podría mostrar ArticleCategories por separado, pero el scope está creciendo.

4. **¿Dashboard CategoriesSection y TagsSection deben ser reales en Phase 18?**
   - Lo que sabemos: Ambas usan hardcoded mock data. Después del split habrá 4 taxonomías (EventCategory, EventTag, ArticleCategory, ArticleTag) — el dashboard necesitaría 4 secciones CRUD.
   - Recomendación: Phase 18 debe conectar al menos EventCategoriesSection a la API real (reemplazando el mock). EventTag, ArticleCategory, ArticleTag pueden tener secciones básicas o dejar TAX-12 como "conectar dashboard" como el último plan.

---

## Validation Architecture

> nyquist_validation: true — incluir sección.

### Test Framework

| Propiedad | Valor |
|-----------|-------|
| Framework | No detectado — el proyecto no tiene archivos de test (jest.config.*, pytest.ini, vitest.config.*) |
| Config file | No existe |
| Quick run | N/A — ver Wave 0 Gaps |
| Full suite | N/A |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TAX-01 | EventCategory model tiene pricePerDay, minDays, maxDays | manual-only | Verificar schema.prisma + DB | ❌ Wave 0 |
| TAX-02 | Event puede tener EventTags (M:M) | manual-only | POST /events con eventTagIds, GET verifica tags | ❌ Wave 0 |
| TAX-03 | ArticleCategory existe en DB | manual-only | GET /article-categories retorna 200 | ❌ Wave 0 |
| TAX-04 | ArticleTag es renombrado de Tag; datos migrados | manual-only | GET /article-tags retorna mismas rows que /tags tenía | ❌ Wave 0 |
| TAX-05 | Datos migrados: EventCategory tiene mismos rows que Category | manual-only | SQL: SELECT COUNT(*) FROM event_categories vs categories | ❌ Wave 0 |
| TAX-06 | GET /event-categories retorna lista de categorías de eventos | smoke | `curl http://localhost:3000/event-categories` | ❌ Wave 0 |
| TAX-07 | GET /article-categories retorna lista de categorías de artículos | smoke | `curl http://localhost:3000/article-categories` | ❌ Wave 0 |
| TAX-08 | EventsService usa eventCategoryId; OrdersService pricing no rompe | manual-only | Crear orden de evento y verificar precio correcto | ❌ Wave 0 |
| TAX-09 | ArticlesService usa ArticleTag; filtro por tag funciona | smoke | `curl "http://localhost:3000/articles?tag=slug-del-tag"` | ❌ Wave 0 |
| TAX-10 | Frontend api.ts tipos actualizados; Header muestra EventCategories | smoke | Navegar a / y verificar nav categories | ❌ Wave 0 |
| TAX-11 | Búsqueda filtra por EventCategory; EventForm tiene dropdown categoría | manual-only | UI test manual | ❌ Wave 0 |
| TAX-12 | Dashboard CategoriesSection conectado a API real (no mock) | manual-only | Admin: editar categoría → refrescar sitio → verificar cambio | ❌ Wave 0 |

**Justificación manual-only para TAX-05:** Requiere inspección de DB o migration logs, no automatizable sin framework de test configurado.

### Wave 0 Gaps

El proyecto no tiene infraestructura de tests automatizados. Para Phase 18:

- [ ] No se requiere configurar framework de tests en Wave 0 (todas las verificaciones son smoke tests manuales o SQL queries)
- [ ] Smoke test checklist debe crearse en VERIFICATION.md al final de la fase

---

## Sources

### Primary (HIGH confidence)

- `apps/api/prisma/schema.prisma` — Inspección directa: modelos Category, Tag, Event, Article, Hero, relaciones completas
- `apps/api/src/orders/orders.service.ts` — Inspección directa: uso de `event.category?.pricePerDay`, `category.minDays`, `category.maxDays`
- `apps/api/src/catalog/catalog.service.ts` — Inspección directa: métodos de taxonomía, `assertUniqueSlug`
- `apps/api/src/events/events.service.ts` — Inspección directa: `EVENT_INCLUDE`, filtros, create/update patterns
- `apps/api/src/articles/articles.service.ts` — Inspección directa: `ARTICLE_INCLUDE`, tag patterns
- `apps/website/lib/api.ts` — Inspección directa: `ApiCategory`, `api.categories()`, `toEventItem()`
- `apps/website/app/dashboard/sections/CategoriesSection.tsx` — Inspección directa: CATS hardcoded mock array
- `apps/website/components/Header.tsx` — Inspección directa: consume `ApiCategory[]`
- `apps/website/app/sitemap.ts` — Inspección directa: llama `api.categories()` para SEO URLs

### Secondary (MEDIUM confidence)

- Prisma documentation (training data): comportamiento de implicit join tables al renombrar modelos — verificado en context de migración 20260521221820_mysql_init

### Tertiary (LOW confidence)

- N/A

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — sin cambios al stack, solo reorganización de modelos existentes
- Architecture: HIGH — basada en inspección directa del código fuente
- Pitfalls: HIGH — basada en lógica de dependencias verificada en código (OrdersService es riesgo confirmado, no inferido)
- Schema migration patterns: MEDIUM — Prisma implicit join table rename behavior verificado en training data pero no contra Prisma 6.x docs directamente

**Research date:** 2026-05-27
**Valid until:** 2026-06-27 (stack estable, no hay releases activos que afecten patrones)
