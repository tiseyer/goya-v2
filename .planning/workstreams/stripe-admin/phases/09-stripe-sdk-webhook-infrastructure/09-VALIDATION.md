---
phase: 09
slug: stripe-sdk-webhook-infrastructure
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 09 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing in project) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose 2>&1 | tail -20` |
| **Full suite command** | `npx vitest run 2>&1` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose 2>&1 | tail -20`
- **After every plan wave:** Run `npx vitest run 2>&1`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 09-01-01 | 01 | 1 | DB-04 | file check | `test -f lib/stripe/client.ts && echo ok` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | DB-04 | unit | `npx vitest run lib/stripe/client.test.ts` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | DB-05 | file check | `test -f app/api/webhooks/stripe/route.ts && echo ok` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | DB-05 | unit | `npx vitest run app/api/webhooks/stripe/route.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `lib/stripe/client.test.ts` — verifies server-only guard (import throws in client context)
- [ ] `app/api/webhooks/stripe/route.test.ts` — stubs for signature verification (400 on bad sig, 200 on valid)

*Note: test stubs can be minimal — Wave 0 intent is to establish test files before implementation.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stripe CLI forwards live test event and endpoint returns 200 | DB-05 | Requires Stripe CLI running locally + live tunnel | Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, then `stripe trigger payment_intent.succeeded`, verify terminal shows `200 OK` |
| Client Component import of `lib/stripe/client.ts` throws build error | DB-04 | Requires triggering Next.js build with a test client component | Add `import stripe from '@/lib/stripe/client'` to any `'use client'` component, run `npm run build`, verify build fails with `server-only` error |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
