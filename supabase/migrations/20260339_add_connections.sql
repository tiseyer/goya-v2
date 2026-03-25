-- ── Connections ────────────────────────────────────────────────────────────────
create table connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid references profiles(id) on delete cascade not null,
  recipient_id  uuid references profiles(id) on delete cascade not null,
  type          text not null check (type in ('peer', 'mentorship', 'faculty')),
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(requester_id, recipient_id)
);

alter table connections enable row level security;

-- ── RLS ───────────────────────────────────────────────────────────────────────
-- Read: a user can see a connection if they are either party
create policy "users can view own connections" on connections
  for select using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- Insert: only the requester can create a connection, and they must be the requester
create policy "users can send connection requests" on connections
  for insert with check (auth.uid() = requester_id);

-- Update: either party can update (recipient accepts/declines, requester can cancel)
create policy "participants can update connections" on connections
  for update using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- Delete: either party can remove
create policy "participants can delete connections" on connections
  for delete using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- ── updated_at trigger (reuses existing function from schools migration) ─────
create trigger update_connections_updated_at
  before update on connections
  for each row execute function update_updated_at_column();
