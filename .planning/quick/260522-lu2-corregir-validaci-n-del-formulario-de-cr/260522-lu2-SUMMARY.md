---
phase: quick-260522-lu2
plan: "01"
subsystem: website
tags: [validation, forms, UX, wizard]
dependency_graph:
  requires: []
  provides: [crear-validacion-reforzada]
  affects: [apps/website/app/crear/page.tsx]
tech_stack:
  added: []
  patterns: [html-native-validation, js-inline-validation, try-catch-url]
key_files:
  created: []
  modified:
    - apps/website/app/crear/page.tsx
decisions:
  - "Validación de socials: se quita @ inicial si está presente, luego si el valor ya tiene http/https se valida tal cual; si no, se antepone https:// — documentado como regla explícita"
  - "Campo de capacidad/aforo fuera de scope: no existe en FormData ni en los pasos del wizard; no se inventó el campo"
  - "Los inputs de precio con free=true quedan fuera del DOM (condicional !data.free), lo que es equivalente a disabled — más robusto. Además se resetean a amount:'0' al activar el toggle gratuito"
  - "Lint (next lint / eslint) no está configurado en el proyecto — sin .eslintrc ni eslint.config.js. La verificación se hizo únicamente con tsc --noEmit que pasa limpio"
metrics:
  duration: "~20 min"
  completed_date: "2026-05-22"
  tasks_completed: 2
  files_modified: 1
---

# Quick Task 260522-lu2: Corregir Validación del Formulario de Creación — Summary

**One-liner:** Validación JS + atributos HTML nativos en el wizard `/crear`: título ≥ 3 chars, precios enteros ≥ $500 CLP, fechas no pasadas, URLs validadas con `new URL()`, teclado numérico en mobile.

---

## Objetivo

Reforzar el wizard de 3 pasos de creación de eventos en `/crear` para bloquear el avance de paso y el submit ante datos inválidos, sin añadir Zod ni React Hook Form.

---

## Tasks Completadas

| Task | Nombre | Commit | Archivos |
|------|--------|--------|---------|
| 1 | Atributos de input correctos + helpers de validación | 33e068b | apps/website/app/crear/page.tsx |
| 2 | Ampliar validateStep() con reglas de negocio | 33e068b | apps/website/app/crear/page.tsx |

> Ambas tasks modifican el mismo archivo y se comprometieron en un solo commit atómico.

---

## Cambios Implementados

### Helpers de validación (al inicio del módulo)

- `isValidUrl(value: string): boolean` — usa `new URL()` en try/catch; acepta solo `http:`/`https:`.
- `todayISO(): string` — fecha local en `YYYY-MM-DD`.
- `MIN_PRICE = 500` (CLP mínimo en eventos de pago).
- `MIN_TITLE_LEN = 3` (caracteres mínimos del título).

### Atributos de inputs

| Campo | Cambios |
|-------|---------|
| Título (Step1) | `minLength={3}`, `maxLength={120}` |
| Precio (Step1) | `min={500}`, `step="1"`, `inputMode="numeric"`, onChange rechaza no-enteros (`/^\d+$/`) |
| Web/ticketera (Step2) | `inputMode="url"` |
| Redes sociales (Step2) | `inputMode="url"` |
| Videos (Step3) | `type="url"`, `inputMode="url"` |
| Fechas (Step2) | `min={todayISO()}` (bloquea fechas pasadas en el selector nativo) |
| Dirección (Step2) | `maxLength={120}` |
| Número (Step2) | `maxLength={12}` |

### validateStep() ampliado

**Paso 1:**
- Título: exige ≥ 3 caracteres (además de no vacío).
- Precios (cuando `!data.free`): clave `price_amount_${i}` — valida que sea entero y ≥ $500 CLP.

**Paso 2:**
- Fechas: exige al menos una fecha (`dates`), rechaza fechas pasadas (`date_${i}`), valida hora término > inicio (`date_${i}`).
- Ticketera: si no vacío, valida `isValidUrl(\`https://\${data.web.trim()}\`)` → clave `web`.
- Socials: quita `@` inicial si lo tiene, antepone `https://` si no tiene esquema → `isValidUrl()` → clave `social_${i}`.

**Paso 3 (nuevo caso):**
- Videos: si no vacío, valida `isValidUrl(v.trim())` → clave `video_${i}`.

### Otras mejoras

