# Phase 8: DB Foundation - Research

**Researched:** 2026-03-23
**Domain:** Supabase migrations, PostgreSQL schema design, RLS policies, Stripe data model
**Confidence:** HIGH

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DB-01 | Admin migration creates `stripe_products`, `stripe_prices`, `stripe_orders`, `stripe_coupons`, `stripe_coupon_redemptions` tables with correct columns and RLS policies for admin/moderator roles | Table schemas, column lists, and RLS patterns documented in this file |
| DB-02 | `webhook_events` idempotency table prevents duplicate webhook processing on Stripe retries (INSERT event ID before processing; skip on conflict) | UNIQUE constraint pattern and INSERT ON CONFLICT documented below |
| DB-03 | `stripe_product_id` bridge column added to existing `products` table; `stripe_customer_id` column added to `profiles` table | ALTER TABLE patterns and migration numbering documented below |
</phase_requirements>

---

## Summary

Phase 8 is pure infrastructure: six new Supabase migration files that create the database foundation every subsequent phase depends on. No application code is written. The deliverables are SQL — tables, columns, constraints, indices, and RLS policies — that must be in place before any webhook handler or admin UI page can run.

The existing codebase has a well-established migration convention: one numbered `.sql` file per concern, UPPERCASE SQL keywords, `IF NOT EXISTS` guards on tables and columns, and a standard admin RLS sub-select pattern (`EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))`). The new migrations must follow this exact style.

The most important design decision in this phase is the `webhook_events` idempotency table: the UNIQUE constraint on `stripe_event_id` is the mechanism that prevents duplicate order creation when Stripe retries. This must be a database-level constraint, not application-level logic. The second most important decision is that `stripe_product_id` on `products` and `stripe_customer_id` on `profiles` are nullable — the 22 existing products have no Stripe IDs yet, and provisioning them is a separate concern flagged for Phase 10 (initial sync).

**Primary recommendation:** Use one migration file per concern: (1) Stripe entity tables, (2) `webhook_events` table, (3) bridge columns. Apply with `npx supabase db push` after each file is created and verified.

---

## Standard Stack

### Core
| Library / Tool | Version | Purpose | Why Standard |
|----------------|---------|---------|--------------|
| Supabase CLI | current | Apply migrations to live DB | Project standard — `npx supabase db push` per MEMORY.md |
| PostgreSQL | managed by Supabase | Schema host | Existing infrastructure |

### No New Dependencies
This phase has zero new npm packages. It is entirely SQL migration files.

**Apply command (from MEMORY.md — mandatory):**
```bash
npx supabase db push
```
MEMORY.md mandates running `npx supabase db push` after creating any migration file. This is the only deployment mechanism for schema changes.

---

## Architecture Patterns

### Migration File Conventions (from existing migrations)

**Naming:** `2026034X_descriptive_name.sql` — sequential from `20260339_add_connections.sql`
- Next available numbers: `20260340`, `20260341`, `20260342`

**SQL style** (from `20260337_add_email_templates.sql`, `20260330_add_credits_system.sql`):
- UPPERCASE SQL keywords (`CREATE TABLE`, `ALTER TABLE`, `CREATE POLICY`)
- `public.` schema prefix on all table names
- `gen_random_uuid()` for UUID primary keys
- `timestamptz DEFAULT now()` for timestamps
- `UPDATE` trigger reuses existing `update_updated_at_column()` function (already defined)
- Comments with `-- ` prefix explaining intent

**RLS Admin Pattern** (from `20260337_add_email_templates.sql`, `20260330_add_credits_system.sql`):
```sql
CREATE POLICY "Admins can manage [table]"
  ON public.[table]
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );
```
Note: `profiles.id` is the correct PK column (not `user_id` — the `schema.sql` file is an outdated draft; the live table uses `id` as confirmed by `20260320_fix_auth_trigger.sql` which inserts with `INSERT INTO public.profiles (id, ...)`).

**ALTER TABLE pattern** (add nullable column idempotently):
```sql
ALTER TABLE public.[table] ADD COLUMN IF NOT EXISTS [col] text;
```

### Recommended Migration Structure

Three migration files for Phase 8:

```
supabase/migrations/
├── 20260340_stripe_tables.sql        -- DB-01: 5 Stripe entity tables + RLS
├── 20260341_webhook_events.sql       -- DB-02: idempotency table + UNIQUE constraint
└── 20260342_stripe_bridge_columns.sql -- DB-03: stripe_product_id + stripe_customer_id
```

