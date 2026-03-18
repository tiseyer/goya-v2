create extension if not exists "pgcrypto";

create sequence if not exists public.user_seq_id_seq start 1;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  user_seq_id integer unique default nextval('public.user_seq_id_seq'),
  user_id_code text generated always as (lpad(user_seq_id::text, 6, '0')) stored,
  mrn text unique,
  first_name text not null,
  last_name text not null,
  role text,
  address_line1 text,
  address_line2 text,
  postal_code text,
  state_region text,
  country text,
  language text,
  practice_formats text[],
  avatar_url text,
  code_of_conduct_accepted_at timestamptz,
  code_of_ethics_accepted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.onboarding_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  current_step integer not null default 1,
  max_step_reached integer not null default 0,
  onboarding_complete boolean not null default false,
  updated_at timestamptz default now()
);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.generate_unique_mrn()
returns text as $$
declare
  candidate text;
  exists_row boolean;
begin
  loop
    candidate := lpad((floor(random() * 100000000))::int::text, 8, '0');
    select exists(select 1 from public.profiles where mrn = candidate) into exists_row;
    if not exists_row then
      return candidate;
    end if;
  end loop;
end;
$$ language plpgsql;

create or replace function public.set_profile_defaults()
returns trigger as $$
begin
  if new.mrn is null then
    new.mrn := public.generate_unique_mrn();
  end if;
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists onboarding_set_updated_at on public.onboarding_state;
create trigger onboarding_set_updated_at
before update on public.onboarding_state
for each row execute procedure public.set_updated_at();

drop trigger if exists profiles_set_defaults on public.profiles;
create trigger profiles_set_defaults
before insert on public.profiles
for each row execute procedure public.set_profile_defaults();

alter table public.profiles enable row level security;
alter table public.onboarding_state enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = user_id);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "onboarding_select_own" on public.onboarding_state
  for select using (auth.uid() = user_id);

create policy "onboarding_insert_own" on public.onboarding_state
  for insert with check (auth.uid() = user_id);

create policy "onboarding_update_own" on public.onboarding_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_auth_insert" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.uid() = owner);

create policy "avatars_auth_update" on storage.objects
  for update using (bucket_id = 'avatars' and auth.uid() = owner);

-- ── Connections ───────────────────────────────────────────────────────────────

create table if not exists public.connections (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(user_id) on delete cascade,
  receiver_id uuid not null references public.profiles(user_id) on delete cascade,
  status text not null check (status in ('pending', 'accepted', 'declined')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(requester_id, receiver_id)
);

drop trigger if exists connections_set_updated_at on public.connections;
create trigger connections_set_updated_at
before update on public.connections
for each row execute procedure public.set_updated_at();

alter table public.connections enable row level security;

-- Users can see any connection they are part of
create policy "connections_select_participant" on public.connections
  for select using (auth.uid() = requester_id or auth.uid() = receiver_id);

-- Only the requester can insert
create policy "connections_insert_requester" on public.connections
  for insert with check (auth.uid() = requester_id);

-- Either participant can update (accept / decline)
create policy "connections_update_participant" on public.connections
  for update using (auth.uid() = requester_id or auth.uid() = receiver_id);

-- ── Notifications ─────────────────────────────────────────────────────────────

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(user_id) on delete cascade,
  type text not null check (type in ('connection_request', 'connection_accepted', 'connection_declined')),
  from_user_id uuid not null references public.profiles(user_id) on delete cascade,
  connection_id uuid references public.connections(id) on delete cascade,
  read boolean not null default false,
  created_at timestamptz default now()
);

alter table public.notifications enable row level security;

-- Users can only read their own notifications
create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

-- Server-side inserts only (service role); authenticated users cannot self-insert
create policy "notifications_insert_service" on public.notifications
  for insert with check (false);

-- Users can mark their own notifications as read
create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Enable Realtime for notifications table
alter publication supabase_realtime add table public.notifications;
