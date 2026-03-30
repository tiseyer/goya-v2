---
phase: quick
plan: 260329-rwg
type: execute
wave: 1
depends_on: []
files_modified:
  - app/api/admin/analytics/route.ts
  - app/admin/dashboard/AnalyticsSection.tsx
  - app/admin/dashboard/page.tsx
autonomous: true
requirements: [QUICK-260329-rwg]
must_haves:
  truths:
    - "Admin dashboard shows visitors count for today and last 7 days"
    - "Admin dashboard shows page views for today and last 7 days"
    - "Admin dashboard shows top 5 pages"
    - "Admin dashboard shows top countries"
    - "Analytics data auto-refreshes every 60 seconds"
    - "Non-admin/moderator users cannot access the analytics API"
  artifacts:
    - path: "app/api/admin/analytics/route.ts"
      provides: "Analytics API proxy to Vercel Web Analytics"
      exports: ["GET"]
    - path: "app/admin/dashboard/AnalyticsSection.tsx"
      provides: "Client component rendering analytics data"
  key_links:
    - from: "app/admin/dashboard/AnalyticsSection.tsx"
      to: "/api/admin/analytics"
      via: "fetch with 60s polling interval"
      pattern: "fetch.*api/admin/analytics"
    - from: "app/api/admin/analytics/route.ts"
      to: "https://vercel.com/api/web-analytics"
      via: "server-side fetch with VERCEL_ACCESS_TOKEN"
---

<objective>
Add a live Vercel Analytics section to the admin dashboard showing visitors, page views, top pages, and top countries with 60-second auto-refresh.

Purpose: Give admins real-time website traffic insights without leaving the admin panel.
Output: New API route + client component integrated into existing dashboard page.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/admin/dashboard/page.tsx (existing dashboard — server component with StatCard pattern)
@app/admin/layout.tsx (admin auth guard — checks role is admin or moderator)
@app/api/admin/stripe-sync/route.ts (existing admin API route pattern)
@lib/supabaseServer.ts (server-side Supabase client creator)

<interfaces>
<!-- From app/admin/dashboard/page.tsx -->
The dashboard is a server component using:
- `createSupabaseServerClient` from `@/lib/supabaseServer` for auth
- `StatCard` local component: `{ label: string, value: string | number, icon: React.ReactNode, accent?: boolean }`
- Styling: white cards with `bg-white rounded-xl border border-[#E5E7EB] p-5 shadow-sm hover:shadow-md`
- Section headers: `text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3`
- Layout container: `p-6 lg:p-8 max-w-6xl`
- Color tokens: `#1B3A5C` (heading text), `#6B7280` (muted text), `#00B5A3` (accent)

