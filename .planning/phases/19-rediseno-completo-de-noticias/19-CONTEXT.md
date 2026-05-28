# Phase 19: Rediseño completo de Noticias - Context

**Gathered:** 2026-05-28
**Status:** Ready for planning
**Source:** PRD Express Path (design/Konbini.html)

<domain>
## Phase Boundary

Esta fase rediseña completamente la sección Noticias del sitio público (apps/website), sin tocar la API backend ni el dashboard admin. Entrega:

1. **Navbar mega menú** — dropdown hover sobre "Noticias" con grid de categorías agrupadas
2. **Hub page `/noticias`** — rediseño completo: hero destacado, picks de redacción, rails por categoría, sección artículo patrocinado, CTA explorar categorías
3. **Ruta `/noticias/categoria/[slug]`** — nueva ruta de categoría con header, filtros avanzados y paginación
4. **ArticleCard actualizado** — botón like + contador, tiempo de lectura, badge eventos relacionados
5. **CSS nuevo** — `.mega-bg`, `.mega-inner`, `.mega-grid`, `.mega-col`, `.mega-aside`, `.mega-cta`, `.news-hero`, `.sponsored-feature`

</domain>

<decisions>
## Implementation Decisions

### 1. Navbar — Mega Menú (NEWS-01)

- El link "Noticias" en el Header tiene un chevron separado al lado derecho
- Al hover sobre "Noticias" O el chevron → abre `NewsMegaMenu`
- `onMouseLeave` en el wrapper cierra el menú
- Estructura del mega menú:
  - Posición: `fixed`, `left: 0`, `right: 0`, `top: 72px` (var `--mega-top`)
  - `z-index: 70`, backdrop blur 24px saturate 160%
  - Animación: `megaIn` — `opacity: 0 → 1`, `translateY(-6px → 0)`, duration 180ms cubic-bezier(.2,.7,.3,1)
  - Layout interior: `grid-template-columns: 280px 1fr`, gap 36px
  - **Aside izquierdo** (`.mega-aside`): border-right, label "NOTICIAS · ニュース", h3 "Lo último.", párrafo descripción, botón CTA `.mega-cta` → navega a `/noticias`
  - **Lista derecha** (`.mega-flat`): `columns: 4; column-gap: 32px` — todas las categorías en lista flat, ordenadas alfabéticamente por nombre
- Categorías del mega menú: todas las de la DB (`article_categories`), ordenadas alfabéticamente por `name`
- Cada item: `display: flex; align-items: center; justify-content: space-between` — nombre a la izquierda, `.ja` (japonés, font-mono 10px, ink-3) a la derecha; `break-inside: avoid`
- El item activo tiene `.on` class (color ink, background surface-2)
- Click en item → navega a `/noticias/categoria/[slug]`

### 2. Hub Page `/noticias` — Rediseño completo (NEWS-02, NEWS-03, NEWS-04, NEWS-05)

La página actual (grilla flat de 24 cards) se reemplaza por una hub page con secciones:

