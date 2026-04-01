# v1.16.0 Shop & Stripe Polish

**Period:** Apr 2026
**Status:** Done

## Deliverables

- [x] Phase 1: Stripe client updated to use STRIPE_RESTRICTED_KEY_V1 as fallback — school designation products confirmed in DB with null stripe_product_id (prices not yet created in Stripe)
- [x] Phase 2: Deleted 24 seed test orders (sub_test_*) from stripe_orders table — Orders page now shows real empty state
- [x] Phase 3a: Added View button (eye icon) to product rows in admin products table, linking to /admin/shop/products/[id]
- [x] Phase 3b: Enhanced product detail page with Stripe Prices table showing all prices (label, amount, price ID, active status)
- [x] Phase 4: No migration needed — products table already has priority, description, stripe_product_id, is_active columns
- [x] Phase 5: Products list now shows price_display string (e.g. "$40.00/year + $99.00 sign-up fee") instead of raw cents
