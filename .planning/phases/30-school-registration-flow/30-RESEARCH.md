# Phase 30: School Registration Flow - Research

**Researched:** 2026-03-31
**Domain:** Next.js multi-step wizard, Stripe Checkout (subscription + one-time), Supabase server actions
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Step 1: School name text input + auto-generated URL-safe slug (editable), real-time slug uniqueness check via API (debounced), Continue CTA only enabled when name filled and slug is unique
- Step 2: Show all 8 school designation products as selectable cards (CYS200, CYS300, CYS500, CCYS, CPYS, CMS, CYYS, CRYS), multi-select, price per selection €40/year + €99 signup fee, running total at bottom, "Can't find your specialty? You can add more designations later." hint, "Continue to Payment" CTA
- Step 3: Server action creates Stripe Checkout Session, line items per selected designation (annual subscription price + one-time signup fee), success_url: /schools/create/success?session_id={CHECKOUT_SESSION_ID}, cancel_url: /schools/create?step=2, on success callback: create school record (status='pending'), create school_designations records, set principal_trainer_school_id on profile, redirect to onboarding
- Step 4: Success page verifies Stripe session, creates school + designations in DB, redirects to /schools/[slug]/onboarding
- Products already seeded in products table with slugs goya-cys200 etc., category 'school_designation'
- Need to look up actual Stripe price IDs from Stripe dashboard or products table; if no Stripe price IDs in DB, create via Stripe API or use env vars
- Only accessible to teachers
- Slug must be unique in schools table

### Claude's Discretion
- Exact visual design of designation cards
- Step indicator UI (progress bar, breadcrumbs, etc.)
- Animation between steps
- Error handling patterns

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| REG-01 | School name + auto-generated slug with uniqueness check at /schools/create step 1 | Slug gen pattern from existing onboarding/page.tsx; uniqueness check needs API route; existing schools table has slug UNIQUE constraint |
| REG-02 | Designation selection step showing 8 products as cards with prices and running total | 8 school_designation products confirmed in products table seed (goya-cys200 through goya-cms); prices €40/year + €99 signup fee |
| REG-03 | Stripe Checkout session with annual subscription + signup fee per selected designation | Pattern confirmed from app/upgrade/actions.ts; uses getStripe().checkout.sessions.create(); mode needs to be 'subscription' for recurring + one-time via add_invoice_items |
| REG-04 | Post-payment: school record created with status='pending', school_designations created | checkout.session.completed webhook handler pattern established in lib/stripe/handlers/checkout-session.ts; use metadata.type to discriminate |
| REG-05 | Redirect to onboarding flow after successful payment | Success page reads session_id from URL, verifies session, redirects to /schools/[slug]/onboarding |
</phase_requirements>

---

## Summary

Phase 30 replaces the existing `/schools/create` landing page and `/schools/create/onboarding` multi-step form with a new 3-step registration wizard: (1) name/slug, (2) designation selection, (3) Stripe Checkout, plus a (4) post-payment success/redirect page.

The codebase has a complete, working Stripe Checkout integration pattern in `app/upgrade/actions.ts` and `lib/stripe/handlers/checkout-session.ts`. The key difference for school registration is that it requires **subscription mode with add_invoice_items** (annual subscription + one-time signup fee per designation) vs. the upgrade flow's simple one-time payment. Post-payment DB writes happen in the webhook handler, not on the success page — the success page only verifies the session and redirects.

A critical open question is whether Stripe price IDs for the 8 school designation products already exist in the `stripe_prices` table (synced from Stripe via webhooks) or need to be created. The `products` table has `stripe_product_id` (nullable) but no `stripe_price_id` column — prices are in the separate `stripe_prices` table. The plan must include a task to resolve this before the checkout action can be completed.

