---
phase: 17
slug: articles-crud-completo
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-27
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | No hay suite de test frontend — pruebas manuales en navegador |
| **Config file** | none — no existe jest.config / vitest.config en apps/website |
| **Quick run command** | `curl -s http://localhost:3333/api/articles/mine -H "Authorization: Bearer $TOKEN"` |
| **Full suite command** | Manual smoke en browser (ver checklist abajo) |
| **Estimated runtime** | ~5 minutos smoke completo |

---

## Sampling Rate

- **After every task commit:** Verificar en browser que la vista modificada carga sin errores de consola
- **After each wave:** Correr el smoke checklist del wave correspondiente

---

## Wave 0 — Infrastructure

**Status:** COMPLETE (no new infrastructure needed)

No se requiere instalar nada nuevo. Stack existente: react-hook-form, zod, sonner, api.uploadImage, imageUrl.

---

## Wave 1 — API (Plan 17-01)

### Smoke Checklist

- [ ] `GET /api/articles/mine` con token de organizador → devuelve solo sus artículos
- [ ] `GET /api/articles/mine` sin token → 401
- [ ] `PATCH /api/articles/:id` con token de otro usuario → 403
- [ ] `DELETE /api/articles/:id` con token del dueño → 200
- [ ] `DELETE /api/articles/:id` con token de ADMIN → 200 (admin puede eliminar cualquiera)

### Acceptance Grep

```bash
grep -n "mine\|@Get.*mine" apps/api/src/articles/articles.controller.ts
grep -n "findMine\|findByUser" apps/api/src/articles/articles.service.ts
grep -n "ownership\|forbidden\|userId.*user.id" apps/api/src/articles/articles.service.ts
```

---

## Wave 2 — Shared Components (Plan 17-02)

### Smoke Checklist

- [ ] `MarkdownEditor` importa limpio sin errores TS
- [ ] `ArticleForm` renderiza sin acordeón (no `.form-acc`, no `AccItem`)
- [ ] Footer sticky con botón CTA visible al hacer scroll
- [ ] Upload de imagen: seleccionar archivo → preview local aparece
- [ ] Tags: multi-select carga tags desde `/api/tags`
- [ ] Submit: POST a `/api/articles` → toast "Artículo creado" → redirect

### Acceptance Grep

```bash
grep -c "form-acc\|AccItem\|accordion" apps/website/app/dashboard/articles/ArticleForm.tsx  # debe ser 0
grep -n "MarkdownEditor" apps/website/app/dashboard/articles/ArticleForm.tsx
grep -n "footer.*sticky\|sticky.*footer\|form-footer" apps/website/app/dashboard/articles/ArticleForm.tsx
grep -n "uploadImage\|imageUrl" apps/website/app/dashboard/articles/ArticleForm.tsx
```

---

## Wave 3 — Admin Dashboard (Plan 17-03) + Organizer /cuenta (Plan 17-04)

### Admin Smoke (17-03)

- [ ] `/dashboard/articles` carga lista de artículos desde API (no mock)
- [ ] Filtro por status funciona (DRAFT, PENDING_REVIEW, APPROVED, REJECTED)
- [ ] Botón "Aprobar" llama a `PATCH /api/articles/:id/approve` → toast + recarga
- [ ] Botón "Rechazar" llama a `PATCH /api/articles/:id/reject` → modal reason → toast
- [ ] Botón "Eliminar" llama a `DELETE /api/articles/:id` → confirmación → toast
- [ ] Link "Nuevo artículo" → `/dashboard/articles/new` → ArticleForm carga
- [ ] Link "Editar" → `/dashboard/articles/[slug]/edit` → ArticleForm pre-rellenado

### Organizer Smoke (17-04)

- [ ] `/cuenta/articulos` muestra solo artículos del organizador (llama a `/mine`)
- [ ] Botón "Crear artículo" → `/crear-articulo` → ArticleForm carga (variant=organizer)
- [ ] `/crear-articulo` → submit → artículo creado → redirect a `/cuenta/articulos`
- [ ] `/cuenta/articulos/[slug]/edit` → ArticleForm pre-rellenado con datos del artículo
- [ ] UpsellView: botón "Artículo patrocinado" redirige a `/crear-articulo` (no form inline)

### Acceptance Grep

```bash
# 17-03: ArticlesSection ya no es mock
grep -c "const ARTICLES\|mock\|hardcoded" apps/website/app/dashboard/sections/ArticlesSection.tsx  # debe ser 0
grep -n "fetch.*api/articles\|useEffect" apps/website/app/dashboard/sections/ArticlesSection.tsx
grep -n "approve\|reject\|ban" apps/website/app/dashboard/sections/ArticlesSection.tsx

# 17-04: Organizer pages
grep -n "articles/mine\|/mine" apps/website/app/\(site\)/cuenta/articulos/page.tsx 2>/dev/null
grep -n "crear-articulo\|router.push" apps/website/app/\(site\)/upsell/UpsellView.tsx 2>/dev/null
```

---

## Phase-Level Acceptance

| Truth | Verified by |
|-------|-------------|
| Admin puede listar, crear, editar, aprobar, rechazar y eliminar cualquier artículo | Manual smoke 17-03 |
| Organizador puede listar SUS artículos desde /cuenta/articulos | Manual smoke 17-04 |
| Organizador puede crear artículo patrocinado desde /crear-articulo | Manual smoke 17-04 |
| ArticleForm no tiene acordeón | `grep -c "form-acc" ArticleForm.tsx == 0` |
| UpsellView no tiene form inline de artículo — redirige a /crear-articulo | Manual smoke 17-04 |
| API /articles/mine requiere auth y devuelve solo artículos del usuario | API smoke 17-01 |
| PATCH/DELETE de artículo ajeno por organizador → 403 | API smoke 17-01 |
