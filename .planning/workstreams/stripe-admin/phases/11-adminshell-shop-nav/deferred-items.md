# Deferred Items — Phase 11 Plan 01

## Pre-existing TypeScript Error (Out of Scope)

**File:** `app/api/admin/stripe-sync/route.ts:40`
**Error:** Type error — `stripe_products` table not in Supabase type definitions. Upsert call gets `never` type.
**Discovered:** During Task 1 build verification
**Pre-existing:** Confirmed — error exists on HEAD before this plan's changes
**Resolution:** Will be resolved in Phase 12 (Shop > Products) when the `stripe_products` DB table is created and types are regenerated.
