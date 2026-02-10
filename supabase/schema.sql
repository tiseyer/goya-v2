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
