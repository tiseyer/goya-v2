-- Unified audit log table for admin actions, user activities, and system events
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),

  -- Event classification
  category text not null check (category in ('admin', 'user', 'system')),
  action text not null,           -- e.g. 'user.role_changed', 'order.refunded', 'webhook.received'
  severity text not null default 'info' check (severity in ('info', 'warning', 'error')),

  -- Who triggered it (null for system events)
  actor_id uuid references auth.users(id) on delete set null,
  actor_name text,                -- denormalized for fast display
  actor_role text,                -- role at the time of action

  -- What was affected
  target_type text,               -- e.g. 'user', 'order', 'product', 'event', 'webhook'
  target_id text,                 -- UUID or external ID
  target_label text,              -- human-readable label (user name, order #, etc.)

  -- Details
  description text,               -- human-readable summary
  metadata jsonb default '{}'::jsonb,  -- structured payload (old/new values, request info, etc.)

  -- IP / request context (for user actions)
  ip_address inet,

  created_at timestamptz not null default now()
);

-- Indexes for common query patterns
create index idx_audit_log_created_at on audit_log (created_at desc);
create index idx_audit_log_category on audit_log (category);
create index idx_audit_log_actor_id on audit_log (actor_id);
create index idx_audit_log_target on audit_log (target_type, target_id);
create index idx_audit_log_action on audit_log (action);
create index idx_audit_log_severity on audit_log (severity) where severity != 'info';

-- RLS
alter table audit_log enable row level security;

create policy "Admins and moderators can read audit log"
  on audit_log for select
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.role in ('admin', 'moderator')
    )
  );

-- Only service role can insert (from server-side code)
-- No insert policy for authenticated users — writes go through service role client
