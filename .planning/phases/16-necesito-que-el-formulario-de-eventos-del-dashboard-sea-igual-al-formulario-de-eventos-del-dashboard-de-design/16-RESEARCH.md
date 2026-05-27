# Phase 16: Formulario de eventos del dashboard igual al de /design — Research

**Researched:** 2026-05-26
**Domain:** React/Next.js form refactor — UI parity con design prototype
**Confidence:** HIGH

## Summary

El formulario de dashboard (`EventForm.tsx`) necesita tres categorías de cambios para igualar al prototipo `design/app.jsx`:

1. **Footer corregido** — eliminar el status-select del footer y dejarlo solo en el cuerpo del formulario; el footer solo debe tener texto descriptivo a la izquierda y los tres botones (Cancelar / Guardar borrador / CTA dinámico) a la derecha.
2. **Arrays dinámicos** — precios, fechas, redes sociales y videos actualmente son campos escalares; el diseño los define como arrays con botón "Agregar". El backend DTO ya acepta arrays — solo es un cambio de frontend.
3. **Imágenes como file picker** — banner y poster usan inputs de URL; deben ser cajas de subida (`.upload-box`) con file picker, preview y remoción, usando `api.uploadImage()`. Galería es nueva (8 slots).

**Decisión estructural bloqueada:** Los 5 paneles siempre visibles (sin acordeón, sin wizard) son correctos. NO replicar el wizard de 3 pasos del diseño.

**Recomendación primaria:** Un solo plan que reescribe `EventForm.tsx` completamente, manteniendo la misma estructura de exports y props.

---

## User Constraints (desde el prompt que inicia esta fase)

> NOTA: No existe un CONTEXT.md para esta fase. Las restricciones provienen del prompt de la tarea y de conversaciones anteriores.

### Decisiones bloqueadas

- **5 secciones siempre visibles, sin acordeón.** El formulario del dashboard NO debe ser un wizard paso a paso. La forma de 5 paneles expandidos permanentemente es correcta.
- **Footer sin status-select.** El status-select ("Estado:") NO va en el footer. Va en el cuerpo del formulario (sección de admin). El footer solo tiene: texto info (izquierda) + Cancelar + Guardar borrador + CTA dinámico (derecha).
- **Labels del CTA principal son específicos.** Ver tabla en sección de patrones.
- **NO introducir librerías de formulario** (react-hook-form, formik, etc.).
- **NO cambiar el patrón de cascade catalogo** — Country→State→City via `/api/states?country=<slug>` y `/api/cities?state=<slug>` está correcto y funciona.
- **NO tocar api.ts** — está preservado (decisión Phase 15-05).
- **AdminEventEditor.tsx** — este archivo existe y tiene acordeón; la tarea es reemplazar el contenido de **EventForm.tsx**, que ya usa paneles. Dejar AdminEventEditor intacto.

### Área de discreción de Claude

- Organización interna de los paneles (orden de campos, labels exactos).
- Cuántos slots de galería (diseño menciona 8 slots y "hasta 10"; el DTO backend acepta array ilimitado).
- Si incluir el campo "Lugar / Venue" (ver Open Questions).
- Si eliminar el campo de tags/AI-suggest (no está en el diseño; estaba solo en AdminEventEditor).

### Ideas diferidas (FUERA DE SCOPE)

- Migraciones de schema para nuevos campos.
- Cambios al backend (DTO, endpoints).
- Animaciones o transiciones entre estados.
- Versión mobile responsive del formulario.

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| (ninguno formal) | Esta fase es polish/UX agregada post-v2; no tiene REQ-IDs en REQUIREMENTS.md. El scope completo está definido por el prompt de tarea y las restricciones de conversación documentadas arriba. | Todos los cambios son puramente de frontend; el backend (DTO, endpoints) ya soporta los datos necesarios. |
</phase_requirements>

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React (via Next.js) | 14.x (ya instalado) | UI / estado de formulario | Stack del proyecto |
| `api.uploadImage` | (interno) | Subida de archivo multipart | Ya implementado en `apps/website/lib/api.ts` |
| `sonner` (toast) | ya instalado | Notificaciones de exito/error | Usado en todos los formularios |

