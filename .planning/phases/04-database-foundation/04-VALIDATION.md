---
phase: 4
slug: database-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 4-01-01 | 01 | 1 | DB-01 | manual/sql | `npx supabase db push` | ✅ | ⬜ pending |
| 4-01-02 | 01 | 1 | DB-02 | manual/sql | `npx supabase db push` | ✅ | ⬜ pending |
| 4-02-01 | 02 | 2 | DB-03 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 4-02-02 | 02 | 2 | DB-04 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/connections-context.test.tsx` — stubs for DB-03, DB-04
- [ ] `__tests__/connect-button.test.tsx` — stubs for DB-04

*Existing infrastructure: vitest already configured in project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration applies to Supabase | DB-01 | Requires live Supabase connection | Run `npx supabase db push`, verify `connections` table exists in dashboard |
| RLS blocks cross-user reads | DB-02 | Requires two test users in Supabase | Sign in as user A, attempt to query user B's connections via Supabase client |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
