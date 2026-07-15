-- ============================================================
-- 0015_biblioteca.sql — Biblioteca de OCEOM.
-- Sección de contenido curado por Valeria para los estudiantes:
-- textos, poemas y archivos (PDF y similares). Los archivos viven en el
-- bucket PRIVADO `biblioteca` (lo auto-crea el server action); en file_path
-- guardamos la RUTA en Storage y la descarga sale por signed URL.
-- RLS: la mentora gestiona todo; los estudiantes leen lo publicado.
-- Idempotente.
-- ============================================================

create table if not exists library_items (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  kind text not null default 'texto' check (kind in ('texto', 'poema', 'archivo')),
  -- Cuerpo del texto/poema (null para archivos).
  content text,
  -- Ruta en el bucket privado `biblioteca` (null para textos/poemas).
  file_path text,
  file_name text,
  is_published boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_library_items_pub
  on library_items (is_published, created_at desc);

drop trigger if exists trg_library_items_updated on library_items;
create trigger trg_library_items_updated
  before update on library_items
  for each row execute function set_updated_at();

alter table library_items enable row level security;

drop policy if exists "biblioteca: mentora gestiona" on library_items;
create policy "biblioteca: mentora gestiona" on library_items
  for all using (is_mentor()) with check (is_mentor());

drop policy if exists "biblioteca: estudiantes leen publicado" on library_items;
create policy "biblioteca: estudiantes leen publicado" on library_items
  for select to authenticated using (is_published);
