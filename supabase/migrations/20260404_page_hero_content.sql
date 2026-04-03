drop table if exists page_hero_content;

create table if not exists page_hero_content (
  slug text primary key,
  pill text,
  title text,
  subtitle text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

alter table page_hero_content enable row level security;

create policy "Anyone authenticated can read hero content"
  on page_hero_content for select
  using (auth.role() = 'authenticated');

create policy "Admins can write hero content"
  on page_hero_content for all
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin')
    )
  )
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin')
    )
  );
