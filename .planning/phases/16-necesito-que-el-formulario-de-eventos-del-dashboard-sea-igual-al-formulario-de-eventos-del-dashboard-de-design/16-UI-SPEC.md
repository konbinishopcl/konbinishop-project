---
phase: 16
slug: formulario-de-eventos-del-dashboard-igual-al-de-design
status: draft
shadcn_initialized: false
preset: none
created: 2026-05-26
---

# Phase 16 — UI Design Contract

> Visual and interaction contract para el formulario de eventos del dashboard.
> Fuente de verdad: `design/app.jsx` (FormPage, Step1, Step2, Step3).
> Generado por gsd-ui-researcher. Verificado por gsd-ui-checker.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none — CSS custom properties en `globals.css` |
| Preset | not applicable |
| Component library | none — componentes propios con CSS tokens |
| Icon library | inline SVG (definidos en `components/icons.tsx`) |
| Fonts | Space Grotesk (display), Inter (body), Zen Kaku Gothic New (jp), JetBrains Mono (mono) |

Source: `apps/website/app/globals.css` `:root` block — leído directamente.

No se introduce shadcn ni ninguna librería de formulario en esta fase.

---

## Spacing Scale

El proyecto usa una escala de 4-point. No se introduce una nueva escala en esta fase.

| Token | Value | Usage en el formulario |
|-------|-------|------------------------|
| xs | 4px | Gap entre badge de número y texto del título de sección |
| sm | 8px | Gap entre label y help text; gap entre botones del footer |
| md | 16px | Espaciado por defecto de `.field`; gap de `.grid-2` |
| lg | 24px | Padding lateral de `.panel` |
| xl | 32px | `paddingBottom` del contenedor del form |
| 2xl | 48px | — |
| 3xl | 64px | — |

> SectionHead badge padding `4px 8px` uses existing standard set values (xs=4, sm=8) — not a new spacing token.
>
> **CSS legacy values (read-only, out of scope):** The following values exist in `globals.css` and MUST NOT be modified — they are not part of the spacing contract for this phase: 10px (gallery gap, price-row gap), 14px (grid-2/grid-3 gap, input-prefix padding), 18px (form-foot vertical padding, panel margin-bottom), 22px (container margin-bottom). Use only the 4-point scale above for any new spacing decisions.

---

## Typography

Cuatro roles en el formulario (reducidos desde todos los tamaños del sistema):

| Role | Family | Size | Weight | Line Height | Uso |
|------|--------|------|--------|-------------|-----|
| Page H1 | Space Grotesk (`--font-display`) | 24px | 700 | 1.2 | "Crear evento" / "Editar evento" — título de página |
| Section title | Space Grotesk (`--font-display`) | 16px | 700 | 1.2 | "01 Información básica" etc. |
| Body / label | Inter (`--font-body`) | 13px | 600 | 1.5 | Labels de campo, help text, texto de footer |
| Button | Inter (`--font-body`) | 14px | 600 | — | Todos los `.btn` |

Weights declared: **600** (body/label/button) + **700** (display/section titles). Maximum 2 weights.

> **SectionHead badge (inherited):** The `<span>` inside SectionHead uses `font-family: var(--font-mono); font-size: 10px; font-weight: 700` from globals.css — this is not a new typographic role and is not part of this phase's type contract.

Note: `globals.css` line 310 declares `.field label { font-weight: 500 }` — this existing rule is read-only and is NOT modified in this phase. New label elements added in this phase use weight 600 to match the 2-weight contract.

Source: `globals.css` — `.step-title`, `.field label`, `.btn`, `.field-set-title`; `EventForm.tsx` — `h1` del page title.

---

## Color

Tokens definidos en `globals.css` `:root` (dark) y `[data-theme="light"]`.

