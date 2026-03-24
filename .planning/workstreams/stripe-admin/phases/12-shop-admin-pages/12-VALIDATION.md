---
phase: 12
slug: shop-admin-pages
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-24
---

# Phase 12 -- Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.9 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npx vitest run app/admin/shop` |
| **Full suite command** | `npx vitest run` |
| **Type check command** | `npx tsc --noEmit` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run app/admin/shop`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Wave 0 Approach: Bundled TDD

Plans 12-01, 12-02, 12-04, and 12-05 use `tdd="true"` tasks that create failing test stubs THEN implement production code within the same task (RED -> GREEN -> REFACTOR). This bundled TDD approach satisfies the Nyquist rule: every code-producing task has automated verification that runs before the task is considered complete. A separate Wave 0 plan is not needed because:

1. TDD tasks write tests FIRST (RED phase), ensuring the test file exists before implementation
2. The verify step runs the tests, confirming they pass (GREEN phase)
3. No task proceeds without its tests passing

This is equivalent in verification intent to a separate Wave 0 -- the test scaffolds exist before production code is written.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 12-01-01 | 01 | 1 | PROD-04,08 | unit (TDD) | `npx vitest run app/admin/shop/products/actions.test.ts` | pending |
| 12-01-02 | 01 | 1 | PROD-01-04,11 | type+build | `npx tsc --noEmit && npx next build` | pending |
| 12-02-01 | 02 | 2 | PROD-05-10 | unit (TDD) | `npx vitest run app/admin/shop/products/actions.test.ts` | pending |
| 12-02-02 | 02 | 2 | PROD-05-10 | type+build | `npx tsc --noEmit && npx next build` | pending |
| 12-03-01 | 03 | 1 | ORD-01-03 | type+build | `npx tsc --noEmit && npx next build` | pending |
| 12-04-01 | 04 | 2 | ORD-05,06 | unit (TDD) | `npx vitest run app/admin/shop/orders/actions.test.ts` | pending |
| 12-04-02 | 04 | 2 | ORD-04,07-09 | type+build | `npx tsc --noEmit && npx next build` | pending |
| 12-05-01 | 05 | 1 | CPN-02 | unit (TDD) | `npx vitest run app/admin/shop/coupons/actions.test.ts` | pending |
| 12-05-02 | 05 | 1 | CPN-01 | type+build | `npx tsc --noEmit && npx next build` | pending |
| 12-06-01 | 06 | 2 | CPN-04,05 | type+build | `npx tsc --noEmit && npx next build` | pending |

*Status: pending / green / red / flaky*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop reorder visual | PROD-04 | Browser interaction required | Drag product rows, verify new order persists after refresh |
| Order event timeline rendering | ORD-07 | Visual chronological layout | Open order detail, verify events appear in time order |
| Coupon redemption history display | CPN-05 | Visual layout verification | Open coupon detail, verify redemption list renders |
| Billing/shipping address display | ORD-08 | Visual layout + Stripe data | Open order detail, verify billing/shipping sections render |
| Role/product restriction UI | CPN-02 | Visual multi-select layout | Open coupon form, verify whitelist/blacklist toggles and multi-selects |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or TDD-bundled tests
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Bundled TDD covers all test requirements (no separate Wave 0 needed)
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter
- [x] `npx tsc --noEmit` added as faster primary type-check for UI tasks

**Approval:** approved