**Primary recommendation:** Use the upgrade flow as the exact template. Replace the existing `/schools/create/page.tsx` and `/schools/create/onboarding/page.tsx` with a new client-side wizard at `/schools/create/page.tsx` (URL param `?step=1|2|3`) plus a server-rendered `/schools/create/success/page.tsx` that verifies the Stripe session and redirects.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js App Router | 15+ (project standard) | Page routing, server actions | Project uses throughout |
| `@supabase/ssr` (createSupabaseServerActionClient) | project standard | Auth + DB in server actions | Established pattern in lib/supabaseServer.ts |
| `getStripe()` from `lib/stripe/client.ts` | project standard | Stripe SDK singleton | `import 'server-only'`, singleton, used in all checkout flows |
| Stripe Checkout Sessions | — | Hosted payment page | Established in upgrade flow; no custom card UI needed |
| `getSupabaseService()` | project standard | Service role writes in webhook handlers | Used in lib/stripe/handlers/checkout-session.ts |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `useSearchParams` + `useRouter` | Next.js built-in | Step navigation via URL params | Step state in URL so back/cancel_url works correctly |
| `useMemo` / `useState` | React | Local wizard state | Multi-select designation tracking, running total |
| `PageContainer` from `app/components/ui/PageContainer.tsx` | project standard | Width consistency | CLAUDE.md mandates this on all pages |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URL param `?step=N` for step state | Separate page routes per step | URL params allow cancel_url to go back to step 2 without extra routes |
| Webhook handler for DB writes | Success page API call | Webhooks are idempotent + retry-safe; success page can be re-visited without double-writes |

---

## Architecture Patterns

### Recommended File Structure
```
app/schools/create/
├── page.tsx               # Multi-step wizard (client component, replaces existing)
├── actions.ts             # Server actions: createSchoolCheckoutSession, checkSlugUniqueness
├── success/
│   └── page.tsx           # Post-payment: verifies session, redirects to onboarding
app/api/schools/
└── check-slug/
    └── route.ts           # GET ?slug=foo — returns { available: boolean }
lib/stripe/handlers/
└── checkout-session.ts    # Extended to handle 'school_registration' type
```

### Pattern 1: Step State via URL Search Params
**What:** Single `/schools/create` page reads `?step=1|2|3` from URL; step navigation pushes new URL.
**When to use:** Required because Stripe's `cancel_url` needs to return to step 2 with state intact.
**Example:**
```typescript
// 'use client'
const searchParams = useSearchParams()
const router = useRouter()
const step = Number(searchParams.get('step') ?? '1') as 1 | 2 | 3

function goToStep(n: number) {
  router.push(`/schools/create?step=${n}`)
}
```
Note: `useSearchParams` requires a `<Suspense>` boundary per Next.js 15 rules. Wrap the client component in Suspense in the page.

