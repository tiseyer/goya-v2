---
phase: 5
slug: profile-page-buttons
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + @testing-library/react |
| **Config file** | `vitest.config.ts` (project root) |
| **Quick run command** | `npx vitest run __tests__/connect-button.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run __tests__/connect-button.test.tsx`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 0 | PROF-01, PROF-02, PROF-03, PROF-04 | unit | `npx vitest run __tests__/connect-button.test.tsx` | ❌ W0 | ⬜ pending |
| 5-01-02 | 01 | 1 | PROF-01 | unit | `npx vitest run __tests__/connect-button.test.tsx` | ✅ | ⬜ pending |
| 5-01-03 | 01 | 1 | PROF-02 | unit | `npx vitest run __tests__/connect-button.test.tsx` | ✅ | ⬜ pending |
| 5-01-04 | 01 | 1 | PROF-03 | unit | `npx vitest run __tests__/connect-button.test.tsx` | ✅ | ⬜ pending |
| 5-01-05 | 01 | 1 | PROF-04 | unit | `npx vitest run __tests__/connect-button.test.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/connect-button.test.tsx` — Add describe block "role-aware CTA rendering" with `@testing-library/react` renders and mocked `ConnectionsContext` covering all four PROF requirements. Existing file only checks source-level strings (UUID doc comment) — new describe block must be written in Wave 0 before implementation begins.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browser: student visiting teacher profile sees "Request Mentorship" | PROF-01 | End-to-end role rendering requires real Supabase auth session | Log in as student, visit a teacher profile, confirm button label |
| Browser: teacher visiting owned school sees "Manage School" | PROF-03 | School ownership check requires real DB relationship | Log in as school owner, visit the school's profile, confirm secondary button label |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
