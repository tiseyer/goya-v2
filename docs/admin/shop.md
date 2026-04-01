---
title: Shop
audience: ["admin"]
section: admin
order: 7
last_updated: "2026-04-01"
---

# Shop

The Shop section covers all commerce-related management: products for sale, customer orders, subscriptions, and discount coupons. Expand the **Shop** group in the sidebar to access its sub-sections.

## Table of Contents

- [Products](#products)
- [Orders](#orders)
- [Subscriptions](#subscriptions)
- [Coupons](#coupons)

---

## Products

Navigate to **Shop > Products** or go to `/admin/shop/products`.

### Product list

The table shows all products, ordered by **priority** (display position) by default. Each row includes the product name, price, type, sales count, and derived status.

#### Product status

Status is derived from the combination of the platform `is_active` flag and the linked Stripe product's active state:

| Status | Condition | Visible on site |
|---|---|---|
| **Published** | `is_active: true` and Stripe product active | Yes |
| **Draft** | `is_active: false` | No |
| **Deleted** | Stripe product deactivated | No |

#### Price type badges

| Badge | Meaning |
|---|---|
| **one_time** | Single purchase |
| **recurring** | Subscription |

### Filters

| Filter | Options |
|---|---|
| **Search** | Matches product name or slug |
| **Status** | All, Published, Draft, Deleted |
| **Type** | All, One-time, Recurring |
| **Sort** | Priority (default), Name A-Z, Name Z-A, Newest, Oldest |

### Creating a product

Click **Create Product** in the top-right corner to open `/admin/shop/products/new`. Fill in the product name, slug, price, category, and image. Linking to a Stripe product ID connects the listing to your Stripe catalog.

### Editing a product

Click the **Edit** action on any product row to open `/admin/shop/products/[id]`.

**Important:** Price cannot be changed after a product is created, because price changes in Stripe require creating a new price object. To update pricing, archive the old product and create a new one.

### Sorting products (drag-drop)

On the Products table, rows can be reordered by dragging them. The order is saved as the `priority` field and determines the display sequence in the public shop.

### Toggling visibility

Use the **is_active** toggle within a product's edit page to flip it between **Draft** and **Published** without affecting the Stripe product.

---

## Orders

Navigate to **Shop > Orders** or go to `/admin/shop/orders`.

### Order list

The table shows all Stripe orders (both one-time and subscription) ordered newest first. Each row shows the customer name, email, product, order type, amount, status, and creation date.

### Filters

| Filter | Options |
|---|---|
| **Search** | Matches customer name or email |
| **Type** | All, One-time (`one_time`), Recurring (`recurring`) |
| **Status** | All, or any Stripe payment/subscription status |
| **Date range** | From and To date pickers |
| **Price range** | Min and Max dollar amounts |
| **Sort** | Newest (default), Oldest, Amount high to low, Amount low to high |

### Order detail

Click any order row to open `/admin/shop/orders/[id]`. The detail page shows:

- Full customer and payment information
- Stripe payment intent or subscription ID
- **Event timeline** — a chronological log of all status changes on the order (e.g. payment succeeded, subscription renewed, cancellation scheduled)

### Refunds and cancellations

From the order detail page:

- **Refund** — initiates a Stripe refund for one-time payments
- **Cancel subscription** — schedules or immediately cancels a recurring subscription

Both actions update the order status and are recorded in the event timeline.

---

## Subscriptions

Navigate to **Shop > Subscriptions** or go to `/admin/shop/subscriptions`.

### Subscription list

The table shows all subscriptions ordered newest first. Each row shows the customer name and email, plan name, billing interval, status, amount, the period start date, and the next payment date (or cancellation date if the subscription is ending at period end).

### Table columns

| Column | Description |
|---|---|
| **Customer** | Name and email of the subscriber |
| **Plan** | Plan name plus Monthly/Yearly badge |
| **Status** | Subscription status pill (see below) |
| **Amount** | Billing amount in cents, displayed in dollars |
| **Started** | Current period start date (falls back to created date) |
| **Next Payment** | Next billing date, or "Cancels [date]" if ending at period end |
| **Stripe ID** | First 8 characters of the Stripe subscription ID, linked to the Stripe dashboard |

### Status badges

| Status | Color | Meaning |
|---|---|---|
| **active** | Green | Subscription is active and billing normally |
| **trialing** | Blue | Customer is in a free trial period |
| **past_due** | Amber | Payment failed but subscription not yet canceled |
| **canceled** | Gray | Subscription has been canceled |
| **incomplete** | Red | Initial payment failed |
| **paused** | Gray | Billing paused |
| **unpaid** | Red | Invoice unpaid after retries |

### Filters

| Filter | Options |
|---|---|
| **Search** | Matches customer name or email |
| **Status** | All, Active, Trialing, Past Due, Canceled, Incomplete, Paused, Unpaid |
| **Date range** | From and To date pickers |
| **Sort** | Newest (default), Oldest, Amount high to low, Amount low to high |

### Empty state

When no subscriptions are found (either no data exists yet, or filters return no results), the table shows:

> "No subscriptions found. Subscriptions will appear here once imported or created via Stripe."

Subscriptions are created via Stripe webhooks or manual import — there is no create form in the admin UI.

---

## Coupons

Navigate to **Shop > Coupons** or go to `/admin/shop/coupons`.

### Coupon list

The table lists all Stripe coupons with their code, discount type, redemption count, validity, and expiry.

#### Discount types

| Type | Description |
|---|---|
| **percent** | Percentage off the order total |
| **amount** | Fixed dollar amount off |
| **free_product** | Grants a product for free |

#### Validity

| Status | Meaning |
|---|---|
| **Active** | `valid: true` — can currently be redeemed |
| **Expired** | `valid: false` — max redemptions reached or past expiry date |

### Filters

| Filter | Options |
|---|---|
| **Search** | Matches coupon name or code |
| **Status** | All, Active, Expired |
| **Sort** | Newest (default), Oldest, Name A-Z, Name Z-A |

### Creating a coupon

Click **Create Coupon** to open the coupon form. Fields include:

- **Name** — internal label
- **Code** — the code members enter at checkout
- **Discount type and amount** — percentage, fixed amount, or free product
- **Max redemptions** — leave blank for unlimited
- **Expiry date** — leave blank for no expiry

Coupons are created in Stripe and synced to the local database.

### Manual assignment

From a coupon's detail page, admins can manually assign a coupon to a specific user by entering their user ID or email. The coupon is applied to their account without them needing to enter the code.

### Redemption history

The coupon detail page shows a list of every redemption, including the user who redeemed it and the date.

---

**See also:** [Analytics](./analytics.md) | [Audit Log](./audit-log.md)