| Role | CSS Token | Dark Value | Light Value | Uso en este formulario |
|------|-----------|------------|-------------|------------------------|
| Dominant (60%) | `--bg` / `--bg-2` | `#0d0c0a` / `#161412` | `#f6f2ea` / `#efe9dd` | Fondo de página, fondo del `.form-foot` con blur |
| Secondary (30%) | `--surface` / `--surface-2` | `#1c1a17` / `#25221e` | `#ffffff` / `#faf6ee` | `.panel` background, inputs, `.upload-box` |
| Accent (10%) | `--accent` | `#ff5b49` | `#e8331f` | Ver lista de reserva abajo |
| Destructive | `--err` | `#ff5b5b` | (idem) | Asterisco de campo requerido; toast de error |

**Accent reservado EXCLUSIVAMENTE para:**
1. Botón `.btn.primary` — CTA dinámico ("Crear en revisión →", "Crear y publicar →", etc.)
2. Badge de número de sección en `SectionHead` — background tint `color-mix(in oklab, var(--accent) 14%, transparent)`, texto `var(--accent)`
3. Hover del `.upload-box` — `border-color: var(--accent)` al pasar el cursor
4. Asterisco `*` de campos requeridos — `color: var(--err)` (técnicamente `--err`, no `--accent`)

**Accent NO se usa para:**
- Botón "Guardar borrador" — usa `.btn.dark` (`--ink` background, `--bg` text)
- Botón "Cancelar" — usa `.btn.ghost` (`--surface` background, `--ink` text)
- Bordes de input en focus — usa `--ink-2`
- Texto de help / labels — usa `--ink-3` / color heredado

Source: `globals.css` `.btn.primary`, `.btn.dark`, `.btn.ghost`, `.upload-box:hover`, `.ck.on`.

---

## Copywriting Contract

### Footer — texto informativo (izquierda)

| Mode | Texto |
|------|-------|
| `mode === "create"` | `Creando como admin · sin checkout ni upsell.` |
| `mode === "edit"` | `Editando evento #${initial.id} · no se notifica al organizador.` |

Estilo: 13px, `color: var(--ink-3)`.

### CTA Principal — label dinámico (botón primary del footer)

El label cambia según `form.status` × `mode`. Esta tabla está BLOQUEADA:

| `form.status` | `mode === "create"` | `mode === "edit"` |
|---------------|--------------------|--------------------|
| `"APPROVED"` | `"Crear y publicar →"` | `"Guardar y publicar →"` |
| `"PENDING_MODERATION"` | `"Crear en revisión →"` | `"Guardar en revisión →"` |
| `"DRAFT"` | `"Crear borrador →"` | `"Guardar borrador →"` |

Estado busy: `"Guardando…"` (sin flecha).

### Botón secundario (siempre DRAFT)

Label: `"Guardar borrador"` — fijo, siempre llama `handleSubmit("DRAFT")`.

### Botón de cancelar

Label: `"Cancelar"` — Link `href="/dashboard/events"`, clase `.btn.ghost`.

### Toast de éxito (sonner)

| Condición | title | description |
|-----------|-------|-------------|
| Create OK | `"Evento creado"` | `"Publicado directamente"` / `"En revisión"` / `"Guardado como borrador"` |
| Edit OK | `"Evento actualizado"` | mismo set de descriptions |

### Toasts de error / validación

| Condición | Copy |
|-----------|------|
| Sin sesión | `"No autenticado"` |
| Sin título | `"El título es requerido"` |
| Descripción < 10 chars (si no es DRAFT) | `"La descripción debe tener al menos 10 caracteres"` |
| Sin dirección (si no es DRAFT) | `"La dirección es requerida"` |
| Error genérico del servidor | Mensaje del backend o `"Error al guardar"` |

### Estados de upload vacíos

| Slot | Copy dentro del `.upload-box` |
|------|-------------------------------|
| Banner | `"Sube una imagen horizontal"` + `"JPG / PNG · máx 5MB · sin texto sobreimpreso"` |
| Poster | `"Poster oficial"` + `"JPG / PNG · 1200×1800"` |
| Galería slot n | `"Imagen {n+1}"` (font 10px) |
| Video | placeholder `"https://youtube.com/watch?v=..."` en el input-prefix |

