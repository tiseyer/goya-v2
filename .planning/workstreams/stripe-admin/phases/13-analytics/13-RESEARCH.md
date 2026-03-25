# Phase 13: Analytics - Research

**Researched:** 2026-03-24
**Domain:** React charting (Recharts), Supabase aggregate queries, CSV export, Next.js App Router admin page patterns
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ANA-01 | User funnel metrics with time range selector (30d / 3mo / 6mo / custom): new registrations, completed onboarding, conversion rate, new subscriptions, pending cancellations, new cancellations, total active members, net growth | `profiles` table has `created_at`, `onboarding_completed`, `role`, `member_type`; `stripe_orders` has `type`, `subscription_status`, `cancel_at_period_end`, `canceled_at`, `created_at` — all queryable by time range |
| ANA-02 | Revenue metrics from local Supabase tables only (no Stripe API at page load): ARR total, new ARR in period, churned ARR in period, net new ARR | `stripe_orders` + `stripe_prices` tables contain `amount_total`, `type`, `subscription_status`, `created_at`, `canceled_at` — sufficient for all four ARR metrics |
| ANA-03 | Funnel and revenue metrics split/filtered by member role: Student / Teacher / Wellness Practitioner / School | `profiles.member_type` and `profiles.role` identify member type; join path: `stripe_orders.user_id → profiles.member_type` |
| ANA-04 | Admin can export any metric or chart as a CSV file | Client-side CSV generation via Blob + anchor download — no server route needed; data already in component state |
| ANA-05 | Interactive Recharts time-series charts: revenue over time and new orders over time | Recharts 3.8.0 (latest, not yet installed) is required — STATE.md locks to 3.8.0+ |
</phase_requirements>

---

## Summary

Phase 13 builds a read-only analytics dashboard at `/admin/shop/analytics`. All data comes from four existing Supabase tables (`profiles`, `stripe_orders`, `stripe_prices`, `stripe_coupon_redemptions`) — no Stripe API calls. The architecture is a Next.js 16 server component that fetches raw rows in parallel, computes all metrics in JS, then passes results to a Client Component that owns charts (Recharts), filters, and CSV export.

Recharts is not yet installed. The project STATE.md explicitly locks to version 3.8.0+ due to a React 19 blank-chart regression in 3.7.x. The latest published version (verified via npm registry) is 3.8.0, which is the correct version to install.

Time-range and role filters should be implemented as URL search params (`?range=30d&role=student`), consistent with every other admin page in this codebase (`ProductsPage`, `OrdersPage` both read `searchParams` in the server component and pass initial values down to a `'use client'` filters component). The filters component uses `router.replace()` + `useTransition` debounce, as seen in `OrdersFilters.tsx`.

**Primary recommendation:** Server component fetches raw rows; JS computes all metrics; Client Component renders Recharts charts, filter controls, and CSV download buttons. Install `recharts@3.8.0`. Use URL search params for filter state.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.0 | Time-series charts | Locked in STATE.md; fixes React 19 blank-chart bug in 3.7.x |
| @supabase/supabase-js | ^2.95.2 (already installed) | Database queries | Project standard |
| date-fns | ^4.1.0 (already installed) | Date arithmetic for time range boundaries and chart bucketing | Already in package.json |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none new beyond recharts) | — | CSV export is native Blob + `<a download>` | Client-side only; no library needed |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| recharts | chart.js / victory / nivo | Recharts is the locked choice; alternatives not applicable |
| client-side CSV | Papa Parse | Overkill for simple flat row export |
| URL search params | React useState for filters | URL params allow deep-linking and browser back — consistent with rest of admin |

**Installation:**
```bash
npm install recharts@3.8.0
```

**Version verification:** `npm view recharts version` returns `3.8.0` (verified 2026-03-24).

---

## Architecture Patterns

