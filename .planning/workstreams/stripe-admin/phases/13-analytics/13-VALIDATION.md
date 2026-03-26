---
phase: 13
slug: analytics
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | ANA-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 13-01-02 | 01 | 1 | ANA-02 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 13-01-03 | 01 | 1 | ANA-03 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 13-02-01 | 02 | 2 | ANA-04 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 13-02-02 | 02 | 2 | ANA-05 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for metric computation functions (ANA-01, ANA-02)
- [ ] Test stubs for role filtering logic (ANA-03)
- [ ] Test stubs for CSV export (ANA-04)

*Existing vitest infrastructure covers framework requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Recharts renders interactive charts | ANA-05 | Visual rendering requires browser | Load /admin/shop/analytics, verify line charts render with hover tooltips |
| Time range filter updates all metrics | ANA-02 | Full integration with Supabase | Select each time range preset, verify metric cards and charts update |
| CSV download produces valid file | ANA-04 | File download requires browser | Click export button, open CSV, verify headers and data rows |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