### Acciones destructivas en esta fase

No hay acciones destructivas de datos permanentes. Las tres acciones con × son:

| Acción | Confirmación | Motivo |
|--------|-------------|--------|
| Quitar tarifa de precios (×) | Ninguna — eliminación inmediata en memoria | Barato deshacer: click en "+ Agregar otra tarifa" |
| Quitar fecha (×) | Ninguna — eliminación inmediata en memoria | Idem |
| Quitar red social / video (×) | Ninguna — eliminación inmediata en memoria | Idem |
| Quitar imagen subida (banner/poster/galería) | Ninguna — solo limpia estado local; archivo no borrado del servidor hasta submit | El archivo en servidor no se borra hasta que el form se guarda con el campo vacío |

Patrón: × inline, sin modal de confirmación. Ejecutor: implementar como `onClick={() => removeItem(i)}` directo, sin `window.confirm()`.

### Labels de secciones (orden y numeración BLOQUEADOS)

| Número | Título | Subtítulo |
|--------|--------|-----------|
| 01 | Información básica | — |
| 02 | Precio | — |
| 03 | Fechas, horario y ubicación | — |
| 04 | Multimedia | Opcional |
| 05 | Redes sociales | Opcional |
| 06 | Administración | Solo visible si admin/super_admin |

Source: RESEARCH.md `Mapeo diseño → paneles del dashboard`; confirmado en `design/app.jsx` Step1/Step2/Step3.

---

## Layout y Contratos de Interacción

> Sección de extensión — contratos que el checker valida pero que no tienen slot en la plantilla base.

### Estructura del formulario

- `maxWidth: 900px`, centrado, `paddingBottom: 100px` (espacio para el footer fijo).
- 5 paneles siempre visibles (NO acordeón, NO wizard). Panel 06 admin condicional.
- Cada panel usa la clase `.panel` (`background: var(--surface); border: 1px solid var(--line); border-radius: var(--r-lg); padding: 22px`).
- SectionHead muestra badge `<n>` + título — implementar como componente reutilizable.

### Footer sticky — contrato de layout CRÍTICO

```
.form-foot
  └── .container    ← display:flex; justify-content:space-between; align-items:center
        ├── <span> infoText    ← izquierda: solo texto, fontSize:13, color:var(--ink-3)
        └── <div> gap:8px      ← derecha: 3 botones en orden fijo
              ├── <Link>    "Cancelar"        → .btn.ghost
              ├── <button>  "Guardar borrador" → .btn.dark  (siempre DRAFT)
              └── <button>  {ctaLabel}         → .btn.primary (status dinámico)
```

> The footer button group uses `gap: 8px` (sm token). If `globals.css` hard-codes a different gap for `.form-foot` buttons, that rule is inherited read-only and must not be overridden in this phase.

