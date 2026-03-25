# Phase 9: Stripe SDK + Webhook Infrastructure - Research

**Researched:** 2026-03-23
**Domain:** Stripe SDK, Next.js App Router route handlers, server-only guards, webhook signature verification
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DB-04 | Stripe SDK singleton exists at `lib/stripe/client.ts` with a server-only guard (never imported in Client Components) | `server-only` npm package pattern documented; lazy singleton approach from `lib/supabase/service.ts` and `lib/email/client.ts` codebase patterns verified |
| DB-05 | Webhook endpoint at `/api/webhooks/stripe` verifies Stripe signature using raw request body (`request.text()`, not `request.json()`) and dispatches to per-entity event handlers | `stripe.webhooks.constructEvent()` signature, `request.text()` requirement, 400/200 return pattern all documented with sources |
</phase_requirements>

---

## Summary

Phase 9 is two files: a server-only Stripe SDK singleton and a webhook route handler. No database schema changes, no UI, no migrations. The deliverables are pure TypeScript code that Phase 10 will build on top of.

The Stripe SDK (`stripe` npm package, currently v20.4.1) is not yet installed in this project. It must be added. The `server-only` npm package (v0.0.1) is also not installed but must be added to enforce the server-side boundary at build time. Neither `STRIPE_WEBHOOK_SECRET` is present in `.env.local` — it must be added manually after running `stripe listen` locally.

The critical implementation detail for webhooks: Stripe signs the raw request body bytes. Any framework middleware that parses the body first (e.g., `req.json()`) mutates the byte stream and invalidates the HMAC signature. In Next.js App Router, `request.text()` reads the raw body string without parsing, preserving the bytes Stripe signed. The `export const config = { api: { bodyParser: false } }` escape hatch is Pages Router only — App Router does not use it.

**Primary recommendation:** Model `lib/stripe/client.ts` on the existing `lib/supabase/service.ts` pattern (lazy singleton + `server-only` import guard). Model `app/api/webhooks/stripe/route.ts` on the existing cron route pattern (`NextResponse` + header auth check), substituting `stripe.webhooks.constructEvent()` for the CRON_SECRET check.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `stripe` | 20.4.1 | Official Stripe Node.js SDK | Only official SDK; typed, maintained by Stripe |
| `server-only` | 0.0.1 | Build-time guard preventing client import | Next.js official recommendation per docs |

### No New Dev Dependencies
Vitest is already installed (v2.1.9). No additional test tooling needed.

**Installation:**
```bash
npm install stripe server-only
```

**Version verification (confirmed 2026-03-23):**
```bash
npm view stripe version       # 20.4.1
npm view server-only version  # 0.0.1
```

### Environment Variables

`.env.local` currently has:
- `STRIPE_SECRET_KEY` — already present (test key `sk_test_...`)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — already present
- `STRIPE_WEBHOOK_SECRET` — **MISSING** — must be added

`STRIPE_WEBHOOK_SECRET` is obtained by running `stripe listen` (Stripe CLI). The CLI prints a `whsec_...` value which is the local endpoint's signing secret. It is different from the production webhook secret in the Stripe Dashboard.

**Required `.env.local` addition:**
```
STRIPE_WEBHOOK_SECRET=whsec_...   # from: stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## Architecture Patterns

### Recommended File Structure

```
lib/
└── stripe/
    └── client.ts          # DB-04: server-only Stripe singleton

app/
└── api/
    └── webhooks/
        └── stripe/
            └── route.ts   # DB-05: POST handler — signature verification + dispatch stub
```

Phase 9 creates exactly these two files. No other files are touched.

### Pattern 1: Server-Only Lazy Singleton (`lib/stripe/client.ts`)

**What:** A module-level singleton that initializes the Stripe client at first call, never at import time. The `import 'server-only'` at the top causes a build error if any Client Component imports this file.

**When to use:** Any server-side code that needs to call the Stripe API.

**Modeled on:** `lib/supabase/service.ts` (same lazy pattern, same server guard intent) and `lib/email/client.ts` (same proxy/lazy approach). The `server-only` import is the new addition.

```typescript
// Source: Next.js docs (server-only pattern) + lib/supabase/service.ts codebase pattern
import 'server-only'
import Stripe from 'stripe'

