---
phase: 26-dashboard-inbox-crm-y-suscripciones-con-api-real
verified: 2026-05-29T00:00:00Z
status: human_needed
score: 7/9 truths verified (2 deviations from goal text need human confirmation)
human_verification:
  - test: "Confirm archive→delete substitution is acceptable"
    expected: "Product owner ratifies that irreversible DELETE /contact/:id replaces the archived-message concept stated in the phase goal ('filtros leer/archivar que persisten'). The backend has no archive endpoint — CONTEXT.md documents this. This is a scope adjustment, not a bug."
    why_human: "The goal text says 'archivar que persisten'; delivery replaced archive with permanent delete. Cannot determine acceptability programmatically."
  - test: "Confirm modal-as-detail replaces navigation for SubsSection"
    expected: "Product owner ratifies that opening a modal (setOpenSub) satisfies 'botón Ver navegando al detalle' from the goal. The Phase 25 UsersSection uses the same pattern and CONTEXT.md specifies a modal."
    why_human: "Goal says 'navegando al detalle' which implies a route change; delivery opens an inline modal. Behavior difference requires explicit product confirmation."
  - test: "Verify mutations persist through real backend round-trip"
    expected: "PATCH /contact/:id/read marks message as read after page reload; DELETE /contact/:id removes it permanently; POST /crm/:id/notes persists note after modal close and reopen; PATCH /crm/:id/stage moves card to new column after reload."
    why_human: "Wiring is verified statically (correct method + endpoint + payload + response handling), but actual backend persistence can only be confirmed through a live test session."
---

# Phase 26: Dashboard inbox, CRM y suscripciones con API real — Verification Report

**Phase Goal:** Conectar las secciones de comunicación a la API real: `InboxSection` fetch `GET /contact` con filtros leer/archivar que persisten; `CRMSection` kanban conectado a `GET /crm` con cambios de etapa persistidos vía `PATCH /crm/:id/stage` y notas reales; `SubsSection` carga suscriptores desde `GET /subscriptions` con el botón "Ver" navegando al detalle.
**Verified:** 2026-05-29
**Status:** human_needed — all automated artifact + wiring checks pass; 2 goal-text deviations need human confirmation
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | InboxSection loads messages from GET /contact | VERIFIED | `api.contactAll(token)` in useCallback+useEffect([load]) at InboxSection.tsx:53-64 |
| 2 | "Todos" and "No leídos" filter tabs work client-side | VERIFIED | `visible = filter === "No leídos" ? msgs.filter(m => !m.read) : msgs` at line 77 |
| 3 | Opening a message marks it read via PATCH /contact/:id/read | VERIFIED | `api.contactMarkRead(item.id, token)` called in handleOpen when `!item.read` at line 84 |
| 4 | "Eliminar" button deletes via DELETE /contact/:id with confirm dialog | VERIFIED | `api.contactRemove(target.id, token)` in handleDelete; ConfirmDialog renders on setConfirmDelete |
| 5 | Goal says "archivar que persisten" — delivery has irreversible delete | DEVIATION | Archive concept removed (no backend endpoint); replaced with DELETE. Documented in 26-CONTEXT.md decisions. Requires human confirmation. |
| 6 | CRMSection shows real kanban grouped by stage from GET /crm | VERIFIED | `api.crmAll(token)` → `res.items`; grouped via `STAGE_CONFIG.map(({stage}) => entries.filter(e => e.stage === stage))` |
| 7 | Card click opens modal with real notes + add-note form + stage selector | VERIFIED | `openModal(entry)` calls `api.crmNotes(entry.id, token!)`, populates `notes` state; CRMDetailModal renders all three sections |
| 8 | PATCH /crm/:id/stage called on confirm; LOST requires stageReason | VERIFIED | `api.crmSetStage(id, stage, token, stageReason?)` in handleSaveStage; `if (selectedStage === "LOST" && !stageReason.trim()) return;` guard |
| 9 | SubsSection loads subscribers from GET /subscriptions | VERIFIED | `api.subscriptions(token)` in loadSubs useCallback+useEffect([loadSubs]) at SubsSection.tsx:82-94 |
| 10 | KPIs show Activos (computed) and Total (from response); MRR/Nuevos mes removed | VERIFIED | `activeCount = subs.filter(s => s.status === 'ACTIVE').length`; `setTotal(res.total)`; grep MRR/Nuevos mes = 0 |
| 11 | Ver button opens detail with handle/email/status/dates/credits | VERIFIED | `onClick={() => setOpenSub(s)}` wired; modal renders 6 SubRow fields via openSub state |
| 12 | Goal says "navegando al detalle" for Ver — delivery opens inline modal | DEVIATION | Modal matches CONTEXT.md spec and Phase 25 UsersSection pattern. Requires human confirmation that modal satisfies "navegando" in goal. |

