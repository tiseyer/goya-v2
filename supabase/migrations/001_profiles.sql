-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  full_name text,
  mrn text unique,
  role text not null default 'student',
  avatar_url text,
  bio text,
  location text,
  website text,
  instagram text,
  youtube text,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;

-- RLS: anyone authenticated can read profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- RLS: users can update only their own profile
create policy "Users can update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- RLS: insert handled by trigger only (service role)
create policy "Service role can insert profiles"
  on public.profiles for insert
  to service_role
  with check (true);

-- Function to generate unique 8-digit MRN
create or replace function public.generate_mrn()
returns text
language plpgsql
as $$
declare
  new_mrn text;
  done bool;
begin
  done := false;
  while not done loop
    new_mrn := lpad(floor(random() * 100000000)::bigint::text, 8, '0');
    done := not exists(select 1 from public.profiles where mrn = new_mrn);
  end loop;
  return new_mrn;
end;
$$;

-- Trigger function: auto-create profile on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, mrn)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    public.generate_mrn()
  );
  return new;
end;
$$;

-- Attach trigger to auth.users
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Helper: check if current user is admin or moderator
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid()
    and role in ('admin', 'moderator')
  );
end;
$$;