### Pattern 2: Checkout Session Server Action (Subscription + One-Time Fee)
**What:** For each selected designation, add two line items: an annual subscription price and a one-time signup fee. Stripe supports this via `mode: 'subscription'` + `subscription_data.add_invoice_items` for the one-time fee.
**When to use:** Every time a school selects designations at checkout.
**Example:**
```typescript
// app/schools/create/actions.ts
'use server'
import { getStripe } from '@/lib/stripe/client'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

export async function createSchoolCheckoutSession(
  schoolName: string,
  slug: string,
  designationTypes: string[],  // ['CYS200', 'CYS300', ...]
): Promise<{ url: string } | { error: string }> {
  const supabase = await createSupabaseServerActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Look up annual subscription price IDs and one-time signup fee price IDs
  // from env vars (see Stripe Price IDs section below)
  const lineItems = []
  const addInvoiceItems = []

  for (const type of designationTypes) {
    const annualPriceId = process.env[`STRIPE_SCHOOL_ANNUAL_PRICE_${type}`]
    const signupPriceId = process.env[`STRIPE_SCHOOL_SIGNUP_PRICE_${type}`]
    if (!annualPriceId || !signupPriceId) {
      return { error: `Stripe price not configured for ${type}` }
    }
    lineItems.push({ price: annualPriceId, quantity: 1 })
    addInvoiceItems.push({ price: signupPriceId })
  }

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: 'subscription',
      line_items: lineItems,
      subscription_data: {
        add_invoice_items: addInvoiceItems,
        metadata: { type: 'school_registration', user_id: user.id },
      },
      metadata: {
        type: 'school_registration',
        user_id: user.id,
        school_name: schoolName,
        school_slug: slug,
        designation_types: JSON.stringify(designationTypes),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/schools/create/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/schools/create?step=2`,
    })
    return { url: session.url! }
  } catch (err) {
    return { error: err instanceof Error ? err.message : 'Unknown error' }
  }
}
```

### Pattern 3: Slug Uniqueness API Route
**What:** Debounced GET request from client to check if a slug is taken in the `schools` table.
**When to use:** Real-time feedback as user types the school name / edits the slug.
**Example:**
```typescript
// app/api/schools/check-slug/route.ts
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  if (!slug) return NextResponse.json({ available: false })

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('schools')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
```

### Pattern 4: Webhook Handler Extension
**What:** Extend `lib/stripe/handlers/checkout-session.ts` to handle `metadata.type === 'school_registration'`.
**When to use:** On `checkout.session.completed` event.
**Key operations:**
1. Parse `session.metadata` to extract `user_id`, `school_name`, `school_slug`, `designation_types`
2. Insert into `schools` table with `status: 'pending'`, `owner_id: user_id`
3. Insert one row per designation into `school_designations` with `stripe_subscription_id` from session
4. Update `profiles` table: set `principal_trainer_school_id = school.id` for the user
5. Use `getSupabaseService()` (service role) for all writes — same as existing pattern

### Pattern 5: Success Page — Verify and Redirect
**What:** Server Component that reads `session_id` from URL, retrieves the Stripe session, finds the school created by the webhook, and redirects to onboarding.
**When to use:** After Stripe redirects to `/schools/create/success?session_id=...`
**Key insight:** DB writes happen in the webhook, not here. The success page just reads the school record (via `owner_id = user.id`) to get the slug, then redirects. Add a brief wait/retry if the webhook hasn't fired yet.

### Anti-Patterns to Avoid
- **Writing to DB on success page:** The success page can be re-visited (browser back, network retry). All DB mutations belong in the webhook handler, not the success redirect.
- **Storing step state only in React state:** If the page is unmounted between steps (e.g., redirect for auth), state is lost. Use URL params for step and localStorage for form data (as the existing onboarding does).
- **Using `mode: 'payment'` for recurring + one-time:** The upgrade flow uses `mode: 'payment'` for one-time only. School designations need `mode: 'subscription'` with `add_invoice_items` for the signup fee.
- **Not wrapping `useSearchParams` in Suspense:** Next.js 15 requires a Suspense boundary around components that call `useSearchParams` to avoid CSR bailout.
- **Hardcoding Stripe price IDs in source code:** The upgrade flow hardcodes one price ID; for 8 designations × 2 prices = 16 IDs, use env vars or a lookup table.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Debounced slug check | Custom debounce utility | `setTimeout` + `clearTimeout` in useEffect (3 lines), or `use-debounce` npm pkg | Simple enough inline; no framework needed |
| Slug generation | Custom regex | Existing `generateSlug()` function in `app/schools/create/onboarding/page.tsx` — copy/extract | Already written and tested in this codebase |
| Stripe hosted checkout | Custom payment form | `getStripe().checkout.sessions.create()` → redirect to `session.url` | PCI compliance, localization, error handling |
| Idempotent webhook processing | Custom deduplication | Existing `webhook_events` table with `unique_violation` check in `app/api/webhooks/stripe/route.ts` | Already handles duplicate events |
| Service role DB writes | Anon client | `getSupabaseService()` from `lib/supabase/service.ts` | RLS bypassed safely for webhook handler writes |

**Key insight:** The slug generation logic already exists in the old onboarding page — extract it into a shared utility rather than rewriting.

---

## Critical Finding: Stripe Price IDs for School Designations

**Status: UNRESOLVED — must be addressed in Wave 0 of the plan.**

The `products` table has `stripe_product_id` (nullable) but **no `stripe_price_id` column**. Stripe prices live in the `stripe_prices` table (keyed by `stripe_id`, linked by `stripe_product_id`). There are NO school designation price IDs found anywhere in the codebase (env vars, hardcoded, or DB seed data).

The upgrade flow hardcodes one price ID (`price_1TE4kfDLfij4i9P9sUpSD2Si`) directly in the action. For 8 designations × 2 price types (annual subscription + one-time signup fee) = up to 16 price IDs.

**Two viable approaches:**

**Option A — Env vars (recommended for now):**
Add env vars per designation + type:
```
STRIPE_SCHOOL_ANNUAL_PRICE_CYS200=price_xxx
STRIPE_SCHOOL_SIGNUP_PRICE_CYS200=price_xxx
... (16 total)
```
This matches how the upgrade flow is done and requires zero DB migration. The plan must include a Wave 0 task: "Create Stripe prices for school designations and add to env vars."

**Option B — Single shared price (simpler but less flexible):**
Since all 8 designations have identical pricing (€40/year + €99 signup), use 2 shared price IDs — one for all annual subscriptions, one for all signup fees. Reduces env vars to 2.
This is architecturally cleaner and aligns with how Stripe products are typically structured when items share the same price.

**Recommendation:** Option B (2 shared price IDs) because all 8 designations have identical pricing. Add `STRIPE_SCHOOL_ANNUAL_PRICE_ID` and `STRIPE_SCHOOL_SIGNUP_FEE_PRICE_ID` to env vars. Store the price IDs used in each `school_designations` row (`stripe_price_id` column already exists in that table).

---

## Common Pitfalls

### Pitfall 1: Webhook Race Condition on Success Page
**What goes wrong:** User lands on `/schools/create/success` before the `checkout.session.completed` webhook has fired and created the school record. The page tries to query the school by `owner_id` and gets nothing, then redirects incorrectly or shows an error.
**Why it happens:** Webhooks are asynchronous — Stripe fires them after redirecting the user, typically within seconds but not instantly.
**How to avoid:** Success page should not depend on DB state. Option A: Pass `school_slug` in Stripe session metadata and include it in the `success_url` as a parameter. Option B: Retry the DB query up to 3 times with 1-second delays. Option A is simpler and more reliable.
**Implementation:** `success_url: .../success?session_id={CHECKOUT_SESSION_ID}&slug=${slug}` — include the slug from step 1 in the metadata and success URL so the page can redirect without querying.

### Pitfall 2: Missing Suspense Boundary for useSearchParams
**What goes wrong:** Build fails or hydration errors with "useSearchParams() should be wrapped in a suspense boundary".
**Why it happens:** Next.js 15 App Router requires Suspense around components using `useSearchParams` to avoid full-page CSR bailout.
**How to avoid:** Wrap the wizard client component in `<Suspense fallback={<LoadingState />}>` in the page.tsx server component.

### Pitfall 3: Teacher Role Check Missing
**What goes wrong:** Students or non-teacher roles can access the wizard and create schools.
**Why it happens:** The existing `/schools/create` page only checks `if (!user) redirect('/sign-in')` — no role check.
**How to avoid:** In the page server component (before rendering the wizard), check `profile.role === 'teacher'`. If not a teacher, redirect to `/dashboard`. Also check `principal_trainer_school_id` is null (teacher doesn't already have a school).

### Pitfall 4: Double School Creation
**What goes wrong:** Webhook fires twice (Stripe retries on timeout), creating two school records for the same user.
**Why it happens:** Stripe retries failed webhooks. The existing idempotency gate in the webhook route prevents processing the same `event.id` twice, but if the handler fails mid-way after inserting the school but before updating the webhook status, it could re-run.
**How to avoid:** Use `upsert` with `ON CONFLICT (owner_id)` for the school insert, OR check `stripe_checkout_session_id` in session metadata before inserting. The existing webhook idempotency gate (unique `stripe_event_id` in `webhook_events`) already handles most cases.

### Pitfall 5: Stripe Subscription Mode vs Payment Mode
**What goes wrong:** Using `mode: 'payment'` for what is actually a subscription + one-time fee, causing the subscription to not be created.
**Why it happens:** The existing upgrade flow uses `mode: 'payment'` for one-time fees. School designations require annual renewal = subscription.
**How to avoid:** Use `mode: 'subscription'` with `subscription_data.add_invoice_items` for the one-time signup fee. Stripe only supports `add_invoice_items` in subscription mode.

---

## Existing Code to Replace

The following files will be **fully replaced** (not modified):

| File | Current Content | New Content |
|------|----------------|-------------|
| `app/schools/create/page.tsx` | Landing page with pricing info and CTA button | Multi-step wizard (Step 1: name/slug, Step 2: designations, Step 3: checkout trigger) |
| `app/schools/create/onboarding/page.tsx` | 6-step form (name, logo, description, address, links, review) that submits directly to DB | **Deleted** — Phase 31 will rebuild onboarding at `/schools/[slug]/onboarding` |

There is also `app/schools/create/page 2.tsx` (note the space) — this appears to be a stale duplicate and should be deleted.

The existing `generateSlug()` function in `app/schools/create/onboarding/page.tsx` (line 52-54) should be extracted to a utility file and reused:
```typescript
// lib/schools/slug.ts
export function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Direct DB write on form submit (old onboarding) | Stripe Checkout → webhook → DB write | Phase 30 (this phase) | Payment is now required before school record creation |
| Single landing page + separate onboarding | 3-step wizard at /schools/create | Phase 30 (this phase) | Name/slug/designations collected before payment |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Stripe API (STRIPE_SECRET_KEY) | Checkout session creation | ✓ | Confirmed (used in upgrade flow) | — |
| NEXT_PUBLIC_APP_URL | success_url / cancel_url | ✓ | Confirmed in upgrade/actions.ts | — |
| STRIPE_WEBHOOK_SECRET | Webhook signature verification | ✓ | Confirmed in webhook route | — |
| School designation Stripe price IDs | Checkout line items | ✗ | Not found in codebase or env | Wave 0 task: create prices in Stripe, add to .env |

