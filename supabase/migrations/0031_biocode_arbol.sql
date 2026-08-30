-- ============================================================
-- OCEOM by E-MOTION® — MI ÁRBOL BIOCODE (§14 y §15 del manual).
--
-- Cuatro niveles (yo, padres, abuelos, bisabuelos) y, por persona, lo que el
-- manual pide registrar: nombres, fechas, edades, acontecimientos,
-- enfermedades, pérdidas, separaciones, migraciones, conflictos, profesiones
-- y situación económica.
--
-- Los acontecimientos van en jsonb con su edad ([{texto, edad}]) y no como
-- texto suelto, porque la detección de coincidencias del §15 se apoya
-- justamente en las edades que se repiten entre generaciones.
--
-- Esto es lo más sensible que guarda la plataforma: son datos de terceros que
-- nunca dieron su consentimiento. Solo los ve quien los escribió — ni siquiera
-- la mentora — y la política de RLS no tiene excepción para roles.
-- ============================================================

create table if not exists biocode_arbol (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,

  nivel text not null check (nivel in ('yo', 'padres', 'abuelos', 'bisabuelos')),
  parentesco text,
  nombre text,

  nacimiento date,
  fallecimiento date,
  profesion text,
  -- Situación económica, para los "patrones económicos" del §15.
  economia text check (economia in ('holgada', 'estable', 'dificil', 'muy_dificil')),

  enfermedades text[] not null default '{}',
  -- [{ "texto": "se separó de mi abuelo", "edad": 34 }]
  acontecimientos jsonb not null default '[]'::jsonb,

  separacion boolean not null default false,
  migracion boolean not null default false,
  perdida boolean not null default false,
  conflicto boolean not null default false,

  notas text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_biocode_arbol_user on biocode_arbol (user_id, nivel);

drop trigger if exists trg_biocode_arbol_updated on biocode_arbol;
create trigger trg_biocode_arbol_updated
  before update on biocode_arbol
  for each row execute function set_updated_at();

alter table biocode_arbol enable row level security;

drop policy if exists "biocode_arbol dueño" on biocode_arbol;
create policy "biocode_arbol dueño" on biocode_arbol
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