### Recommended Project Structure
```
app/admin/shop/analytics/
├── page.tsx                  # Server component: fetch rows, compute metrics, pass to client
├── AnalyticsFilters.tsx      # 'use client': time range + role selector → router.replace()
├── AnalyticsCharts.tsx       # 'use client': Recharts LineChart + AreaChart
└── AnalyticsMetricCard.tsx   # Pure presentational: a single KPI tile
```

### Pattern 1: Server-Fetches-Then-Passes-To-Client (established pattern in this codebase)
**What:** `page.tsx` is an `async` server component. It reads `searchParams` for `range` and `role`, queries Supabase, computes derived metrics, and passes plain objects to client components via props.
**When to use:** All admin data pages in this project follow this pattern (`/admin/shop/products/page.tsx`, `/admin/shop/orders/page.tsx`).
**Example (from products page.tsx pattern):**
```typescript
// app/admin/shop/analytics/page.tsx
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import AnalyticsCharts from './AnalyticsCharts'
import AnalyticsFilters from './AnalyticsFilters'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

export default async function AnalyticsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams
  const range = (params.range as string) ?? '30d'   // '30d' | '3mo' | '6mo' | 'custom'
  const role  = (params.role  as string) ?? 'all'   // 'all' | 'student' | 'teacher' | 'wellness_practitioner' | 'school'
  const dateFrom = params.dateFrom as string | undefined
  const dateTo   = params.dateTo   as string | undefined

  const supabase = await createSupabaseServerClient()

  // Parallel fetches — no Stripe API calls
  const [ordersResult, profilesResult, pricesResult] = await Promise.all([
    supabase.from('stripe_orders').select('...'),
    supabase.from('profiles').select('id, role, member_type, created_at, onboarding_completed, subscription_status'),
    supabase.from('stripe_prices').select('stripe_id, unit_amount, type, interval'),
  ])

  // Compute metrics in JS, pass as props
  return (
    <div>
      <AnalyticsFilters initialRange={range} initialRole={role} ... />
      <AnalyticsCharts metrics={computedMetrics} chartData={timeSeriesData} />
    </div>
  )
}
```

### Pattern 2: URL-Param Filters (established pattern — OrdersFilters.tsx)
**What:** A `'use client'` component that holds no business data. On change, it calls `router.replace()` inside `startTransition()`, updating URL params which triggers the server component to re-fetch.
**When to use:** All filter controls in admin shop pages use this pattern.
**Example (mirrors OrdersFilters.tsx):**
```typescript
// AnalyticsFilters.tsx  — 'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export default function AnalyticsFilters({ initialRange, initialRole }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    value ? params.set(key, value) : params.delete(key)
    startTransition(() => router.replace(`/admin/shop/analytics?${params.toString()}`))
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select defaultValue={initialRange} onChange={e => updateParam('range', e.target.value)}>
        <option value="30d">Last 30 days</option>
        <option value="3mo">Last 3 months</option>
        <option value="6mo">Last 6 months</option>
        <option value="custom">Custom range</option>
      </select>
      {/* role select, custom date inputs */}
    </div>
  )
}
```

