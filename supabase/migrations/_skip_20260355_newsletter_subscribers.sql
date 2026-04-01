-- Newsletter subscribers table
create table if not exists public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  subscribed_at timestamptz not null default now(),
  source text not null default 'landing_page',
  constraint newsletter_subscribers_email_unique unique (email)
);

-- Allow anonymous inserts (public form), restrict reads to admin
alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert
  with check (true);

create policy "Admins can view subscribers"
  on public.newsletter_subscribers for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'moderator')
    )
  );

-- RPC functions for public landing page stats
create or replace function public.count_distinct_countries()
returns integer language sql security definer stable as $$
  select count(distinct country)::integer
  from public.profiles
  where country is not null and country != '';
$$;

create or replace function public.sum_approved_hours()
returns numeric language sql security definer stable as $$
  select coalesce(sum(amount), 0)
  from public.credit_entries
  where status = 'approved';
$$;

grant execute on function public.count_distinct_countries() to anon;
grant execute on function public.sum_approved_hours() to anon;
