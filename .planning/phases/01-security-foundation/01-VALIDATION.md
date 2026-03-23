---
phase: 1
slug: security-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | None — zero test files exist in any app (Wave 0 not required for Phase 1) |
| **Config file** | none — no automated suite for this phase |
| **Quick run command** | `curl` + browser devtools (manual) |
| **Full suite command** | Manual UAT checklist (see below) |
| **Estimated runtime** | ~10 minutes (manual) |

---

## Sampling Rate

- **After every task commit:** Manual UAT check for that specific task's UAT criteria
- **After every plan wave:** Full manual UAT list executed
- **Before `/gsd:verify-work`:** All 7 UAT criteria green
- **Max feedback latency:** Per-task manual check (no automated timing)

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 1 | SEC-01 | manual | browser: visit `/dashboard` with non-dashboard user | ❌ manual-only | ⬜ pending |
| 1-02-01 | 02 | 1 | SEC-02 | manual | browser devtools: `document.cookie` must not show `strapi_jwt` | ❌ manual-only | ⬜ pending |
| 1-03-01 | 03 | 2 | SEC-03 | smoke | `curl -H "Origin: https://evil.com" http://localhost:1337/api/events` → expect 403 | N/A — curl | ⬜ pending |
| 1-03-02 | 03 | 2 | SEC-04 | smoke | `curl -X GET http://localhost:3001/api/admin` → expect 403 | N/A — curl | ⬜ pending |
| 1-03-03 | 03 | 2 | SEC-07 | smoke | `curl -X POST http://localhost:3001/api/events` → expect 400 | N/A — curl | ⬜ pending |
| 1-04-01 | 04 | 2 | SEC-05 | manual | browser devtools network tab: no requests to `localhost:1337` | ❌ manual-only | ⬜ pending |
| 1-04-02 | 04 | 2 | SEC-06 | smoke | `curl -X POST http://localhost:3000/api/events` → expect 400 | N/A — curl | ⬜ pending |
| 1-04-03 | 04 | 2 | SEC-08 | code inspection | `grep -r recaptcha apps/strapi/config/` → expect no results | N/A — grep | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None required — Phase 1 is purely security fixes with no automated test suite. UAT is manual verification via browser devtools and `curl`. The CONCERNS.md confirms zero test files exist; this is a known gap addressed in future phases.

*Manual-only justification: SEC-01 requires a real Strapi user with a non-dashboard role. SEC-02 and SEC-05 require browser devtools inspection. These cannot be automated without a test user seeder and Playwright setup, which is out of scope for Phase 1.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Non-dashboard user blocked from `/dashboard` routes | SEC-01 | Requires real Strapi user with non-dashboard role | Login with non-dashboard Strapi user, attempt to visit `/dashboard` — expect redirect to login |
| `strapi_jwt` not in `document.cookie` | SEC-02 | Requires browser devtools inspection | Open devtools console, run `document.cookie` — must not contain `strapi_jwt` |
| No direct browser requests to `localhost:1337` | SEC-05 | Requires browser network tab inspection | Open devtools Network tab, navigate website — verify zero requests to port 1337 |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 600s (manual UAT per task)
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