Keeping them separate means each can be reviewed and rolled back independently.

---

## Table Schemas

### DB-01: Stripe Entity Tables

#### `stripe_products`
Maps Stripe `product.*` webhook events. Stripe owns all columns except `products.priority`, `requires_any_of`, `hidden_if_has_any`, `is_active` (those live on `public.products`).

```sql
CREATE TABLE IF NOT EXISTS public.stripe_products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id        text UNIQUE NOT NULL,          -- Stripe product ID (prod_xxx)
  name             text NOT NULL,
  description      text,
  active           boolean DEFAULT true,
  images           text[] DEFAULT '{}',
  metadata         jsonb DEFAULT '{}',
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);
```

**Key constraint:** `stripe_id` UNIQUE — enables idempotent upserts keyed on `stripe_id`.
**Index needed:** `CREATE INDEX ON public.stripe_products(stripe_id);` (already covered by UNIQUE, but explicit index aids planner)

#### `stripe_prices`
Maps Stripe `price.*` webhook events. Prices are immutable on Stripe (amount cannot be changed); new price = new row.

```sql
CREATE TABLE IF NOT EXISTS public.stripe_prices (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id           text UNIQUE NOT NULL,       -- Stripe price ID (price_xxx)
  stripe_product_id   text NOT NULL,              -- Stripe product ID (prod_xxx), FK to stripe_products.stripe_id
  currency            text NOT NULL DEFAULT 'usd',
  unit_amount         integer,                    -- cents; null for metered billing
  type                text NOT NULL DEFAULT 'one_time' CHECK (type IN ('one_time', 'recurring')),
  interval            text CHECK (interval IN ('day', 'week', 'month', 'year')),
  interval_count      integer,
  active              boolean DEFAULT true,
  metadata            jsonb DEFAULT '{}',
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);
```

**FK note:** FK to `stripe_products(stripe_id)` not `stripe_products(id)` because webhook events reference Stripe IDs directly. Using `stripe_id` as FK target requires it to be UNIQUE (already is).

#### `stripe_orders`
Maps Stripe `payment_intent.*` and subscription events. One row per payment or subscription cycle.

```sql
CREATE TABLE IF NOT EXISTS public.stripe_orders (
  id                        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id                 text UNIQUE NOT NULL,   -- payment_intent ID or subscription ID (pi_xxx / sub_xxx)
  stripe_customer_id        text,                   -- cus_xxx
  stripe_price_id           text,                   -- price_xxx
  stripe_product_id         text,                   -- prod_xxx
  user_id                   uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount_total              integer,                -- cents
  currency                  text DEFAULT 'usd',
  status                    text NOT NULL,          -- e.g. succeeded, requires_payment_method, canceled
  type                      text NOT NULL DEFAULT 'one_time' CHECK (type IN ('one_time', 'recurring')),
  subscription_status       text,                   -- active, past_due, canceled, trialing, etc.
  cancel_at_period_end      boolean DEFAULT false,
  current_period_start      timestamptz,
  current_period_end        timestamptz,
  canceled_at               timestamptz,
  metadata                  jsonb DEFAULT '{}',
  stripe_event_id           text,                   -- last event that wrote this row
  created_at                timestamptz DEFAULT now(),
  updated_at                timestamptz DEFAULT now()
);
```

**Indices needed:** `stripe_customer_id` (coupon assignment lookup), `user_id` (user order history), `stripe_price_id` (analytics joins).

#### `stripe_coupons`
Maps Stripe `coupon.*` events. Stores both `stripe_coupon_id` and `stripe_promotion_code_id` separately (critical: they are distinct Stripe objects).

```sql
CREATE TABLE IF NOT EXISTS public.stripe_coupons (
  id                          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_coupon_id            text UNIQUE NOT NULL,    -- coupon ID used for manual assignment
  stripe_promotion_code_id    text UNIQUE,             -- promo code ID used in checkout sessions; nullable if no public code
  name                        text NOT NULL,           -- internal admin label
  code                        text,                    -- public-facing code (from promotion_code.code)
  discount_type               text NOT NULL CHECK (discount_type IN ('percent', 'amount', 'free_product')),
  percent_off                 numeric(5,2),
  amount_off                  integer,                 -- cents
  currency                    text DEFAULT 'usd',
  duration                    text CHECK (duration IN ('forever', 'once', 'repeating')),
  duration_in_months          integer,
  max_redemptions             integer,                 -- null = unlimited
  times_redeemed              integer DEFAULT 0,
  redeem_by                   timestamptz,
  valid                       boolean DEFAULT true,
  metadata                    jsonb DEFAULT '{}',
  created_at                  timestamptz DEFAULT now(),
  updated_at                  timestamptz DEFAULT now()
);
```

