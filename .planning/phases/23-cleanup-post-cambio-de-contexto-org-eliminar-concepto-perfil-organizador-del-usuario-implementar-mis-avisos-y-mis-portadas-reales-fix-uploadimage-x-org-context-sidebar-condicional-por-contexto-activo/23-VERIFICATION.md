---
phase: 23-cleanup-post-cambio-de-contexto-org
verified: 2026-05-28T00:00:00Z
status: human_needed
score: 7/7 must-haves verified
re_verification: false
human_verification:
  - test: "Navegar a /cuenta/organizador"
    expected: "La ruta retorna 404 — Next.js no sirve la página"
    why_human: "Requiere la app corriendo; no se puede verificar con grep/fs"
  - test: "Subir una imagen como org activa (operar como una org, luego subir imagen en /crear-evento u otra pantalla con upload)"
    expected: "La request POST /api/upload incluye el header X-Org-Context con el orgId correcto en el Network tab"
    why_human: "Comportamiento de runtime — el header se inyecta condicionalmente según _activeOrgId; requiere browser + DevTools"
  - test: "Con avisos reales creados, visitar /cuenta/mis-avisos y cambiar entre tabs"
    expected: "Tab 'Activos' muestra APPROVED no-vencidos; tab 'Expirados' muestra APPROVED vencidos (no aparecen en Activos); tab 'En revisión' muestra PENDING_MODERATION"
    why_human: "El predicado matchesTab es correcto en código pero la lógica Activos/Expirados depende de la fecha relativa — necesita datos reales"
  - test: "Con portadas reales creadas, visitar /cuenta/mis-portadas"
    expected: "Las portadas se listan; el título compuesto (title + titleAccent) aparece en la card; los tabs con labels femeninos (Activas/Expiradas/Rechazadas) filtran correctamente"
    why_human: "Requiere datos reales para observar el render de titleAccent concatenado"
---

# Phase 23: Cleanup Post-Org-Context-Switch Verification Report

**Phase Goal:** Cleanup post org-context switch — eliminate the "organizer profile as user mode" concept from UI and backend, wire mis-avisos/mis-portadas to real API data, fix uploadImage X-Org-Context header, make sidebar conditional by active context.

**Note on sidebar conditional:** The phase CONTEXT.md explicitly defers sidebar-conditional-by-active-context ("requiere diseño, deferido"). It is not part of the 7 in-scope items (CLEAN-01..CLEAN-07). Not assessed here.

**Verified:** 2026-05-28
**Status:** human_needed (all automated checks passed; 4 runtime behaviors need human confirmation)
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|---------|
| 1 (CLEAN-01) | `/cuenta/organizador` directory eliminated | VERIFIED | `test ! -d apps/website/app/(site)/cuenta/organizador` passes |
| 2 (CLEAN-02) | AccountShell TABS has no `organizador` entry; 10 clean tabs present | VERIFIED | `grep -c "id:" AccountShell.tsx` = 10; grep for "organizador" returns 0; all 10 expected tabs confirmed |
| 3 (CLEAN-03) | mis-avisos loads real spots via `api.mySpots(token)` and renders them | VERIFIED | Call present at line 54; `filtered.map(s => ...)` renders card with title/status/days/amount/expirationDate at line 99 |
| 4 (CLEAN-04) | mis-portadas loads real heroes via `api.myHeroes(token)` and renders them | VERIFIED | Call present at line 54; `filtered.map(h => ...)` renders card with fullTitle/status/days/amount/expirationDate at line 99; `titleAccent` concatenated at line 102 |
| 5 (CLEAN-05) | uploadImage includes X-Org-Context when org active AND does not manually set Content-Type | VERIFIED | `headers["X-Org-Context"] = String(_activeOrgId)` at lib/api.ts:387; no Content-Type in the uploadImage headers block |
| 6 (CLEAN-06) | carrito/exito CTA links to /cuenta/perfil with copy "¿Tu perfil está completo?"; tab=eventos link at ~187 intact | VERIFIED | Line 154: `¿Tu perfil está completo?`; line 159: `href="/cuenta/perfil"`; line 187: `href="/cuenta?tab=eventos"` present |
| 7 (CLEAN-07) | Backend: updateOrganizer method, UpdateOrganizerDto, and PATCH /users/me/organizer all absent; backend compiles | VERIFIED | `grep -rn "UpdateOrganizerDto\|updateOrganizer\|me/organizer" apps/api/src/` returns 0 results; DTO file absent; setVerified/findByHandle still present |

**Score:** 7/7 truths verified (automated)

---

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `apps/website/app/(site)/cuenta/organizador/` | Deleted | VERIFIED | Directory absent |
| `apps/website/app/(site)/cuenta/AccountShell.tsx` | TABS without organizador (10 entries) | VERIFIED | 10 entries: perfil, organizaciones, suscripcion, publicaciones, mis-avisos, mis-portadas, articulos, favoritos, mensajes, pagos |
| `apps/website/app/(site)/carrito/exito/page.tsx` | CTA href=/cuenta/perfil, copy updated | VERIFIED | Both text and href corrected; tab=eventos link preserved |
| `apps/website/app/(site)/cuenta/mis-avisos/page.tsx` | Real data via api.mySpots, tab filtering, render | VERIFIED | Contains `api.mySpots`, `ApiSpot`, `matchesTab`, `filtered.map`, all three render states |
| `apps/website/app/(site)/cuenta/mis-portadas/page.tsx` | Real data via api.myHeroes, tab filtering, render | VERIFIED | Contains `api.myHeroes`, `ApiHero`, `matchesTab`, `filtered.map`, `titleAccent`, all three render states |
| `apps/website/lib/api.ts` | uploadImage with X-Org-Context, no Content-Type override | VERIFIED | `headers["X-Org-Context"] = String(_activeOrgId)` present; no Content-Type in function |
| `apps/api/src/users/users.controller.ts` | No updateOrganizer method, no UpdateOrganizerDto import | VERIFIED | Zero matches for either; other endpoints intact |
| `apps/api/src/users/users.service.ts` | No updateOrganizer method, no UpdateOrganizerDto import | VERIFIED | Zero matches for either; findByHandle, setVerified, ensure all present |
| `apps/api/src/users/dto/update-organizer.dto.ts` | Deleted | VERIFIED | File absent |

