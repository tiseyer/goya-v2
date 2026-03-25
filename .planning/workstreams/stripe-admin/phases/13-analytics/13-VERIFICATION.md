---
phase: 13-analytics
verified: 2026-03-24T18:00:00Z
status: human_needed
score: 9/9 must-haves verified
re_verification: false
human_verification:
  - test: "Navigate to /admin/shop/analytics as an admin. Select 'Custom range' from the time range dropdown. Verify that date inputs appear after the URL updates."
    expected: "After selecting 'Custom range', the page re-renders and shows two date input fields (Date from, Date to). This involves a brief round-trip to the server — date inputs should appear within ~1s of selecting Custom."
    why_human: "AnalyticsFilters uses initialRange prop (server-side) rather than local state to toggle date input visibility. The behavior is correct but depends on a URL-driven re-render. Cannot confirm the user experience is acceptable without browser testing."
  - test: "Navigate to /admin/shop/analytics. Change the role filter to 'Student'. Verify metric cards update with student-only data."
    expected: "Funnel and revenue metric cards reflect only student-role data after the URL param ?role=student takes effect."
    why_human: "Role filter correctness is verified in unit tests, but the full round-trip (filter -> URL -> server re-render -> metric update) requires a running app and data in the database."
  - test: "Click any 'Export CSV' button. Verify the downloaded file has correct headers and data."
    expected: "A CSV file downloads with headers matching the metric section (e.g. 'New Registrations,Completed Onboarding,...') and one data row with current values."
    why_human: "downloadCsv triggers a Blob URL download in the browser — cannot verify file download behavior programmatically without a running app."
  - test: "Verify both Recharts line charts render interactively (hover tooltips work)."
    expected: "Revenue Over Time and New Orders Over Time charts display a line and show tooltip on hover. If no orders exist, shows 'No data for this period' text instead."
    why_human: "Recharts rendering requires a real browser with DOM and canvas support — jsdom cannot reliably verify chart interactivity."
---

# Phase 13: Analytics Verification Report

**Phase Goal:** Admins can view user funnel and revenue metrics computed from local tables, filtered by role and time range, with chart and CSV export
**Verified:** 2026-03-24T18:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Funnel metrics (registrations, onboarding, conversions, subscriptions, cancellations, active members, net growth) are correctly computed from raw profile and order data | VERIFIED | 29 passing unit tests in metrics.test.ts covering all 8 funnel fields; computeFunnelMetrics exported and wired in page.tsx |
| 2 | ARR metrics (total, new, churned, net) are correctly computed from orders + prices with subscription deduplication | VERIFIED | 6 passing revenue unit tests including deduplication by stripe_customer_id+stripe_product_id key; interval multiplier helper (month->12, year->1, week->52, day->365) tested across all intervals |
| 3 | All metrics can be filtered by member role (student, teacher, wellness_practitioner, school) | VERIFIED | 3 passing role-filter unit tests; filterProfilesByRole and filterOrdersByRole internals verified; schoolOwnerIds set built from schools table in page.tsx |
| 4 | CSV export produces valid comma-separated output with headers and escaped values | VERIFIED | 13 passing csv.test.ts tests covering comma escaping, quote doubling, null/undefined as empty cells, multi-row output; CsvExportButton.tsx wires exportToCsv+downloadCsv |
| 5 | Analytics page loads without any Stripe API calls; all metrics from Supabase tables only | VERIFIED | grep confirmed zero lib/stripe imports in analytics directory; page.tsx uses getSupabaseService() with Promise.all for 4 parallel Supabase queries |
| 6 | Admin can select time range (30d / 3mo / 6mo / custom) and all metrics update | VERIFIED | AnalyticsFilters.tsx contains all 4 options (30d/3mo/6mo/custom); updateParam drives router.replace to URL-based re-render; getRangeBoundaries handles all 4 cases in page.tsx |
| 7 | Admin can filter by member role (All / Student / Teacher / Wellness Practitioner / School) | VERIFIED | AnalyticsFilters.tsx has all 5 role options; roleFilter param passed to computeFunnelMetrics and computeRevenueMetrics |
| 8 | Revenue over time and new orders over time render as interactive Recharts line charts | VERIFIED (code) | AnalyticsCharts.tsx imports ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend from recharts@3.8.0; two LineChart instances for revenue and orders; empty-state fallback "No data for this period" — visual confirmation needs human |
| 9 | Admin can click CSV export button and download a valid CSV file for any metric section | VERIFIED (code) | CsvExportButton.tsx wired to exportToCsv+downloadCsv; three CsvExportButton instances in page.tsx (funnel, revenue, chart trend data) — download behavior needs human |

