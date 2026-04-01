---
phase: quick
plan: 260401-kfs
type: execute
wave: 1
depends_on: []
files_modified:
  - app/admin/dashboard/page.tsx
  - app/admin/dashboard/actions.ts
  - app/admin/analytics/users/page.tsx
  - app/admin/analytics/visitors/VisitorsAnalyticsClient.tsx
  - app/admin/shop/analytics/page.tsx
  - app/admin/shop/analytics/AnalyticsMetricCard.tsx
  - app/admin/shop/analytics/AnalyticsCharts.tsx
  - app/admin/shop/analytics/AnalyticsFilters.tsx
autonomous: true
requirements: []

must_haves:
  truths:
    - "Dashboard and Users analytics pages show real user counts (5,800+ total)"
    - "Growth chart shows cumulative user data across time ranges"
    - "Visitors time range buttons show pointer cursor and loading spinner when switching"
    - "Shop analytics visually matches Visitors/Users analytics page style"
  artifacts:
    - path: "app/admin/dashboard/page.tsx"
      provides: "Fixed Total Members stat card query"
    - path: "app/admin/analytics/users/page.tsx"
      provides: "Fixed Total Members stat card query"
    - path: "app/admin/analytics/visitors/VisitorsAnalyticsClient.tsx"
      provides: "Pointer cursor + loading state on time range buttons"
    - path: "app/admin/shop/analytics/page.tsx"
      provides: "Redesigned layout matching visitors/users style"
  key_links:
    - from: "app/admin/dashboard/page.tsx"
      to: "profiles table"
      via: "supabase count query without role filter"
      pattern: "select.*count.*exact.*head.*true.*not.*wp_roles"
---

<objective>
Fix three admin analytics issues: (1) user data queries returning zero due to role filter excluding NULL-role profiles, (2) visitors tab UX missing cursor/loading states, (3) shop analytics visual redesign to match visitors/users page style.

Purpose: Admin dashboard shows accurate user data, visitors UX is polished, shop analytics has consistent visual design.
Output: Fixed queries, improved UX, redesigned shop analytics page.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@app/admin/dashboard/page.tsx (Dashboard — stat card queries)
@app/admin/dashboard/actions.ts (getMemberGrowthData server action)
@app/admin/dashboard/MemberGrowthChart.tsx (Dashboard growth chart client)
@app/admin/analytics/users/page.tsx (Users analytics — stat cards + recent signups)
@app/admin/analytics/users/UsersAnalyticsClient.tsx (Users growth chart client)
@app/admin/analytics/visitors/VisitorsAnalyticsClient.tsx (Visitors — reference for visual style)
@app/admin/shop/analytics/page.tsx (Shop analytics — current layout to redesign)
@app/admin/shop/analytics/AnalyticsMetricCard.tsx (Shop metric card)
@app/admin/shop/analytics/AnalyticsCharts.tsx (Shop charts)
@app/admin/shop/analytics/AnalyticsFilters.tsx (Shop filters)

<interfaces>
<!-- Root cause analysis for Issue 1 -->

The "Total Members" queries on BOTH dashboard/page.tsx (line 106) and analytics/users/page.tsx (line 209) use:
```typescript
.in('role', ['student', 'teacher', 'wellness_practitioner', 'moderator', 'admin'])
```
This EXCLUDES profiles where `role` is NULL. Since this is a WordPress-migrated database with 5,800+ profiles, most profiles likely have NULL role (never set during migration). The fix is to remove the `.in('role', [...])` filter from the "Total Members" query — just exclude faux/robot via wp_roles. Role-specific cards (Teachers, Students, etc.) should keep their `.eq('role', ...)` filters.

The growth chart (actions.ts getMemberGrowthData) does NOT filter by role for "all" — it only excludes faux/robot. But it defaults to 30D range. If no new signups in 30 days, chart shows empty. The "All" time range (since 2020) should show data. Consider changing default range to "All" or "1Y" to show data on first load.

<!-- Visual style reference for Issue 3 (from visitors/users pages) -->

