---
phase: 7
slug: admin-connections-tab
status: draft
nyquist_compliant: false
wave_0_complete: false
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
| **Quick run command** | `npx vitest run __tests__/admin-connections-tab.test.tsx` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | ADM-01, ADM-02 | unit | `npx vitest run __tests__/admin-connections-tab.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/admin-connections-tab.test.tsx` — stubs for admin connections tab rendering, remove action (ADM-01, ADM-02)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Admin can see another user's connections via service role bypass | ADM-01 | Requires admin auth session + real Supabase data | Log in as admin, navigate to user detail, click Connections tab, verify connections list |
| Admin can remove a connection and row disappears | ADM-02 | Requires live Supabase delete + page refresh | Click Remove on a connection, confirm dialog, verify row disappears |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