**Score:** 9/9 truths verified (automated). 4 items routed to human confirmation.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/analytics/metrics.ts` | Pure computation functions for funnel and revenue metrics | VERIFIED | 303 lines; exports computeFunnelMetrics, computeRevenueMetrics, bucketTimeSeries, getAnnualMultiplier, all required interfaces and RoleFilter type; no Supabase/React imports |
| `lib/analytics/metrics.test.ts` | Unit tests for all metric computations | VERIFIED | 356 lines (min 100 required); 29 tests covering funnel, revenue, role-filter, time-series, multiplier helpers — all passing |
| `lib/analytics/csv.ts` | CSV serialization helper | VERIFIED | 32 lines; exports formatCsvValue, exportToCsv, downloadCsv; no Supabase/React imports |
| `lib/analytics/csv.test.ts` | Unit tests for CSV export | VERIFIED | 68 lines (min 20 required); 13 tests covering all edge cases — all passing |
| `app/admin/shop/analytics/page.tsx` | Server component that fetches data and computes metrics | VERIFIED | 271 lines (min 80 required); async server component; imports all 3 metric functions; Promise.all parallel fetch; no Stripe imports |
| `app/admin/shop/analytics/AnalyticsFilters.tsx` | Client component for time range and role filter controls | VERIFIED | Contains 'use client'; useRouter + useTransition + useSearchParams; all 4 time ranges and 5 role options present; router.replace wired |
| `app/admin/shop/analytics/AnalyticsCharts.tsx` | Client component rendering Recharts LineChart | VERIFIED | Contains 'use client'; imports from 'recharts'; ResponsiveContainer + LineChart used; empty-state fallback present |
| `app/admin/shop/analytics/AnalyticsMetricCard.tsx` | Presentational metric card component | VERIFIED | 28 lines (min 10 required); label and value props; trend indicator (up/down/neutral) via SVG arrows |
| `app/admin/shop/analytics/CsvExportButton.tsx` | Client component for CSV download trigger | VERIFIED | Contains 'use client'; imports exportToCsv and downloadCsv from '@/lib/analytics/csv'; onClick handler wired |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/admin/shop/analytics/page.tsx` | `lib/analytics/metrics.ts` | import computeFunnelMetrics, computeRevenueMetrics, bucketTimeSeries | WIRED | Lines 3-8 confirm named imports; all three functions called with correct arguments |
| `app/admin/shop/analytics/page.tsx` | `supabase` | getSupabaseService() parallel queries | WIRED | Line 61: getSupabaseService(); Lines 64-77: Promise.all with 4 queries (stripe_orders, profiles, stripe_prices, schools) |
| `app/admin/shop/analytics/AnalyticsCharts.tsx` | `recharts` | LineChart, ResponsiveContainer imports | WIRED | Lines 3-11 import 7 recharts symbols; two LineChart components render revenue and orders data |
| `app/admin/shop/analytics/CsvExportButton.tsx` | `lib/analytics/csv.ts` | import exportToCsv, downloadCsv | WIRED | Line 3 confirms import; handleClick calls exportToCsv then downloadCsv |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `page.tsx` | funnel, revenue, chartData | Promise.all Supabase queries (stripe_orders, profiles, stripe_prices, schools) | Yes — real DB queries with no static fallback; empty arrays only on Supabase error | FLOWING |
| `AnalyticsCharts.tsx` | chartData prop | Passed from page.tsx (bucketTimeSeries output) | Yes — computed from real orders | FLOWING |
| `CsvExportButton.tsx` | data prop | funnelCsvData / revenueCsvData / chartCsvData passed from page.tsx | Yes — built from computed metric objects | FLOWING |
| `AnalyticsMetricCard.tsx` | value prop | funnel.* / revenue.* fields passed from page.tsx | Yes — computed from real data | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| All analytics unit tests pass | npx vitest run lib/analytics/ | 126 tests passing across 6 test files (3 copies: main + 2 worktrees) | PASS |
| No Stripe API imports in analytics directory | grep -r "lib/stripe" app/admin/shop/analytics/ | No output | PASS |
| recharts version is 3.8.0 (locked, not ^3.8.0) | node -e package.json | recharts: 3.8.0 | PASS |
| metrics.ts exports computeFunnelMetrics, computeRevenueMetrics, bucketTimeSeries | grep exports | All 3 exported at expected lines | PASS |
| csv.ts exports formatCsvValue, exportToCsv, downloadCsv | grep exports | All 3 exported | PASS |
| Commits fe0e9b3 and 85d832a exist | git log | Both commits present in develop branch | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| ANA-01 | 13-01-PLAN, 13-02-PLAN | User funnel metrics with time range selector (8 metrics: registrations, onboarding, conversion, subscriptions, pending/new cancellations, active members, net growth) | SATISFIED | computeFunnelMetrics returns all 8 fields; all 8 AnalyticsMetricCard instances in page.tsx; time range filter wired via URL params |
| ANA-02 | 13-01-PLAN, 13-02-PLAN | Revenue metrics from local Supabase tables (no Stripe API): ARR total, new ARR, churned ARR, net new ARR | SATISFIED | computeRevenueMetrics returns all 4 ARR fields; page.tsx confirmed to have no lib/stripe import; all 4 revenue cards rendered |
| ANA-03 | 13-01-PLAN, 13-02-PLAN | Funnel and revenue metrics split/filtered by member role: Student / Teacher / Wellness Practitioner / School | SATISFIED | Role filter UI in AnalyticsFilters.tsx has all 5 options; filterProfilesByRole and filterOrdersByRole unit-tested; school role uses schoolOwnerIds Set from schools table |
| ANA-04 | 13-01-PLAN, 13-02-PLAN | Admin can export any metric or chart as CSV | SATISFIED | 3 CsvExportButton instances (funnel, revenue, trends); exportToCsv produces RFC-4180-compliant output per 13 passing tests |
| ANA-05 | 13-02-PLAN | Interactive time-series charts (Recharts): revenue over time and new orders over time | SATISFIED (code) | AnalyticsCharts.tsx: two LineChart instances with recharts@3.8.0; interactive Tooltip on both; visual confirmation needed |

