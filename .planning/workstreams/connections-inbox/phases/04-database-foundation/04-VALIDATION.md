---
phase: 4
slug: database-foundation
status: draft
nyquist_compliant: true
wave_0_complete: true
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
| 4-01-01 | 01 | 1 | DB-01, DB-02 | file/grep | `grep -c "create table connections" supabase/migrations/20260339_add_connections.sql` | N/A (creates the file) | pending |
| 4-01-02 | 01 | 1 | DB-03 | human-gate | File existence only (push is human-verified at checkpoint) | N/A | pending |
| 4-02-00 | 02 | 2 | DB-04 | file check | `test -f __tests__/connections-context.test.tsx && test -f __tests__/connect-button.test.tsx` | Creates them | pending |
| 4-02-01 | 02 | 2 | DB-04 | unit (source-level) | `npx vitest run __tests__/connections-context.test.tsx` | __tests__/connections-context.test.tsx (Wave 0) | pending |
| 4-02-02 | 02 | 2 | DB-04 | unit (source-level) + grep | `npx vitest run __tests__/connect-button.test.tsx` | __tests__/connect-button.test.tsx (Wave 0) | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

- [x] `__tests__/connections-context.test.tsx` — created by Plan 02, Task 0
- [x] `__tests__/connect-button.test.tsx` — created by Plan 02, Task 0

*Wave 0 test stubs are created as the first task in Plan 02. They contain source-level assertions (file content checks) that verify the rewrite requirements without needing Supabase mocks.*

*Existing infrastructure: vitest already configured in project.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Migration applies to Supabase | DB-01 | Requires live Supabase connection | Run `npx supabase db push`, verify `connections` table exists in dashboard |
| RLS blocks cross-user reads | DB-02 | Requires two test users in Supabase | Sign in as user A, attempt to query user B's connections via Supabase client |
| Migration pushed successfully | DB-03 (push half) | Requires Supabase credentials Claude cannot access | Human confirms at checkpoint gate in Plan 01 Task 2. The `/gsd:verify-work` agent should treat a completed checkpoint as evidence that push succeeded. |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** approved
