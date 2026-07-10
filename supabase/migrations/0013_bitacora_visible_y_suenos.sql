-- ============================================================
-- 0013_bitacora_visible_y_suenos.sql
-- 1) Bitácora SIEMPRE visible para la mentora: Valeria acompaña el proceso
--    emocional leyendo las bitácoras, así que desaparece el concepto de
--    "entrada privada" (la columna is_private queda, pero ya no filtra).
-- 2) Diario de sueños: cuaderno aparte dentro de la Bitácora donde el
--    estudiante registra sueños, la emoción sentida y sus símbolos.
-- Idempotente.
-- ============================================================

-- 1) La mentora ve TODAS las entradas (antes: solo las no privadas).
drop policy if exists "bitacora: mentora ve solo no privadas" on journal_entries;
drop policy if exists "bitacora: mentora ve todas" on journal_entries;
create policy "bitacora: mentora ve todas" on journal_entries
  for select using (is_mentor());

-- 2) Diario de sueños.
create table if not exists dream_entries (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  title text,
  content text not null,
  -- Emoción predominante DENTRO del sueño (mismo catálogo de la bitácora).
  emotion text,
  intensity integer check (intensity between 0 and 10),
  -- Tipo: normal | lucido | recurrente | pesadilla | revelador.
  dream_type text not null default 'normal',
  -- Símbolos o elementos clave del sueño (texto libre: "agua, una puerta…").
  symbols text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_dream_entries_student
  on dream_entries (student_id, created_at desc);

drop trigger if exists trg_dream_entries_updated on dream_entries;
create trigger trg_dream_entries_updated
  before update on dream_entries
  for each row execute function set_updated_at();

alter table dream_entries enable row level security;

drop policy if exists "suenos: dueño gestiona" on dream_entries;
create policy "suenos: dueño gestiona" on dream_entries
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "suenos: mentora ve" on dream_entries;
create policy "suenos: mentora ve" on dream_entries
  for select using (is_mentor());