### Pattern 3: Recharts LineChart (Recharts 3.8.0 for React 19)
**What:** Wrap chart in a `'use client'` component. Use `ResponsiveContainer` wrapping `LineChart` or `AreaChart` with `XAxis`, `YAxis`, `Tooltip`, `CartesianGrid`, `Legend`.
**When to use:** Revenue over time and new orders over time charts.
**Example:**
```typescript
// AnalyticsCharts.tsx  — 'use client'
'use client'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

interface ChartPoint { date: string; revenue: number; orders: number }

export default function AnalyticsCharts({ chartData }: { chartData: ChartPoint[] }) {
  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#00B5A3" name="Revenue ($)" dot={false} />
          <Line type="monotone" dataKey="orders"  stroke="#1B3A5C" name="New Orders"  dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

### Pattern 4: CSV Export (client-side Blob download)
**What:** Build a CSV string from the data already in component state. Create a Blob, make an object URL, trigger download via a temporary `<a>` tag.
**When to use:** "Export CSV" button on metric cards and chart panels.
**Example:**
```typescript
function exportCsv(rows: Record<string, unknown>[], filename: string) {
  const headers = Object.keys(rows[0]).join(',')
  const body    = rows.map(r => Object.values(r).join(',')).join('\n')
  const blob    = new Blob([`${headers}\n${body}`], { type: 'text/csv' })
  const url     = URL.createObjectURL(blob)
  const a       = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
```

### Anti-Patterns to Avoid
- **Calling Stripe API at page load for analytics:** Out of scope per REQUIREMENTS.md. All metrics from local tables only.
- **Storing filter state in React useState:** Breaks deep-linking and browser back. Use URL search params.
- **Installing recharts@3.7.x:** Causes blank charts with React 19. Must be 3.8.0+.
- **Separate fetch routes for each metric:** All queries should run in parallel in one server component to avoid waterfall.
- **Using `supabase.rpc()` for all aggregation:** Simple aggregations (count, sum) are faster to compute in JS after a single broad SELECT than to write a stored procedure per metric — consistent with Phase 12 patterns (sales counts fetched via stripe_orders, grouped in JS with Map).

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Time-series charting | Custom SVG chart | Recharts 3.8.0 | Tooltip, zoom, responsive container, accessibility — hundreds of edge cases |
| CSV string serialisation for complex objects | Manual escaping | Native template literal with simple quoting rule | Metrics are flat numeric rows — no nested objects; full Papa Parse overkill |
| Date arithmetic for range boundaries | Custom date math | date-fns `subDays`, `subMonths`, `startOfDay`, `endOfDay` | Already installed; handles DST, leap years |

---

## Metric Computation Guide

All metrics derive from four tables already in the project. This section documents the join paths and derivation rules so the planner can write precise task actions.

### Profiles table fields relevant to funnel metrics
```
profiles.id, profiles.created_at, profiles.onboarding_completed,
profiles.role (user_role enum: student | teacher | wellness_practitioner | moderator | admin),
profiles.member_type (text: student | teacher | wellness_practitioner — nullable, set during onboarding),
profiles.subscription_status ('member' | 'guest')
```

**Member role filter join path:** `stripe_orders.user_id → profiles.id → profiles.member_type`
For "School" role: `profiles.role = 'school'` does NOT exist as an enum value. The requirements list "School" as a role filter option. The `user_role` enum contains: `student`, `teacher`, `wellness_practitioner`, `moderator`, `admin`. There is no `school` value. The `member_type` column (`profiles.member_type`) is the correct field for `student | teacher | wellness_practitioner`. School users are likely identified differently.

**OPEN QUESTION — see Open Questions section.**

### Funnel metric derivation (ANA-01)

| Metric | Source | Derivation |
|--------|--------|-----------|
| New registrations | `profiles` | `COUNT(*)` WHERE `created_at` IN period |
| Completed onboarding | `profiles` | `COUNT(*)` WHERE `created_at` IN period AND `onboarding_completed = true` |
| Conversion rate | computed | `paid_in_period / new_registrations_in_period` |
| New subscriptions | `stripe_orders` | `COUNT(*)` WHERE `type = 'recurring'` AND `subscription_status = 'active'` AND `created_at` IN period |
| Pending cancellations | `stripe_orders` | `COUNT(*)` WHERE `cancel_at_period_end = true` AND `subscription_status = 'active'` |
| New cancellations (churned) | `stripe_orders` | `COUNT(*)` WHERE `canceled_at` IN period AND `subscription_status != 'active'` |
| Total active members | `profiles` | `COUNT(*)` WHERE `subscription_status = 'member'` (snapshot, not period-filtered) |
| Net growth | computed | `new_subscriptions - new_cancellations` in period |

### Revenue metric derivation (ANA-02)

All revenue in USD cents (`amount_total` column on `stripe_orders`). Convert to dollars for display.

| Metric | Derivation |
|--------|-----------|
| ARR total | `SUM(unit_amount * 12)` for all active recurring orders; join `stripe_prices` on `stripe_price_id` to get interval |
| New ARR in period | `SUM(unit_amount * 12)` WHERE recurring orders `created_at` IN period |
| Churned ARR in period | `SUM(unit_amount * 12)` WHERE recurring orders `canceled_at` IN period |
| Net new ARR | `new ARR - churned ARR` |

**Note:** `stripe_orders.amount_total` reflects what was charged (not the price object). For ARR, it is more accurate to join `stripe_orders.stripe_price_id → stripe_prices.unit_amount` and compute `unit_amount * 12 / interval_scaling` based on `interval` (month → ×12; year → ×1; week → ×52). `stripe_prices.interval` and `stripe_prices.interval_count` are the correct columns.

### Time-series chart bucketing (ANA-05)

For "revenue over time" and "new orders over time": bucket `stripe_orders` rows by day or week into a sorted array of `{ date: string, revenue: number, orders: number }` points. Use `date-fns` `format(date, 'MMM d')` for chart X-axis labels.

**Bucket granularity rule:**
- 30-day range → daily buckets (30 points)
- 3-month range → weekly buckets (~13 points)
- 6-month range → weekly buckets (~26 points)
- Custom range → daily if ≤ 60 days, otherwise weekly

---

## Common Pitfalls

### Pitfall 1: Recharts blank chart with React 19
**What goes wrong:** Charts render empty — no lines, no bars.
**Why it happens:** Recharts 3.7.x has a known regression with React 19's concurrent renderer.
**How to avoid:** Install `recharts@3.8.0` exactly. The project STATE.md already documents this as a locked decision.
**Warning signs:** Chart container renders but SVG paths are absent.

### Pitfall 2: ResponsiveContainer requires a sized parent
**What goes wrong:** `ResponsiveContainer width="100%"` renders with 0px width and chart is invisible.
**Why it happens:** ResponsiveContainer reads its DOM parent's dimensions. If the parent has no explicit width (e.g., `display:contents` or is `hidden`), width resolves to 0.
**How to avoid:** Wrap in a `<div style={{ width: '100%', height: 300 }}>` or Tailwind `w-full h-72`. Never put ResponsiveContainer directly in a flexbox item without explicit dimensions.
**Warning signs:** Chart container renders with correct height but width is 0 in DevTools.

### Pitfall 3: ARR double-counting subscriptions
**What goes wrong:** ARR appears inflated — the same subscription is counted multiple times.
**Why it happens:** Webhook handlers create multiple `stripe_orders` rows for the same subscription — one per billing cycle (`invoice.paid` events). ARR should only count each active subscription ONCE.
**How to avoid:** For ARR computation, use DISTINCT on a unique subscription identifier. The `stripe_orders.stripe_id` is the payment intent or invoice ID — not stable across cycles. Instead, identify unique subscriptions by `stripe_customer_id + stripe_product_id` pair, or add a `stripe_subscription_id` column (see Open Questions).
**Warning signs:** ARR total is N× the actual figure where N = average number of billing cycles.

### Pitfall 4: School role not in user_role enum
**What goes wrong:** Filtering by "School" role returns zero results or throws a type error.
**Why it happens:** The `user_role` enum (`student`, `teacher`, `wellness_practitioner`, `moderator`, `admin`) does not contain `school`. ANA-03 requires filtering by "School" but there is no corresponding value in the schema.
**How to avoid:** Investigate how School users are represented (may be `profiles.role = 'moderator'` with a `schools` table row, or a separate column). See Open Questions.
**Warning signs:** School filter always returns 0 regardless of data.

### Pitfall 5: Empty chart data before Stripe data is populated
**What goes wrong:** Revenue charts show no data even when the page loads correctly.
**Why it happens:** Phase 8 migrations exist but the initial sync (Phase 10) may not have been run yet, or only test data is present.
**How to avoid:** Handle empty `chartData` gracefully — show "No data for this period" placeholder instead of a broken chart.

### Pitfall 6: CSV export with commas in values
**What goes wrong:** CSV columns misalign because product names or user names contain commas.
**Why it happens:** Simple `join(',')` does not escape values containing commas or quotes.
**How to avoid:** Wrap each value: `JSON.stringify(v)` (produces `"value"`) or replace commas in strings. For metric exports (numeric values only) this is not an issue, but for user-name exports it is.

---

## Code Examples

### Time range boundary computation using date-fns
```typescript
// Source: date-fns v4 docs (installed at ^4.1.0)
import { subDays, subMonths, startOfDay, endOfDay } from 'date-fns'

function getRangeBoundaries(range: string, dateFrom?: string, dateTo?: string) {
  const now = new Date()
  if (range === '30d')   return { from: startOfDay(subDays(now, 30)),  to: endOfDay(now) }
  if (range === '3mo')   return { from: startOfDay(subMonths(now, 3)), to: endOfDay(now) }
  if (range === '6mo')   return { from: startOfDay(subMonths(now, 6)), to: endOfDay(now) }
  if (range === 'custom' && dateFrom && dateTo) {
    return { from: startOfDay(new Date(dateFrom)), to: endOfDay(new Date(dateTo)) }
  }
  return { from: startOfDay(subDays(now, 30)), to: endOfDay(now) } // default
}
```

### Supabase parallel fetch pattern
```typescript
// Source: project pattern — products/page.tsx
const supabase = await createSupabaseServerClient()
const [ordersRes, profilesRes, pricesRes] = await Promise.all([
  supabase
    .from('stripe_orders')
    .select('id, user_id, stripe_price_id, stripe_product_id, amount_total, type, subscription_status, cancel_at_period_end, canceled_at, created_at')
    .gte('created_at', from.toISOString()),
  supabase
    .from('profiles')
    .select('id, role, member_type, created_at, onboarding_completed, subscription_status'),
  supabase
    .from('stripe_prices')
    .select('stripe_id, unit_amount, type, interval, interval_count'),
])
```

### Bucket rows by day (time-series chart data)
```typescript
function bucketByDay(orders: Order[], from: Date, to: Date): ChartPoint[] {
  const buckets = new Map<string, { revenue: number; orders: number }>()
  // initialise all days in range to 0
  for (let d = new Date(from); d <= to; d = new Date(d.getTime() + 86400000)) {
    buckets.set(format(d, 'yyyy-MM-dd'), { revenue: 0, orders: 0 })
  }
  for (const o of orders) {
    const key = format(new Date(o.created_at), 'yyyy-MM-dd')
    const b = buckets.get(key)
    if (b) { b.revenue += (o.amount_total ?? 0) / 100; b.orders += 1 }
  }
  return Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v }))
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| recharts 2.x | recharts 3.8.0 | v3 released ~2024 | Different import paths for some components; ResponsiveContainer API unchanged |
| react-beautiful-dnd | @dnd-kit | 2023 (rbd archived) | Already resolved in Phase 12; not relevant here |