### No agregar
- No se necesitan nuevas dependencias para esta fase.
- El upload ya tiene `api.uploadImage(file: File, token: string): Promise<{url: string, filename: string}>` en `lib/api.ts` (línea 234–253).

---

## Architecture Patterns

### Estructura actual que se MANTIENE

```
apps/website/app/dashboard/events/
├── EventForm.tsx        ← archivo a reescribir completamente
├── new/page.tsx         ← sin cambios (import EventForm)
└── [id]/edit/page.tsx   ← sin cambios (import EventForm, InitialEvent)
```

`new/page.tsx` y `[id]/edit/page.tsx` no cambian. `EventForm` y su tipo exportado `InitialEvent` deben mantener la misma interfaz de props para no romper los pages.

### Mapeo diseño → paneles del dashboard

El diseño tiene 3 Steps; el dashboard tiene 5 paneles siempre visibles:

| Design (app.jsx) | Dashboard Panel | Campos incluidos |
|------------------|-----------------|-----------------|
| Step1 § 1.1 | **Panel 01 — Información básica** | título, empresa, categoría, descripción, sobre el evento |
| Step1 § 1.2 | **Panel 02 — Precio** | checkbox gratuito, array dinámico de tarifas (price-row) |
| Step2 § 2.1 + 2.2 | **Panel 03 — Fechas, horario y ubicación** | array dinámico de fechas, venue/lugar, selects Country/State/City, dirección, ticketUrl |
| Step3 § 3.1 + 3.2 + 3.3 | **Panel 04 — Multimedia** | upload-box banner (16:9), upload-box.tall poster (2:3), galería 8 slots, array dinámico de videos |
| Step2 § 2.3 (sociales) | **Panel 05 — Redes sociales** | array dinámico de sociales con @-prefix input |
| *(admin-only)* | **Panel 06 — Admin** (solo si admin) | status select (APPROVED / PENDING_MODERATION / DRAFT) |

> Panel 06 de admin es nuevo: el status-select sale del footer y va aquí, visible solo para admins. Si el user no es admin, el evento siempre se crea como PENDING_MODERATION.

### Pattern 1: Footer correcto

**Estructura exacta del sticky footer:**

```tsx
// CORRECTO — footer sin status select
<div className="form-foot">
  <div className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    {/* IZQUIERDA: solo texto informativo */}
    <span style={{ fontSize: 13, color: "var(--ink-3)" }}>
      {mode === "create"
        ? "Creando como admin · sin checkout ni upsell."
        : `Editando evento #${initial?.id} · no se notifica al organizador.`}
    </span>

    {/* DERECHA: 3 botones en este orden */}
    <div style={{ display: "flex", gap: 10 }}>
      <Link href="/dashboard/events" className="btn ghost">Cancelar</Link>
      <button className="btn dark" disabled={busy} onClick={() => handleSubmit("DRAFT")}>
        Guardar borrador
      </button>
      <button className="btn primary" disabled={busy} onClick={() => handleSubmit(form.status)}>
        {busy ? "Guardando…" : CTA_LABEL}
      </button>
    </div>
  </div>
