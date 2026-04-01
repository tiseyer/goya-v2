---
title: Deployment
audience: ["developer"]
section: developer
order: 9
last_updated: "2026-03-31"
---

# Deployment

GOYA v2 is deployed on Vercel, connected to the `main` branch. Database is hosted on Supabase.

## Table of Contents

- [Vercel Deployment](#vercel-deployment)
- [Environment Variables](#environment-variables)
- [Database Migrations](#database-migrations)
- [Cron Jobs](#cron-jobs)
- [Maintenance Mode](#maintenance-mode)
- [Stripe Webhook Registration](#stripe-webhook-registration)

---

## Vercel Deployment

The project deploys automatically on push to `main`. Preview deployments are created for PRs.

**Manual deploy from CLI:**

```bash
vercel --prod
```

**Build command:** `next build`
**Output directory:** `.next` (standard Next.js)
**Node.js version:** 20.x

No special build configuration is required. The `next.config.ts` is standard.

---

## Environment Variables

Set these in the Vercel project dashboard under Settings → Environment Variables, or in `.env.local` for local development.

### Supabase

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Project URL e.g. `https://abc.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key (safe for browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Service role key — server only, bypasses RLS |

### Stripe

| Variable | Required | Description |
|---|---|---|
| `STRIPE_SECRET_KEY` | Yes | `sk_live_...` (production) or `sk_test_...` (development) |
| `STRIPE_WEBHOOK_SECRET` | Yes | `whsec_...` from Stripe webhook endpoint registration |

### Resend (Email)

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes | `re_...` from Resend dashboard |

### Secrets Store

| Variable | Required | Description |
|---|---|---|
| `SECRETS_MASTER_KEY` | Yes | 32-byte hex string used to AES-encrypt values in `admin_secrets` table |

### Map

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Yes | Mapbox public token for the schools map |

### Cron Security

| Variable | Required | Description |
|---|---|---|
| `CRON_SECRET` | Yes | Shared secret for authorising cron job requests from Vercel |

### AI / Chatbot

| Variable | Conditional | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | If using Claude | Anthropic API key |
| `OPENAI_API_KEY` | If using OpenAI | OpenAI API key |

AI provider selection is controlled via `site_settings` in the database (`ai_provider` key), so switching providers does not require a redeploy.

### Analytics

| Variable | Optional | Description |
|---|---|---|
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Optional | Vercel Analytics — auto-injected by Vercel |

---

## Database Migrations

Migrations are applied manually using the Supabase CLI. They are not automatically applied on deploy.

**After merging code that contains new migration files:**

```bash
npx supabase db push
```

This applies all pending migrations in `supabase/migrations/` to the linked Supabase project.

**Link a new environment:**

```bash
npx supabase link --project-ref your-project-ref
```

---

## Cron Jobs

Cron jobs are defined in `vercel.json` and executed by Vercel's built-in scheduler. Each job calls an API route handler with a `CRON_SECRET` header for verification.

| Route | Schedule | Purpose |
|---|---|---|
| `/api/cron/credits-expiring` | Daily at 08:00 UTC | Notify members whose CE credits expire within 30 days |
| `/api/cron/admin-digest` | Mondays at 08:00 UTC | Weekly admin summary email (pending verifications, new members, revenue) |
| `/api/cron/stripe-events` | Every 5 minutes | Retry `pending_cron` Stripe webhook events |
| `/api/cron/chatbot-cleanup` | Daily at 03:00 UTC | Delete expired anonymous chat sessions |

**Testing cron routes locally:**

```bash
curl -H "x-cron-secret: your-cron-secret" http://localhost:3000/api/cron/credits-expiring
```

---

## Maintenance Mode

Maintenance mode is controlled from the admin panel at `/admin/settings`, not from environment variables or code. Two modes are available:

- **Immediate:** Activate now — all non-admin users see the `/maintenance` splash page.
- **Scheduled:** Set a UTC start and end time — maintenance activates and deactivates automatically.

The middleware fetches these settings from `site_settings` with a 60-second cache, so activation propagates within one minute.

Admins and moderators are never blocked by maintenance mode.

---

## Stripe Webhook Registration

For production, register the webhook endpoint in the Stripe Dashboard:

1. Go to Stripe Dashboard → Developers → Webhooks.
2. Add endpoint: `https://your-domain.com/api/webhooks/stripe`
3. Select the following events to listen for:
   - `product.created`, `product.updated`, `product.deleted`
   - `price.created`, `price.updated`, `price.deleted`
   - `coupon.created`, `coupon.updated`, `coupon.deleted`
   - `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`
   - `payment_intent.succeeded`, `payment_intent.payment_failed`
   - `invoice.paid`, `invoice.payment_failed`
   - `checkout.session.completed`
4. Copy the signing secret (`whsec_...`) into the `STRIPE_WEBHOOK_SECRET` environment variable.

For local development, use the Stripe CLI to forward events:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

The CLI will print a local webhook secret — use it as `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

## See Also

- [stripe-integration.md](./stripe-integration.md) — How the webhook endpoint works
- [authentication.md](./authentication.md) — Supabase auth environment variables
- [email-system.md](./email-system.md) — Resend configuration
