---
phase: 10
slug: webhook-handlers-initial-sync
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-24
---

# Phase 10 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 2.1.9 |
| **Config file** | `vitest.config.ts` (root) |
| **Quick run command** | `npx vitest run lib/stripe/handlers/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run lib/stripe/handlers/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 10-01-01 | 01 | 0 | DB-06, DB-07 | unit | `npx vitest run lib/stripe/handlers/product.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-02 | 01 | 0 | DB-06, DB-07 | unit | `npx vitest run lib/stripe/handlers/price.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-03 | 01 | 0 | DB-06, DB-07 | unit | `npx vitest run lib/stripe/handlers/coupon.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-04 | 01 | 0 | DB-06, DB-07, DB-08 | unit | `npx vitest run lib/stripe/handlers/subscription.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-05 | 01 | 0 | DB-06, DB-07 | unit | `npx vitest run lib/stripe/handlers/payment-intent.test.ts` | ❌ W0 | ⬜ pending |
| 10-01-06 | 01 | 0 | DB-06, DB-07, DB-08 | unit | `npx vitest run lib/stripe/handlers/invoice.test.ts` | ❌ W0 | ⬜ pending |
| 10-02-01 | 02 | 1 | DB-06, DB-07 | unit | `npx vitest run lib/stripe/handlers/` | ❌ W0 | ⬜ pending |
| 10-03-01 | 03 | 1 | DB-08 | unit | `npx vitest run app/api/webhooks/stripe/route.test.ts` | ✅ extend | ⬜ pending |
| 10-04-01 | 04 | 2 | DB-09 | unit | `npx vitest run app/api/admin/stripe-sync/route.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/stripe/handlers/product.test.ts` — stubs for DB-06, DB-07 (product events)
- [ ] `lib/stripe/handlers/price.test.ts` — stubs for DB-06, DB-07 (price events)
- [ ] `lib/stripe/handlers/coupon.test.ts` — stubs for DB-06, DB-07 (coupon events; `stripe_coupon_id` conflict key)
- [ ] `lib/stripe/handlers/subscription.test.ts` — stubs for DB-06, DB-07, DB-08 (subscription + pending_cron)
- [ ] `lib/stripe/handlers/payment-intent.test.ts` — stubs for DB-06, DB-07 (payment_intent events)
- [ ] `lib/stripe/handlers/invoice.test.ts` — stubs for DB-06, DB-07, DB-08 (invoice + pending_cron)
- [ ] `app/api/admin/stripe-sync/route.test.ts` — stubs for DB-09 (pagination, upsert all three entities)

*Existing infrastructure covers test runner and `@/` alias (both set up in Phase 9).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Live Stripe CLI event firing produces correct DB row | DB-06 | Stripe CLI not installed in CI | Run `stripe listen` + `stripe trigger product.created`; verify row in Supabase dashboard |
| Concurrent duplicate event deduplication under load | DB-08 | Race condition requires real Postgres | Fire same event ID from two parallel curl requests; verify exactly 1 row |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
