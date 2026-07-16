-- ============================================================
-- 0016_oceom_lab.sql — OCEOM LAB (Laboratorio de Percepción).
-- Gamificación del Viajero: progreso acumulado (XP, cristales, perlas)
-- y bitácora de sesiones de entrenamiento. RLS: cada viajero gestiona lo
-- suyo; la mentora puede LEER el progreso para acompañar.
-- Idempotente.
-- ============================================================

create table if not exists lab_progress (
  user_id uuid primary key references profiles(id) on delete cascade,
  xp integer not null default 0 check (xp >= 0),
  crystals integer not null default 0 check (crystals >= 0),
  pearls integer not null default 0 check (pearls >= 0),
  sessions_count integer not null default 0,
  last_session_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

drop trigger if exists trg_lab_progress_updated on lab_progress;
create trigger trg_lab_progress_updated
  before update on lab_progress
  for each row execute function set_updated_at();

create table if not exists lab_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  game_key text not null,
  world integer not null,
  xp integer not null default 0,
  crystals integer not null default 0,
  pearls integer not null default 0,
  metrics jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_lab_sessions_user
  on lab_sessions (user_id, created_at desc);

alter table lab_progress enable row level security;
alter table lab_sessions enable row level security;

drop policy if exists "lab: viajero gestiona su progreso" on lab_progress;
create policy "lab: viajero gestiona su progreso" on lab_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "lab: mentora ve progreso" on lab_progress;
create policy "lab: mentora ve progreso" on lab_progress
  for select using (is_mentor());

drop policy if exists "lab: viajero gestiona sus sesiones" on lab_sessions;
create policy "lab: viajero gestiona sus sesiones" on lab_sessions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "lab: mentora ve sesiones" on lab_sessions;
create policy "lab: mentora ve sesiones" on lab_sessions
  for select using (is_mentor());