**Verified truths (automated):** 9/11 definite truths + 2 goal-text deviations flagged

---

## Required Artifacts

| Artifact | Status | Details |
|----------|--------|---------|
| `apps/website/lib/api.ts` | VERIFIED | 8 types (ApiContactMessage, ApiCrmEntry, ApiCrmNote, ApiSubscription, CrmStage, CrmType, ApiSubscriptionList, ApiCrmList) + 9 methods (contactAll, contactMarkRead, contactRemove, crmAll, crmGet, crmNotes, crmAddNote, crmSetStage, subscriptions) added |
| `apps/website/app/dashboard/sections/InboxSection.tsx` | VERIFIED | Full rewrite; real API wired; mock DATA/InboxItem/PipelineStage removed; kind guard present |
| `apps/website/app/dashboard/sections/CRMSection.tsx` | VERIFIED | Full rewrite; STAGE_CONFIG + TYPE_TAG driven kanban; CRMDetailModal with notes + stage change |
| `apps/website/app/dashboard/sections/SubsSection.tsx` | VERIFIED | Subscriber section rewritten; plan config preserved 100% unchanged |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| InboxSection | api.contactAll | useCallback+useEffect([load]) | WIRED | Lines 53-66 |
| openItem handler | api.contactMarkRead | called when msg.read === false | WIRED | Lines 79-90 |
| delete confirm | api.contactRemove | onConfirm callback in handleDelete | WIRED | Lines 92-104 |
| CRMSection | api.crmAll | useCallback+useEffect([load]) | WIRED | Lines 243-256 |
| modal open | api.crmNotes | openModal function on card click | WIRED | Lines 268-283 |
| add note form submit | api.crmAddNote | handleAddNote onAddNote prop | WIRED | Lines 293-306 |
| stage selector change | api.crmSetStage | handleSaveStage onSaveStage prop | WIRED | Lines 308-327 |
| SubsSection | api.subscriptions | useCallback+useEffect([loadSubs]) | WIRED | Lines 82-96 |
| Ver button | setOpenSub(sub) | onClick on table row action | WIRED | Line 144 |
| photography/page.tsx | InboxSection kind="photo" | import + kind prop passed | WIRED | Page renders placeholder (not contact inbox) |
| content-creators/page.tsx | InboxSection kind="creators" | import + kind prop passed | WIRED | Page renders placeholder (not contact inbox) |

---

## Requirements Coverage

REQUIREMENTS.md does not exist in this project. Requirement IDs DASH-CRM-01..DASH-CRM-10 are referenced in ROADMAP.md as a range but not individually defined. None are orphaned — all 10 are claimed across plans. Evidence mapping:

| Req ID Range | Claimed By Plan | Coverage |
|--------------|-----------------|----------|
| DASH-CRM-01..10 | 26-01 (foundation) | All 10 IDs claimed as foundation |
| DASH-CRM-01..04 | 26-02 (InboxSection) | Contact inbox read/filter/mark-read/delete |
| DASH-CRM-05..08 | 26-03 (CRMSection) | CRM kanban/modal/notes/stage-change |
| DASH-CRM-09..10 | 26-04 (SubsSection) | Subscriber list/detail |

