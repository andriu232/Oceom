-- ============================================================
-- OCEOM by E-MOTION® — MAPA BIOCODE
-- Buscador de exploración cuerpo–emoción. Tres piezas:
--
--  1) biocode_nodes    · la red de conocimiento (cuerpo, síntomas, emociones,
--                        creencias, patrones). Cada nodo trae información
--                        educativa, lectura complementaria, preguntas y
--                        ejercicios, con su NIVEL DE EVIDENCIA declarado.
--  2) biocode_sessions · cada exploración de una persona.
--  3) biocode_messages · la conversación dentro de esa exploración.
--
-- Regla del producto: nunca se afirma causalidad médica ni emocional. El nivel
-- de evidencia viaja con el dato para que el usuario sepa qué está leyendo.
-- ============================================================

-- ---------- 1) Red de conocimiento ----------
create table if not exists biocode_nodes (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,

  -- Puerta de entrada a la que pertenece (las 7 del método).
  category text not null
    check (category in ('cuerpo','sintoma','emocion','creencia','patron','historia','arbol')),

  -- Ubicación anatómica (para el mapa corporal). Nulo si no aplica.
  body_zone text,
  organ text,
  body_system text,

  -- Información educativa (perspectiva médica divulgativa).
  scientific_info text,
  scientific_sources text[] not null default '{}',
  warning_signs text[] not null default '{}',   -- cuándo consultar a un profesional

  -- Lectura complementaria (biodecodificación, simbolismo). SIEMPRE declarada.
  complementary_info text,
  symbolic_themes text[] not null default '{}',

  -- Material de exploración.
  emotions text[] not null default '{}',
  beliefs text[] not null default '{}',
  patterns text[] not null default '{}',
  behaviors text[] not null default '{}',
  questions text[] not null default '{}',
  exercises text[] not null default '{}',

  -- Nodos vecinos (por slug) y recurso de OCEOM sugerido.
  related_slugs text[] not null default '{}',
  oceom_resource text,
  oceom_link text,

  evidence_level text not null default 'complementario'
    check (evidence_level in ('consolidada','investigacion','complementario','reflexion')),

  is_active boolean not null default true,
  tsv tsvector,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_biocode_nodes_tsv on biocode_nodes using gin (tsv);
create index if not exists idx_biocode_nodes_cat on biocode_nodes (category, is_active);
create index if not exists idx_biocode_nodes_zone on biocode_nodes (body_zone) where body_zone is not null;

-- Vector de búsqueda en español: nombre + zona + todo el material explorable,
-- para que "me duele la espalda" o "me cuesta recibir" caigan en el nodo justo.
create or replace function biocode_nodes_tsv_update() returns trigger
language plpgsql as $$
begin
  new.tsv := to_tsvector('spanish',
    coalesce(new.name,'') || ' ' ||
    coalesce(new.body_zone,'') || ' ' || coalesce(new.organ,'') || ' ' ||
    coalesce(new.body_system,'') || ' ' ||
    coalesce(new.scientific_info,'') || ' ' || coalesce(new.complementary_info,'') || ' ' ||
    coalesce(array_to_string(new.symbolic_themes,' '),'') || ' ' ||
    coalesce(array_to_string(new.emotions,' '),'') || ' ' ||
    coalesce(array_to_string(new.beliefs,' '),'') || ' ' ||
    coalesce(array_to_string(new.patterns,' '),'') || ' ' ||
    coalesce(array_to_string(new.behaviors,' '),''));
  return new;
end; $$;

drop trigger if exists trg_biocode_nodes_tsv on biocode_nodes;
create trigger trg_biocode_nodes_tsv
  before insert or update on biocode_nodes
  for each row execute function biocode_nodes_tsv_update();

-- ---------- 2) Exploraciones ----------
create table if not exists biocode_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null default 'Nueva exploración',
  -- Puerta por la que entró (cuerpo, síntoma, emoción…).
  entry_door text,
  -- Nodos que se tocaron durante la exploración (para "Mi Mapa BIOCODE").
  node_slugs text[] not null default '{}',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_biocode_sessions_user
  on biocode_sessions (user_id, updated_at desc);

create table if not exists biocode_messages (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references biocode_sessions(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_biocode_messages_session
  on biocode_messages (session_id, created_at);

-- ---------- Timestamps ----------
drop trigger if exists trg_biocode_nodes_updated on biocode_nodes;
create trigger trg_biocode_nodes_updated
  before update on biocode_nodes
  for each row execute function set_updated_at();

drop trigger if exists trg_biocode_sessions_updated on biocode_sessions;
create trigger trg_biocode_sessions_updated
  before update on biocode_sessions
  for each row execute function set_updated_at();

-- ---------- 3) Búsqueda de nodos (FTS español) ----------
create or replace function match_biocode_nodes(query_text text, match_count int default 6)
returns table (
  id uuid, slug text, name text, category text,
  body_zone text, organ text,
  scientific_info text, complementary_info text,
  symbolic_themes text[], emotions text[], beliefs text[],
  patterns text[], behaviors text[], questions text[], exercises text[],
  warning_signs text[], oceom_resource text, oceom_link text,
  evidence_level text, rank real
)
language sql stable as $$
  select n.id, n.slug, n.name, n.category,
         n.body_zone, n.organ,
         n.scientific_info, n.complementary_info,
         n.symbolic_themes, n.emotions, n.beliefs,
         n.patterns, n.behaviors, n.questions, n.exercises,
         n.warning_signs, n.oceom_resource, n.oceom_link,
         n.evidence_level,
         ts_rank(n.tsv, websearch_to_tsquery('spanish', query_text)) as rank
  from biocode_nodes n
  where n.is_active
    and n.tsv @@ websearch_to_tsquery('spanish', query_text)
  order by rank desc
  limit match_count;
$$;

-- ---------- 4) RLS ----------
alter table biocode_nodes enable row level security;
alter table biocode_sessions enable row level security;
alter table biocode_messages enable row level security;

-- La red de conocimiento la lee cualquier persona autenticada; la edita la mentora.
drop policy if exists "biocode_nodes lectura" on biocode_nodes;
create policy "biocode_nodes lectura" on biocode_nodes
  for select to authenticated using (is_active or is_mentor());

drop policy if exists "biocode_nodes mentora" on biocode_nodes;
create policy "biocode_nodes mentora" on biocode_nodes
  for all to authenticated using (is_mentor()) with check (is_mentor());

-- Las exploraciones son privadas de cada persona.
drop policy if exists "biocode_sessions dueño" on biocode_sessions;
create policy "biocode_sessions dueño" on biocode_sessions
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "biocode_messages dueño" on biocode_messages;
create policy "biocode_messages dueño" on biocode_messages
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