#### `stripe_coupon_redemptions`
One row per coupon use event. Supports CPN-05 (usage history per coupon).

```sql
CREATE TABLE IF NOT EXISTS public.stripe_coupon_redemptions (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_coupon_id    text NOT NULL,                   -- references stripe_coupons.stripe_coupon_id
  stripe_order_id     text,                            -- references stripe_orders.stripe_id
  user_id             uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at         timestamptz DEFAULT now()
);
```

**Index needed:** `stripe_coupon_id` (usage history queries), `user_id` (user redemption lookup).

---

### DB-02: `webhook_events` Idempotency Table

This is the critical safety mechanism. Stripe retries webhook delivery on failure; without this table, concurrent retries create duplicate orders.

**Idempotency pattern:**
1. INSERT the event ID into `webhook_events` BEFORE processing
2. On INSERT conflict (duplicate event), skip processing and return 200
3. After processing succeeds, update `status` to `processed`

```sql
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,   -- UNIQUE constraint is the idempotency guarantee
  event_type      text NOT NULL,          -- e.g. 'payment_intent.succeeded'
  status          text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed')),
  error_message   text,                   -- populated on failed status
  payload         jsonb,                  -- full Stripe event payload for debugging/reprocessing
  created_at      timestamptz DEFAULT now(),
  processed_at    timestamptz
);
```

**The key constraint:** `stripe_event_id TEXT UNIQUE NOT NULL` — the INSERT ON CONFLICT in the webhook handler skips duplicate events at the database level, not application level.

**Index needed:** `CREATE INDEX ON public.webhook_events(stripe_event_id);` (UNIQUE index already provides this; adding explicit one is redundant — do NOT double-index).

**Insert pattern (application-level, for reference by Phase 9):**
```sql
INSERT INTO public.webhook_events (stripe_event_id, event_type, payload)
VALUES ($1, $2, $3)
ON CONFLICT (stripe_event_id) DO NOTHING;
-- If 0 rows inserted, event was already processed — skip handler
```

---

### DB-03: Bridge Columns

#### `stripe_product_id` on `products`
The existing `products` table has 22 seeded rows with no Stripe IDs. The column is nullable — provisioning existing products to Stripe happens in Phase 10 (initial sync).

```sql
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS stripe_product_id text;

CREATE INDEX IF NOT EXISTS idx_products_stripe_product_id
  ON public.products(stripe_product_id);
```

#### `stripe_customer_id` on `profiles`
Needed for: coupon manual assignment (CPN-04), subscription lookup (ORD-06), customer journey (ORD-08).

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id text;

CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id
  ON public.profiles(stripe_customer_id);
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Idempotency | Application-level dedup logic (e.g., check-then-insert) | `UNIQUE` constraint + `INSERT ON CONFLICT DO NOTHING` | DB-level atomicity; application-level check-then-insert has a race condition |
| Admin access control | Custom auth checks in application code | RLS `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN (...))` | Existing codebase pattern; applies at DB level regardless of application bugs |
| updated_at timestamp | Manual `updated_at = now()` in application code | `CREATE TRIGGER ... EXECUTE FUNCTION update_updated_at_column()` | Function already exists in DB from earlier migrations |

---

## Common Pitfalls

### Pitfall 1: Recursive RLS on `profiles` reference
**What goes wrong:** Writing `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN (...))` in a policy on `public.profiles` itself causes infinite recursion.
**Why it happens:** RLS policies on `profiles` that query `profiles` recurse. The fix (`is_admin()` SECURITY DEFINER function) is already applied in `20260321_fix_admin_rls_policy.sql`.
**How to avoid:** New Stripe tables are NOT `profiles`. The sub-select pattern is safe on any table OTHER than `profiles`. Use it freely on `stripe_products`, `stripe_orders`, etc.
**Warning signs:** Empty results from admin UI when data exists in DB.

