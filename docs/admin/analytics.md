---
title: Analytics
audience: ["admin"]
section: admin
order: 8
last_updated: "2026-03-31"
---

# Analytics

The Analytics section provides data on shop performance and visitor traffic. Expand the **Analytics** group in the sidebar to access its two sub-sections.

## Table of Contents

- [Shop Analytics](#shop-analytics)
- [Visitors Analytics](#visitors-analytics)

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

This page provides traffic and visitor data for the public-facing GOYA site. Specific metrics and charts depend on the visitor tracking integration configured for the project.

---

**See also:** [Shop](./shop.md) | [Overview](./overview.md)