</div>
```

### Pattern 2: Labels del CTA principal (tabla bloqueada)

| `form.status` | `mode === "create"` | `mode === "edit"` |
|---------------|--------------------|--------------------|
| `"APPROVED"` | `"Crear y publicar →"` | `"Guardar y publicar →"` |
| `"PENDING_MODERATION"` | `"Crear en revisión →"` | `"Guardar en revisión →"` |
| `"DRAFT"` | `"Crear borrador →"` | `"Guardar borrador →"` |

**CRITICO:** "Crear en revisión →" es la etiqueta correcta para PENDING_MODERATION en modo create. El error anterior fue usar "Guardar borrador →" para este caso.

### Pattern 3: Arrays dinámicos — state shape

`FormData` debe cambiar de scalars a arrays:

```typescript
type FormData = {
  // ── Campos que cambian a array ──
  prices: Array<{ name: string; amount: string }>;   // antes: priceName + priceAmount
  dates:  Array<{ date: string; startTime: string; endTime: string }>;  // antes: dateStr + startTime + endTime
  socials: Array<{ link: string }>;                  // antes: instagram + tiktok + facebook + twitter
  videos:  Array<{ link: string }>;                  // antes: videoUrl

  // ── Campos que cambian a File/URL ──
  bannerFile: File | null;
  bannerUrl:  string;       // resultado del upload o URL existente al editar
  posterFile: File | null;
  posterUrl:  string;
  gallery:    Array<{ file: File | null; url: string }>;  // 8 slots

  // ── Campos que se mantienen igual ──
  title:         string;
  company:       string;
  description:   string;
  about:         string;
  isFree:        boolean;
  venue:         string;    // nuevo campo — ver Open Questions
  address:       string;
  addressNumber: string;
  ticketUrl:     string;
  categoryId:    string;
  countrySlug:   string;
  stateSlug:     string;
  cityId:        string;
  status:        "APPROVED" | "PENDING_MODERATION" | "DRAFT";
};
```

### Pattern 4: File upload con upload-box

```tsx
// Banner upload con preview
function ImageUploadBox({
  aspect,  // "16/9" | "2/3"
  url,
  onFile,
  onRemove,
  label,
}: ImageUploadBoxProps) {
  const ref = useRef<HTMLInputElement>(null);
  if (url) {
    return (
      <div style={{ position: "relative", aspectRatio: aspect }}>
        <img src={url.startsWith("/uploads/") ? `/api/media${url}` : url}
             style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--r)" }} />
        <button onClick={onRemove} style={{ position: "absolute", top: 8, right: 8 }}>×</button>
      </div>
    );
  }
  return (
    <>
      <div className={`upload-box${aspect === "2/3" ? " tall" : ""}`}
           onClick={() => ref.current?.click()}>
        {/* upload icon + label */}
      </div>
      <input ref={ref} type="file" accept="image/*" style={{ display: "none" }}
             onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} />
    </>
  );
}
```

La subida real ocurre en `handleSubmit`, antes de enviar el payload:
```typescript
// En handleSubmit — subir imágenes pendientes antes de construir payload
if (form.bannerFile) {
  const { url } = await api.uploadImage(form.bannerFile, token);
  bannerUrl = url;
}
```

### Pattern 5: price-row del diseño (ya existe en CSS)

```tsx
// Usar la clase .price-row que ya existe en globals.css
{form.prices.map((p, i) => (
  <div className="price-row" key={i}>
    <div className="field" style={{ margin: 0 }}>
      <label>Nombre de tarifa</label>
      <input type="text" placeholder="General, VIP, Estudiante"
        value={p.name}
        onChange={e => updatePrice(i, "name", e.target.value)} />
    </div>
    <div className="field" style={{ margin: 0 }}>
      <label>Precio</label>
      <div className="input-prefix">
        <span>$</span>
        <input type="number" placeholder="0" value={p.amount}
          onChange={e => updatePrice(i, "amount", e.target.value)} />
        <span className="suffix">CLP</span>
      </div>
    </div>
    <div style={{ display: "flex", alignItems: "end" }}>
      {form.prices.length > 1 && (
        <button className="icon-btn" onClick={() => removePrice(i)}>×</button>
      )}
    </div>
  </div>
))}
<button className="add-line" onClick={addPrice}>+ Agregar otra tarifa</button>
```

### Pattern 6: InitialEvent — inicialización de arrays

Al editar un evento existente, los arrays deben inicializarse correctamente:

```typescript
prices: initial?.prices.length
  ? initial.prices.map(p => ({ name: p.name, amount: String(p.price) }))
  : [{ name: "General", amount: "" }],

dates: initial?.dates.length
  ? initial.dates.map(d => ({
      date:      d.date ? d.date.slice(0, 10) : "",
      startTime: d.startTime ?? "",
      endTime:   d.endTime   ?? "",
    }))
  : [{ date: "", startTime: "", endTime: "" }],

socials: initial?.socialLinks.length
  ? initial.socialLinks.map(l => ({ link: l.link ?? "" }))
  : [{ link: "" }],

videos: initial?.videos.length
  ? initial.videos.map(v => ({ link: v.link ?? "" }))
  : [{ link: "" }],

gallery: initial?.gallery?.length
  ? initial.gallery.map(url => ({ file: null, url }))
  : Array(8).fill(null).map(() => ({ file: null, url: "" })),
