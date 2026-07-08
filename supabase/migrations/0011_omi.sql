-- ============================================================
-- 0011_omi.sql — memoria de OMI (chat de acompañamiento).
-- Conversaciones y mensajes por usuario. RLS: cada quien ve solo lo suyo
-- (OMI es un espacio íntimo; la mentora NO lee estos chats).
-- ============================================================

create table if not exists omi_conversations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists omi_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references omi_conversations(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_omi_conversations_user
  on omi_conversations (user_id, updated_at desc);
create index if not exists idx_omi_messages_conv
  on omi_messages (conversation_id, created_at);

drop trigger if exists trg_omi_conversations_updated on omi_conversations;
create trigger trg_omi_conversations_updated
  before update on omi_conversations
  for each row execute function set_updated_at();

alter table omi_conversations enable row level security;
alter table omi_messages enable row level security;

drop policy if exists "omi_conversations owner" on omi_conversations;
create policy "omi_conversations owner" on omi_conversations
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists "omi_messages owner" on omi_messages;
create policy "omi_messages owner" on omi_messages
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
