-- ============================================================
-- OCEOM by E-MOTION® — Notificaciones in-app + Pregunta semanal
-- (Sprint S1 · Comunidad "Círculo de inteligencia colectiva")
--
-- 1) notifications: avisos in-app por usuario. El fan-out (avisar a
--    todos los estudiantes cuando la mentora publica) lo hace el
--    servidor con service_role; por eso NO hay policy de insert:
--    los clientes normales solo leen y marcan como leídas las suyas.
-- 2) community_posts.kind: distingue la "pregunta semanal" de un post
--    normal, para que OMI pueda sacar el informe de sus respuestas.
-- ============================================================

-- ---------- Notificaciones ----------
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null default 'general',   -- 'comunidad' | 'pregunta_semanal' | ...
  title text not null,
  body text,
  link text,                              -- ruta interna a abrir (p. ej. /comunidad/comunidad)
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_notifications_user
  on notifications(user_id, read_at, created_at desc);

alter table notifications enable row level security;

-- El dueño lee las suyas y las marca como leídas. La inserción es
-- server-side (service_role) → sin policy de insert a propósito.
create policy "notif: dueño lee" on notifications
  for select using (user_id = auth.uid());
create policy "notif: dueño marca leída" on notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Realtime para el contador de la campana.
alter table notifications replica identity full;
alter publication supabase_realtime add table notifications;

-- ---------- Pregunta semanal en Comunidad ----------
alter table community_posts
  add column if not exists kind text not null default 'post';
-- valores: 'post' (normal) | 'pregunta_semanal' (la publica la mentora)
create index if not exists idx_posts_kind on community_posts(kind);