**Deprecated/outdated:**
- Recharts 3.7.x: React 19 blank-chart regression — do not use.

---

## Open Questions

1. **How are "School" users represented in the schema?**
   - What we know: `user_role` enum has `student`, `teacher`, `wellness_practitioner`, `moderator`, `admin`. There is a `schools` table (`20260335_add_schools.sql`). There is no `school` enum value.
   - What's unclear: Do School admins use `role = 'admin'`? Or is there a separate `owner_id` relationship? `member_type` only has `student | teacher | wellness_practitioner`.
   - Recommendation: Check `20260335_add_schools.sql` and how School users are queried elsewhere (e.g., `SchoolRegistrationsTab.tsx`). The planner should add a task to investigate and define the "School" filter for ANA-03 before implementing it.

2. **Is there a `stripe_subscription_id` column on `stripe_orders`?**
   - What we know: Current `stripe_orders` schema (from migration 20260340) does NOT have a `stripe_subscription_id` column. The `stripe_id` is the payment intent or invoice stripe ID.
   - What's unclear: How to uniquely identify active subscriptions for ARR without double-counting across billing cycles.
   - Recommendation: Planner should define ARR as computed from `stripe_orders` WHERE `type = 'recurring'` AND `subscription_status = 'active'`, deduplicated by `stripe_customer_id + stripe_product_id`. This is a proxy that works until a proper subscription_id column is added.

