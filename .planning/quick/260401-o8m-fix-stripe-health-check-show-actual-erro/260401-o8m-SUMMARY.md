# Quick Task 260401-o8m: Fix Stripe health check

**Status:** Complete
**Date:** 2026-04-01
**Commit:** c391de3

## What was done

Fixed the Stripe health check that was failing with "An error occurred with our connection to Stripe. Request was retried 3 times."

### Changes

**lib/stripe/client.ts:**
- `maxNetworkRetries: 3` → `maxNetworkRetries: 0` (single attempt, no retries)
- Added `httpClient: Stripe.createFetchHttpClient()` for Vercel edge/serverless compatibility

**lib/health-checks.ts:**
- Error catch now extracts `type`, `code`, and `message` from Stripe errors (not truncated)
- Failed check marked as `degraded` instead of `down` (Stripe exists, just unreachable)
- Removed 100-char truncation so full error details appear in Notes column

## Files changed

- `lib/stripe/client.ts` (2 lines)
- `lib/health-checks.ts` (15 lines)