```

### Pattern 7: payload construction con los nuevos arrays

```typescript
const payload = {
  // ...otros campos...
  prices: form.isFree
    ? [{ name: "Entrada", price: 0 }]
    : form.prices
        .filter(p => p.amount)
        .map(p => ({ name: p.name || "General", price: Number(p.amount) })),

  dates: form.dates
    .filter(d => d.date)
    .map(d => ({ date: d.date, startTime: d.startTime || undefined, endTime: d.endTime || undefined })),

  socialLinks: form.socials
    .filter(s => s.link.trim())
    .map(s => ({ link: s.link.trim() })),

  videos: form.videos
    .filter(v => v.link.trim())
    .map(v => ({ link: v.link.trim() })),

  gallery: form.gallery
    .filter(g => g.url)
    .map(g => g.url),

  banner: bannerUrl || undefined,
  poster: posterUrl || undefined,
};
```

### Anti-Patterns a Evitar

- **NO poner el status-select en el footer.** Fue el error que causó el problema anterior. El status-select va en un panel del cuerpo, solo visible para admins.
- **NO recrear el wizard de 3 pasos del diseño.** El usuario aprobó los 5 paneles siempre visibles.
- **NO usar el acordeón** (`.form-acc-item`, `.AccItem`). Ese patrón está en AdminEventEditor.tsx y se quedó atrás.
- **NO hardcodear labels de red social** (Instagram, TikTok, etc.) como campos fijos. Usar array dinámico con un solo input por entrada, como hace el diseño.
- **NO llamar a api.uploadImage durante onChange** del file input. Hacerlo en el submit.

---

## Don't Hand-Roll

| Problema | No construir | Usar en cambio | Por qué |
|----------|--------------|----------------|---------|
| Subida de imágenes | Upload component custom con fetch | `api.uploadImage(file, token)` en `lib/api.ts` | Ya maneja auth, errores, URL de respuesta |
| Preview de imágenes | Canvas / FileReader base64 | `URL.createObjectURL(file)` para preview temporal | Sin overhead, liberado on unmount |
| Cascade de catálogo | Fetch manual en handlers | `useEffect` en `countrySlug` / `stateSlug` como el código actual | Ya funciona; no tocar |
| Validación de form | Librería externa | `useState` + validación in-submit como el código actual | Patrón establecido en el proyecto |
| CSS de upload | Estilos custom inline | `.upload-box`, `.upload-box.tall`, `.upload-grid`, `.price-row`, `.add-line`, `.input-prefix` | Todas existen en globals.css |

---

## Common Pitfalls

### Pitfall 1: Status-select en el footer
**Qué sale mal:** El usuario ve "Estado: Borrador" en el footer y la CTA dice "Guardar borrador →" cuando debería decir "Crear en revisión →".
**Por qué ocurre:** El status-select fue puesto en el footer en lugar del cuerpo; el label del CTA leyó el valor del form pero el select que lo modificaba estaba en el footer, causando confusión de flujo.
**Cómo evitar:** Status-select SOLO en el panel de Admin en el cuerpo. Footer solo muestra texto informativo + 3 botones. El CTA primario siempre llama `handleSubmit(form.status)`.
**Señales de alerta:** Si en code review se ve `<select>` dentro del div de `.form-foot`, es un bug.

### Pitfall 2: Label del CTA erróneo para PENDING_MODERATION
**Qué sale mal:** El botón dice "Guardar borrador →" cuando el status es PENDING_MODERATION.
**Por qué ocurre:** Confundir el botón "Guardar borrador" (que siempre guarda como DRAFT) con el CTA principal cuyo label cambia según el status seleccionado.
**Cómo evitar:** Usar exactamente la tabla de labels de Pattern 2 de este documento. Los dos botones son independientes: "Guardar borrador" siempre llama `handleSubmit("DRAFT")`; el CTA principal llama `handleSubmit(form.status)` con label dinámico.

### Pitfall 3: InitialEvent type — gallery missing
**Qué sale mal:** TypeScript error en el page de edit porque `InitialEvent` no tiene campo `gallery`.
**Por qué ocurre:** El tipo `InitialEvent` exportado por EventForm.tsx no incluía `gallery: string[]` porque el form original usaba URLs como strings.
**Cómo evitar:** Actualizar `InitialEvent` para incluir `gallery?: string[]`. El endpoint `/api/events/:id/admin` devuelve `gallery` en el shape del evento.

### Pitfall 4: Subir imágenes dos veces
**Qué sale mal:** Si el usuario hace click en "Guardar borrador" y luego en "Continuar", la imagen se sube dos veces.
**Por qué ocurre:** La subida ocurre en cada llamada a `handleSubmit`.
**Cómo evitar:** Una vez que `bannerFile` se sube y `bannerUrl` se actualiza en el estado, limpiar `bannerFile` a `null`. Si `bannerUrl` ya existe y `bannerFile` es `null`, no subir de nuevo.

### Pitfall 5: Preview de imagen con URL relativa del API
**Qué sale mal:** El preview muestra una imagen rota después de editar un evento que ya tenía banner.
**Por qué ocurre:** Las URLs del backend son paths relativos como `/uploads/banner.jpg`, no URLs absolutas.
**Cómo evitar:** Usar `imageUrl()` de `lib/api.ts` que convierte `/uploads/x.jpg` a `/api/media/uploads/x.jpg`.

### Pitfall 6: gallery array vacío en modo create
**Qué sale mal:** Enviar `gallery: []` al backend cuando no se subió ninguna imagen.
**Por qué ocurre:** El array de 8 slots se inicializa con objetos `{file: null, url: ""}`.
**Cómo evitar:** Filtrar antes de construir el payload: `gallery: form.gallery.filter(g => g.url).map(g => g.url)`. Si el resultado es `[]`, enviar `undefined`.

---

## Code Examples

### CSS disponible en globals.css

```css
/* Clases de upload — verificadas en globals.css líneas 341-346 */
.upload-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 14px; }
.upload-box  { border: 1.5px dashed var(--line-2); aspect-ratio: 16/9; ... }
.upload-box.tall { aspect-ratio: 3/4; }

