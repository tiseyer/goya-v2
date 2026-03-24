---
phase: 6
slug: settings-connections-inbox
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest + jsdom + @testing-library/jest-dom |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run __tests__/connections-context.test.tsx __tests__/settings-connections.test.tsx __tests__/settings-inbox.test.tsx` |
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
| 06-01-01 | 01 | 1 | CONN-01, CONN-02, CONN-03 | unit | `npx vitest run __tests__/connections-context.test.tsx` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 2 | CONN-01, CONN-02, CONN-03 | unit | `npx vitest run __tests__/settings-connections.test.tsx` | ❌ W0 | ⬜ pending |
| 06-02-02 | 02 | 2 | INBOX-01, INBOX-02, INBOX-03 | unit | `npx vitest run __tests__/settings-inbox.test.tsx` | ❌ W0 | ⬜ pending |
| 06-02-03 | 02 | 2 | INBOX-04 | grep | `grep "settings/inbox" app/components/Header.tsx` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `__tests__/connections-context.test.tsx` — stubs for removeConnection mutation (CONN-03) and profiles join
- [ ] `__tests__/settings-connections.test.tsx` — stubs for Settings > Connections tabs and remove action (CONN-01, CONN-02, CONN-03)
- [ ] `__tests__/settings-inbox.test.tsx` — stubs for inbox list, accept/decline actions, type filter (INBOX-01, INBOX-02, INBOX-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Principal Teacher tab only visible for school owners | CONN-01 | Requires authenticated school-owner session | Log in as school owner, visit /settings/connections, verify extra tab appears |
| Accept/Decline updates inbox list in real time | INBOX-02 | Supabase realtime subscription hard to automate | Accept a request, verify it disappears from Inbox and appears in Connections |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