No DASH-CRM IDs are orphaned (every ID is covered by at least one plan). However, without a definition document, individual requirement descriptions cannot be cross-referenced.

---

## TypeScript Compilation

`npx tsc --noEmit` from `apps/website/` returns zero errors in all Phase 26 files. Two pre-existing errors exist in `.next/types/app/(site)/cuenta/organizador/page.ts` (stale cache from Phase 23 deleted page) — unrelated to Phase 26.

---

## Anti-Patterns Found

| File | Pattern | Severity | Impact |
|------|---------|----------|--------|
| None | — | — | — |

No stub patterns detected. HTML `placeholder=""` attributes in CRMSection textarea/input are legitimate UI text, not code stubs.

---

## Goal-Text Deviations (Not Implementation Failures)

Both deviations are documented planning decisions in 26-CONTEXT.md and are the consequence of missing backend endpoints:

**Deviation 1 — Archive replaced by Delete:**
- Goal: "filtros leer/archivar que persisten"
- Delivery: "Archivar" button replaced with "Eliminar" (DELETE /contact/:id with confirm dialog); "Archivados" tab removed; only "Todos" and "No leídos" tabs remain.
- Rationale: Backend has no archive endpoint. Documented in 26-CONTEXT.md: "Botón 'Archivar' → DELETE /contact/:id con confirm dialog (el backend no tiene endpoint de archive)".
- Impact: Destructive (permanent delete) vs. reversible archive. Behavior change for admin user.

**Deviation 2 — Modal replaces navigation for "Ver":**
- Goal: "botón 'Ver' navegando al detalle"
- Delivery: Ver button opens inline `confirm-bg`/`confirm-card` modal.
- Rationale: No subscriber detail route exists; CONTEXT.md specifies modal display. Matches Phase 25 UsersSection pattern.
- Impact: Lower in severity — modal is a common "detail" pattern. The word "navegando" in the goal likely meant "go to detail" loosely.

---

## Human Verification Required

### 1. Ratify archive→delete substitution

**Test:** As admin, find a contact message and click "Eliminar". Verify it shows a confirm dialog. Confirm deletion. Verify the message is permanently removed (not recoverable, no "Archivados" tab exists).
**Expected:** Product owner accepts that the archive concept is replaced by permanent delete given the backend constraint.
**Why human:** Behavioral scope change from goal text; requires product sign-off.

### 2. Ratify modal-as-detail for subscriptions

**Test:** As admin, visit /dashboard/subscriptions. Click "Ver" on any subscriber row. Verify an inline modal opens showing handle/email, status, cycle dates, and credits. Verify no route change occurs.
**Expected:** Product owner accepts that the inline modal satisfies the goal's intent of "navegando al detalle".
**Why human:** Goal says "navegando"; delivery is a modal. Requires product confirmation of the scope interpretation.

### 3. Verify mutation persistence through real backend

**Test:**
- Mark a contact message as read, reload the page. Confirm it stays read.
- Delete a message, confirm it does not reappear after reload.
- Add a CRM note, close the modal, reopen the same card. Confirm the note persists.
- Change a CRM stage, reload the page. Confirm the card appears in the new column.
- Load /dashboard/subscriptions and confirm the table shows real subscriber data (not empty).

**Expected:** All mutations survive a page reload, confirming backend persistence.
**Why human:** Static analysis confirms correct method + payload + response handling, but actual round-trip to real API cannot be verified programmatically.

---

## Minor Notes

- 26-03 SUMMARY.md documents commit `b30c426` for CRMSection but the actual commit is `6ab0269` (b30c426 is the SUMMARY+STATE commit from plan 02 that was reused in the plan 03 summary). Documentation error only; actual code commit `6ab0269` exists and is correct.

---

_Verified: 2026-05-29_
_Verifier: Claude (gsd-verifier)_
