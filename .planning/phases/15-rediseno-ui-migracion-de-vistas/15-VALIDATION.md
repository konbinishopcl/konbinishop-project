---
phase: 15
slug: rediseno-ui-migracion-de-vistas
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-25
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None installed in `apps/website` — build + lint only |
| **Config file** | `apps/website/package.json` (scripts: build, lint) |
| **Quick run command** | `pnpm --filter website build` |
| **Full suite command** | `pnpm --filter website build && pnpm --filter website lint` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm --filter website build`
- **After every plan wave:** Run `pnpm --filter website build && pnpm --filter website lint`
- **Before `/gsd:verify-work`:** Full suite must be green + manual smoke of all new routes
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-* | 01 | 1 | UI-BUILD | build | `pnpm --filter website build` | ✅ | ⬜ pending |
| 15-02-* | 02 | 2 | UI-BUILD | build | `pnpm --filter website build` | ✅ | ⬜ pending |
| 15-03-* | 03 | 3 | UI-BUILD,UI-ADMIN | build+manual | `pnpm --filter website build` | ✅ | ⬜ pending |
| 15-04-* | 04 | 3 | UI-BUILD | build | `pnpm --filter website build` | ✅ | ⬜ pending |
| 15-05-* | 05 | 4 | UI-BUILD,UI-ROUTES | build+manual | `pnpm --filter website build` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `sonner` package installed in `apps/website` — required before Wave 1 toast notifications

*Existing `pnpm --filter website build` infrastructure covers all automated checks.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| All new routes render (no 404) | UI-ROUTES | No E2E framework installed | Navigate to each new route in browser |
| Admin sections render + real integrations work | UI-ADMIN | Visual + API interaction | Log in as admin, approve/reject an event |
| Dark/light toggle persists across navigation | UI-THEME | CSS state / localStorage | Toggle theme, navigate pages, verify persistence |
| Header category nav scrolls correctly | UI-NAV | Visual interaction | Click category pills, verify navigation |
| Mobile responsive layouts | UI-RESPONSIVE | Visual — requires browser resize | Test at 375px, 768px, 1280px |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
