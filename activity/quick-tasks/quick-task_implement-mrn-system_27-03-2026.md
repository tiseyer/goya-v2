# Quick Task: Implement MRN System (Generation & Storage)

**Date:** 2026-03-27
**Status:** Complete

## Task Description

Implement MRN lifecycle tracking to prevent MRN reuse after user deletion or anonymization. Previously, `generate_mrn()` only checked the `profiles` table for uniqueness — meaning a deleted user's MRN could be reassigned to a new user.

## Solution

Created a single Supabase migration (`supabase/migrations/20260353_mrn_used_table.sql`) that:

- **Creates `used_mrns` table** — permanent registry of every MRN ever issued, with `status` column (`active` | `retired`) and RLS policies
- **Updates `generate_mrn()`** — uniqueness check now queries `used_mrns` instead of `profiles`
- **Adds `on_profile_mrn_set` trigger** — automatically records any new/updated MRN in `used_mrns` as 'active' after profile insert/update
- **Adds `on_profile_deleted` trigger** — marks MRN as 'retired' in `used_mrns` before profile deletion
- **Backfills existing data** — all current profile MRNs inserted into `used_mrns`; profiles missing MRNs had one generated

## Result

Migration applied to remote Supabase database. Verified:
- 2 MRNs tracked in `used_mrns` (all active)
- 0 profiles with NULL mrn

No breaking changes to existing auth flow or frontend (profiles.mrn column unchanged).
