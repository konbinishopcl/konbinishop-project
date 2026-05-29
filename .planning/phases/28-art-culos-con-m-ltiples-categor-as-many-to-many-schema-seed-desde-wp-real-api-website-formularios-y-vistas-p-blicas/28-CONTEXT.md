# Phase 28: Artículos con múltiples categorías - Context

**Gathered:** 2026-05-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Cambiar la relación entre artículos y categorías de FK única (`articleCategoryId`) a many-to-many.
Incluye: migración Prisma, actualización del seeder de datos (articles.json), actualización de la API
(articles.service + DTOs + query filter), y actualización del frontend (tipos, componentes de display,
formularios de creación/edición, vistas públicas de noticias).

El objetivo raíz es que los artículos importados de WordPress reflejen correctamente las múltiples
categorías que tenían en el sitio original.

</domain>

<decisions>
## Implementation Decisions

### Seed data — actualización de articles.json

- **D-01:** Crear un script ligero (`prisma/update-article-categories.ts`) que consulta solo
  la WP API (`?_fields=id,slug,categories`) sin bajar imágenes. Cruza por slug con el
  `articles.json` existente y reemplaza `categorySlug: string | null` por `categorySlugs: string[]`.
  Las imágenes ya descargadas no se tocan.

- **D-02:** Estrategia catch-all: excluir categorías genéricas (`cultura-otaku`, `anime`,
  `uncategorized`) si el post tiene al menos una categoría más específica disponible.
  Si solo tiene catch-alls, incluirlas. Ejemplo: `["anime", "naruto"]` → `["naruto"]`.

- **D-03:** Todo cambio de datos pasa por el seeder (`seed.ts` → `articles.json`),
  **nunca** directo a la base de datos. El script de actualización produce un JSON;
  el seed.ts lo consume para poblar la DB.

### Schema y migración Prisma

- **D-04:** Quitar `articleCategoryId Int?` de `Article` y la relación `articleCategory ArticleCategory?`.
  Agregar relación implícita many-to-many: `articleCategories ArticleCategory[]` en `Article`
  y `articles Article[]` en `ArticleCategory` (Prisma genera la tabla pivot automáticamente).

### API — articles.service y DTOs

- **D-05:** `articleCategoryId?: number` en los 3 DTOs (create, update, create-sponsored) cambia
  a `articleCategoryIds?: number[]`.

- **D-06:** El filtro de query `?articleCategory=slug` mantiene la misma interfaz pero la lógica
  cambia a `articleCategories: { some: { slug } }` — semántica OR, sin breaking change externo.

- **D-07:** En `include`, `articleCategory: true` cambia a `articleCategories: true`.

### Seed.ts

- **D-08:** `articles.json` pasa de `{ categorySlug: string | null }` a `{ categorySlugs: string[] }`.
  El loop de seed usa `connect: categorySlugs.map(slug => ({ slug }))` para la relación.

### Frontend — display

- **D-09:** Claude's discretion. Para componentes que muestran una sola categoría (ArticleCard,
  ArticleView header, NoticiasHubView), mostrar la primera del array `articleCategories[0]`.
  No se diseñaron vistas de múltiples badges — mantener consistencia visual actual.

### Frontend — formularios (ArticleForm + vista pública crear artículo)

- **D-10:** `ArticleForm` actualmente **no tiene campo de categoría**. Agregar selector de
  categorías múltiples consistente con cómo `ArticleForm` ya maneja tags (checkboxes o multi-select).
  Mismo patrón para la vista pública de crear artículo si existe ese campo.

- **D-11:** En `ArticlesSection` del dashboard admin, si se muestra categoría en la lista,
  mostrar la primera o un badge con conteo (ej: "Anime +2").

### Scripts auxiliares

- **D-12:** `export-wp-articles.ts` actualizar para que genere `categorySlugs: string[]` en vez
  de `categorySlug: string | null` para futuras re-exportaciones (misma lógica catch-all de D-02).

- **D-13:** `recategorize-articles.ts` eliminar — era un workaround para la FK única, ya no aplica.