**Contrato negativo (Pitfall #1):** NO colocar ningún `<select>` dentro de `.form-foot`.
El status-select está en Panel 06 (Admin), NO en el footer.

El footer usa la clase CSS `.form-foot` existente — no recrear con `position: fixed` inline.
`.form-foot > .container` ya tiene `display: flex; justify-content: space-between`.

### Status select — Panel 06 (Admin)

- Visible solo cuando `user.role === "ADMIN" || user.role === "SUPER_ADMIN"` (via `useUser()`).
- Si el usuario NO es admin: `status` se inicializa en `"PENDING_MODERATION"` y no muestra el select.
- Si el usuario ES admin: muestra select con opciones:
  - `"APPROVED"` → label "Publicado (directo)"
  - `"PENDING_MODERATION"` → label "En revisión"
  - `"DRAFT"` → label "Borrador"

### Arrays dinámicos — contratos de interacción

| Array | Add button copy | Min rows | Clase CSS |
|-------|----------------|----------|-----------|
| `prices` | `"+ Agregar otra tarifa"` | 1 (oculto si `isFree`) | `.price-row` + `.add-line` |
| `dates` | `"+ Agregar otro día"` | 1 | `.grid-3` row + `.add-line` |
| `socials` | `"+ Agregar otra red social"` | 1 | `row` inline + `.add-line` |
| `videos` | `"+ Agregar otro video"` | 1 | `row` inline + `.add-line` |

Botón × de eliminación: solo visible cuando `array.length > 1`. Clase `.icon-btn`. Accessibility: añadir `aria-label="Eliminar"` en todos los botones × icon-only para que los lectores de pantalla anuncien la acción.

### Precio — layout de tarifa

Usa `.price-row` (`grid-template-columns: 1fr 200px 40px`):
- Col 1 (1fr): campo `.field` "Nombre de tarifa" (placeholder: "Ej: Entrada General, VIP, Estudiante")
- Col 2 (200px): campo `.field` + `.input-prefix` con prefijo `"$"` y sufijo `"CLP"`
- Col 3 (40px): `.icon-btn` con icono close (visible solo si `prices.length > 1`) + `aria-label="Eliminar"`

### Imágenes — upload-box

| Slot | Clase CSS | Aspect ratio | Preview behavior |
|------|-----------|--------------|-----------------|
| Banner | `.upload-box` | `16/9` (CSS) | Si URL: img `objectFit:cover` + botón × overlay |
| Poster | `.upload-box.tall` | `3/4` (CSS, runtime truth) | Igual que banner |
| Galería (8 slots) | `.upload-box` + `aspectRatio:"1/1"` | `1/1` | Igual — grid 4 columnas |

Nota: El CSS `globals.css` línea 344 declara `.upload-box.tall { aspect-ratio: 3/4 }`. El diseño `app.jsx` comenta "2:3" en label pero el CSS resuelve `3/4`. Se usa `3/4` como fuente de verdad runtime.

Layout galería: `display: grid; gridTemplateColumns: "repeat(4, 1fr)"; gap: 10px`.
Texto de ayuda debajo de la galería: `"Hasta 8 imágenes. Aparecerán en la sección "Galería" del evento."`

### Upload — secuencia de estados

```
Estado 1: Vacío        → mostrar .upload-box con icono + label + small
Estado 2: Archivo pick → URL.createObjectURL(file) → preview inmediato (NO subir aún)
Estado 3: Submit       → api.uploadImage(file, token) → {url} → actualizar state (file:null, url)
Estado 4: URL existente → renderizar img src con imageUrl(url) + botón × overlay
```

`imageUrl()` de `lib/api.ts` convierte `/uploads/x.jpg` → `/api/media/uploads/x.jpg`.
Después de subir exitosamente: `bannerFile = null` (prevenir re-upload en Pitfall #4).

### Video — layout

Usa `row` con `.input-prefix` (flex:1) con prefijo `"▶"` y `.icon-btn` de close condicional.

### Red social — layout

Igual que video pero prefijo `"@"`.

### Cascade geográfico — comportamiento preservado

El patrón `useEffect` en `countrySlug` / `stateSlug` para cargar states/cities vía
`/api/states?country={slug}` y `/api/cities?state={slug}` se mantiene intacto.
Al cambiar país: resetear `stateSlug: ""` y `cityId: ""`.
Al cambiar estado: resetear `cityId: ""`.

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| N/A | Ninguno — proyecto usa CSS propio | not applicable |

No se usa shadcn ni ningún registro de componentes externos en esta fase.

---

## Checker Sign-Off

- [ ] Dimension 1 Copywriting: PASS
- [ ] Dimension 2 Visuals: PASS
- [ ] Dimension 3 Color: PASS
- [ ] Dimension 4 Typography: PASS
- [ ] Dimension 5 Spacing: PASS
- [ ] Dimension 6 Registry Safety: PASS

**Approval:** pending