**Note on ANA-05 in REQUIREMENTS.md:** The REQUIREMENTS.md traceability table shows ANA-05 as "Pending" at the bottom of the document (line 140), but the checkbox at line 66 shows `- [ ] **ANA-05**` as unchecked while ANA-01 through ANA-04 are checked. This is a documentation inconsistency — the code implementation exists and is complete. The REQUIREMENTS.md should be updated to mark ANA-05 as complete once human visual verification passes.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `AnalyticsFilters.tsx` | 66 | `{initialRange === 'custom' && ...}` — date inputs gated on server-side prop, not local state | Info | Date inputs only appear after URL re-render round-trip when user selects 'Custom'. Behavior is intentional (matches OrdersFilters pattern) but causes ~1 navigation hop before inputs appear. Not a blocker. |

No TODO/FIXME/HACK/PLACEHOLDER comments found. No empty implementations. No hardcoded empty data in rendering paths.

### Human Verification Required

#### 1. Custom Date Range Input Appearance

**Test:** Log in as admin, navigate to `/admin/shop/analytics`, select "Custom range" from the time range dropdown.
**Expected:** After the URL updates to `?range=custom` and the page re-renders, two date input fields ("Date from" and "Date to") appear in the filter bar.
**Why human:** AnalyticsFilters uses `initialRange` prop (server value) to toggle date inputs, not local React state. The inputs appear after a URL-driven server re-render — cannot confirm the UX latency is acceptable without browser testing.

#### 2. Role Filter End-to-End

**Test:** Change the role filter to "Student" on the analytics page.
**Expected:** Funnel and revenue metric cards update to show only data for users with `member_type='student'`. If no student data exists in the database, cards should show 0 values (not errors).
**Why human:** Role filter correctness is unit-tested, but the full round-trip (URL param -> server re-render -> Supabase query -> metric computation) requires a running app.

#### 3. CSV Download Behavior

**Test:** Click the "Export CSV" button next to "User Funnel".
**Expected:** A file named `funnel-metrics.csv` downloads. Opening it reveals a header row (`New Registrations,Completed Onboarding,Conversion Rate,...`) and one data row with current values.
**Why human:** `downloadCsv` uses `Blob` and `URL.createObjectURL` — browser-only APIs that cannot be exercised in automated checks.

#### 4. Recharts Chart Interactivity

**Test:** Observe the "Trends" section on the analytics page. Hover over a point on the "Revenue Over Time" chart.
**Expected:** A tooltip appears showing revenue value for that date. If no order data exists in the database, the text "No data for this period" appears instead of charts.
**Why human:** Recharts renders to SVG in a real DOM — jsdom/node cannot validate interactive tooltip behavior.

### Gaps Summary

No blocking gaps found. All 9 observable truths are verified at the code level:

- Pure computation layer (metrics.ts, csv.ts): fully implemented and tested (42 unit tests passing)
- UI layer: all 5 components exist, are substantive, wired, and data flows through them from real Supabase queries
- No Stripe API imports in the analytics path
- recharts@3.8.0 installed (locked, no caret)
- All 5 requirements (ANA-01 through ANA-05) have implementation evidence

4 items require human confirmation because they involve browser-specific behavior (CSV download, chart rendering, URL-driven UI transitions). The REQUIREMENTS.md documentation inconsistency on ANA-05 should be resolved after human verification passes.

---

_Verified: 2026-03-24T18:00:00Z_
_Verifier: Claude (gsd-verifier)_
