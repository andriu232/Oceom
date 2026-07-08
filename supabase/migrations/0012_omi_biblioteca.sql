-- ============================================================
-- 0012_omi_biblioteca.sql — Biblioteca IA de OMI (base de conocimiento).
-- Valeria sube material (texto/PDF) desde el admin; se trocea en `omi_chunks`
-- y OMI recupera lo relevante al responder (retrieval con búsqueda de texto
-- completo en español). RLS: solo la mentora gestiona; OMI lee vía service_role.
-- ============================================================

create table if not exists omi_documents (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  source_type text not null default 'text' check (source_type in ('text', 'file')),
  file_name text,
  char_count integer not null default 0,
  chunk_count integer not null default 0,
  status text not null default 'ready' check (status in ('processing', 'ready', 'error')),
  error text,
  is_active boolean not null default true,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists omi_chunks (
  id uuid primary key default uuid_generate_v4(),
  document_id uuid not null references omi_documents(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  tsv tsvector,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists idx_omi_chunks_tsv on omi_chunks using gin (tsv);
create index if not exists idx_omi_chunks_doc on omi_chunks (document_id);
create index if not exists idx_omi_documents_active on omi_documents (is_active, created_at desc);

-- Mantiene el vector de búsqueda (español) al insertar/actualizar el contenido.
create or replace function omi_chunks_tsv_update() returns trigger
language plpgsql as $$
begin
  new.tsv := to_tsvector('spanish', coalesce(new.content, ''));
  return new;
end; $$;
drop trigger if exists trg_omi_chunks_tsv on omi_chunks;
create trigger trg_omi_chunks_tsv
  before insert or update of content on omi_chunks
  for each row execute function omi_chunks_tsv_update();

drop trigger if exists trg_omi_documents_updated on omi_documents;
create trigger trg_omi_documents_updated
  before update on omi_documents
  for each row execute function set_updated_at();

-- Recupera los fragmentos más relevantes a la consulta (solo documentos activos).
create or replace function match_omi_chunks(query_text text, match_count int default 5)
returns table (content text, document_id uuid, title text, rank real)
language sql stable as $$
  select c.content, c.document_id, d.title,
         ts_rank_cd(c.tsv, websearch_to_tsquery('spanish', query_text)) as rank
  from omi_chunks c
  join omi_documents d on d.id = c.document_id
  where d.is_active
    and c.tsv @@ websearch_to_tsquery('spanish', query_text)
  order by rank desc
  limit match_count;
$$;

alter table omi_documents enable row level security;
alter table omi_chunks enable row level security;

drop policy if exists "omi_documents mentora" on omi_documents;
create policy "omi_documents mentora" on omi_documents
  for all to authenticated using (is_mentor()) with check (is_mentor());

drop policy if exists "omi_chunks mentora" on omi_chunks;
create policy "omi_chunks mentora" on omi_chunks
  for all to authenticated using (is_mentor()) with check (is_mentor());
