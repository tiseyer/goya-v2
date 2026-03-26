# API Overview – GOYA v2

## Current API Routes

| Route | Auth Method | Purpose |
|-------|-------------|---------|
| `/api/webhooks/stripe` | Stripe HMAC signature | Receives Stripe webhooks |
| `/api/admin/stripe-sync` | `Bearer CRON_SECRET` | Stripe data sync |
| `/api/cron/stripe-events` | `Bearer CRON_SECRET` | Process pending webhook events |
| `/api/cron/credits-expiring` | `Bearer CRON_SECRET` | Daily credits expiry check |
| `/api/cron/admin-digest` | `Bearer CRON_SECRET` | Weekly admin digest email |
| `/api/email/welcome` | None | Send welcome email |
| `/api/email/onboarding-complete` | None | Send onboarding completion email |
| `/api/email/verification-approved` | None | Send verification approved email |
| `/api/email/verification-rejected` | None | Send verification rejected email |
| `/api/avatar` | Supabase auth | Avatar upload |

## External Integrations

No public API exists yet. All data access goes through Supabase directly (with RLS). If external integrations are needed (e.g. Make.com), build new `/api/external/*` routes following the existing cron endpoint pattern (`Bearer CRON_SECRET` auth). Not yet implemented — build on demand.

## External Services

- **Stripe** — webhook endpoint + server-side SDK calls
- **Resend** — server-side transactional email sending
- **Supabase** — direct client with RLS (browser + server)
