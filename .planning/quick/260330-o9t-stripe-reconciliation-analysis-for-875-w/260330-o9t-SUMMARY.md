---
phase: quick
plan: 260330-o9t
subsystem: scripts/data-analysis
tags: [stripe, woocommerce, reconciliation, migration, data-analysis]
dependency_graph:
  requires: []
  provides: [stripe-recon-script, wc-subscription-data, recon-summary]
  affects: [migration-planning, stripe-integration]
tech_stack:
  added: []
  patterns: [tsx-script, fetch-api, dotenv, supabase-rest-api, stripe-rest-api]
key_files:
  created:
    - scripts/stripe-recon-875.ts
    - activity/quick-tasks/quick-task_stripe-recon-875-analysis_30-03-2026.md
  modified: []
decisions:
  - Skipped Stripe lookups when test key detected — all would return empty, saves 8+ minutes of delay
  - Batched Supabase queries at 100 per batch to avoid URL length limits
  - Added USE_WC_CACHE=1 env var to reuse fetched WC data on reruns
  - WC cache file at /tmp/wc_no_stripe_subs.json (not committed — runtime artifact)
metrics:
  duration: ~12 min (8 min WC fetch, 3 min Supabase batch, 1 min categorize+output)
  completed: 2026-03-30
  tasks_completed: 2
  files_changed: 2
---

# Quick Task 260330-o9t: Stripe Reconciliation Analysis

**One-liner:** Reusable TypeScript script to fetch all WC active subs without Stripe IDs (found 4,971 — not 875), batch-query Supabase, and categorize into 5 migration buckets.

## What Was Built

`scripts/stripe-recon-875.ts` performs a full 5-step reconciliation:

1. Paginated WC API fetch (`/subscriptions?status=active`) — filters for missing `_stripe_subscription_id`
2. Stripe customer lookup per unique email (skipped for test keys)
3. 5-bucket categorization (active/cancelled/no_customer/manual/failed)
4. Anomaly detection (multiple customers, recent cancellations)
5. Batch Supabase profile cross-reference (100 emails per batch)

## Key Findings

| Metric | Value |
|--------|-------|
| WC subs without Stripe sub ID | **4,971** (plan estimated ~875) |
| Unique emails | 4,821 |
| Matched in Supabase | 4,834 (97.2%) |
| WC-only (not in Supabase) | 137 (2.8%) |
| All billing period | year (100%) |

Top products: Student Practitioner (23.3%), Certified Teacher designations (~62% combined).

## Critical Limitation

The live Stripe key (`rk_live_51...`) was not available locally — only a test key exists
in the Vercel preview environment. All 4,971 records are currently bucketed as
`no_stripe_customer`. **Stripe bucket data is incomplete until live key is added.**

To complete the full reconciliation:
1. Add `STRIPE_SECRET_KEY=rk_live_51...` to `.env.local`
2. Run: `USE_WC_CACHE=1 npx tsx scripts/stripe-recon-875.ts`
3. WC data (already fetched) will be reused; only Stripe lookups will run

## Output Files (runtime, not committed)

- `/tmp/wc_no_stripe_subs.json` — 4,971 WC subscriptions (1.8MB)
- `/tmp/stripe_recon_875.json` — Full recon records with bucket/anomaly/supabase fields (3.1MB)
- `/tmp/recon_summary.md` — Human-readable summary with product distribution

## Commits

- `3ab4391` — feat: add Stripe reconciliation script
- `d557cb7` — docs: add activity log

## Deviations from Plan

### Auto-detected Issues

**1. [Rule 1 - Bug] Supabase batch query format**
- **Found during:** Task 1, Supabase cross-reference step
- **Issue:** First attempt used quoted email values `"email@x.com"` in PostgREST `in()` filter, causing all batch queries to fail
- **Fix:** Removed quotes — PostgREST `in.(email1,email2)` works without quoting
- **Commit:** `3ab4391`

**2. [Rule 2 - Efficiency] Batch size reduced from 500 to 100**
- **Found during:** Task 1
- **Issue:** 500 emails per batch exceeded URL length limits
- **Fix:** Reduced BATCH_SIZE to 100, all batches succeed
- **Commit:** `3ab4391`

**3. [Rule 2 - Missing functionality] Test key detection added**
- **Found during:** Task 1 — live Stripe key not available
- **Issue:** Running Stripe lookups with test key wastes 8+ min for all-empty results
- **Fix:** Added test key detection, skips Stripe lookups with clear warning, adds note to summary
- **Commit:** `3ab4391`

**4. [Rule 2 - Added value] WC cache support**
- **Found during:** Task 1 — WC fetch takes 8 minutes
- **Issue:** Re-running the script for Stripe/Supabase fixes requires re-fetching all WC data
- **Fix:** Added `USE_WC_CACHE=1` env var to reuse `/tmp/wc_no_stripe_subs.json`
- **Commit:** `3ab4391`

### Scale Discrepancy

Plan estimated ~875 users without Stripe IDs. Actual count is **4,971** (~5.7x higher).
Previous recon estimated ~20% have Stripe IDs — that would mean ~4,971 / 0.8 × 0.2 ≈ 1,243
with Stripe IDs out of ~6,214 total. The estimate may have been based on a different filter
(e.g., only counting users with `_stripe_customer_id` present, not `_stripe_subscription_id`).

## Self-Check: PASSED

- [x] `/tmp/wc_no_stripe_subs.json` exists — 1,842,324 bytes
- [x] `/tmp/stripe_recon_875.json` exists — 3,169,718 bytes
- [x] `/tmp/recon_summary.md` exists — 4,898 bytes
- [x] `scripts/stripe-recon-875.ts` committed at `3ab4391`
- [x] Activity log committed at `d557cb7`
- [x] Records: 4,971 | Buckets: {"no_stripe_customer": 4971}
