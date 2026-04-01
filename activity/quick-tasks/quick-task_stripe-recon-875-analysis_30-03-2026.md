# Quick Task: Stripe Reconciliation Analysis for WC Users Without Stripe Sub IDs

**Date:** 2026-03-30
**Task ID:** 260330-o9t
**Status:** Complete

## Task Description

Perform Stripe reconciliation analysis for WooCommerce active subscriptions that have no
Stripe subscription ID, to determine actual Stripe state and categorize for migration strategy.

The goal was to understand which users can be auto-migrated (have Stripe subs to link) vs
need re-onboarding — enabling accurate migration planning.

## Solution

Created `scripts/stripe-recon-875.ts` — a TypeScript script using tsx that:

1. **Fetches all WC active subscriptions** without `_stripe_subscription_id` via paginated API
2. **Looks up each unique email in Stripe** (with 100ms delay between calls)
3. **Categorizes into 5 buckets:**
   - A: active_in_stripe — has active Stripe sub (link it to WC/Supabase)
   - B: cancelled_in_stripe — Stripe sub exists but cancelled (re-onboarding needed)
   - C: no_stripe_customer — no Stripe presence (faux users or pre-Stripe members)
   - D: manual_renewal — Stripe customer with $0 plan (comp'd members)
   - E: failed_payment — Stripe sub in past_due/incomplete state (dunning needed)
4. **Cross-references Supabase profiles** in batches of 100
5. **Generates 3 output files** with full data and human-readable summary

## Results

| Metric | Value |
|--------|-------|
| Total WC active subs without Stripe sub ID | **4,971** (estimated ~875, actual much higher) |
| Unique emails | 4,821 |
| Found in Supabase profiles | 4,834 (97.2%) |
| Not in Supabase (WC-only) | 137 (2.8%) |
| All billing period | year (100%) |

### Top Products (Without Stripe IDs)

| Product | Count | % |
|---------|-------|---|
| Student Practitioner | 1,158 | 23.3% |
| Certified Teacher - GOYA-CRYT | 646 | 13.0% |
| Certified Teacher - GOYA-CYT200 | 586 | 11.8% |
| Certified Teacher - GOYA-CPYT | 447 | 9.0% |
| Certified Teacher - GOYA-CCYT | 443 | 8.9% |
| Certified Teacher - GOYA-CYYT | 441 | 8.9% |
| Wellness Practitioner | 380 | 7.6% |

### Important Note: Stripe Key

The live Stripe key (`rk_live_51...`) was not available in local `.env.local` or Vercel
preview env. Only a test key (`sk_test_`) was available — which sees no real customers.
As a result, all 4,971 records are bucketed as `no_stripe_customer` in this run.

**To get real bucket data:** Add `STRIPE_SECRET_KEY=rk_live_51...` to `.env.local` and
re-run with `USE_WC_CACHE=1 npx tsx scripts/stripe-recon-875.ts` (WC data is cached).

## Output Files

- `/tmp/wc_no_stripe_subs.json` — Raw WC subscription data for 4,971 users
- `/tmp/stripe_recon_875.json` — Full categorized reconciliation data
- `/tmp/recon_summary.md` — Human-readable summary with bucket counts and strategy

## Script Features

- Uses `dotenv` to load `.env.local` automatically
- Detects test vs live Stripe key and skips Stripe lookups for test keys (saves time)
- `USE_WC_CACHE=1` env var to skip re-fetching WC data on reruns
- Batch Supabase queries (100 per batch) to stay within URL length limits
- Anomaly detection: multiple Stripe customers per email, recently cancelled subs
