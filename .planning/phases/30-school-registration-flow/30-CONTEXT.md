# Phase 30: School Registration Flow - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Multi-step wizard at /schools/create for teachers to: (1) enter school name + auto-generated slug with uniqueness check, (2) select designations from 8 products as selectable cards with running total, (3) Stripe Checkout with annual subscription + signup fee per designation, (4) post-payment redirect to onboarding.

IMPORTANT: An existing /schools/create page already exists — it must be REPLACED/REBUILT with the new multi-step flow.

</domain>

<decisions>
## Implementation Decisions

### Step 1: School Name + Slug
- School name text input
- Auto-generate URL-safe slug from name (editable by user)
- Real-time slug uniqueness check via API (debounced)
- "Continue" CTA only enabled when name is filled and slug is unique

### Step 2: Select Designations
- Show all 8 school designation products as selectable cards:
  - CYS200, CYS300, CYS500, CCYS, CPYS, CMS, CYYS, CRYS
- Each card shows: designation name, description, logo/icon
- Multi-select (user can pick multiple)
- Price per selection: €40/year + €99 signup fee each
- Running total shown at bottom
- "Can't find your specialty? You can add more designations later."
- "Continue to Payment" CTA

### Step 3: Stripe Checkout
- Server action creates Stripe Checkout Session
- Line items: for each selected designation, add annual subscription price + one-time signup fee
- success_url: /schools/create/success?session_id={CHECKOUT_SESSION_ID}
- cancel_url: /schools/create?step=2
- On success callback: create school record (status='pending'), create school_designations records, set principal_trainer_school_id on profile
- Redirect to onboarding flow

### Step 4: Post-payment redirect
- Success page verifies Stripe session
- Creates school + designations in DB
- Redirects to /schools/[slug]/onboarding (Phase 31)

### Stripe Products
- Products already seeded in `products` table with slugs: goya-cys200, goya-cys300, etc.
- Each has category 'school_designation'
- Need to look up actual Stripe price IDs from Stripe dashboard or products table
- If no Stripe price IDs in DB, create them via Stripe API or use env vars

### Claude's Discretion
- Exact visual design of designation cards
- Step indicator UI (progress bar, breadcrumbs, etc.)
- Animation between steps
- Error handling patterns

</decisions>

<code_context>
## Existing Code Insights

### Existing School Create Page
- app/schools/create/page.tsx — landing page with pricing info and CTA
- app/schools/create/onboarding/page.tsx — 6-step onboarding form
- These need to be replaced/rebuilt

### Stripe Integration
- lib/stripe.ts — Stripe SDK singleton
- Existing checkout patterns in the upgrade flow (app/upgrade/)
- Stripe webhook at app/api/webhooks/stripe/route.ts

### Database
- schools table with owner_id, name, slug, status fields
- school_designations table with school_id, designation_type, stripe_subscription_id, stripe_signup_payment_id, status
- products table with school designation products (goya-cys200 etc.)

### Auth Pattern
- Use getSupabaseServer() for server-side auth
- Teachers only (role check)

</code_context>

<specifics>
## Specific Ideas

- €40/year + €99 signup fee per designation
- Only accessible to teachers
- Slug must be unique in schools table

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
