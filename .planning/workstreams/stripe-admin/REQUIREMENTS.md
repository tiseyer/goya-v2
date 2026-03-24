# Requirements: GOYA v2 — v1.3 Subscriptions & Teacher Upgrade

**Defined:** 2026-03-24
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## Stripe Product Taxonomy (from live Stripe account)

- **3 Memberships** (recurring/year): Student ($19), Teacher ($39), Wellness Practitioner ($39)
- **12 Teacher/WP Designations** (one-time $10): Yoga Teacher 200h/500h, Children's, Prenatal, Restorative, Yin, Ayurveda, Meditation, Experienced 200h/500h, Continuing Ed Provider, WP Designation
- **8 School Designations** (one-time $99 + recurring $40/yr): Yoga School 200h/300h/500h, Children's, Prenatal, Meditation, Yin, Restorative
- **Discriminator:** `stripe_prices.type` = `recurring` → membership/school annual; `one_time` → designation. Name pattern "Membership" for base plans, "School" for school designations.

## v1.3 Requirements

### FIX — Bug Fixes & Admin Page Crashes

- [ ] **FIX-01**: Admin and moderator users always display "Admin Member" / "Moderator Member" on the Subscriptions page, never "Guest", regardless of Stripe subscription status
- [ ] **FIX-02**: /admin/shop/orders page loads without crashing — all data fetches wrapped in try/catch, empty state shown when data unavailable
- [ ] **FIX-03**: /admin/shop/analytics page loads without crashing — all data fetches wrapped in try/catch, empty state shown when data unavailable
- [ ] **FIX-04**: /admin/audit-log page loads without crashing — all data fetches wrapped in try/catch, empty state shown when data unavailable
- [ ] **FIX-05**: /admin/shop/products page has a "+ Create Product" button (same pattern as existing "+ Create Coupon" on coupons page)

### SUB — Subscriptions Page (Real Stripe Data)

- [ ] **SUB-01**: Subscriptions page queries Stripe for active subscriptions linked to the current user and displays the correct membership name and price (e.g., "You're on a GOYA Teacher Membership. $39.00 / year.")
- [ ] **SUB-02**: Each membership box has a "Verwalten" button that opens a Stripe Customer Portal session (stripe.billingPortal.sessions.create)
- [ ] **SUB-03**: If user has no active Stripe membership but has a role (student/teacher/wp), the correct plan name is shown based on role
- [ ] **SUB-04**: Additional Teacher Pro subscriptions (recurring products beyond base membership) are shown in a separate box with their own "Verwalten" button
- [ ] **SUB-05**: School membership box is shown only if the user owns a school (schools.owner_id = user.id)
- [ ] **SUB-06**: Designations box lists all one-time designation products the user owns, with a "Delete" button per designation
- [ ] **SUB-07**: Deleting a designation soft-deletes by setting deleted_at timestamp on user_designations — does NOT cancel in Stripe, does NOT trigger refund, preserves purchase_date and deleted_at for admin audit
- [ ] **SUB-08**: Layout uses stacked content boxes with visual separator between each section (membership, additional subs, school, designations)

### UPG — Upgrade Flow (Student/WP → Teacher)

- [ ] **UPG-01**: Upgrade CTA card appears on Subscriptions page below current plan if user role is student or wellness_practitioner — "Ready to become a GOYA Certified Teacher?" with "Upgrade to Teacher Membership" button linking to /upgrade
- [ ] **UPG-02**: In Shop/Add-ons, Teacher Membership product is visible ONLY to students and wellness practitioners with "Upgrade" button label (not "Buy"), linking to /upgrade
- [ ] **UPG-03**: Upgrade page Step 1 shows info about teacher membership benefits with "Start Upgrade" button
- [ ] **UPG-04**: Upgrade page Step 2 allows uploading 1-3 certificate files (PDF, JPG, PNG, WEBP, max 4MB each) to Supabase Storage bucket "upgrade-certificates/{user_id}/{timestamp}-{filename}" with progress, previews, and remove button
- [ ] **UPG-05**: Upgrade page Step 3 creates a Stripe Payment Intent with capture_method: "manual" (authorize only, do not capture), then redirects to Stripe Checkout
- [ ] **UPG-06**: On checkout.session.completed webhook: create upgrade_request record (status: "pending"), store user_id, certificate_urls[], stripe_payment_intent_id — do NOT change role, do NOT capture payment
- [ ] **UPG-07**: Redirect to /upgrade/success page showing confirmation message ("submitted", "verify within 48 hours", "notification when verified")
- [ ] **UPG-08**: While upgrade request is pending: hide upgrade CTA everywhere, show info card on Subscriptions page ("Your upgrade request is pending verification"), hide Teacher Membership in Shop
- [ ] **UPG-09**: Trigger admin inbox notification when upgrade request is submitted