// Lazy initialization — avoids crashing at build time if env var is missing
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}
```

**Why lazy (not top-level `new Stripe(...)`):** Top-level initialization runs at module load time during Next.js build. If `STRIPE_SECRET_KEY` is not available in the build environment, a top-level `new Stripe(process.env.STRIPE_SECRET_KEY!)` throws at build time, breaking CI. The lazy pattern (initialize at first call) avoids this. Identical rationale to `lib/supabase/service.ts` and `lib/email/client.ts` in this codebase.

**What `import 'server-only'` does:** Next.js intercepts this import. If any Client Component (file with `'use client'`) imports a module that transitively imports `server-only`, Next.js throws a build error: `You're importing a component that needs "server-only" but none of its parents are Server Components.` This is a build-time guarantee, not a runtime check. Source: Next.js docs (2026-03-03, verified).

**apiVersion:** The `stripe` SDK v20.4.1 no longer requires passing `apiVersion` in the constructor — it defaults to a recent stable version. If the plan requires pinning, use the string from `stripe/package.json`. Do not guess the date string.

### Pattern 2: Webhook Route Handler (`app/api/webhooks/stripe/route.ts`)

**What:** A `POST` route handler that: (1) reads raw body with `request.text()`, (2) verifies Stripe signature with `stripe.webhooks.constructEvent()`, (3) returns 400 on bad signature, 200 on success. Phase 9 only stubs the dispatch — actual event handlers come in Phase 10.

**When to use:** Receives all Stripe-originated events. Every external Stripe event (product, price, payment, subscription, invoice, coupon) enters the system through this endpoint.

```typescript
// Source: Stripe docs (constructEvent pattern) + dev.to 2026 verified pattern
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe/client'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()                          // raw bytes — do NOT use request.json()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 })
  }

  // Phase 9: stub — idempotency insert + dispatch comes in Phase 10
  console.log(`[webhook] received: ${event.type} (${event.id})`)

  return NextResponse.json({ received: true }, { status: 200 })
}
```

**Why `request.text()` and not `request.json()`:** Stripe generates the HMAC-SHA256 signature over the exact bytes of the raw request body. `request.json()` parses the JSON, re-serializes internally, and may alter whitespace or key ordering — breaking the HMAC. `request.text()` returns the raw string exactly as Stripe sent it. This is not optional. Source: Stripe docs, verified by 2026 community patterns.

**Why no `export const config = { api: { bodyParser: false } }`:** This is Pages Router syntax only. App Router route handlers have no built-in body parsing — `request.text()` is the standard idiom. The config export does nothing in App Router and should not be included.