Visitors/Users style conventions:
- Page header: `text-2xl font-bold text-[#1B3A5C]` + subtitle `text-sm text-slate-500`
- Section headers: `text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3`
- Stat cards: `bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 flex flex-col`
- Chart container: `bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5`
- Charts: AreaChart with gradient fill (#345c83), not LineChart with CartesianGrid
- Filter pills: `px-3 py-1 rounded-full text-xs font-medium` (not <select> dropdowns)
- Tables: `bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden`
- Grid: `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4` for metric cards (visitors uses lg:grid-cols-6)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix user data queries on dashboard and users analytics</name>
  <files>app/admin/dashboard/page.tsx, app/admin/analytics/users/page.tsx, app/admin/dashboard/actions.ts</files>
  <action>
**Fix "Total Members" stat card queries in BOTH files:**

In `app/admin/dashboard/page.tsx` (lines 104-108), change the totalMembersRes query from:
```typescript
svc.from('profiles').select('*', { count: 'exact', head: true })
  .in('role', ['student', 'teacher', 'wellness_practitioner', 'moderator', 'admin'])
  .not('wp_roles', 'cs', '{"faux"}')
  .not('wp_roles', 'cs', '{"robot"}')
```
to:
```typescript
svc.from('profiles').select('*', { count: 'exact', head: true })
  .not('wp_roles', 'cs', '{"faux"}')
  .not('wp_roles', 'cs', '{"robot"}')
```
Remove the `.in('role', [...])` filter. This counts ALL real profiles regardless of whether role is set.

Apply the EXACT same change in `app/admin/analytics/users/page.tsx` (lines 206-211) — same query, same fix.

**Keep all role-specific card queries unchanged** (Teachers, Students, Wellness) — those correctly filter `.eq('role', 'teacher')` etc.

**Fix growth chart default range:**

In `app/admin/dashboard/MemberGrowthChart.tsx` and `app/admin/analytics/users/UsersAnalyticsClient.tsx`, change the default useState for range from `'30D'` to `'All'`:
```typescript
const [range, setRange] = useState<string>('All')
```
This ensures the chart shows cumulative growth data on first load instead of only the last 30 days (which may have zero new signups).

**Do NOT modify** the getMemberGrowthData server action — it correctly handles the "all" role filter by only excluding faux/robot without role filtering.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
- "Total Members" stat card query in both dashboard/page.tsx and analytics/users/page.tsx no longer filters by role column
- Growth charts default to "All" time range
- Role-specific cards (Teachers, Students, Wellness) still filter correctly
- TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 2: Add cursor pointer and loading state to visitors time range buttons</name>
  <files>app/admin/analytics/visitors/VisitorsAnalyticsClient.tsx</files>
  <action>
**Add cursor-pointer to time range pill buttons:**

In `VisitorsAnalyticsInner`, the TIME_RANGES buttons (around line 112) already have transition-colors but are missing `cursor-pointer`. Add it to the className of each button:
```typescript
className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
  currentRange === r.key
    ? 'bg-[#1B3A5C] text-white'
    : 'border border-[#E5E7EB] text-[#374151] hover:bg-slate-50'
}`}
```

**Add loading state when switching time ranges:**

The visitors page uses `router.push` for range changes (server-side re-fetch). Add a `useTransition` hook to show a loading spinner while the page re-renders:

1. Import `useTransition` from 'react' (already imported in some files, add if missing).
2. In `VisitorsAnalyticsInner`, add: `const [isPending, startTransition] = useTransition()`
3. Wrap the `router.push` call in `handleRangeChange` with `startTransition`:
```typescript
function handleRangeChange(key: string) {
  const params = new URLSearchParams(searchParams.toString())
  params.set('range', key)
  startTransition(() => {
    router.push(`?${params.toString()}`)
  })
}
```
4. Add a loading overlay to the main content area. After the time filter pills div and before the stats row, add:
```tsx
{isPending && (
  <div className="flex items-center justify-center py-8">
    <div className="w-5 h-5 border-2 border-slate-300 border-t-[#345c83] rounded-full animate-spin" />
  </div>
)}
```
5. Wrap the rest of the content (stats row through tables grid) in a container that fades when pending:
```tsx
<div className={`space-y-6 transition-opacity ${isPending ? 'opacity-40 pointer-events-none' : ''}`}>
  {/* Stats row, chart, tables — existing content */}
