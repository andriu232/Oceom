-- ============================================================
-- 0005 — Círculos 1:1: restringir una transmisión a UN estudiante
-- específico (sesiones de sanación individuales del Método E-MOTION®).
-- Ejecutar UNA vez en el SQL Editor de Supabase.
-- ============================================================

-- Nueva columna: si está seteada, el círculo es solo para ese estudiante.
alter table live_sessions
  add column if not exists student_id uuid references profiles(id) on delete cascade;

create index if not exists idx_live_sessions_student on live_sessions(student_id);

-- Visibilidad actualizada:
--   • la mentora ve todo,
--   • si es 1:1 (student_id no nulo) → solo ese estudiante,
--   • si no → abierto (program_id nulo) o inscritos en el programa.
drop policy if exists "sesiones: visibles con acceso o mentora" on live_sessions;
create policy "sesiones: visibles con acceso o mentora" on live_sessions
  for select using (
    is_mentor()
    or (student_id is not null and student_id = auth.uid())
    or (student_id is null and (program_id is null or has_program_access(program_id)))
  );