**Missing dependencies with no fallback:**
- Stripe price IDs for school designations (annual subscription + signup fee) — Wave 0 must create these in Stripe and add to env vars before the checkout action can be implemented.

---

## Validation Architecture

Config `workflow.nyquist_validation` is not set to false — validation section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.x |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run __tests__/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REG-01 | Slug generation produces URL-safe strings | unit | `npx vitest run __tests__/school-slug.test.ts` | ❌ Wave 0 |
| REG-01 | Slug uniqueness API returns correct availability | unit (mocked) | `npx vitest run __tests__/check-slug-route.test.ts` | ❌ Wave 0 |
| REG-03 | createSchoolCheckoutSession builds correct line items | unit (mocked Stripe) | `npx vitest run __tests__/school-checkout-actions.test.ts` | ❌ Wave 0 |
| REG-04 | Webhook handler creates school + designations on school_registration type | unit (mocked Supabase) | `npx vitest run __tests__/checkout-session-handler.test.ts` | ✅ (extends existing) |
| REG-02 | Designation selection UI — not unit-testable without browser | manual | Manual smoke test | — |
| REG-05 | Success page redirect — requires Stripe session mock | manual | Manual smoke test | — |

### Wave 0 Gaps
- [ ] `__tests__/school-slug.test.ts` — covers REG-01 slug generation
- [ ] `__tests__/check-slug-route.test.ts` — covers REG-01 uniqueness check (mock Supabase)
- [ ] `__tests__/school-checkout-actions.test.ts` — covers REG-03 checkout session shape
- [ ] `lib/schools/slug.ts` — extracted slug utility (shared between wizard and tests)