### ADM — Admin Inbox Teacher Upgrades

- [ ] **ADM-01**: New "Teacher Upgrades" tab in /admin/inbox (same design pattern as existing "School Registrations" tab)
- [ ] **ADM-02**: Each upgrade request card shows: user name, email, current role, member since, submitted certificates (downloadable/viewable), Stripe Payment Intent ID + authorized amount, submission date
- [ ] **ADM-03**: Approve action: capture Stripe Payment Intent, activate Teacher Membership subscription, update user role (student/wp → teacher), update upgrade_request status to "approved", migrate designations, send user notification
- [ ] **ADM-04**: Reject action: cancel Stripe Payment Intent (no charge), update upgrade_request status to "rejected" with rejection reason (text input modal), send user notification, restore upgrade CTA visibility
- [ ] **ADM-05**: Sub-tabs within Teacher Upgrades: Pending | Approved | Rejected

### SCH — Supabase Schema

- [ ] **SCH-01**: upgrade_requests table with id, user_id, status CHECK ('pending','approved','rejected'), certificate_urls text[], stripe_payment_intent_id, stripe_subscription_id (on approve), rejection_reason, created_at, reviewed_at, reviewed_by, and RLS policies
- [ ] **SCH-02**: user_designations table with id, user_id, stripe_product_id, stripe_price_id, purchase_date, deleted_at (null = active), deleted_by, and RLS policies

## Future Requirements

### Payments (deferred to v1.4+)

- **PAY-01**: Proration handling UI for subscription upgrades/downgrades
- **PAY-02**: Refund dispute management (chargeback handling)
- **PAY-03**: Subscription pause feature
- **PAY-04**: Multi-currency analytics

### Analytics (deferred to v1.4+)

- **ANA-F01**: Coupon performance analytics
- **ANA-F02**: Product performance comparison charts

## Out of Scope

| Feature | Reason |
|---------|--------|
| Automatic role detection from Stripe metadata | Product names + price type are sufficient discriminators; metadata not reliably populated |
| School upgrade flow | Only teacher upgrade in v1.3; school registration already exists |
| Designation purchase flow (new checkout) | Existing cart/checkout handles one-time purchases; focus on upgrade flow only |
| Subscription downgrade (teacher → student) | Complex proration; admin-only action for now |
| Multi-currency | USD only for v1.3 |
| Real-time webhook side-effects in cron | Stub from v1.2 stays — cron clears queue without email/membership actions |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| FIX-01 | Phase 14 | Pending |
| FIX-02 | Phase 20 | Pending |
| FIX-03 | Phase 20 | Pending |
| FIX-04 | Phase 20 | Pending |
| FIX-05 | Phase 20 | Pending |
| SUB-01 | Phase 15 | Pending |
| SUB-02 | Phase 15 | Pending |
| SUB-03 | Phase 15 | Pending |
| SUB-04 | Phase 15 | Pending |
| SUB-05 | Phase 15 | Pending |
| SUB-06 | Phase 15 | Pending |
| SUB-07 | Phase 15 | Pending |
| SUB-08 | Phase 15 | Pending |
| UPG-01 | Phase 16 | Pending |
| UPG-02 | Phase 16 | Pending |
| UPG-03 | Phase 17 | Pending |
| UPG-04 | Phase 17 | Pending |
| UPG-05 | Phase 17 | Pending |
| UPG-06 | Phase 17 | Pending |
| UPG-07 | Phase 17 | Pending |
| UPG-08 | Phase 16 | Pending |
| UPG-09 | Phase 17 | Pending |
| ADM-01 | Phase 18 | Pending |
| ADM-02 | Phase 18 | Pending |
| ADM-03 | Phase 18 | Pending |
| ADM-04 | Phase 18 | Pending |
| ADM-05 | Phase 18 | Pending |
| SCH-01 | Phase 19 | Pending |
| SCH-02 | Phase 19 | Pending |

**Coverage:**
- v1.3 requirements: 29 total
- Mapped to phases: 29
- Unmapped: 0

---
*Requirements defined: 2026-03-24*
