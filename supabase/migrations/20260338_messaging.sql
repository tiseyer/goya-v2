-- ── Conversations ─────────────────────────────────────────────────────────────
create table conversations (
  id            uuid primary key default gen_random_uuid(),
  participant_1 uuid references profiles(id) on delete cascade not null,
  participant_2 uuid references profiles(id) on delete cascade not null,
  last_message_at timestamptz default now(),
  created_at    timestamptz default now(),
  unique(participant_1, participant_2)
);

-- ── Messages ──────────────────────────────────────────────────────────────────
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations(id) on delete cascade not null,
  sender_id       uuid references profiles(id) on delete cascade not null,
  content         text not null,
  read_at         timestamptz,
  created_at      timestamptz default now()
);

-- ── Notifications ─────────────────────────────────────────────────────────────
create table notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade not null,
  type       text not null,
  title      text not null,
  body       text,
  link       text,
  read_at    timestamptz,
  actor_id   uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- ── RLS ───────────────────────────────────────────────────────────────────────
alter table conversations  enable row level security;
alter table messages       enable row level security;
alter table notifications  enable row level security;

-- Conversations
create policy "participants can view conversations" on conversations
  for select using (auth.uid() = participant_1 or auth.uid() = participant_2);

create policy "authenticated users can start conversations" on conversations
  for insert with check (auth.uid() = participant_1 or auth.uid() = participant_2);

create policy "participants can update conversations" on conversations
  for update using (auth.uid() = participant_1 or auth.uid() = participant_2);

-- Messages
create policy "participants can view messages" on messages
  for select using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
    )
  );

create policy "participants can send messages" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
    )
  );

create policy "participants can update messages" on messages
  for update using (
    exists (
      select 1 from conversations c
      where c.id = conversation_id
        and (c.participant_1 = auth.uid() or c.participant_2 = auth.uid())
    )
  );

-- Notifications
create policy "users can view own notifications" on notifications
  for select using (auth.uid() = user_id);

create policy "service role can insert notifications" on notifications
  for insert with check (true);

create policy "users can update own notifications" on notifications
  for update using (auth.uid() = user_id);

-- ── Realtime ──────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table conversations;