---

## Open Questions

1. **Stripe Price IDs for School Designations**
   - What we know: All 8 designations share identical pricing (€40/year + €99 signup fee). The `stripe_prices` table is synced from Stripe webhooks. No school designation price IDs exist in the codebase.
   - What's unclear: Whether these prices already exist in the Stripe account (test + production). The `products` table has `stripe_product_id` nullable — the school designation products may not have been linked to Stripe products yet.
   - Recommendation: Wave 0 task must create 2 Stripe prices (or 16 if per-designation) and populate `STRIPE_SCHOOL_ANNUAL_PRICE_ID` + `STRIPE_SCHOOL_SIGNUP_FEE_PRICE_ID` env vars. If the products already exist in Stripe, also set `stripe_product_id` on the 8 school designation rows in the `products` table.

2. **Stripe Customer Handling**
   - What we know: The upgrade flow does not pass a `customer` to the checkout session. Stripe creates a new customer each time.
   - What's unclear: Whether teachers registering a school should be linked to an existing Stripe customer (e.g., their existing subscription customer).
   - Recommendation: For simplicity in Phase 30, don't pass `customer` — let Stripe create a new customer. This matches the upgrade pattern and avoids complexity.

3. **Currency: EUR vs USD**
   - What we know: The CONTEXT.md specifies €40/year + €99 signup fee (EUR). The existing upgrade flow uses USD (`$99`). The `products` table `price_display` shows `$40.00/year` for school designations (USD).
   - What's unclear: Whether the actual Stripe prices should be EUR or USD.
   - Recommendation: Follow whatever the Stripe prices are set to when created. The UI should display the currency from the Stripe price, not hardcoded €/$ symbols. Flag for human decision.

