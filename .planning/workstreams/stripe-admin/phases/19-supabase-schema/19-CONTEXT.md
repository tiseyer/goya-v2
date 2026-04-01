# Phase 19: Supabase Schema - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Create upgrade_requests and user_designations tables with proper RLS policies. These tables are required by Phase 15 (subscriptions page soft-delete designations) and Phase 17 (upgrade request tracking).

</domain>

<decisions>
## Implementation Decisions

### Schema Design
- upgrade_requests: id uuid PK, user_id uuid FK auth.users, status text CHECK ('pending','approved','rejected'), certificate_urls text[], stripe_payment_intent_id text, stripe_subscription_id text (populated on approve), rejection_reason text, created_at timestamptz default now(), reviewed_at timestamptz, reviewed_by uuid FK auth.users
- user_designations: id uuid PK, user_id uuid FK auth.users, stripe_product_id text, stripe_price_id text, purchase_date timestamptz, deleted_at timestamptz (null = active), deleted_by uuid FK auth.users (null if self-deleted)
- RLS: Users can read their own rows; admins/moderators can read/write all rows
- Soft-delete pattern: deleted_at timestamp, never hard delete

### Claude's Discretion
All implementation choices at Claude's discretion — pure infrastructure phase. Follow existing migration patterns from 20260340_stripe_tables.sql and 20260341_webhook_events.sql.

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- supabase/migrations/20260340_stripe_tables.sql — pattern for table creation with RLS
- supabase/migrations/20260341_webhook_events.sql — pattern for idempotency table
- Existing RLS pattern: admin/moderator read/write, users read own rows

### Established Patterns
- UUID primary keys with gen_random_uuid()
- timestamptz for all dates with default now()
- updated_at trigger function (handle_updated_at)
- RLS enabled on all new tables

### Integration Points
- Phase 15 imports user_designations for soft-delete
- Phase 17 creates upgrade_request rows
- Phase 18 reads/updates upgrade_requests for admin actions

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