- **Toggle gratuito:** al activar `free=true` se resetean todos los montos a `"0"` para no arrastrar valores.
- **Step3 recibe `errors: FieldErrors`** y muestra `<FieldError>` bajo cada input de video.
- **FieldError para nuevas claves** en Step2: `web`, `social_${i}`, `date_${i}`, `dates`.
- **FieldError `price_amount_${i}`** bajo el input de precio en Step1.
- **Scroll a top** cuando `validateStep` bloquea el avance de paso o el submit.
- **submit() valida paso 3** (`validateStep(3)`) en vez de paso 2 (que ya fue validado al avanzar).
- **update() limpia errores derivados** (price_, date_, social_, video_) al modificar esos campos.

---

## Decisiones Tomadas

1. **Socials → regla de normalización:** Quitar `@` inicial → si tiene `http(s)://` usar tal cual; si no, anteponer `https://`. Esto permite tanto `@instagram.com/tu-evento` como `https://instagram.com/tu-evento`.

2. **Campo capacidad/aforo: FUERA DE SCOPE.** El enunciado original mencionaba "capacidad mínima 1 persona", pero ese campo NO existe en `FormData` ni en ningún paso del wizard. No se inventó. Queda documentado aquí para referencia futura.

3. **Precios con `free=true`:** Los inputs de precio no están en el DOM cuando `data.free === true` (renderizado condicional `{!data.free && (...) }`). Esto es más fuerte que `disabled`. No se añadió `disabled` redundante.

4. **Lint:** El proyecto no tiene ESLint configurado (sin `.eslintrc.*` ni `eslint.config.js`). `next lint` es interactivo y no ejecutable en CI. Verificación se realizó con `tsc --noEmit` que pasa limpio. Se borró la caché `.next/types` antes de correr el check (contenía referencias al archivo borrado `app/(site)/crear/page.tsx`).

---

## Deviations from Plan

### Auto-fixed Issues

None — plan ejecutado exactamente como estaba definido, con una excepción menor:

**[Rule 2 - Missing feature] Limpieza de errores derivados en update()**
- **Found during:** Task 2
- **Issue:** Al editar campos de precios/fechas/socials/videos, los errores de las claves derivadas (ej. `price_amount_0`) no se limpiaban porque `update()` solo borraba la clave principal del campo.
- **Fix:** Añadida limpieza de prefijos `price_`, `date_`, `social_`, `video_` en la función `update()`.
- **Files modified:** apps/website/app/crear/page.tsx
- **Commit:** 33e068b

---

## Checkpoint de Verificación Manual (Task 3)

Los siguientes escenarios deben verificarse manualmente en `http://localhost:3000/crear` (ejecutar `pnpm dev` desde la raíz del monorepo con sesión iniciada):

| # | Escenario | Resultado esperado |
|---|-----------|-------------------|
| 1 | **Título corto:** escribir "a" e intentar Continuar en Paso 1 | Bloquear con "El título debe tener al menos 3 caracteres." |
| 2 | **Precio con letras:** intentar escribir letras o decimal en el campo precio (evento de pago) | Campo no acepta el carácter |
| 3 | **Precio bajo:** ingresar `100` en evento de pago e intentar Continuar | Bloquear con "El precio mínimo es $500 CLP." |
| 4 | **Precio válido:** ingresar `500` → debe avanzar al Paso 2 | Avanza correctamente |
| 5 | **Toggle gratuito:** marcar "Evento gratuito" → desmarcar | Al desmarcar, el campo de monto muestra `0` |
| 6 | **Fecha pasada:** el selector de fecha no debe permitir elegir un día anterior a hoy | Selector nativo bloquea |
| 7 | **Hora término ≤ inicio:** poner inicio 20:00 y término 19:00, intentar Continuar | Bloquear con "La hora de término debe ser posterior al inicio." |
| 8 | **URL ticketera inválida:** escribir "no es una url" → Continuar | Bloquear con "Ingresa una dirección web válida." |
| 9 | **URL ticketera válida:** escribir "ticketera.cl/evento" → Continuar | Avanza al Paso 3 |
| 10 | **Video URL inválida:** escribir "abc" en campo de video → "Publicar evento" | Bloquear con "Ingresa una URL de video válida." |
| 11 | **Mobile keyboard:** en DevTools responsive, los campos de precio deben mostrar teclado numérico | `inputMode="numeric"` activo |

---

## Known Stubs

Ninguno — todos los campos implementados están cableados a estado real.

---

## Self-Check: PASSED

- [x] `apps/website/app/crear/page.tsx` existe y fue modificado
- [x] Commit `33e068b` existe en el historial
- [x] `tsc --noEmit` pasa sin errores
- [x] No se añadieron dependencias a `package.json`
- [x] No se usó Zod ni React Hook Form