3. **"Conversion rate" definition**
   - What we know: ANA-01 defines it as "registered → paid". "Paid" could mean any paid order, or only subscriptions.
   - Recommendation: Use `COUNT(profiles with at least one stripe_order) / COUNT(profiles created in period)`. This is the simplest defensible definition.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| recharts | ANA-05 (charts) | No (not installed) | — | None — must install |
| date-fns | Time range math | Yes | ^4.1.0 | — |
| @supabase/supabase-js | All queries | Yes | ^2.95.2 | — |
| next | Page routing | Yes | 16.1.6 | — |

**Missing dependencies with no fallback:**
- `recharts@3.8.0` — must install before implementing AnalyticsCharts component.

---

## Validation Architecture

> `workflow.nyquist_validation` key is absent from `.planning/config.json` — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest ^2.1.9 |
| Config file | none detected (project uses `vitest` defaults) |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ANA-01 | Funnel metric computation (time range filter, counts) | unit | `npx vitest run lib/analytics/metrics.test.ts` | No — Wave 0 |
| ANA-02 | ARR computation from orders + prices | unit | `npx vitest run lib/analytics/metrics.test.ts` | No — Wave 0 |
| ANA-03 | Role filter applied to metrics | unit | `npx vitest run lib/analytics/metrics.test.ts` | No — Wave 0 |
| ANA-04 | CSV export string format | unit | `npx vitest run lib/analytics/csv.test.ts` | No — Wave 0 |
| ANA-05 | Chart renders without blank output | manual | Browser smoke test: load `/admin/shop/analytics`, verify chart lines visible | — |