**Headers in Next.js 16:** The `headers()` function from `next/headers` is async in Next.js 15+. Always `await headers()` before calling `.get()`. Source: verified against Next.js 16.1.6 (this project's version).

**`constructEvent` exact signature:**
```typescript
stripe.webhooks.constructEvent(
  payload: string | Buffer,   // raw body from request.text()
  header: string,             // value of 'stripe-signature' header
  secret: string              // STRIPE_WEBHOOK_SECRET (whsec_...)
): Stripe.Event
// Throws: Stripe.errors.StripeSignatureVerificationError on bad/missing signature
```

Source: Stripe SDK — confirmed via quickstart docs and 2026 community articles.

### Anti-Patterns to Avoid

- **`request.json()` in webhook handler:** Parses body before signature check, always breaks HMAC. Return value is an object, not a raw string.
- **Top-level `new Stripe(process.env.STRIPE_SECRET_KEY!)`:** Crashes build if env var absent. Use lazy init.
- **`export const config = { api: { bodyParser: false } }`:** Pages Router only, silently ignored in App Router, creates confusion.
- **Importing `getStripe()` in a Client Component:** The `server-only` guard prevents this at build time, but never put `use client` in `lib/stripe/client.ts` and never pass the Stripe instance as a prop.
- **Using `headers()` synchronously:** In Next.js 15+, `headers()` returns a Promise. Forgetting `await` returns a Promise object, not the headers — `.get('stripe-signature')` returns `undefined` and every webhook returns 400.
- **Trusting event type without `constructEvent`:** Without signature verification, any HTTP client can forge a `payment_intent.succeeded` event.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Webhook signature verification | Custom HMAC-SHA256 logic | `stripe.webhooks.constructEvent()` | Handles timing-safe comparison, replay attack prevention (300s tolerance), multi-value header parsing |
| Server-side boundary enforcement | Runtime `typeof window` checks | `import 'server-only'` | Build-time error, not runtime error — caught before deployment |
| Stripe type definitions | Manual TypeScript interfaces for events | `Stripe.Event`, `Stripe.PaymentIntent`, etc. | SDK ships complete, accurate types for all 200+ event types |

**Key insight:** Stripe's HMAC signature includes a timestamp component to prevent replay attacks. Hand-rolled HMAC verification almost always misses the timestamp validation. `constructEvent()` handles this correctly.

---

## Common Pitfalls

### Pitfall 1: `request.json()` breaks signature verification
**What goes wrong:** Webhook handler calls `const body = await request.json()` then passes `JSON.stringify(body)` to `constructEvent`. Signature always fails.
**Why it happens:** `JSON.stringify` re-serializes the parsed object, which does not byte-for-byte match what Stripe signed (whitespace, key order may differ).
**How to avoid:** Always `const body = await request.text()`. Pass the raw string directly.
**Warning signs:** 400 responses with "No signatures found matching the expected signature" when testing with Stripe CLI.

### Pitfall 2: `await headers()` omitted
**What goes wrong:** `const headersList = headers()` without `await` returns a Promise. `headersList.get('stripe-signature')` returns `undefined`. Every request returns 400.
**Why it happens:** In Next.js 15+, `headers()` became async. Code from pre-15 tutorials omits `await`.
**How to avoid:** Always `const headersList = await headers()` in App Router route handlers (Next.js 16.1.6 is this project's version).
**Warning signs:** Signature check always fails even for valid Stripe CLI events; logs show `signature: null`.

### Pitfall 3: `STRIPE_WEBHOOK_SECRET` is not `STRIPE_SECRET_KEY`
**What goes wrong:** Dev uses `STRIPE_SECRET_KEY` (the API key, `sk_test_...`) as the webhook signing secret. `constructEvent` throws immediately — the format is wrong.
**Why it happens:** Two different secrets, confusingly named. `STRIPE_WEBHOOK_SECRET` starts with `whsec_` and is obtained from Stripe CLI or Stripe Dashboard webhook settings.
**How to avoid:** `.env.local` must have both keys. `STRIPE_WEBHOOK_SECRET` comes from running `stripe listen` (local) or the Stripe Dashboard webhook endpoint (production). It is never the same as the API secret key.
**Warning signs:** Error: "No signatures found" or "Invalid signature" immediately on Stripe CLI test events.

### Pitfall 4: Stripe CLI not installed — blocks local testing
**What goes wrong:** Success criterion 3 (valid Stripe-signed test event returns 200) cannot be verified without the Stripe CLI. `curl -X POST` with a fake body will always return 400 (correct behavior but not a valid test).
**Why it happens:** Stripe CLI is not a npm package; it requires separate installation (`brew install stripe/stripe-cli/stripe` on macOS).
**How to avoid:** Plan must include a Stripe CLI installation step. Verified: CLI is not installed on this machine (`stripe` command not found). Must be installed before the verification step.
**Warning signs:** `stripe: command not found` when running `stripe listen`.

### Pitfall 5: Top-level Stripe initialization crashes build
**What goes wrong:** `export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)` at module level. Build fails if `STRIPE_SECRET_KEY` is not available in the build environment (CI/CD).
**Why it happens:** Module-level code runs during Next.js build analysis.
**How to avoid:** Use the lazy initialization pattern (see Pattern 1 above). Initialize inside the getter function, not at module scope. Confirmed pattern in this codebase: `lib/supabase/service.ts` and `lib/email/client.ts` both use this approach.
**Warning signs:** Build error: `TypeError: Cannot read properties of undefined` during `next build`.

### Pitfall 6: Missing `STRIPE_WEBHOOK_SECRET` at runtime
**What goes wrong:** Webhook endpoint is deployed but `STRIPE_WEBHOOK_SECRET` is not set in Vercel environment variables. Every webhook returns 500 (from the guard check) or crashes with an unhandled error.
**How to avoid:** Add the variable check explicitly before `constructEvent`, return a clear 500 with a message (not 400, since it's a configuration error not a bad request). The route handler pattern above includes this check.

---

## Code Examples

### Full `lib/stripe/client.ts` (verified pattern)
```typescript
// Sources: Next.js docs (server-only), lib/supabase/service.ts codebase pattern
import 'server-only'
import Stripe from 'stripe'

let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not set')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return _stripe
}
```

### Full `app/api/webhooks/stripe/route.ts` for Phase 9 (verified 2026 pattern)
```typescript
// Sources: Stripe docs constructEvent, dev.to 2026 pattern, Next.js headers() async
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe/client'
import Stripe from 'stripe'

export async function POST(request: Request) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 })
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET not configured' }, { status: 500 })
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${message}` },
      { status: 400 }
    )
  }

  // Phase 9 stub — full dispatch + idempotency in Phase 10
  console.log(`[webhook] received: ${event.type} (${event.id})`)

  return NextResponse.json({ received: true }, { status: 200 })
}
```

### Testing with Stripe CLI (local verification)
```bash
# 1. Install Stripe CLI (macOS — CLI not installed on this machine)
brew install stripe/stripe-cli/stripe

