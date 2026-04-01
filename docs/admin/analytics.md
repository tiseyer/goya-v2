---
title: Analytics
audience: ["admin"]
section: admin
order: 8
last_updated: "2026-04-01"
---

# Analytics

The Analytics section provides data on user growth, shop performance, and visitor traffic. Expand the **Analytics** group in the sidebar to access its three sub-sections.

## Table of Contents

- [Users Analytics](#users-analytics)
- [Shop Analytics](#shop-analytics)
- [Visitors Analytics](#visitors-analytics)

---

## Users Analytics

Navigate to **Analytics > Users** or go to `/admin/analytics/users`.

This page shows user growth and signup activity across all member types.

### Stat Cards

Four summary cards are displayed at the top of the page, each covering the last 30 days:

| Card | Description |
|------|-------------|
| **Total Users** | All registered users at the current time |
| **New This Month** | Users who signed up in the last 30 days |
| **Active This Month** | Users with recent activity (sessions, events, logins) |
| **Verified Users** | Users who have completed identity or email verification |

### User Growth Chart

A time-series line chart shows new signups over the past 12 months. Hover over any point to see the exact count for that month.

### Recent Signups Table

A table lists the most recent registrations, showing:

- User name and avatar
- Email address
- Signup date
- Assigned role (teacher, student, school owner, etc.)
- Account status

---

## Shop Analytics

Navigate to **Analytics > Shop** or go to `/admin/shop/analytics`.

### Filters

At the top of the page, use the filter bar to scope all metrics:

| Filter | Options |
|---|---|
| **Range** | Last 30 days (default), Last 3 months, Last 6 months, Custom |
| **Role** | All, specific member role (filters revenue and funnel by role) |
| **Custom dates** | Date from / to pickers (only active when Range = Custom) |

Changing any filter reloads all metric cards and charts.

### User Funnel

This section shows how users move through the registration and subscription funnel within the selected date range.

| Metric | Description |
|---|---|
| **New Registrations** | Accounts created in the period |
| **Completed Onboarding** | Users who finished the onboarding flow |
| **Conversion Rate** | Percentage of new registrations that completed onboarding |
| **New Subscriptions** | Stripe subscriptions started in the period |
| **Pending Cancellations** | Subscriptions set to cancel at period end |
| **New Cancellations** | Subscriptions fully cancelled in the period |
| **Total Active Members** | Current count of members with an active subscription |
| **Net Growth** | New subscriptions minus new cancellations; shows an up or down trend arrow |

Click **Export CSV** next to the User Funnel heading to download funnel metrics as a spreadsheet.

### Revenue

This section shows Stripe-based revenue metrics for the selected date range.

| Metric | Description |
|---|---|
| **ARR Total** | Annualised run rate — the projected annual revenue from all current active subscriptions |
| **New ARR** | ARR added by new subscriptions started in the period |
| **Churned ARR** | ARR lost from cancellations in the period |
| **Net New ARR** | New ARR minus Churned ARR; positive is growth, negative is contraction |

**Net New ARR** displays a trend arrow (up/down/neutral) to make direction immediately visible.

Click **Export CSV** next to the Revenue heading to download revenue metrics.

### Trends Chart

Below the metric cards, a time-series chart (powered by Recharts) plots daily or weekly revenue and order counts over the selected range. The granularity switches automatically:

- **30 days or fewer** → daily bars
- **More than 60 days** → weekly bars

Click **Export CSV** next to the Trends heading to download the underlying data points.

### Role filter behaviour

When a role is selected, the funnel and revenue metrics are recalculated to include only users who match that role. School owners are also identified and can be included or excluded depending on the role selection.

---

## Visitors Analytics

Navigate to **Analytics > Visitors** or go to `/admin/analytics/visitors`.

This page provides traffic and visitor data for the public-facing GOYA site, powered by the Google Analytics 4 Data API.

### Prerequisites

The Visitors page requires two configuration values to be set:

| Setting | Where to set it |
|---------|-----------------|
| **GA4 Property ID** | Admin → Settings → `ga4_property_id` |
| **Google Service Account Key** | Vercel environment variable `GOOGLE_SERVICE_ACCOUNT_KEY` |

If either value is missing, the page will display a configuration notice. See the [Analytics Manual Setup Guide](../analytics-manual-setup.md) for step-by-step instructions.

### Metrics

When configured, the following metrics are pulled from GA4 for the last 30 days:

| Metric | Description |
|--------|-------------|
| **Total Users** | Unique visitors to the public site |
| **New Users** | First-time visitors in the period |
| **Sessions** | Total browsing sessions |
| **Bounce Rate** | Percentage of sessions that viewed only one page |
| **Avg. Session Duration** | Average time spent per session |
| **Pageviews** | Total pages viewed |

### Traffic Sources

A breakdown of how visitors arrived (organic search, direct, referral, social, paid) is shown as a chart and table.

### Top Pages

A ranked list of the most-visited pages on the public site, with pageview counts.

---

**See also:** [Shop](./shop.md) | [Overview](./overview.md) | [Analytics Manual Setup Guide](../analytics-manual-setup.md)
