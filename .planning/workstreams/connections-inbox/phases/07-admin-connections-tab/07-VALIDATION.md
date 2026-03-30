---
phase: 7
slug: admin-connections-tab
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-24
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + jsdom + @testing-library/jest-dom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command (regression only — no phase-specific test file)
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 07-01-01 | 01 | 1 | ADM-01, ADM-02 | manual-only | — (browser verification in Plan 02) | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

None — no new test files needed. Both requirements (ADM-01, ADM-02) are manual-only verifications. See RESEARCH.md Validation Architecture section for justification.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin can see another user's connections via service role bypass | ADM-01 | Requires admin auth session + real Supabase data; RLS prevents test-harness fetch | Log in as admin, navigate to user detail, click Connections tab, verify connections list populates |
| Admin can remove a connection and row disappears | ADM-02 | Requires live Supabase delete + page revalidation with real auth session | Click Remove on a connection, confirm dialog, verify row disappears and persists after refresh |

Both are covered by Plan 02 (checkpoint:human-verify) with a 12-step browser verification checklist.

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or are mapped to manual-only verifications
- [x] Sampling continuity: regression suite runs after each task commit
- [x] Wave 0 not needed — no automated test gaps
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** ready
