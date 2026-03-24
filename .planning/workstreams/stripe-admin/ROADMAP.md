# Roadmap: GOYA v2 — v1.3 Subscriptions & Teacher Upgrade

## Overview

Seven phases deliver the Subscriptions page Stripe integration and Teacher Upgrade flow. The dependency chain: schema first (Phase 19) so tables exist for all subsequent work, then bug fixes (Phase 14) and broken admin page fixes (Phase 20) can run in parallel, followed by subscriptions page (Phase 15), upgrade CTA (Phase 16), upgrade page (Phase 17), and admin inbox (Phase 18).

## Phases

**Phase Numbering:** Continues from v1.2 (Phases 8–13). This milestone uses Phases 14–20.

- [ ] **Phase 14: Fix Role Display Bug** - Fix admin/moderator "Guest" display on Subscriptions page
- [ ] **Phase 15: Subscriptions Page — Real Stripe Data** - Replace placeholder with live Stripe membership, designations, school, Customer Portal
- [ ] **Phase 16: Upgrade CTA** - Show upgrade prompts for students/WPs on Subscriptions page and in Shop
- [ ] **Phase 17: Upgrade Page** - Multi-step /upgrade page with certificate upload and Stripe delayed capture
- [ ] **Phase 18: Admin Inbox — Teacher Upgrades** - Admin approve/reject flow with payment capture and role change
- [ ] **Phase 19: Supabase Schema** - Create upgrade_requests and user_designations tables with RLS
- [ ] **Phase 20: Fix Broken Admin Pages** - Fix 3 crashing admin pages + add Create Product button

## Phase Details

### Phase 14: Fix Role Display Bug
**Goal**: Admin and moderator users never show "Guest" on the Subscriptions page
**Depends on**: Nothing (standalone fix)
**Requirements**: FIX-01
**Success Criteria** (what must be TRUE):
  1. Admin user sees "Admin Member" on Subscriptions page regardless of Stripe subscription status
  2. Moderator user sees "Moderator Member" on Subscriptions page regardless of Stripe subscription status
  3. The fix is a display + logic change, not a Stripe data change
**Plans**: 1 plan

### Phase 15: Subscriptions Page — Real Stripe Data
**Goal**: Subscriptions page shows real Stripe membership data with Customer Portal access and soft-deletable designations
**Depends on**: Phase 14 (role display logic), Phase 19 (user_designations table)
**Requirements**: SUB-01, SUB-02, SUB-03, SUB-04, SUB-05, SUB-06, SUB-07, SUB-08
**Success Criteria** (what must be TRUE):
  1. User with active Stripe membership sees correct plan name and price with "Verwalten" button opening Stripe Customer Portal
  2. User with no active Stripe membership but with a role sees role-based plan name
  3. Additional recurring subscriptions beyond base membership shown in separate box
  4. School membership box appears only for school owners
  5. Designations listed with delete button that soft-deletes via deleted_at (no Stripe cancellation, no refund)
  6. Layout uses stacked content boxes with visual separators
**Plans**: 2 plans
**UI hint**: yes

### Phase 16: Upgrade CTA
**Goal**: Students and wellness practitioners see upgrade prompts on Subscriptions page and in Shop
**Depends on**: Phase 15 (subscriptions page exists), Phase 19 (upgrade_requests table for pending state)
**Requirements**: UPG-01, UPG-02, UPG-08
**Success Criteria** (what must be TRUE):
  1. Student/WP sees upgrade CTA card on Subscriptions page below current plan
  2. Teacher Membership product visible only to students/WPs in Shop with "Upgrade" label
  3. If upgrade request is pending: CTA hidden everywhere, info card shown on Subscriptions page, Teacher Membership hidden in Shop
**Plans**: 1 plan
**UI hint**: yes

### Phase 17: Upgrade Page (/upgrade)
**Goal**: Multi-step upgrade page with certificate upload, Stripe delayed capture, and success page
**Depends on**: Phase 16 (CTA links to /upgrade), Phase 19 (upgrade_requests table)
**Requirements**: UPG-03, UPG-04, UPG-05, UPG-06, UPG-07, UPG-09
**Success Criteria** (what must be TRUE):
  1. Step 1 shows teacher membership info with "Start Upgrade" button
  2. Step 2 allows 1-3 file uploads (PDF/JPG/PNG/WEBP, max 4MB) to Supabase Storage with progress and previews
  3. Step 3 creates Payment Intent with capture_method: "manual" and redirects to Stripe Checkout
  4. On checkout.session.completed: upgrade_request created with status "pending", no role change, no payment capture
  5. /upgrade/success page shows confirmation with 48-hour timeline
  6. Admin inbox notification triggered on submission
**Plans**: 2 plans
**UI hint**: yes

### Phase 18: Admin Inbox — Teacher Upgrades
**Goal**: Admins can approve or reject teacher upgrade requests with payment capture and role change
**Depends on**: Phase 17 (upgrade requests exist to review)
**Requirements**: ADM-01, ADM-02, ADM-03, ADM-04, ADM-05
**Success Criteria** (what must be TRUE):
  1. "Teacher Upgrades" tab exists in /admin/inbox matching School Registrations pattern
  2. Request cards show user info, certificates (downloadable), payment details, submission date
  3. Approve captures payment, activates subscription, changes role to teacher, migrates designations, notifies user
  4. Reject cancels payment intent (no charge), sets rejection reason, notifies user, restores CTA
  5. Sub-tabs: Pending | Approved | Rejected
**Plans**: 2 plans
**UI hint**: yes

### Phase 19: Supabase Schema
**Goal**: Database tables for upgrade requests and user designations exist with proper RLS
**Depends on**: Nothing (first phase to execute — other phases depend on this)
**Requirements**: SCH-01, SCH-02
**Success Criteria** (what must be TRUE):
  1. upgrade_requests table exists with all columns, CHECK constraint on status, and RLS policies
  2. user_designations table exists with all columns, soft-delete pattern (deleted_at), and RLS policies
  3. Migrations applied successfully via `npx supabase db push`
**Plans**: 1 plan

### Phase 20: Fix Broken Admin Pages
**Goal**: Three crashing admin pages load without errors and products page has Create Product button
**Depends on**: Nothing (independent fixes)
**Requirements**: FIX-02, FIX-03, FIX-04, FIX-05
**Success Criteria** (what must be TRUE):
  1. /admin/shop/orders loads without server-side exceptions
  2. /admin/shop/analytics loads without server-side exceptions
  3. /admin/audit-log loads without server-side exceptions
  4. All three pages show empty state when data is unavailable (never crash)
  5. /admin/shop/products has a "+ Create Product" button matching coupons page pattern
**Plans**: 1 plan

## Progress

**Execution Order:** 19 → 14 + 20 (parallel) → 15 → 16 → 17 → 18

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 19. Supabase Schema | 0/1 | Not started | - |
| 14. Fix Role Display Bug | 0/1 | Not started | - |
| 20. Fix Broken Admin Pages | 0/1 | Not started | - |
| 15. Subscriptions Page | 0/2 | Not started | - |
| 16. Upgrade CTA | 0/1 | Not started | - |
| 17. Upgrade Page | 0/2 | Not started | - |
| 18. Admin Inbox — Teacher Upgrades | 0/2 | Not started | - |