</div>
```

This shows the spinner from the visitors page's existing design system and dims content while the server re-fetches data (3-4 seconds).
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
- Time range buttons show cursor:pointer on hover
- Clicking a time range shows a spinner and dims content while data loads
- Existing functionality unchanged — range switching still works via URL params
- TypeScript compiles without errors
  </done>
</task>

<task type="auto">
  <name>Task 3: Redesign shop analytics to match visitors/users visual style</name>
  <files>app/admin/shop/analytics/page.tsx, app/admin/shop/analytics/AnalyticsMetricCard.tsx, app/admin/shop/analytics/AnalyticsCharts.tsx, app/admin/shop/analytics/AnalyticsFilters.tsx</files>
  <action>
Redesign all four shop analytics files to match the visual conventions of the visitors and users analytics pages. Keep ALL existing data fetching logic and functionality — only change presentation.

**AnalyticsFilters.tsx — Convert dropdowns to pill buttons:**

Replace the `<select>` elements with pill-style buttons matching visitors page pattern:
- Time range: pill buttons for "30D", "3M", "6M", "Custom" (keep the same URL param values: 30d, 3mo, 6mo, custom)
- Role filter: pill buttons for "All", "Student", "Teacher", "Wellness", "School"
- Style each pill: `px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors` with active state `bg-[#1B3A5C] text-white` and inactive `border border-[#E5E7EB] text-[#374151] hover:bg-slate-50`
- Keep the custom date inputs — show them inline when "Custom" is selected
- Keep the `useTransition` and `router.replace` logic

**AnalyticsMetricCard.tsx — Match visitors/users card style:**

Update the card wrapper classes from `rounded-lg border bg-white p-4 shadow-sm` to match visitors style:
```
bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 flex flex-col
```
Update label style to `text-xs text-[#6B7280] font-medium` (was `text-sm text-gray-500`).
Update value style to `text-2xl font-bold text-[#1B3A5C] mt-1 leading-none`.
For trend indicators, use the TrendBadge pattern from visitors (small chevron SVG + colored text: emerald-600 for up, red-500 for down) instead of the current full arrow SVGs.

**AnalyticsCharts.tsx — Convert LineChart to AreaChart with gradient:**

Replace both LineCharts with AreaCharts matching the visitors/users pattern:
- Remove CartesianGrid, Legend
- Use AreaChart with gradient fill (defs > linearGradient)
- Revenue chart: gradient id `revenueGradient`, stopColor `#00B5A3` (the brand teal), stroke `#00B5A3`
- Orders chart: gradient id `ordersGradient`, stopColor `#345c83` (the brand blue), stroke `#345c83`
- XAxis: `tick={{ fontSize: 11, fill: '#6B7280' }}`, `tickLine={false}`, `axisLine={{ stroke: '#E5E7EB' }}`
- YAxis: `tick={{ fontSize: 11, fill: '#6B7280' }}`, `tickLine={false}`, `axisLine={false}`, `width={50}`
- Tooltip: dark style `backgroundColor: '#1B3A5C'`, `border: 'none'`, `borderRadius: '8px'`, `fontSize: '12px'`, `color: 'white'`, `padding: '8px 12px'`
- Wrap each chart in: `bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-5`
- Chart section header inside card: `text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-4`
- Chart height: `h-[300px]` (consistent with visitors/users)
- Empty state: `h-full flex items-center justify-center text-sm text-slate-400` with "No data for this period"

**page.tsx — Update layout and section headers:**

Update page header to match: `text-2xl font-bold text-[#1B3A5C]` with subtitle `text-sm text-slate-500 mt-1` saying "Revenue, subscriptions, and order trends."

Section headers: Replace `text-lg font-semibold text-[#1B3A5C]` with `text-xs font-semibold text-[#6B7280] uppercase tracking-widest mb-3` (matching visitors/users). Sections: "User Funnel", "Revenue", "Trends".

Metric card grid: Use `grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4` (already close, just ensure consistency).

Keep CsvExportButton as-is — place it inline with section headers using `flex items-center justify-between mb-3`.

Add loading/pending state: Since the page already uses `<Suspense>` around AnalyticsFilters, add `useTransition` inside AnalyticsFilters and pass `isPending` state. In page.tsx, wrap the metric cards and charts content in a div that gets `opacity-40 pointer-events-none` class when filters change (same pattern as visitors task). Since page.tsx is a server component, the pending state should be handled by AnalyticsFilters broadcasting via URL params (which triggers server re-render). This is already the existing behavior — just ensure AnalyticsFilters uses `startTransition` (it already does on line 21).

Overall spacing: `space-y-6` between sections (already used).
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
  </verify>
  <done>
- Shop analytics page uses pill-button filters (not dropdowns)
- Metric cards use rounded-xl border-[#E5E7EB] shadow-sm style
- Charts use AreaChart with gradient fills (not LineChart with CartesianGrid)
- Section headers use uppercase tracking-widest pattern
- Tooltip uses dark #1B3A5C style
- All existing data, CSV export, and filtering functionality preserved
- Visual style is consistent with visitors and users analytics pages
- TypeScript compiles without errors
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero TypeScript errors
2. `npm run build` — successful Next.js build with no errors
3. Visual check: /admin/dashboard shows Total Members count > 5000, growth chart has data on load
4. Visual check: /admin/analytics/users shows same Total Members count, growth chart has data
5. Visual check: /admin/analytics/visitors time range buttons show pointer cursor, clicking shows loading spinner
6. Visual check: /admin/shop/analytics uses pill buttons, rounded-xl cards, AreaChart with gradients
</verification>

<success_criteria>
- Dashboard "Total Members" shows 5,800+ (not 0 or dashes)
- Users analytics "Total Members" matches dashboard count
- Growth charts show cumulative data by default (All time range)
- Visitors time range buttons have cursor:pointer and loading state
- Shop analytics is visually indistinguishable in style from visitors/users pages
- All existing data and functionality preserved
</success_criteria>

<output>
After completion, create `.planning/quick/260401-kfs-fix-admin-analytics-user-data-visitors-u/260401-kfs-SUMMARY.md`
</output>
