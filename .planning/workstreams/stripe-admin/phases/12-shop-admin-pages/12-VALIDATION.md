---
phase: 12
slug: shop-admin-pages
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 12 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 2.1.9 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npx vitest run app/admin/shop` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run app/admin/shop`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 12-01-01 | 01 | 1 | PROD-08 | unit | `npx vitest run app/admin/shop/products/actions.test.ts -t "archivePrice"` | ❌ W0 | ⬜ pending |
| 12-01-02 | 01 | 1 | PROD-09 | unit | `npx vitest run app/admin/shop/products/actions.test.ts -t "visibility"` | ❌ W0 | ⬜ pending |
| 12-01-03 | 01 | 1 | PROD-04 | unit | `npx vitest run app/admin/shop/products/actions.test.ts -t "reorder"` | ❌ W0 | ⬜ pending |
| 12-02-01 | 02 | 2 | ORD-05 | unit | `npx vitest run app/admin/shop/orders/actions.test.ts -t "refund"` | ❌ W0 | ⬜ pending |
| 12-02-02 | 02 | 2 | ORD-06 | unit | `npx vitest run app/admin/shop/orders/actions.test.ts -t "cancel"` | ❌ W0 | ⬜ pending |
| 12-03-01 | 03 | 3 | CPN-02 | unit | `npx vitest run app/admin/shop/coupons/actions.test.ts -t "createCoupon"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `app/admin/shop/products/actions.test.ts` — stubs for PROD-08, PROD-09, PROD-04
- [ ] `app/admin/shop/orders/actions.test.ts` — stubs for ORD-05, ORD-06
- [ ] `app/admin/shop/coupons/actions.test.ts` — stubs for CPN-02
- [ ] `npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` — drag-and-drop for PROD-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Drag-and-drop reorder visual | PROD-04 | Browser interaction required | Drag product rows, verify new order persists after refresh |
| Order event timeline rendering | ORD-03 | Visual chronological layout | Open order detail, verify events appear in time order |
| Coupon redemption history display | CPN-04 | Visual layout verification | Open coupon detail, verify redemption list renders |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
