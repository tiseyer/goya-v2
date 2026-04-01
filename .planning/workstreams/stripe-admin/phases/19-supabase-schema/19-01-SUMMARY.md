---
phase: 19-supabase-schema
plan: "01"
subsystem: database
tags: [migration, supabase, rls, schema]
dependency_graph:
  requires: []
  provides: [upgrade_requests table, user_designations table]
  affects: [Phase 15, Phase 16, Phase 17, Phase 18]
tech_stack:
  added: []
  patterns: [soft-delete via deleted_at, RLS user-read-own + admin-full-access, updated_at trigger, partial index on active rows]
key_files:
  created:
    - supabase/migrations/20260345_upgrade_and_designations.sql
  modified: []
decisions:
  - Added updated_at column to upgrade_requests to satisfy update_updated_at_column() trigger requirement
metrics:
  duration: "5 min"
  completed: "2026-03-24"
  tasks_completed: 2
  files_created: 1
---

# Phase 19 Plan 01: Supabase Schema Summary

One-liner: PostgreSQL migration creating `upgrade_requests` (status CHECK constraint, payment fields, admin review flow) and `user_designations` (soft-delete via deleted_at) tables with RLS and indexes.

## What Was Created

### Migration File: `supabase/migrations/20260345_upgrade_and_designations.sql`

**Table 1: `upgrade_requests`**

Columns: `id` (uuid PK), `user_id` (uuid FK auth.users CASCADE), `status` (text CHECK pending/approved/rejected, default pending), `certificate_urls` (text[] default {}), `stripe_payment_intent_id` (text), `stripe_subscription_id` (text), `rejection_reason` (text), `created_at` (timestamptz), `updated_at` (timestamptz), `reviewed_at` (timestamptz), `reviewed_by` (uuid FK auth.users SET NULL)

RLS Policies:
- `Users can read own upgrade_requests` — SELECT WHERE auth.uid() = user_id
- `Admins can manage upgrade_requests` — all operations for role IN ('admin', 'moderator')

Other: `update_upgrade_requests_updated_at` trigger, indexes on user_id and status.

**Table 2: `user_designations`**

Columns: `id` (uuid PK), `user_id` (uuid FK auth.users CASCADE), `stripe_product_id` (text NOT NULL), `stripe_price_id` (text NOT NULL), `purchase_date` (timestamptz default now()), `deleted_at` (timestamptz — null = active), `deleted_by` (uuid FK auth.users SET NULL)

RLS Policies:
- `Users can read own user_designations` — SELECT WHERE auth.uid() = user_id
- `Users can soft-delete own user_designations` — UPDATE WHERE auth.uid() = user_id AND deleted_at IS NULL
- `Admins can manage user_designations` — all operations for role IN ('admin', 'moderator')

Other: Index on user_id, partial index on user_id WHERE deleted_at IS NULL (active rows only).

## Migration Applied

`npx supabase db push` — exit code 0, no errors. Remote database is up to date with the new migration.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Added missing updated_at column to upgrade_requests**
- **Found during:** Task 1
- **Issue:** The plan SQL included `CREATE TRIGGER update_upgrade_requests_updated_at ... EXECUTE FUNCTION update_updated_at_column()` but did not include an `updated_at` column in the table definition. The trigger function sets `NEW.updated_at = now()`, which would cause a runtime error when any row is updated.
- **Fix:** Added `updated_at timestamptz NOT NULL DEFAULT now()` column to `upgrade_requests` table.
- **Files modified:** supabase/migrations/20260345_upgrade_and_designations.sql
- **Commit:** 54bfef4

## Self-Check

- [x] `supabase/migrations/20260345_upgrade_and_designations.sql` exists
- [x] Contains exactly 2 CREATE TABLE statements
- [x] `npx supabase db push` exited with code 0
- [x] No ERROR in push output
