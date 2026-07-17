-- ============================================================
-- 0017_galeria_astral.sql — Galería Astral.
-- Galería orbital 3D del estudiante con contenido curado por Valeria:
-- fotos (bucket público `galeria`, auto-creado por el server action) y
-- poemas. RLS: mentora gestiona; estudiantes leen lo publicado.
-- Idempotente.
-- ============================================================

create table if not exists astral_items (
  id uuid primary key default uuid_generate_v4(),
  kind text not null default 'foto' check (kind in ('foto', 'poema')),
  title text not null,
  -- Poema: cuerpo completo. Foto: pie de foto opcional.
  content text,
  description text,
  -- Foto: URL pública en el bucket `galeria`.
  file_url text,
  is_published boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_astral_items_pub
  on astral_items (is_published, created_at desc);

drop trigger if exists trg_astral_items_updated on astral_items;
create trigger trg_astral_items_updated
  before update on astral_items
  for each row execute function set_updated_at();

alter table astral_items enable row level security;

drop policy if exists "astral: mentora gestiona" on astral_items;
create policy "astral: mentora gestiona" on astral_items
  for all using (is_mentor()) with check (is_mentor());

drop policy if exists "astral: estudiantes leen publicado" on astral_items;
create policy "astral: estudiantes leen publicado" on astral_items
  for select to authenticated using (is_published);
