-- ============================================================
-- 0018_vision_images.sql — imágenes del Mapa de Visión (vision board).
-- Cada estudiante sube imágenes que representan sus metas, agrupadas por área
-- (general + las 5 dimensiones). Se muestran como un collage. Los archivos
-- viven en el bucket PÚBLICO `vision` (auto-creado por el server action) — el
-- collage necesita URLs directas.
-- RLS: cada estudiante gestiona las suyas; la mentora puede LEERLAS (seguimiento).
-- Idempotente.
-- ============================================================

create table if not exists vision_images (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  -- 'general' o una de las claves de VISION_AREAS (espiritual, mental, …).
  area text not null default 'general',
  url text not null,
  sort int not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_vision_images_student
  on vision_images (student_id, sort, created_at);

alter table vision_images enable row level security;

drop policy if exists "vision_img: dueño gestiona" on vision_images;
create policy "vision_img: dueño gestiona" on vision_images
  for all using (student_id = auth.uid()) with check (student_id = auth.uid());

drop policy if exists "vision_img: mentora lee" on vision_images;
create policy "vision_img: mentora lee" on vision_images
  for select using (is_mentor());
