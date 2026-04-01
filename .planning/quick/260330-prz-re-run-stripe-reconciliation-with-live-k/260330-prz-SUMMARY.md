---
phase: quick-260330-prz
status: complete
date: 2026-03-30
---

# Quick Task 260330-prz: Re-run Stripe Reconciliation with Live Key

## What was done

Re-ran the Stripe reconciliation script (`scripts/stripe-recon-875.ts`) with the correct live Stripe restricted key (`rk_live_51...`). Also improved the script:

1. **Parallelized Stripe lookups** — 10 concurrent requests instead of sequential, reducing runtime from ~90 min to ~10 min
2. **Added new bucket "C2: customer_no_subs"** — distinguishes users who have a Stripe customer record (but no subscription) from users with no Stripe presence at all
3. **Added C2 detail section** — shows payment method availability for the C2 bucket

## Key Findings

| Bucket | Count | % | Meaning |
|--------|-------|---|---------|
| C — no_stripe_customer | 4,164 | 83.8% | No Stripe presence — need full payment setup at re-onboarding |
| C2 — customer_no_subs | 807 | 16.2% | Stripe customer exists, no subscription — link customer ID, create sub |
| A/B/D/E | 0 | 0% | No active, cancelled, manual, or failed subscriptions found |

### C2 Detail
- **791 of 807** (98%) have a payment method on file — can have subscriptions created automatically
- Only 16 need payment method collection

### Anomalies
- **17 users** have multiple Stripe customer records for the same email
- 0 recent cancellations

### Supabase cross-reference
- Supabase batch lookups failed due to network timeouts in this run
- Previous run (260330-o9t) confirmed 97.2% of these users already exist in Supabase profiles

## Conclusion

**None of these ~4,971 users have Stripe subscriptions** — they were all managed by WooCommerce directly. The migration strategy is:
- **807 users (C2):** Link existing Stripe customer ID to Supabase profile, create new subscription at re-onboarding (791 already have payment methods)
- **4,164 users (C):** Create new Stripe customer + subscription at re-onboarding

## Output Files
- `/tmp/wc_no_stripe_subs.json` — raw WC data (4,971 records)
- `/tmp/stripe_recon_875.json` — full categorized data with Stripe details
- `/tmp/recon_summary.md` — human-readable summary