<!-- From app/admin/layout.tsx -->
Admin auth pattern:
```typescript
const { data: { user } } = await supabase.auth.getUser();
const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
if (!profile || !['admin', 'moderator'].includes(profile.role)) { /* reject */ }
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create analytics API route with Vercel Web Analytics proxy</name>
  <files>app/api/admin/analytics/route.ts</files>
  <action>
Create `app/api/admin/analytics/route.ts` with a GET handler that:

1. **Auth check** — Use `createSupabaseServerClient()` to get the current user, then query `profiles` table for `role`. Return 401 if no user, 403 if role is not `admin` or `moderator`. Match the exact pattern from `app/admin/layout.tsx`.

2. **Fetch from Vercel's undocumented Web Analytics API** — The Vercel dashboard uses these internal endpoints (they require a Bearer token via `VERCEL_ACCESS_TOKEN`):

   **Timeseries (visitors + pageviews):**
   ```
   GET https://vercel.com/api/web-analytics/timeseries?projectId={VERCEL_PROJECT_ID}&environment=production&filter=%7B%7D&from={startDate}&to={endDate}
   ```
   Make TWO calls: one for "today" (from = today 00:00 UTC, to = now) and one for "last 7 days" (from = 7 days ago, to = now).

   **Top pages:**
   ```
   GET https://vercel.com/api/web-analytics/pages?projectId={VERCEL_PROJECT_ID}&environment=production&filter=%7B%7D&from={7daysAgo}&to={now}&limit=5
   ```

   **Top countries:**
   ```
   GET https://vercel.com/api/web-analytics/countries?projectId={VERCEL_PROJECT_ID}&environment=production&filter=%7B%7D&from={7daysAgo}&to={now}&limit=5
   ```

   All requests use header: `Authorization: Bearer ${process.env.VERCEL_ACCESS_TOKEN}`

   If `VERCEL_ACCESS_TOKEN` or `VERCEL_PROJECT_ID` env vars are missing, return `{ error: 'Analytics not configured' }` with status 503.

3. **Response shape:**
   ```typescript
   {
     visitors: { today: number, last7Days: number },
     pageViews: { today: number, last7Days: number },
     topPages: Array<{ key: string, total: number }>,
     topCountries: Array<{ key: string, total: number }>
   }
   ```

   For timeseries responses, sum the `visitors` and `pageViews` fields across all data points in the response array.

   For pages/countries, map the response `data` array to `{ key, total }` shape. The Vercel API returns objects with `key` (page path or country code) and `total` (visitor count).

4. **Error handling** — Wrap all Vercel API calls in try/catch. If any Vercel API call fails (non-200 or network error), log the error and return partial data where possible, or `{ error: 'Failed to fetch analytics' }` with status 502 if all calls fail.

5. **Cache** — Add `Cache-Control: no-store` header since data is live. Use `export const dynamic = 'force-dynamic'` to prevent Next.js static caching.

NOTE: These Vercel endpoints are undocumented/internal. The exact response shape may vary. Add defensive checks (optional chaining, fallback to 0) on all response fields. If the API shape differs from expected, the response should gracefully degrade to zeros rather than crash.
  </action>
  <verify>
    <automated>npx tsc --noEmit app/api/admin/analytics/route.ts 2>&1 | head -20</automated>
  </verify>
  <done>GET /api/admin/analytics returns analytics JSON for authenticated admin users, 401/403 for unauthorized, 503 if env vars missing</done>
</task>

<task type="auto">
  <name>Task 2: Create AnalyticsSection client component and integrate into dashboard</name>
  <files>app/admin/dashboard/AnalyticsSection.tsx, app/admin/dashboard/page.tsx</files>
  <action>
**Part A: Create `app/admin/dashboard/AnalyticsSection.tsx`**

A `'use client'` component that:

1. **State and fetching:**
   - State: `data` (analytics response or null), `loading` (boolean), `error` (string or null), `lastUpdated` (Date or null)
   - On mount and every 60 seconds, fetch `/api/admin/analytics`
   - Use `useEffect` with `setInterval` for polling. Clear interval on unmount.
   - While loading initially, show skeleton/placeholder cards
   - On error, show a subtle error banner within the section (not a toast — keep it contained)

2. **Layout — match existing dashboard styling exactly:**
   - Section header: `<h2 className="text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3">Web Analytics</h2>`
   - Below header, show a subtle "Last updated: {time}" and a small refresh indicator (pulsing dot when fetching)

3. **Stats row (grid matching existing `StatCard` pattern):**
   - Use `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4`
   - Four stat cards matching the existing `StatCard` visual style (copy the exact same card markup from page.tsx — white bg, rounded-xl, border, shadow-sm, icon left, value+label right):
     - "Visitors Today" — `data.visitors.today` — accent color, use an eye/chart icon
     - "Visitors (7d)" — `data.visitors.last7Days` — use same icon
     - "Page Views Today" — `data.pageViews.today` — use a document/page icon
     - "Page Views (7d)" — `data.pageViews.last7Days` — use same icon
   - Format numbers with `toLocaleString()` for comma separators

4. **Top Pages list:**
   - Below the stats grid, add a sub-row with two side-by-side cards (on desktop, stacked on mobile): `grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4`
   - **Top Pages card:** White card matching existing style. Title "Top Pages" in bold. Render `data.topPages` as a numbered list: rank, page path (truncate long paths), visitor count right-aligned. Use `text-sm` for entries.
   - **Top Countries card:** Same style. Title "Top Countries". Render `data.topCountries` as a numbered list with country name (map common country codes to names like US -> United States, DE -> Germany, etc. — use a simple lookup object for top ~30 countries, fallback to raw code). Visitor count right-aligned.

5. **Loading state:** Show the same card structure but with `animate-pulse bg-slate-100` placeholder blocks instead of values.

6. **Error state:** If env vars not configured (503), show a single info card: "Vercel Analytics not configured. Set VERCEL_ACCESS_TOKEN and VERCEL_PROJECT_ID environment variables." with a muted style. If fetch error (502/other), show "Unable to load analytics" with a retry button.

**Part B: Integrate into `app/admin/dashboard/page.tsx`**

1. Import `AnalyticsSection` at the top of page.tsx
2. Add the analytics section between the "User Stats" section and the "Platform" section (between the two existing `div` blocks at ~line 118 and ~line 121):
   ```tsx
   {/* Row 2 — Web Analytics */}
   <div className="mt-8">
     <AnalyticsSection />
   </div>
   ```
3. Renumber the existing "Platform" section comment to "Row 3"
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx next build 2>&1 | tail -20</automated>
  </verify>
  <done>Admin dashboard shows Web Analytics section with 4 stat cards (visitors/pageviews today and 7d), top pages list, and top countries list. Data auto-refreshes every 60 seconds. Gracefully handles missing env vars and API errors.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with no errors
2. `npx next build` succeeds
3. Visit /admin/dashboard — Analytics section visible between User Stats and Platform sections
4. If VERCEL_ACCESS_TOKEN + VERCEL_PROJECT_ID are set, live data appears
5. If env vars missing, graceful "not configured" message shown
6. Network tab shows /api/admin/analytics called every 60s
</verification>

<success_criteria>
- Analytics API route at /api/admin/analytics protected by admin/moderator role check
- Dashboard shows visitors (today + 7d), page views (today + 7d), top 5 pages, top 5 countries
- Auto-refresh every 60 seconds with visual indicator
- Matches existing dashboard card styling exactly
- Graceful degradation when env vars missing or API unreachable
</success_criteria>

<output>
After completion:
1. Commit with message: "feat: add live Vercel Analytics section to admin dashboard"
2. Push to develop branch
3. Create activity/quick-tasks/quick-task_add-vercel-analytics-admin-dashboard_29-03-2026.md per CLAUDE.md instructions
</output>
