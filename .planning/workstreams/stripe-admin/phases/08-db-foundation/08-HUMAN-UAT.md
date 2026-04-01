---
status: partial
phase: 08-db-foundation
source: [08-VERIFICATION.md]
started: 2026-03-23T00:00:00Z
updated: 2026-03-23T00:00:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. RLS blocks non-admin reads
expected: Sign in as a student/teacher role user and query any new Stripe table (e.g. `SELECT * FROM stripe_products`); expect 0 rows returned and no error (RLS silently filters).
result: [pending]

### 2. RLS allows admin/moderator reads
expected: Sign in as an admin or moderator role user and run `SELECT * FROM stripe_products` (and other new tables); expect query succeeds without RLS error.
result: [pending]

### 3. Webhook idempotency holds
expected: Run two INSERTs with the same `stripe_event_id` using `ON CONFLICT (stripe_event_id) DO NOTHING`; confirm the second insert returns 0 affected rows.
result: [pending]

## Summary

total: 3
passed: 0
issues: 0
pending: 3
skipped: 0
blocked: 0

## Gaps
