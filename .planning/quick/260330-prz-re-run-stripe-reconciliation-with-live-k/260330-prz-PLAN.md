---
phase: quick-260330-prz
type: quick
description: Re-run Stripe reconciliation with live key for 875 WC users without Stripe sub IDs
created: 2026-03-30
---

# Quick Task 260330-prz: Re-run Stripe Reconciliation with Live Stripe Key

## Objective

Re-run the existing `scripts/stripe-recon-875.ts` reconciliation script using the correct Stripe restricted key that has `customers:read` permission. The previous run (260330-o9t) fetched all 4,971 WC subscriptions but Stripe lookups failed due to key permissions.

## Tasks

### Task 1: Re-run recon script with correct Stripe key

**Files:** scripts/stripe-recon-875.ts (existing, no changes needed)
**Action:** Run script with `STRIPE_SECRET_KEY=rk_live_51...` and `USE_WC_CACHE=1` to reuse cached WC data
**Verify:** Check /tmp/stripe_recon_875.json has real bucket distribution (not 100% bucket C)
**Done:** Summary report at /tmp/recon_summary.md shows real A/B/C/D/E distribution

### Task 2: Update outputs, create activity log, commit

**Files:** activity/quick-tasks/quick-task_stripe-recon-875-live-key_30-03-2026.md
**Action:** Create activity log, update STATE.md, commit and push
**Verify:** Commit on develop branch
**Done:** All artifacts committed and pushed