/* Clases de precio — verificadas línea 337-338 */
.price-row { display: grid; grid-template-columns: 1fr 200px 40px; gap: 10px; }
.add-line  { width: 100%; border: 1px dashed var(--line-2); ... }

/* Input con prefijo — verificada línea 324-327 */
.input-prefix { display: flex; align-items: stretch; ... }
.input-prefix span { padding: 0 14px; border-right: 1px solid var(--line); }

/* Footer del formulario — verificada líneas 348-354 */
.form-foot { position: fixed; bottom: 0; left: 0; right: 0; ... }
.form-foot > .container { display: flex; justify-content: space-between; align-items: center; }
```

### form-foot usar con .container (no inline styles)

El CSS de `.form-foot > .container` ya define `display: flex; justify-content: space-between`. El footer debe renderizarse así:

```tsx
<div className="form-foot">
  <div className="container">
    <span style={{ fontSize: 13, color: "var(--ink-3)" }}>{infoText}</span>
    <div style={{ display: "flex", gap: 10 }}>
      <Link href="/dashboard/events" className="btn ghost">Cancelar</Link>
      <button className="btn dark" ...>Guardar borrador</button>
      <button className="btn primary" ...>{ctaLabel}</button>
    </div>
  </div>
</div>
```

NO usar position:fixed con padding inline — usar `.form-foot` que ya lo maneja.

---

## State of the Art

| Versión anterior | Versión objetivo | Impacto |
|-----------------|-----------------|---------|
| Status-select en el footer (EventForm.tsx) | Status-select en panel "Admin" del cuerpo | Footer limpio, flujo intuitivo |
| Scalars: `priceName, priceAmount, dateStr, startTime, endTime, instagram, tiktok, facebook, twitter, videoUrl` | Arrays dinámicos | Parity con diseño; soporte de múltiples fechas/precios |
| Banner/poster como URL text input | `upload-box` con file picker + preview | UX de upload como el diseño |
| Sin galería | 8 slots de upload en grid 4×2 | Completa sección 3.2 del diseño |
| Footer con `position: fixed` y inline styles | Usar clase `.form-foot` + `.container` | Consistencia con el design system |

---

## Open Questions

1. **Campo "Lugar / Venue"**
   - **Qué sabemos:** El diseño (Step2) tiene un campo "Lugar / Venue" separado de la dirección. Ejemplo: "Teatro Cariola" vs "San Diego 246, Santiago".
   - **Qué no está claro:** El backend `Event` model NO tiene columna `venue`, solo `address` y `addressNumber`. Añadir `venue` requeriría una migración de schema.
   - **Opciones:** (a) Omitir el campo venue por ahora, dejando solo `address`; (b) Agregar `venue` al schema con migración (expande scope a backend); (c) Usar `addressNumber` para el nombre del venue como workaround semántico (no recomendado).
   - **Recomendación:** Omitir por ahora (opción a) para no expandir scope. Mencionar al usuario.

2. **Cuántos slots de galería**
   - **Qué sabemos:** El diseño muestra 8 slots; el texto del diseño dice "hasta 10 imágenes". El DTO del backend acepta array sin límite definido.
   - **Recomendación:** 8 slots en UI (como el diseño visual) con texto de ayuda "Hasta 8 imágenes".

3. **Tags y AI-suggest (de AdminEventEditor)**
   - **Qué sabemos:** `AdminEventEditor.tsx` tiene un campo de tags con sugerencia por IA (mock). Este campo NO existe en el diseño de `app.jsx` ni en el schema del backend (`Event` no tiene `tags` column en CreateEventDto).
   - **Recomendación:** No incluir en el nuevo `EventForm.tsx`. Si el usuario lo quiere, es scope separado.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | (no se detectó config de tests en apps/website) |
| Config file | ninguno encontrado |
| Quick run | manual visual en dev |
| Full suite | manual |

### Phase Requirements → Test Map
| Req | Comportamiento | Tipo | Automatizable |
|-----|---------------|------|---------------|
| Footer-left | Solo contiene nodo de texto (no `<select>`) | DOM snapshot | Sí — React Testing Library |
| Footer-right | 3 botones en orden: Cancelar, Guardar borrador, CTA | DOM snapshot | Sí |
| CTA label create+PENDING | Texto === "Crear en revisión →" | Unit | Sí |
| CTA label edit+APPROVED | Texto === "Guardar y publicar →" | Unit | Sí |
| Upload banner | Después de seleccionar archivo, se muestra preview | Manual/e2e | Manual |
| Dynamic prices | Click en "Agregar otra tarifa" añade fila | Manual | Manual |

### Wave 0 Gaps
- No existe infraestructura de tests en `apps/website`. Si el planner quiere tests automatizados del footer, necesitará:
  - [ ] `apps/website/__tests__/EventForm.footer.test.tsx` — cubre footer DOM
  - [ ] Configurar jest / vitest + `@testing-library/react`

*(Si no se quieren tests automatizados, verificar manualmente con checklist antes de commit.)*

---

## Sources

### Primary (HIGH confidence)
- `design/app.jsx` — fuente de verdad del diseño (FormPage, Step1, Step2, Step3) — leído directamente
- `apps/website/app/dashboard/events/EventForm.tsx` — estado actual del formulario — leído directamente
- `apps/website/app/dashboard/modals/AdminEventEditor.tsx` — versión acordeón (referencia para labels del CTA, Pattern 2) — leído directamente
- `apps/website/app/globals.css` — CSS classes verificadas (upload-box, price-row, add-line, form-foot, input-prefix) — leído directamente
- `apps/api/src/events/dto/create-event.dto.ts` — confirma que backend ya acepta arrays (prices, dates, socialLinks, videos, gallery) — leído directamente
- `apps/website/lib/api.ts` — confirma `api.uploadImage` existe y retorna `{url, filename}` — leído directamente

### Secondary (MEDIUM confidence)
- `apps/website/app/dashboard/events/new/page.tsx` — confirma que el page solo importa y re-exporta `EventForm`; no cambia
- `apps/website/app/dashboard/events/[id]/edit/page.tsx` — confirma carga evento via `/api/events/:id/admin` e inyecta `InitialEvent`

---

## Metadata

**Confidence breakdown:**
- Estado actual del form: HIGH — código leído directamente
- Diseño objetivo: HIGH — app.jsx leído directamente
- CSS classes disponibles: HIGH — globals.css leído directamente
- Backend API: HIGH — DTO y endpoint leídos directamente
- Pitfalls del footer: HIGH — derivado de errores concretos documentados en el prompt

**Research date:** 2026-05-26
**Valid until:** 2026-07-26 (estable — no depende de libs externas cambiantes)