### Pitfall 2: RLS enabled but no policy = all blocked
**What goes wrong:** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` with no policy blocks all access, including the admin UI.
**Why it happens:** Supabase default-deny after enabling RLS.
**How to avoid:** Always add at minimum one admin policy immediately after `ENABLE ROW LEVEL SECURITY` in the same migration file. Do not enable RLS in one migration and add policies in another.

### Pitfall 3: `stripe_product_id` FK direction
**What goes wrong:** Adding a FK from `stripe_orders.stripe_product_id` to `stripe_products.id` (UUID) instead of `stripe_products.stripe_id` (text). Webhook events only know Stripe IDs (strings), not internal UUIDs.
**Why it happens:** Reflex to FK to the UUID primary key.
**How to avoid:** FK from `stripe_orders.stripe_product_id` to `stripe_products.stripe_id`. The UNIQUE constraint on `stripe_id` makes it a valid FK target.
**Decision:** Alternatively, omit explicit FK and rely on application-level joins — simpler, avoids FK maintenance overhead. Given write order uncertainty during initial sync, omitting FK on `stripe_product_id`/`stripe_price_id` columns and using `stripe_customer_id` + `stripe_price_id` as plain text columns is acceptable.

### Pitfall 4: Missing index on `stripe_event_id`
**What goes wrong:** `webhook_events` table with no index on `stripe_event_id` causes sequential scan on every idempotency check under load.
**Why it happens:** UNIQUE constraint creates a B-tree index automatically. No separate `CREATE INDEX` is needed — but teams sometimes add a redundant one, wasting storage.
**How to avoid:** UNIQUE constraint already creates the index. Do not add a second `CREATE INDEX ON ... (stripe_event_id)`.

### Pitfall 5: Applying migration without `db push`
**What goes wrong:** Migration file is created but not applied. Later phases fail because tables don't exist.
**Why it happens:** Forgetting to run `npx supabase db push`.
**How to avoid:** MEMORY.md mandates `npx supabase db push` after every migration. Make it part of the task definition, not an afterthought.

### Pitfall 6: `profiles` PK is `id`, not `user_id`
**What goes wrong:** Writing `WHERE user_id = auth.uid()` in RLS policies on `profiles` (the old `schema.sql` column name) when the live table uses `id`.
**Why it happens:** `schema.sql` uses `user_id` as PK but all migrations from `20260320` onward insert with `profiles (id, ...)` and reference `WHERE id = auth.uid()`. The live DB column is `id`.
**How to avoid:** In `stripe_orders` and `stripe_coupon_redemptions`, use `user_id uuid REFERENCES auth.users(id)` (not `profiles.id`) to avoid RLS complexity on bridge tables. For admin RLS on new Stripe tables, use the standard `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN (...))`.

---

## Code Examples

### Pattern: Full table migration with RLS (verified from codebase)
```sql
-- Source: supabase/migrations/20260337_add_email_templates.sql pattern
CREATE TABLE IF NOT EXISTS public.stripe_products (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_id   text UNIQUE NOT NULL,
  name        text NOT NULL,
  -- ... columns ...
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE public.stripe_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage stripe products"
  ON public.stripe_products
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE TRIGGER update_stripe_products_updated_at
  BEFORE UPDATE ON public.stripe_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Pattern: Idempotency INSERT ON CONFLICT (Phase 9 handler reference)
```sql
-- Source: supabase/migrations/20260341_webhook_events.sql (to be created)
INSERT INTO public.webhook_events (stripe_event_id, event_type, payload)
VALUES ('evt_xxx', 'payment_intent.succeeded', '{...}')
ON CONFLICT (stripe_event_id) DO NOTHING;
-- Check affected rows: if 0, event already processed — return 200 early
```

### Pattern: ADD COLUMN IF NOT EXISTS (verified from codebase)
```sql
-- Source: supabase/migrations/20260332_add_products_table.sql line 32
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id text;
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase CLI | `npx supabase db push` | ✓ | managed via npx | — |
| PostgreSQL | Table creation | ✓ | Supabase-managed | — |

Step 2.6: No external tool installations needed. All dependencies are already in place.

---

## Validation Architecture

`workflow.nyquist_validation` is not set to `false` in `.planning/config.json` (key absent). Section included.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 2.1.9 |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | Notes |
|--------|----------|-----------|-------------------|-------|
| DB-01 | All 5 Stripe tables exist with correct columns | manual-only | SQL query against Supabase | No Vitest test can verify DB schema directly — must inspect via `supabase db diff` or SQL client |
| DB-01 | RLS blocks non-admin roles from all new tables | manual-only | Test with anon/member Supabase client in dashboard | RLS verification requires a running Supabase instance with multiple role sessions |
| DB-02 | Duplicate event ID is rejected by UNIQUE constraint | manual-only | Run `INSERT ... ON CONFLICT` twice in SQL client | Constraint behavior is DB-level; no unit test needed |
| DB-03 | `stripe_product_id` column exists on `products` | manual-only | `SELECT column_name FROM information_schema.columns WHERE table_name='products'` | Schema inspection query |
| DB-03 | `stripe_customer_id` column exists on `profiles` | manual-only | Same as above | Schema inspection query |

**Manual-only justification:** Phase 8 is pure SQL schema. There is no application code to unit test. Validation is by schema inspection (SQL queries), not automated test suites. The Vitest framework tests application code written in later phases.

### Wave 0 Gaps
None — no test files need to be created for this phase. The test infrastructure exists and will be used in subsequent phases.

---

## Open Questions

1. **Existing 22 products → Stripe provisioning strategy**
   - What we know: `stripe_product_id` will be nullable after Phase 8. The column exists but is unpopulated.
   - What's unclear: When a Phase 9 webhook arrives for a product that exists in GOYA but has no `stripe_product_id`, should the handler attempt a lookup-by-slug/name to auto-link, or leave it unlinked until Phase 10 (initial sync)?
   - Recommendation: Leave it unlinked. Phase 10 (DB-09) covers the initial sync explicitly. Webhook handlers should insert into `stripe_products` (mirror table) and not attempt to update `products.stripe_product_id` automatically. The bridge column is populated by the initial sync script, not by incoming webhooks.

2. **FK on Stripe ID columns: explicit or omitted?**
   - What we know: `stripe_orders.stripe_product_id` (text) could FK to `stripe_products.stripe_id` (text UNIQUE), but webhook delivery order is not guaranteed (a price event may arrive before its product event).
   - What's unclear: Whether strict FK constraints would cause webhook handler failures on out-of-order delivery.
   - Recommendation: Omit explicit FKs on `stripe_id` cross-references. Use plain `text` columns. Application-level joins by text equality are sufficient and avoid FK violation errors on out-of-order webhooks.

3. **`webhook_events.payload` column size**
   - What we know: Stripe payloads can be large (full subscription objects, customer objects embedded).
   - What's unclear: Whether Supabase has practical jsonb size limits that would truncate large payloads.
   - Recommendation: Store payload as `jsonb`. PostgreSQL has no practical row size limit that Stripe events would approach. No action needed.

---

## Sources

### Primary (HIGH confidence)
- Supabase migration files `20260330` through `20260339` — established migration conventions, RLS patterns, trigger reuse
- `20260320_fix_auth_trigger.sql` — confirms `profiles.id` is the PK (not `user_id`)
- `20260332_add_products_table.sql` — confirms existing 22 products seeded, `stripe_product_id` not present, confirms GOYA-owned columns (`priority`, `requires_any_of`, `hidden_if_has_any`, `is_active`)
- Stripe API docs (from milestone SUMMARY.md) — `stripe_coupon_id` vs `stripe_promotion_code_id` distinction confirmed
- Supabase RLS docs (cited in SUMMARY.md) — UNIQUE constraint idempotency pattern confirmed

### Secondary (MEDIUM confidence)
- Milestone SUMMARY.md — webhook idempotency pattern, write-partitioning boundaries, pitfall list
- STATE.md decisions — confirmed locked architecture choices

---

## Metadata

**Confidence breakdown:**
- Table schemas: HIGH — derived from Stripe API data model (well-documented) + existing codebase RLS patterns
- Migration conventions: HIGH — directly verified from 10 existing migration files
- `profiles.id` vs `user_id`: HIGH — confirmed by `20260320_fix_auth_trigger.sql` INSERT statement
- Idempotency pattern: HIGH — PostgreSQL UNIQUE + ON CONFLICT is a standard, well-documented mechanism
- Open questions: MEDIUM — recommendations are reasonable defaults, but decisions have not been locked by the user

**Research date:** 2026-03-23
**Valid until:** 2026-06-23 (stable domain — SQL/PostgreSQL patterns don't change)