---

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `mis-avisos/page.tsx` | `/spots/mine` | `api.mySpots(token)` in useEffect | WIRED | Call at line 54; result stored in `spots` state; `filtered.map` at line 99 renders to JSX |
| `mis-portadas/page.tsx` | `/heroes/mine` | `api.myHeroes(token)` in useEffect | WIRED | Call at line 54; result stored in `heroes` state; `filtered.map` at line 99 renders to JSX |
| `lib/api.ts` uploadImage | X-Org-Context header | `if (_activeOrgId) headers["X-Org-Context"]` | WIRED | Pattern at line 387 inside uploadImage function; `_activeOrgId` is module-level var (line 13) |
| `AccountShell.tsx` TABS | No organizador entry | Entry removed from array | WIRED | Array has 10 entries, none with id/href "organizador" |
| `carrito/exito/page.tsx` | `/cuenta/perfil` | `<Link href="/cuenta/perfil">` | WIRED | Line 159 confirmed |
| `apps/api/src` | updateOrganizer absent | grep returns 0 results | WIRED | Zero matches in entire apps/api/src |

---

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|---------|
| CLEAN-01 | 23-01 | Eliminar /cuenta/organizador y su directorio | SATISFIED | Directory absent |
| CLEAN-02 | 23-01 | Quitar tab Organizador de AccountShell | SATISFIED | TABS array = 10 entries, no organizador |
| CLEAN-03 | 23-02 | Implementar mis-avisos con datos reales | SATISFIED | api.mySpots wired + rendered |
| CLEAN-04 | 23-02 | Implementar mis-portadas con datos reales | SATISFIED | api.myHeroes wired + rendered |
| CLEAN-05 | 23-02 | Fix uploadImage X-Org-Context header | SATISFIED | Header present, no Content-Type override |
| CLEAN-06 | 23-01 | Fix carrito/exito CTA copy and href | SATISFIED | href=/cuenta/perfil + correct copy confirmed |
| CLEAN-07 | 23-03 | Eliminar endpoint PATCH /users/me/organizer | SATISFIED | No matches in apps/api/src; DTO deleted |

---

### Anti-Patterns Found

No blockers or warnings found.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.next/types/app/(site)/cuenta/organizador/page.ts` | — | Stale build cache artifact referencing deleted page | INFO | Not active source code; cleared on next `next build` |

The remaining "organizador" word occurrences in the frontend (dashboard admin sections, copy text, pricing page, event forms) are legitimate domain vocabulary referring to "event organizers" as a concept — not the deleted `/cuenta/organizador` user-mode feature. None are in `apps/website/app/(site)/cuenta/`.

---

### Human Verification Required

#### 1. 404 on /cuenta/organizador

**Test:** Start the website dev server and navigate to `/cuenta/organizador` while logged in.
**Expected:** Next.js serves a 404 page (no route handler for this path after directory deletion).
**Why human:** Requires running app — cannot verify Next.js route resolution via filesystem checks alone.

#### 2. X-Org-Context header in image upload request

**Test:** Log in, switch to an org context via the UserMenu, then upload an image (e.g., when creating a spot or hero).
**Expected:** The POST request to `/api/upload` (proxied to backend) includes the `X-Org-Context` header in the Network tab of DevTools.
**Why human:** The `_activeOrgId` conditional fires at runtime; grep confirms the code path exists but cannot confirm the header is actually sent with the correct orgId value.

#### 3. Tab filtering in mis-avisos with real data

**Test:** With at least one APPROVED spot that has a past `expirationDate` and one APPROVED spot with a future or null `expirationDate`, visit `/cuenta/mis-avisos`.
**Expected:** The expired APPROVED spot appears under "Expirados" tab only (not under "Activos"); the non-expired APPROVED spot appears under "Activos" only.
**Why human:** The `matchesTab` predicate is correct in code but the Activos/Expirados boundary depends on real datetime comparison with actual data.

#### 4. mis-portadas card title with titleAccent

**Test:** With at least one hero that has a non-null `titleAccent`, visit `/cuenta/mis-portadas`.
**Expected:** The card displays the concatenated `title + " " + titleAccent` as a single title string.
**Why human:** `titleAccent` concatenation (line 102) is correct in code but requires real hero data with a non-null `titleAccent` to confirm the rendered output.

---

### Gaps Summary

No gaps. All 7 automated truths are verified. The phase goal is achieved in source code. Four items require human verification to confirm runtime behavior, but none indicate missing or broken implementation.

---

_Verified: 2026-05-28_
_Verifier: Claude (gsd-verifier)_