**NEWS-02: Hero + Picks de Redacción**
- Layout: `grid-template-columns: minmax(0, 1fr) 360px`, gap 28px, margin 28px 0 56px
- Izquierda — artículo destacado (el más reciente con imagen):
  - Aspecto 16:10, borderRadius xl, overflow hidden, cursor pointer
  - Imagen de fondo (img absolute inset)
  - Overlay gradiente: `linear-gradient(0deg, rgba(0,0,0,.85) 0%, rgba(0,0,0,0) 60%)`
  - Contenido sobre el overlay (left 36, right 36, bottom 36, color #fff):
    - Eyebrow mono 11px: `DESTACADO · {CAT}` + fecha + tiempo lectura
    - `h1` display font: clamp(36px, 4.6vw, 56px), lineHeight 1.05
    - Excerpt 16px, max 62ch
    - Badge CTA inline-flex: background accent, "Leer artículo →"
- Derecha — "Picks de la redacción":
  - Label mono 10px uppercase "Picks de la redacción"
  - 3 artículos en columna: número `01/02/03` (font-display 28px, color accent), categoría (mono 10px, accent), título (display 17px), fecha + lectura

**NEWS-03: Grid "Lo último"**
- `SectionHead` con title "Lo último", ja "最新", link "Ver todas las noticias"
- `card-grid` con los siguientes 4 artículos (skip el featured)
- marginBottom 56px

**NEWS-04: Sección artículo patrocinado**
- Solo se muestra si existe al menos un artículo con `isSponsored: true`
- Layout: `background: var(--surface); border: 1px solid var(--line); borderRadius: var(--r-xl); padding: 32px; grid-template-columns: 1fr 1fr; gap: 32px`
- Izquierda: imagen 16:10 con badge "ARTÍCULO PATROCINADO" (absolute top-left)
- Derecha: eyebrow categoría + PATROCINADO en accent, h3 display 32px, excerpt 15px, botón CTA + fecha
- Click en sección → navega al artículo

**NEWS-05: Rails por categoría**
- Para cada categoría que tenga artículos: sección con `SectionHead` + `card-grid` de 4 cards
- Categorías con rails (en orden): Anime, Manga, Cine, Gaming, K-Pop (mostrar solo las que tengan artículos)
- Link "Ver más de {categoría}" → `/noticias/categoria/{slug}`
- Sección final: "Explora por categoría" — grid `repeat(auto-fill, minmax(180px, 1fr))`, gap 12px, cada item es un botón con label + ja, hover: borderColor accent, translateY(-2px)

### 3. Ruta `/noticias/categoria/[slug]` — Nueva página (NEWS-06, NEWS-07, NEWS-08)

**NEWS-06: Estructura de ruta**
- Nueva ruta: `apps/website/app/(site)/noticias/categoria/[slug]/page.tsx`
- Server Component: lee `params.slug`, fetch `article-categories` para validar, fetch artículos con `?articleCategory={slug}&pageSize=24`
- `export const dynamic = "force-dynamic"`
- Si categoría no encontrada → `notFound()`

**NEWS-07: Header de categoría**
- Back button: `← Volver a todas las noticias` → `/noticias`
- Layout header: `justify-content: space-between; align-items: flex-end`
- Eyebrow: `NOTICIAS · {ja}` (texto japonés de la categoría, o "ニュース" como fallback)
- `h1.display` con `font-size: 64px`: nombre de categoría + punto accent
- Párrafo: N artículos en negrita + descripción "cobertura editorial de {cat} en Konbini"
- Decoración derecha: `.jp` — número/texto 80px, opacity 0.3, color ink-3 (igual que CategoryView de eventos)

**NEWS-08: Filtros avanzados**
- Sticky filter bar `.fbar-sticky > .fbar-inner`:
  - **Grupo 1 (izquierda)**: Period toggles — "Hoy" | "Esta semana"
  - **Separador**: `.vline`
  - **Grupo 2**: 
    - Dropdown **Tipo**: Todos / Artículos / Entrevistas / Reseñas (ícono líneas)
    - Dropdown **Origen**: Todos / Editoriales / Patrocinados (ícono ✦)
    - Botón limpiar: `✕ Limpiar (N)` en color accent (solo si hay filtros activos)
  - **Grupo 3 (marginLeft auto)**:
    - Buscador inline: botón que abre dropdown con input autoFocus, limpiar X si hay query
    - Toggle Grid/Lista (igual al de CategoryView de eventos)
    - Dropdown **Ordenar**: Más recientes / Más leídas / A-Z (ícono sort)
- Filtros son client-side (no cambian URL) — la paginación sí fetch desde API
- Filtro "Tipo" (Artículos/Entrevistas/Reseñas) es client-side por ahora (no hay campo en API → filtrar por articleTags o ignorar)
- Filtro "Origen": Editoriales = `isSponsored: false`, Patrocinados = `isSponsored: true`
- Búsqueda: filtra `article.title.toLowerCase().includes(q.toLowerCase())`
- Grid/Lista: alterna entre `.card-grid` y `.list-grid` (mismo `.list-row` que eventos)
- Ordenar: Más recientes = default API order (desc createdAt), A-Z = sort por title client-side

### 4. ArticleCard actualizado (NEWS-09)

El componente `.art-card` actual añade:
- **Botón like** (`.a-like`): posición absolute sobre la imagen, esquina inferior derecha. Ícono corazón SVG (fill en state "on"), contador de likes. Click hace toggle + optimistic update
- **Tiempo de lectura** en `.a-meta`: calculado como `Math.ceil(wordCount / 200)` min. Formato: `{N} min lectura`
- **Badge eventos relacionados**: si el artículo tiene eventos vinculados: `{N} evento(s) relacionado(s)` con ícono de link SVG — en `.a-meta`
- El botón like llama a `POST /api/articles/{id}/like` o `DELETE /api/articles/{id}/like` (requiere auth, si no auth → mostrar contador pero no toggle)

### CSS nuevos (NEWS-10)

Agregar en `globals.css` o en el componente del Header (styled):

```css
.mega-bg {
  position: fixed; left: 0; right: 0; top: var(--mega-top, 72px);
  z-index: 70; background: color-mix(in oklab, var(--surface) 96%, transparent);
  backdrop-filter: blur(24px) saturate(160%);
  border-bottom: 1px solid var(--line); border-top: 1px solid var(--line);
  box-shadow: 0 24px 60px -20px rgba(0,0,0,.4);
  animation: megaIn .18s cubic-bezier(.2,.7,.3,1) both;
}
@keyframes megaIn {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.mega-inner { max-width: 1280px; margin: 0 auto; padding: 28px 32px; display: grid; grid-template-columns: 280px 1fr; gap: 36px; }
.mega-aside { border-right: 1px solid var(--line); padding-right: 28px; }
.mega-aside .label { font-family: var(--font-mono); font-size: 10px; letter-spacing: .18em; color: var(--ink-3); text-transform: uppercase; margin-bottom: 14px; }
.mega-aside h3 { font-family: var(--font-display); font-size: 32px; letter-spacing: -.02em; margin: 0 0 8px; line-height: 1.05; }
.mega-aside p { color: var(--ink-3); font-size: 13px; line-height: 1.55; margin: 0 0 22px; }
.mega-aside .mega-cta { display: inline-flex; align-items: center; gap: 6px; padding: 10px 16px; border-radius: 999px; background: var(--ink); color: var(--bg); font-size: 13px; font-weight: 600; cursor: pointer; }
.mega-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px 36px; align-items: start; }
.mega-col { display: flex; flex-direction: column; gap: 2px; }
.mega-col .gtl { font-family: var(--font-mono); font-size: 10px; letter-spacing: .18em; color: var(--accent); text-transform: uppercase; margin: 0 0 10px; padding: 4px 0; border-bottom: 1px dashed var(--line); }
.mega-col button { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 7px 8px; border-radius: 8px; color: var(--ink-2); font-size: 14px; font-weight: 500; text-align: left; transition: background .12s, color .12s; }
.mega-col button:hover { background: var(--surface-2); color: var(--ink); }
.mega-col button.on { color: var(--ink); background: var(--surface-2); }
.mega-col button .ja { font-family: var(--font-mono); font-size: 10px; color: var(--ink-3); letter-spacing: .04em; flex-shrink: 0; }
.mega-col button.on .ja { color: var(--accent); }

/* ArticleCard like button */
.a-like { position: absolute; bottom: 10px; right: 10px; display: inline-flex; align-items: center; gap: 5px; padding: 5px 10px; border-radius: 999px; background: rgba(0,0,0,.55); backdrop-filter: blur(8px); color: #fff; font-size: 12px; font-weight: 600; border: 1px solid rgba(255,255,255,.15); transition: background .15s, color .15s; }
.a-like:hover { background: rgba(0,0,0,.75); }
.a-like.on { background: var(--accent); border-color: var(--accent); }
.a-like.on svg { fill: #fff; }
```

### 5. Comportamiento del hub page — fetch

- El hub fetcha `pageSize=50` para tener suficientes artículos para los rails
- Hero = primer artículo con imagen (busca `a.image !== null` en el array)
- Picks de redacción = siguientes 3 artículos
- Artículo patrocinado = primer artículo con `isSponsored: true`
- Rails por categoría: filtrar artículos del array por `articleCategory?.slug === slug`, tomar 4 por categoría
- Si un rail tiene 0 artículos → no mostrar esa sección
- Si no hay artículo patrocinado → no mostrar esa sección
- Fetch categorías para los rails y para el mega menú (desde `fetchArticleCategories()`)

### 6. Tiempo de lectura — cálculo

```typescript
function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.ceil(words / 200));
  return `${mins} min`;
}
```

### Claude's Discretion

- Archivos exactos del Header a modificar: leer antes de tocar
- Orden exacto de rails (mostrar las N primeras categorías con artículos)
- Responsive del mega menú en mobile (ocultarlo o simplificarlo)
- Manejo del mega menú en SSR vs cliente (usar `"use client"` solo donde necesario)
- Lista view en categoría: usar el mismo `.list-row` ya implementado en CategoryView de eventos
- La ruta de categoría es NUEVA (no existe aún), el hub `/noticias` se modifica

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Diseño (fuente de verdad visual)
- `design/Konbini.html` — Mockup HTML completo. Secciones relevantes: `NewsMegaMenu` (líneas ~1883-1916), `NewsHubPage` (~2492-2588), `NewsCategoryPage` (~2591-2757), `ArticleCard` (~2113-2157), CSS `.mega-*` (~978-1003)

### Archivos a modificar (leer antes de tocar)
- `apps/website/components/Header.tsx` — Navbar actual, aquí va el mega menú
- `apps/website/app/(site)/noticias/page.tsx` — Hub page actual (grilla flat), se reescribe
- `apps/website/app/(site)/noticias/NoticiasListView.tsx` — Vista cliente actual con paginación
- `apps/website/app/(site)/noticias/[slug]/ArticleView.tsx` — Article card detail

### Patrones de referencia (replicar estos patterns)
- `apps/website/app/(site)/categoria/[cat]/CategoryView.tsx` — FilterBar, vline, Pop dropdown, list-row, pag-bar — REPLICAR en NewsCategoryView
- `apps/website/app/dashboard/sections/EventsSection.tsx` — pageWindows, ChevL/ChevR, pag-bar, pag-info — REPLICAR en paginación de categoría
- `apps/website/lib/api.ts` — `imageUrl()`, `apiHeaders()`, `ApiArticleCategory` type — USAR

### CSS
- `apps/website/app/globals.css` — Donde agregar `.mega-*` y `.a-like` nuevos

### API
- `GET /api/articles?pageSize=N&articleCategory=slug&page=N` — soporta filtro por categoría y paginación
- `GET /api/article-categories` — lista categorías con name, slug
- `POST /api/articles/{id}/like` y `DELETE /api/articles/{id}/like` — requieren Authorization header

</canonical_refs>

<specifics>
## Specific Ideas

### Mega menú — grupos de categorías con sus slugs
Los slugs deben coincidir con los de la tabla `article_categories` en DB (seeded en fase 18):

| Grupo | Label | Slug | Japonés |
|---|---|---|---|
| Anime & Manga | Anime | anime | アニメ |
| Anime & Manga | Manga | manga | 漫画 |
| Anime & Manga | Live Action | live-action | 実写 |
| Cine & TV | Cine | cine | 映画 |
| Cine & TV | Series | series | ドラマ |
| Cine & TV | Streaming | streaming | 配信 |
| Cine & TV | Netflix | netflix | Netflix |
| Gaming | Juegos | juegos | ゲーム |
| Música | Música | musica | 音楽 |
| Música | K-Pop | — | K-POP |
| Comunidad | Cosplay | — | コスプレ |
| Comunidad | Conciertos | conciertos | コンサート |
| Comunidad | Eventos | eventos | イベント |
| Cultura | Coleccionables | coleccionables | グッズ |
| Cultura | Cultura Otaku | cultura-otaku | 文化 |
| Cultura | Anuncios | anuncios | お知らせ |

Solo incluir en el mega menú las categorías que existen en la DB. Los slugs que no existen en article_categories se omiten.

### Artículo con tiempo de lectura
El campo `content` viene como Markdown desde la API. El cálculo se hace client-side en el componente (no hace falta un campo nuevo en la API).

### ArticleCard — like button
- Mostrar siempre el botón con el contador de `article._count.likes`
- Si el usuario no está autenticado → click no hace nada (o muestra toast "Inicia sesión para dar like")
- Si autenticado → `POST /api/articles/{id}/like` con `Authorization: Bearer {token}` header
- Optimistic update: toggle `liked` local + ajustar contador +1/-1

</specifics>

<deferred>
## Deferred Ideas

- El campo "Entrevistas" y "Reseñas" en el filtro Tipo no existe en la API → filtrar solo Editoriales/Patrocinados reales; el dropdown Tipo muestra opciones pero solo Todos tiene efecto real por ahora
- La lista de artículos "Más leídas" (ordenar por views) no existe en la API → ordenar por `_count.likes` como aproximación o simplemente no implementar ese sort (usar solo Más recientes y A-Z)
- El tiempo de lectura promedio no se almacena en DB → siempre calcular on-the-fly desde `content`
- Responsive mobile del mega menú (collapse a scroll horizontal o sheet)
</deferred>

---

*Phase: 19-rediseno-completo-de-noticias*
*Context gathered: 2026-05-28 via PRD Express Path (design/Konbini.html)*
