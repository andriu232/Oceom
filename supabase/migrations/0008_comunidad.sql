-- ============================================================
-- OCEOM by E-MOTION® — Comunidad (Sprint: Comunidad)
-- Feed social por espacios/canales: posts, comentarios (1 nivel +
-- respuestas), likes, ranking semanal, moderación y realtime.
-- Adaptado del módulo de comunidad (mismo modelo, sin membership
-- tiers): los espacios son ABIERTOS a cualquier usuario autenticado
-- no baneado; "Fundador"/admin = mentora o super admin (is_mentor()).
-- ============================================================

-- Reemplaza las tablas mínimas previas (estaban vacías / ComingSoon).
drop table if exists community_comments cascade;
drop table if exists community_posts cascade;

-- ---------- Espacios (canales) ----------
create table community_spaces (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,
  description text,
  color_hex text,                       -- hex sin '#', para el punto de color
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------- Posts ----------
create table community_posts (
  id uuid primary key default uuid_generate_v4(),
  space_id uuid not null references community_spaces(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  body text not null check (length(body) > 0 and length(body) <= 5000),
  image_url text,
  is_pinned boolean not null default false,
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index idx_posts_space on community_posts(space_id, is_deleted, created_at desc);
create index idx_posts_author on community_posts(author_id);
create trigger trg_posts_updated before update on community_posts
  for each row execute function set_updated_at();

-- ---------- Comentarios (1 nivel + respuestas vía parent_id) ----------
create table community_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references community_posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  parent_id uuid references community_comments(id) on delete cascade,
  body text not null check (length(body) > 0 and length(body) <= 2000),
  is_deleted boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);
create index idx_comments_post on community_comments(post_id, is_deleted, created_at);
create index idx_comments_parent on community_comments(parent_id);

-- ---------- Likes (toggle binario, sobre post XOR comentario) ----------
create table community_likes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  post_id uuid references community_posts(id) on delete cascade,
  comment_id uuid references community_comments(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  constraint community_likes_xor check ((post_id is null) <> (comment_id is null))
);
create unique index community_likes_user_post on community_likes(user_id, post_id) where post_id is not null;
create unique index community_likes_user_comment on community_likes(user_id, comment_id) where comment_id is not null;

-- ---------- Bans ----------
create table community_bans (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade unique,
  reason text,
  banned_by uuid references profiles(id),
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------- Acceso a un espacio (abierto): baneado -> false; espacio activo -> true ----------
create or replace function has_space_access(p_user_id uuid, p_space_id uuid)
returns boolean language plpgsql security definer stable set search_path = public as $$
begin
  if p_user_id is null then return false; end if;
  if exists (select 1 from community_bans where user_id = p_user_id) then return false; end if;
  return exists (select 1 from community_spaces where id = p_space_id and is_active = true);
end; $$;

-- ---------- Ranking semanal: +5 post, +2 comentario, +1 like recibido (7 días) ----------
create or replace view community_weekly_ranking as
with post_points as (
  select author_id as user_id, count(*) * 5 as pts from community_posts
  where is_deleted = false and created_at > now() - interval '7 days' group by author_id
), comment_points as (
  select author_id as user_id, count(*) * 2 as pts from community_comments
  where is_deleted = false and created_at > now() - interval '7 days' group by author_id
), likes_on_posts as (
  select p.author_id as user_id, count(l.id) as pts from community_likes l
  join community_posts p on p.id = l.post_id
  where l.created_at > now() - interval '7 days' and p.is_deleted = false group by p.author_id
), likes_on_comments as (
  select c.author_id as user_id, count(l.id) as pts from community_likes l
  join community_comments c on c.id = l.comment_id
  where l.created_at > now() - interval '7 days' and c.is_deleted = false group by c.author_id
)
select u.user_id, coalesce(sum(u.pts), 0)::int as points
from (
  select * from post_points union all select * from comment_points
  union all select * from likes_on_posts union all select * from likes_on_comments
) u
group by u.user_id order by points desc;

grant select on community_weekly_ranking to authenticated;

-- ============================================================
-- RLS
-- ============================================================
alter table community_spaces   enable row level security;
alter table community_posts    enable row level security;
alter table community_comments enable row level security;
alter table community_likes    enable row level security;
alter table community_bans     enable row level security;

-- Espacios: catálogo visible a todos; mentora gestiona.
create policy "espacios: lectura pública" on community_spaces
  for select using (is_active = true);
create policy "espacios: mentora gestiona" on community_spaces
  for all using (is_mentor()) with check (is_mentor());

-- Posts: gateados por acceso al espacio; autor gestiona el suyo; mentora todo.
create policy "posts: ver con acceso" on community_posts
  for select using (is_deleted = false and has_space_access(auth.uid(), space_id));
create policy "posts: publicar con acceso" on community_posts
  for insert with check (author_id = auth.uid() and has_space_access(auth.uid(), space_id));
create policy "posts: autor edita el suyo" on community_posts
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "posts: autor borra el suyo" on community_posts
  for delete using (author_id = auth.uid());
create policy "posts: mentora modera" on community_posts
  for all using (is_mentor()) with check (is_mentor());

-- Comentarios: gateados resolviendo post -> espacio; autor gestiona; mentora todo.
create policy "comentarios: ver con acceso" on community_comments
  for select using (is_deleted = false and exists (
    select 1 from community_posts p
    where p.id = post_id and p.is_deleted = false and has_space_access(auth.uid(), p.space_id)
  ));
create policy "comentarios: publicar con acceso" on community_comments
  for insert with check (author_id = auth.uid() and exists (
    select 1 from community_posts p
    where p.id = post_id and has_space_access(auth.uid(), p.space_id)
  ));
create policy "comentarios: autor edita el suyo" on community_comments
  for update using (author_id = auth.uid()) with check (author_id = auth.uid());
create policy "comentarios: autor borra el suyo" on community_comments
  for delete using (author_id = auth.uid());
create policy "comentarios: mentora modera" on community_comments
  for all using (is_mentor()) with check (is_mentor());

-- Likes: los autenticados leen; solo el dueño inserta/borra su like.
create policy "likes: lectura autenticada" on community_likes
  for select using (auth.role() = 'authenticated');
create policy "likes: dueño inserta" on community_likes
  for insert with check (user_id = auth.uid());
create policy "likes: dueño borra" on community_likes
  for delete using (user_id = auth.uid());

-- Bans: el usuario ve el suyo; la mentora gestiona.
create policy "bans: ve el propio" on community_bans
  for select using (user_id = auth.uid());
create policy "bans: mentora gestiona" on community_bans
  for all using (is_mentor()) with check (is_mentor());

-- ---------- Realtime ----------
alter table community_posts    replica identity full;
alter table community_comments replica identity full;
alter table community_likes    replica identity full;
alter publication supabase_realtime add table community_posts;
alter publication supabase_realtime add table community_comments;
alter publication supabase_realtime add table community_likes;

-- ---------- Seed de espacios iniciales ----------
insert into community_spaces (slug, name, description, color_hex, sort_order) values
  ('comunidad', 'Comunidad', 'El espacio abierto para compartir tu proceso.', '22d3ee', 0),
  ('logros',    'Logros del día', 'Celebra tus avances, por pequeños que sean.', '5eead4', 1),
  ('preguntas', 'Preguntas', 'Dudas del proceso, técnicas y prácticas.', '818cf8', 2),
  ('gratitud',  'Gratitud', 'Comparte aquello por lo que agradeces hoy.', '2dd4bf', 3)
on conflict (slug) do nothing;