---

## Sources

### Primary (HIGH confidence)
- Direct code inspection: `app/upgrade/actions.ts` — checkout session creation pattern
- Direct code inspection: `lib/stripe/handlers/checkout-session.ts` — webhook handler pattern
- Direct code inspection: `app/api/webhooks/stripe/route.ts` — idempotency + dispatch pattern
- Direct code inspection: `lib/stripe/client.ts` — Stripe singleton
- Direct code inspection: `supabase/migrations/20260376_school_owner_schema.sql` — school_designations table schema
- Direct code inspection: `supabase/migrations/20260332_add_products_table.sql` — 8 school designation products confirmed
- Direct code inspection: `types/supabase.ts` — TypeScript types for school_designations, products, stripe_prices
- Direct code inspection: `app/schools/create/onboarding/page.tsx` — existing slug generation utility
- Direct code inspection: `lib/supabaseServer.ts` — server action client pattern
- Direct code inspection: `app/components/ui/PageContainer.tsx` — CLAUDE.md-mandated layout wrapper
- Direct code inspection: `vitest.config.ts` — test framework

### Secondary (MEDIUM confidence)
- Stripe documentation knowledge: `mode: 'subscription'` + `subscription_data.add_invoice_items` for mixed recurring + one-time in Checkout Sessions

### Tertiary (LOW confidence)
- None

---

## Project Constraints (from CLAUDE.md)

The following directives from CLAUDE.md must be honored in all tasks for this phase:

1. **PageContainer mandatory:** All page content must use `app/components/ui/PageContainer.tsx` (max-w-7xl, px-4/6/8). Never hardcode max-width or horizontal padding on pages directly.
2. **Documentation required after task:** After completing tasks, update docs in `docs/` audience folders. For this phase: `docs/teacher/` (registration flow how-to) and possibly `docs/developer/` (Stripe integration pattern). Run `npm run docs:index` after.
3. **Activity tracking:** After phase completion, create `activity/vX-X-X_MilestoneName_DD-MM-YYYY.md`.
4. **Error logging:** Append unexpected errors to `LOG.md` under "Open Issues".
5. **Supabase migrations:** Always run `npx supabase db push` after creating a migration file.
6. **Server action auth pattern:** Use `createSupabaseServerActionClient()` (not the browser client) in all `'use server'` files.
7. **Webhook writes use service role:** Always use `getSupabaseService()` in webhook handlers (bypasses RLS).
8. **No new `lib/stripe.ts`:** Stripe singleton is at `lib/stripe/client.ts`, imported as `getStripe()`.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — confirmed from direct code inspection of working patterns
- Architecture patterns: HIGH — derived from existing upgrade flow which is fully operational
- Stripe price IDs: LOW — not found anywhere in codebase; must be created/configured
- Pitfalls: HIGH — derived from code analysis and known Stripe/Next.js constraints

**Research date:** 2026-03-31
**Valid until:** 2026-04-30 (stable stack)
