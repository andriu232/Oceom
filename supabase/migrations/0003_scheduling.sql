-- ============================================================
-- OCEOM — Agendamiento de clases 1:1 (Sprint: Agenda)
-- La mentora abre franjas de disponibilidad; el estudiante reserva.
-- ============================================================

create type slot_status as enum ('available', 'booked', 'cancelled');

create table class_slots (
  id uuid primary key default uuid_generate_v4(),
  mentor_id uuid not null references profiles(id) on delete cascade,
  starts_at timestamptz not null,
  duration_minutes int not null default 120,
  status slot_status not null default 'available',
  student_id uuid references profiles(id) on delete set null,
  program_id uuid references programs(id) on delete set null,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index idx_class_slots_starts on class_slots(starts_at);
create index idx_class_slots_student on class_slots(student_id);

create trigger trg_class_slots_updated before update on class_slots
  for each row execute function set_updated_at();

alter table class_slots enable row level security;

-- Estudiante ve franjas disponibles + las suyas; mentora ve todo.
create policy "slots: disponibles / propios / mentora" on class_slots
  for select using (
    status = 'available' or student_id = auth.uid() or is_mentor()
  );

-- Solo la mentora gestiona la disponibilidad (crear/editar/borrar).
-- La reserva del estudiante se hace por server action con service client
-- (validada), no por RLS, para mantener el update controlado.
create policy "slots: mentora gestiona" on class_slots
  for all using (is_mentor()) with check (is_mentor());