# 2. Authenticate
stripe login

# 3. Forward events to local dev server — prints whsec_... signing secret
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# 4. In a second terminal, trigger a test event
stripe trigger payment_intent.succeeded

# Expected: route handler logs the event type + returns 200
# Expected: stripe listen shows "200 OK"
```

### Idempotency INSERT pattern (from Phase 8 research — Phase 10 will use this)
```typescript
// Source: Phase 8 research — webhook_events table INSERT ON CONFLICT
const supabase = getSupabaseService()
const { count } = await supabase
  .from('webhook_events')
  .insert({
    stripe_event_id: event.id,
    event_type: event.type,
    payload: event as unknown as Record<string, unknown>,
  }, { count: 'exact' })
  .onConflict('stripe_event_id')
  .ignore()

if (count === 0) {
  // Already processed — return 200 immediately
  return NextResponse.json({ received: true, skipped: true }, { status: 200 })
}
```
Note: Phase 9 does NOT implement this. It is documented here so the planner knows Phase 10 extends this handler, not replaces it.

---

## Phase Boundary: Phase 9 vs Phase 10

This distinction is load-bearing for planning:

| Concern | Phase 9 | Phase 10 |
|---------|---------|---------|
| Stripe SDK singleton | Create | Use |
| Webhook route file | Create with stub dispatch | Extend — add idempotency INSERT + 15 event handlers |
| `webhook_events` table writes | None | Full INSERT ON CONFLICT pattern |
| Event type handlers | None | All 15 (product, price, payment_intent, subscription, invoice, coupon) |
| Initial sync | None | Admin-triggered Stripe list API seed |

Phase 9's dispatch stub (`console.log`) is intentional. Signature verification is the only concern for Phase 9. Phase 10 will add the `webhook_events` INSERT and the per-entity handler routing to the same file.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| `stripe` npm package | `lib/stripe/client.ts` | ✗ | — | None — must install |
| `server-only` npm package | `lib/stripe/client.ts` | ✗ | — | None — must install |
| `STRIPE_SECRET_KEY` env var | Stripe client init | ✓ | sk_test_51... in .env.local | — |
| `STRIPE_WEBHOOK_SECRET` env var | `constructEvent` | ✗ | — | None — must add to .env.local after `stripe listen` |
| Stripe CLI | Local webhook testing (success criterion 3) | ✗ | — | None — must install to complete verification |
| Node.js | Runtime | ✓ | via Next.js | — |

**Missing dependencies with no fallback:**
- `stripe` npm package — install: `npm install stripe`
- `server-only` npm package — install: `npm install server-only`
- `STRIPE_WEBHOOK_SECRET` — add to `.env.local` after running `stripe listen` (value starts with `whsec_`)
- Stripe CLI — install: `brew install stripe/stripe-cli/stripe` — **required to verify success criterion 3**

**All four must be resolved before Phase 9 can be verified complete.**

---

## Validation Architecture

`workflow.nyquist_validation` is absent from `.planning/config.json` (treated as enabled).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DB-04 | `lib/stripe/client.ts` exports `getStripe()` returning a Stripe instance | unit | `npx vitest run --reporter=verbose` | ❌ Wave 0 |
| DB-04 | Importing `lib/stripe/client.ts` in a file without server context throws at build | manual-only | `next build` with a test Client Component that imports the module | N/A |
| DB-05 | POST to `/api/webhooks/stripe` with missing `stripe-signature` returns 400 | unit | `npx vitest run --reporter=verbose` | ❌ Wave 0 |
| DB-05 | POST to `/api/webhooks/stripe` with invalid signature returns 400 | unit | `npx vitest run --reporter=verbose` | ❌ Wave 0 |
| DB-05 | POST to `/api/webhooks/stripe` with valid Stripe-signed event returns 200 | integration | `stripe trigger payment_intent.succeeded` with `stripe listen` running | N/A — Stripe CLI required |

**Manual-only justifications:**
- `server-only` build-time behavior: Cannot be unit-tested; requires a full `next build` run with a Client Component that imports the module
- Valid Stripe CLI test: Requires the Stripe CLI to generate a correctly-signed payload; cannot be mocked at unit level without reimplementing HMAC-SHA256

### Wave 0 Gaps
- [ ] `__tests__/webhooks/stripe.test.ts` — covers DB-05 (missing/invalid signature → 400)
- [ ] `__tests__/lib/stripe/client.test.ts` — covers DB-04 (singleton returns Stripe instance, throws on missing env var)

*(Both test files need to be created in Wave 0. The route handler can be tested by mocking `stripe.webhooks.constructEvent` to throw vs succeed.)*

---

## Open Questions

1. **`apiVersion` pin or default?**
   - What we know: Stripe SDK v20.4.1 allows omitting `apiVersion` (defaults to latest stable). Pinning to a specific date string (e.g. `'2024-12-18'`) gives predictability if Stripe releases breaking changes.
   - What's unclear: Whether this project needs to pin. There is no existing Stripe SDK usage to reference.
   - Recommendation: Use the default (no `apiVersion` argument) for Phase 9. Phase 10 can pin if needed.

2. **`STRIPE_WEBHOOK_SECRET` for production (Vercel)**
   - What we know: The local `whsec_` from Stripe CLI is different from the production webhook signing secret configured in Stripe Dashboard.
   - What's unclear: Whether Vercel environment variables for production are already set.
   - Recommendation: Phase 9 only needs the local `.env.local` value for success criterion 3. Production config is a Phase 9 task to document but not block on.

3. **`getStripe()` function export vs named `stripe` export**
   - What we know: `lib/supabase/service.ts` uses `getSupabaseService()` (function). `lib/email/client.ts` uses both `getResend()` and a Proxy-based `resend` export.
   - Recommendation: Use `getStripe()` (function) pattern matching `lib/supabase/service.ts` for consistency. Simpler than the Proxy approach.

---

## Sources

### Primary (HIGH confidence)
- Next.js docs (nextjs.org, version 16.2.1, last updated 2026-03-03) — `server-only` package behavior, build-time error, `headers()` async requirement
- `lib/supabase/service.ts` (codebase) — lazy singleton pattern confirmed
- `lib/email/client.ts` (codebase) — lazy singleton alternative confirmed
- `app/api/cron/credits-expiring/route.ts` (codebase) — existing POST handler pattern confirmed
- npm registry: `stripe@20.4.1`, `server-only@0.0.1` — versions verified 2026-03-23

### Secondary (MEDIUM confidence)
- Stripe webhook quickstart docs (docs.stripe.com/webhooks/quickstart) — `constructEvent` parameter order, Express body parsing rationale
- dev.to 2026 patterns (multiple authors) — App Router `request.text()` + `await headers()` pattern cross-verified
- Phase 8 RESEARCH.md (codebase) — `webhook_events` table schema, INSERT ON CONFLICT idempotency pattern

### Tertiary (LOW confidence)
- Stripe signature verification docs (404 on /webhooks/signature-verification) — fell back to quickstart + community sources. `constructEvent` API is stable and unlikely to have changed.

---

## Metadata

**Confidence breakdown:**
- Stripe SDK installation + version: HIGH — npm registry verified
- `server-only` pattern: HIGH — Next.js official docs verified (2026-03-03)
- `request.text()` requirement: HIGH — multiple 2026 community sources converge; rationale is sound (HMAC over raw bytes)
- `await headers()` async requirement: HIGH — Next.js 15+ confirmed; this project is on 16.1.6
- `constructEvent` exact signature: HIGH — Stripe quickstart docs + SDK type definitions
- Stripe CLI not installed: HIGH — `command -v stripe` confirmed not found
- `stripe` npm package not installed: HIGH — node_modules confirmed absent

**Research date:** 2026-03-23
**Valid until:** 2026-09-23 (Stripe SDK major versions move slowly; Next.js `server-only` pattern is stable)