### Claude's Discretion
- Diseño exacto del selector de categorías en formularios
- Orden de categorías en el array (ej: más específica primero)
- Manejo de `articleCategories: []` (sin categoría) en display — mostrar "NOTICIAS" como fallback

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Schema y modelo de datos
- `apps/api/prisma/schema.prisma` — Modelos Article y ArticleCategory (relación actual a cambiar)

### API — artículos
- `apps/api/src/articles/articles.service.ts` — Lógica de include, where, create/update
- `apps/api/src/articles/dto/create-article.dto.ts`
- `apps/api/src/articles/dto/update-article.dto.ts`
- `apps/api/src/articles/dto/create-sponsored-article.dto.ts`
- `apps/api/src/articles/dto/query-articles.dto.ts`

### Seed y datos
- `apps/api/prisma/seed.ts` — Loop de artículos y conexión de categorías
- `apps/api/prisma/data/articles.json` — Fuente de datos (cambiar a categorySlugs[])
- `apps/api/prisma/export-wp-articles.ts` — Script de exportación (actualizar para futuras ejecuciones)

### Frontend — tipos y componentes
- `apps/website/lib/api.ts` — Tipo ApiArticle (línea 205: `articleCategory: ApiArticleCategory | null`)
- `apps/website/components/ArticleCard.tsx`
- `apps/website/app/(site)/noticias/NoticiasHubView.tsx`
- `apps/website/app/(site)/noticias/[slug]/ArticleView.tsx`
- `apps/website/app/(site)/noticias/categorias/[slug]/NewsCategoryView.tsx`
- `apps/website/app/(site)/noticias/categoria/[slug]/NewsCategoryView.tsx`
- `apps/website/components/SearchLightbox.tsx`
- `apps/website/app/dashboard/articles/ArticleForm.tsx`

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `ArticleTag` many-to-many: patrón exacto a replicar para `ArticleCategory`. Ya existe en `ArticleForm` como multi-select de tags — usar mismo patrón para categorías.
- `NoticiasListView` filtro `articleCategory`: simplemente cambia el where Prisma, la UI del filtro no cambia.

### Established Patterns
- Many-to-many implícito Prisma (como `articleTags ArticleTag[]`) — usar mismo approach para ArticleCategory.
- DTOs de artículos usan `number[]` para tagIds — usar `articleCategoryIds: number[]` consistentemente.
- Seed usa `connect: tagIds.map(id => ({ id }))` — para categorías usar `connect: categorySlugs.map(slug => ({ slug }))`.

### Integration Points
- `apps/api/src/catalog/catalog.service.ts` — CRUD de ArticleCategory no cambia (sigue siendo el mismo modelo, solo cambia la relación con Article).
- `apps/website/app/(site)/layout.tsx` — ya carga `articleCategories` para el Header/MegaMenu, no cambia.
- `apps/website/app/(site)/noticias/page.tsx` y `/categorias/[slug]/page.tsx` — usan el endpoint `?articleCategory=slug`, no cambia la interfaz.

### Scripts a eliminar/actualizar
- `apps/api/prisma/recategorize-articles.ts` — workaround que queda obsoleto, eliminar.
- `apps/api/prisma/seed-article-categories.ts` — standalone seeder de categorías, no afectado.

</code_context>

<specifics>
## Specific Ideas

- El script de actualización de categories (`update-article-categories.ts`) debe ser idempotente:
  puede correrse N veces y produce el mismo resultado en articles.json.
- Catch-alls a excluir: `["cultura-otaku", "anime", "uncategorized"]`. Si el único disponible
  es uno de estos, se incluye igual (mejor una genérica que ninguna).
- El seeder debe poder correrse en entornos con poca RAM — el script de actualización del JSON
  no debe conectarse a la DB, solo llama a la WP API y escribe el archivo local.

</specifics>

<deferred>
## Deferred Ideas

- Filtrar artículos por múltiples categorías simultáneas en la URL (ej: `?cats=anime,naruto`) — scope propio si se necesita.
- Mostrar badges de todas las categorías en ArticleCard (diseño multi-badge) — requiere revisión de diseño.

</deferred>

---

*Phase: 28-articulos-multiples-categorias*
*Context gathered: 2026-05-29*
