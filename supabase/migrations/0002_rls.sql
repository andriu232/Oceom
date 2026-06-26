-- ============================================================
-- OCEOM by E-MOTION® — Row Level Security (Sprint 1)
-- Frontera de seguridad real. La app asume que toda query puede ser hostil.
-- ============================================================

-- ---------- Helpers (security definer evita recursión de RLS) ----------
create or replace function is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'super_admin');
$$;

create or replace function is_mentor() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role in ('mentor','super_admin'));
$$;

create or replace function is_student() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from profiles where id = auth.uid() and role = 'student');
$$;

-- ¿El usuario tiene enrollment ACTIVO en el programa? (mentora siempre true)
create or replace function has_program_access(p_program uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_mentor() or exists(
    select 1 from enrollments
    where student_id = auth.uid() and program_id = p_program and status = 'active'
  );
$$;

-- ¿Puede administrar el programa? (creador o super admin)
create or replace function can_manage_program(p_program uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select is_super_admin() or exists(
    select 1 from programs where id = p_program and created_by = auth.uid()
  ) or is_mentor();
$$;

-- ---------- Habilitar RLS en todas las tablas ----------
alter table profiles            enable row level security;
alter table programs            enable row level security;
alter table program_phases      enable row level security;
alter table modules             enable row level security;
alter table lessons             enable row level security;
alter table resources           enable row level security;
alter table cohorts             enable row level security;
alter table enrollments         enable row level security;
alter table assignments         enable row level security;
alter table submissions         enable row level security;
alter table lesson_progress     enable row level security;
alter table emotional_checkins  enable row level security;
alter table journal_entries     enable row level security;
alter table dream_maps          enable row level security;
alter table dream_map_items     enable row level security;
alter table live_sessions       enable row level security;
alter table session_attendance  enable row level security;
alter table mentor_notes        enable row level security;
alter table ai_sources          enable row level security;
alter table ai_conversations    enable row level security;
alter table ai_messages         enable row level security;
alter table community_posts     enable row level security;
alter table community_comments  enable row level security;
alter table audit_log           enable row level security;

-- ---------- profiles ----------
create policy "perfil: lee propio o mentora" on profiles
  for select using (id = auth.uid() or is_mentor());
create policy "perfil: edita propio" on profiles
  for update using (id = auth.uid()) with check (id = auth.uid());
create policy "perfil: super admin gestiona" on profiles
  for all using (is_super_admin()) with check (is_super_admin());

-- ---------- programs ----------
create policy "programa: visible con acceso o mentora" on programs
  for select using ((status = 'published' and has_program_access(id)) or is_mentor());
create policy "programa: mentora crea" on programs
  for insert with check (is_mentor());
create policy "programa: gestiona quien puede" on programs
  for update using (can_manage_program(id)) with check (can_manage_program(id));
create policy "programa: super admin borra" on programs
  for delete using (is_super_admin());

-- ---------- program_phases / modules / lessons / resources ----------
create policy "fases: visible con acceso o mentora" on program_phases
  for select using (has_program_access(program_id) or is_mentor());
create policy "fases: mentora gestiona" on program_phases
  for all using (can_manage_program(program_id)) with check (can_manage_program(program_id));

create policy "modulos: visible con acceso o mentora" on modules
  for select using ((status = 'published' and has_program_access(program_id)) or is_mentor());
create policy "modulos: mentora gestiona" on modules
  for all using (can_manage_program(program_id)) with check (can_manage_program(program_id));

create policy "lecciones: visible publicada con acceso o mentora" on lessons
  for select using ((status = 'published' and has_program_access(program_id)) or is_mentor());
create policy "lecciones: mentora gestiona" on lessons
  for all using (can_manage_program(program_id)) with check (can_manage_program(program_id));

create policy "recursos: visible con acceso a la leccion" on resources
  for select using (exists(
    select 1 from lessons l
    where l.id = resources.lesson_id
      and ((l.status = 'published' and has_program_access(l.program_id)) or is_mentor())
  ));
create policy "recursos: mentora gestiona" on resources
  for all using (is_mentor()) with check (is_mentor());

-- ---------- cohorts ----------
create policy "cohortes: visibles a mentora o inscritos" on cohorts
  for select using (is_mentor() or has_program_access(program_id));
create policy "cohortes: mentora gestiona" on cohorts
  for all using (is_mentor()) with check (is_mentor());

-- ---------- enrollments ----------
create policy "enroll: estudiante ve los suyos / mentora todos" on enrollments
  for select using (student_id = auth.uid() or is_mentor());
create policy "enroll: mentora gestiona" on enrollments
  for all using (is_mentor()) with check (is_mentor());

-- ---------- assignments ----------
create policy "tareas: visibles con acceso o mentora" on assignments
  for select using (exists(
    select 1 from lessons l
    where l.id = assignments.lesson_id
      and (has_program_access(l.program_id) or is_mentor())
  ));
create policy "tareas: mentora gestiona" on assignments
  for all using (is_mentor()) with check (is_mentor());

-- ---------- submissions ----------
create policy "entregas: estudiante gestiona las suyas" on submissions
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "entregas: mentora ve" on submissions
  for select using (is_mentor());
create policy "entregas: mentora da feedback" on submissions
  for update using (is_mentor());

-- ---------- lesson_progress ----------
create policy "progreso: dueño gestiona" on lesson_progress
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "progreso: mentora ve" on lesson_progress
  for select using (is_mentor());

-- ---------- emotional_checkins ----------
create policy "checkins: dueño gestiona" on emotional_checkins
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "checkins: mentora ve" on emotional_checkins
  for select using (is_mentor());

-- ---------- journal_entries ----------
create policy "bitacora: dueño gestiona" on journal_entries
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "bitacora: mentora ve solo no privadas" on journal_entries
  for select using (is_mentor() and is_private = false);

-- ---------- dream_maps / items ----------
create policy "mapa: dueño gestiona" on dream_maps
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "mapa: mentora ve" on dream_maps
  for select using (is_mentor());
create policy "mapa items: dueño gestiona" on dream_map_items
  for all using (exists(
    select 1 from dream_maps d where d.id = dream_map_items.dream_map_id and d.student_id = auth.uid()
  )) with check (exists(
    select 1 from dream_maps d where d.id = dream_map_items.dream_map_id and d.student_id = auth.uid()
  ));
create policy "mapa items: mentora ve" on dream_map_items
  for select using (is_mentor());

-- ---------- live_sessions ----------
create policy "sesiones: visibles con acceso o mentora" on live_sessions
  for select using (program_id is null or has_program_access(program_id) or is_mentor());
create policy "sesiones: mentora gestiona" on live_sessions
  for all using (is_mentor()) with check (is_mentor());

-- ---------- session_attendance ----------
create policy "asistencia: dueño gestiona la suya" on session_attendance
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "asistencia: mentora ve" on session_attendance
  for select using (is_mentor());

-- ---------- mentor_notes (NUNCA visibles al estudiante) ----------
create policy "notas: solo mentora" on mentor_notes
  for all using (is_mentor()) with check (is_mentor());

-- ---------- ai_sources (solo mentora/admin) ----------
create policy "fuentes IA: solo mentora" on ai_sources
  for all using (is_mentor()) with check (is_mentor());

-- ---------- ai_conversations / ai_messages (privadas del estudiante) ----------
create policy "conversaciones: dueño gestiona" on ai_conversations
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());
create policy "mensajes: dueño gestiona" on ai_messages
  for all using (exists(
    select 1 from ai_conversations c where c.id = ai_messages.conversation_id and c.student_id = auth.uid()
  )) with check (exists(
    select 1 from ai_conversations c where c.id = ai_messages.conversation_id and c.student_id = auth.uid()
  ));

-- ---------- comunidad (solo programas/cohortes donde está inscrito) ----------
create policy "posts: ver de mis programas" on community_posts
  for select using (has_program_access(program_id));
create policy "posts: publicar en mis programas" on community_posts
  for insert with check (author_id = auth.uid() and has_program_access(program_id));
create policy "posts: autor gestiona el suyo" on community_posts
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts: autor o mentora borra" on community_posts
  for delete using (author_id = auth.uid() or is_mentor());

create policy "comentarios: ver de posts accesibles" on community_comments
  for select using (exists(
    select 1 from community_posts p where p.id = community_comments.post_id and has_program_access(p.program_id)
  ));
create policy "comentarios: publicar en posts accesibles" on community_comments
  for insert with check (author_id = auth.uid() and exists(
    select 1 from community_posts p where p.id = community_comments.post_id and has_program_access(p.program_id)
  ));
create policy "comentarios: autor o mentora gestiona" on community_comments
  for all using (author_id = auth.uid() or is_mentor()) with check (author_id = auth.uid() or is_mentor());

-- ---------- audit_log (solo super admin) ----------
create policy "auditoria: solo super admin" on audit_log
  for select using (is_super_admin());
