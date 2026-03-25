# Phase 20: Fix Broken Admin Pages - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Mode:** Auto-generated (bug fix phase)

<domain>
## Phase Boundary

Fix 3 crashing admin pages and add Create Product button:
1. /admin/shop/orders — crashes with server-side exception
2. /admin/shop/analytics — crashes with server-side exception
3. /admin/audit-log — crashes with server-side exception
4. /admin/shop/products — add "+ Create Product" button (same pattern as coupons page)

</domain>

<decisions>
## Implementation Decisions

### Fix Approach
- Read each page file and all its imports
- Find unhandled async errors, missing null checks, top-level Stripe/Supabase calls outside try/catch
- Wrap all data fetches in try/catch
- If data is unavailable → show empty state, never crash
- Check for 'use client' vs server component mismatches

### Create Product Button
- Match existing "+ Create Coupon" button pattern on /admin/shop/coupons
- Same styling, same position (top of page, right-aligned)

### Claude's Discretion
All implementation choices at Claude's discretion — bug fix phase.

</decisions>

<code_context>
## Existing Code Insights

### Files to investigate
- app/admin/shop/orders/page.tsx
- app/admin/shop/analytics/page.tsx
- app/admin/audit-log/page.tsx
- app/admin/shop/products/page.tsx (for Create Product button)
- app/admin/shop/coupons/page.tsx (reference for button pattern)

</code_context>

<specifics>
## Specific Ideas

Error digests provided by user:
- /admin/shop/orders (Digest: 3267628319)
- /admin/shop/analytics (Digest: 2903588106)
- /admin/audit-log (Digest: 1860331683)

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
