---
title: Audit Log
audience: ["admin"]
section: admin
order: 13
last_updated: "2026-04-01"
---

# Audit Log

The Audit Log is a tamper-evident record of every significant action taken on the platform. It is the primary tool for compliance, debugging, and investigating unexpected behaviour. Navigate to **Settings > Audit Log** or go to `/admin/audit-log`.

## Table of Contents

- [What is Tracked](#what-is-tracked)
- [All Action Codes](#all-action-codes)
- [Schema](#schema)
- [Table Columns](#table-columns)
- [Filters](#filters)
- [Reading an Entry](#reading-an-entry)
- [Exporting](#exporting)
- [Adding New Audit Events (Developer Guide)](#adding-new-audit-events)

---

## What is Tracked

The audit log captures actions across three categories:

| Category | Examples |
|---|---|
| **admin** | Approving schools, verifications, credits, changing user roles, managing API keys, toggling maintenance mode, editing settings |
| **user** | Login/registration, profile updates, connection requests, course enrollment, credit submissions |
| **system** | Cron job execution, Stripe webhook events, email delivery status, payment outcomes |

Each entry records **who** performed the action, **what** they did, **what they did it to**, and **when**.

---

## All Action Codes

### User Actions

| Action Code | Description | Target Type |
|---|---|---|
| `user.login` | User logged in (email/password or OAuth) | — |
| `user.registered` | New user account created | — |
| `user.profile_updated` | Profile fields changed | USER |
| `user.connection_requested` | Connection request sent | USER |
| `user.connection_accepted` | Connection request accepted | USER |

### Admin Actions

| Action Code | Description | Target Type |
|---|---|---|
| `admin.user_role_changed` | User role changed (incl. upgrade approvals/rejections) | USER |
| `admin.user_created` | New user created by admin | USER |
| `admin.user_impersonated` | Admin impersonated a user | USER |
| `admin.school_approved` | School registration approved | SCHOOL |
| `admin.school_rejected` | School registration rejected | SCHOOL |
| `admin.verification_approved` | Teacher/wellness verification approved | USER |
| `admin.verification_rejected` | Verification rejected | USER |
| `admin.event_status_changed` | Event status changed (approve/reject) | EVENT |
| `admin.course_status_changed` | Course status changed (approve/reject) | COURSE |
| `admin.credit_approved` | Credit entry approved | CREDIT |
| `admin.credit_rejected` | Credit entry rejected | CREDIT |
| `admin.settings_changed` | Site settings key changed | — |
| `admin.maintenance_mode_enabled` | Maintenance mode turned on | — |
| `admin.maintenance_mode_disabled` | Maintenance mode turned off | — |
| `admin.email_sandbox_enabled` | Email sandbox enabled | — |
| `admin.email_sandbox_disabled` | Email sandbox disabled | — |
| `admin.chatbot_sandbox_enabled` | Chatbot maintenance mode enabled | — |
| `admin.chatbot_sandbox_disabled` | Chatbot maintenance mode disabled | — |
| `admin.api_key_created` | New API key created | API_KEY |
| `admin.api_key_revoked` | API key revoked | API_KEY |

### System Actions

| Action Code | Description | Target Type |
|---|---|---|
| `system.cron_executed` | Cron job completed successfully | — |
| `system.stripe_webhook_received` | Stripe webhook event received | — |
| `system.stripe_payment_succeeded` | Stripe payment succeeded | — |
| `system.stripe_payment_failed` | Stripe payment failed (severity: warning) | — |
| `system.stripe_subscription_created` | Subscription created via Stripe | — |
| `system.stripe_subscription_updated` | Subscription updated via Stripe | — |
| `system.stripe_subscription_deleted` | Subscription deleted via Stripe | — |
| `system.stripe_webhook_failed` | Stripe webhook handler error (severity: error) | — |
| `system.email_sent` | Email sent via Resend (recipient anonymized) | — |
| `system.email_failed` | Email delivery failed (severity: error) | — |

---

## Schema

Each audit log entry contains:

| Field | Type | Description |
|---|---|---|
| `category` | `admin` / `user` / `system` | Who initiated the action |
| `action` | string | Machine-readable action code (e.g. `user.login`) |
| `severity` | `info` / `warning` / `error` | Importance level |
| `actor_id` | UUID | Profile ID of the user who performed the action (null for system) |
| `actor_name` | string | Display name of the actor |
| `actor_role` | string | Role at time of action (e.g. `admin`, `teacher`) |
| `target_type` | string | Type of affected object (e.g. `USER`, `SCHOOL`, `EVENT`) |
| `target_id` | string | ID of the affected object |
| `target_label` | string | Human-readable label (e.g. school name, event title) |
| `description` | string | Human-readable summary |
| `metadata` | JSON | Additional context: old/new values, error details, etc. |
| `ip_address` | inet | IP address of the request (when available) |
| `created_at` | timestamp | When the event occurred |

---

## Table Columns

| Column | Description |
|---|---|
| **Time** | Date and time of the action (displayed in DD.MM.YYYY HH:MM format) |
| **Category** | `admin`, `user`, or `system` badge |
| **Severity** | `info`, `warning`, or `error` badge |
| **Actor** | Name and role of the user who performed the action |
| **Action** | Machine-readable action code shown in a monospace pill |
| **Target** | The type and label of the object affected |
| **Description** | A human-readable summary of what happened |
| **Details** | An expandable section showing metadata as formatted key-value pairs |

### Severity levels

| Severity | Badge colour | When used |
|---|---|---|
| **info** | Blue | Routine actions with no risk |
| **warning** | Amber | Rejections, failed payments, actions that may warrant attention |
| **error** | Red | Failed operations, system errors, delivery failures |

### Category badge colours

| Category | Badge colour |
|---|---|
| **admin** | Blue |
| **user** | Emerald |
| **system** | Slate |

---

## Filters

Use the filter bar at the top of the page to narrow the log:

### Row 1: Core filters

| Filter | Description |
|---|---|
| **Search** | Full-text search across description, actor name, action code, target label, and target type (debounced 300ms) |
| **Category** | Filter to `admin`, `user`, or `system` entries only |
| **Severity** | Filter to `info`, `warning`, or `error` entries only |
| **Sort** | Newest first (default) or Oldest first |

### Row 2: Advanced filters

| Filter | Description |
|---|---|
| **Action** | Searchable dropdown of all known action codes, grouped by category |
| **Actor** | Text input to filter by actor name (partial match, debounced 300ms) |
| **Target Type** | Filter by target type: USER, SCHOOL, EVENT, COURSE, SUBSCRIPTION, CREDIT, API_KEY, SYSTEM |
| **Date from** | Show entries on or after this date |
| **Date to** | Show entries on or before this date (inclusive, through end of day) |

A count of displayed versus total matching entries is shown in the page header.

**Page size** (25, 50, or 100) is available in the pagination controls below the table.

---

## Reading an Entry

Each row in the table contains the full audit context at a glance:

1. **Who** — the **Actor** column shows the admin or user's name and their role at the time.
2. **What** — the **Action** code (e.g. `admin.school_approved`) combined with the **Description** explains the operation.
3. **On what** — the **Target** column shows the type of object (e.g. SCHOOL) and its display label.
4. **When** — the **Time** column shows the exact timestamp.

### Expanding metadata

If an entry has associated metadata, a "N fields" link appears in the **Details** column. Click it to expand the metadata as formatted key-value pairs.

For status change actions (`*.status_changed`, `*.role_changed`), the old and new values are displayed prominently with color-coded badges showing the transition (e.g. `pending_review` → `published`).

---

## Exporting

Click the **Export CSV** button (green, top-right of filters) to download the current filtered view as a CSV file. The export includes all matching entries — not just the current page. Columns: Time, Category, Severity, Actor, Role, Action, Target Type, Target, Description, IP.

---

## Adding New Audit Events

To add a new audit event to the codebase:

```typescript
import { logAuditEvent } from '@/lib/audit';

// Fire-and-forget — never blocks the main request
void logAuditEvent({
  category: 'admin',           // 'admin' | 'user' | 'system'
  severity: 'info',            // 'info' | 'warning' | 'error' (default: 'info')
  action: 'admin.thing_done',  // machine-readable, e.g. 'user.login'
  actor_id: userId,            // UUID of the person performing the action
  actor_name: 'John Doe',      // display name
  actor_role: 'admin',         // role at time of action
  target_type: 'THING',        // e.g. 'USER', 'SCHOOL', 'EVENT'
  target_id: thingId,          // ID of the affected object
  target_label: 'Thing Name',  // human-readable label
  description: 'Did something to the thing',
  metadata: { key: 'value' },  // old/new values, error details, etc.
});
```

For **client components**, use the server action wrapper:

```typescript
import { logAuditEventAction } from '@/app/actions/audit';

void logAuditEventAction({ ...same params... });
```

**Rules:**
- Never log sensitive data (passwords, full API keys, full card numbers)
- Anonymize email recipients: `j***@gmail.com`
- `logAuditEvent()` never throws — it silently catches errors
- Use `void` to fire-and-forget where latency matters
- Add the action code to `ACTION_CODES` in `AuditLogFilters.tsx`

---

**See also:** [Events](./events.md) | [Courses](./courses.md) | [Settings](./settings.md) | [API Keys](./api-keys.md)