### Sampling Rate
- **Per task commit:** `npx vitest run lib/analytics/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `lib/analytics/metrics.ts` — pure computation functions (no Supabase dependency; testable in isolation)
- [ ] `lib/analytics/metrics.test.ts` — covers ANA-01, ANA-02, ANA-03
- [ ] `lib/analytics/csv.ts` — CSV serialisation helper
- [ ] `lib/analytics/csv.test.ts` — covers ANA-04

---

## Sources

### Primary (HIGH confidence)
- Project source files: `supabase/migrations/20260340_stripe_tables.sql` — verified stripe_orders, stripe_prices, stripe_coupons columns
- Project source files: `supabase/migrations/20260319_add_roles_and_subscription.sql` — verified user_role enum values and profiles columns
- Project source files: `supabase/migrations/20260325_add_onboarding.sql`, `20260326_extend_onboarding.sql` — verified onboarding_completed, member_type columns
- Project source files: `app/admin/shop/products/page.tsx`, `app/admin/shop/orders/OrdersFilters.tsx` — verified URL-param filter pattern
- npm registry: `npm view recharts version` → `3.8.0` (verified 2026-03-24)
- Project STATE.md — verified Recharts 3.8.0+ lock and React 19 regression note

### Secondary (MEDIUM confidence)
- Project REQUIREMENTS.md — ANA-01 through ANA-05 requirements text
- Project package.json — verified date-fns ^4.1.0 and all other installed packages

### Tertiary (LOW confidence)
- None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — recharts version verified via npm registry; all other packages confirmed in package.json
- Architecture: HIGH — patterns lifted directly from existing Phase 12 codebase files
- Metric computation: MEDIUM — derivation logic is inferred from schema; "School" role and subscription deduplication are open questions
- Pitfalls: HIGH — blank chart regression is a documented locked decision in STATE.md; others are structural analysis of the schema

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (recharts is stable; Supabase schema is project-controlled)
