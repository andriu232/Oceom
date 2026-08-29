-- ============================================================
-- OCEOM by E-MOTION® — BIOCODE: restaurar la búsqueda (y blindarla).
--
-- QUÉ PASÓ
-- La 0023 crea `biocode_nodes_tsv_update` y `match_biocode_nodes` con
-- `create or replace`, y la 0025 las REEMPLAZA con las versiones buenas
-- (tsv con alias + búsqueda por OR). Al aplicar el lote pendiente en orden,
-- la 0023 volvió a correr DESPUÉS de que la 0025 ya estaba puesta en su
-- momento, así que dejó la base con las versiones viejas:
--   · trigger sin alias  → los alias no entran al vector de búsqueda
--   · búsqueda con AND   → una sola palabra fuera del vocabulario devuelve 0
-- Y el `update` final de la 0026 recalculó TODOS los tsv con ese trigger
-- viejo, así que se perdieron los alias también en las filas antiguas.
-- Síntoma: "me duele la espalda" y "no puedo expresar lo que siento" vacíos.
--
-- ESTA MIGRACIÓN
-- Reinstala las dos funciones buenas, refresca el tsv de todas las filas y
-- añade un desempate por alias. Es idempotente: se puede correr las veces
-- que haga falta, y es lo último que debe correrse si alguna vez se
-- vuelve a aplicar el lote completo desde cero.
-- ============================================================

-- ---------- 1) Vector de búsqueda CON alias ----------
create or replace function biocode_nodes_tsv_update() returns trigger
language plpgsql as $$
begin
  new.tsv := to_tsvector('spanish',
    coalesce(new.name,'') || ' ' ||
    coalesce(array_to_string(new.aliases,' '),'') || ' ' ||
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

-- ---------- 2) Búsqueda por OR, con desempate ----------
-- El OR evita que un término suelto tumbe la consulta entera. Encima del
-- ranking de texto se suman dos empujones, porque quien escribe una frase
-- casi calcada de un alias está señalando ese nodo y no uno vecino:
--   +0.5 si la frase contiene un alias del nodo
--   +0.3 si la frase contiene el nombre del nodo
-- Solo reordenan: no meten ni sacan resultados del conjunto.
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
  with q as (
    select
      nullif(replace(plainto_tsquery('spanish', query_text)::text, '&', '|'), '')::tsquery as tsq,
      lower(query_text) as texto
  )
  select n.id, n.slug, n.name, n.category,
         n.body_zone, n.organ,
         n.scientific_info, n.complementary_info,
         n.symbolic_themes, n.emotions, n.beliefs,
         n.patterns, n.behaviors, n.questions, n.exercises,
         n.warning_signs, n.oceom_resource, n.oceom_link,
         n.evidence_level,
         (ts_rank(n.tsv, q.tsq)
           + case when exists (
               select 1 from unnest(n.aliases) a
               where length(a) > 6 and q.texto like '%' || lower(a) || '%'
             ) then 0.5 else 0 end
           + case when q.texto like '%' || lower(n.name) || '%' then 0.3 else 0 end
         )::real as rank
  from biocode_nodes n, q
  where q.tsq is not null
    and n.is_active
    and n.tsv @@ q.tsq
  order by rank desc
  limit match_count;
$$;

-- ---------- 3) Reconstruir el tsv de todas las filas ----------
-- Ahora sí con el trigger bueno: los alias vuelven al vector.
update biocode_nodes set updated_at = updated_at;
