-- ⚠️ La 0023 vuelve a crear estas dos funciones con `create or replace`:
-- si se reaplica después de esta, se pierde el arreglo. La 0027 las
-- restaura y debe ser la última del lote.
-- ============================================================
-- OCEOM by E-MOTION® — BIOCODE: arreglo de la búsqueda.
--
-- Problema detectado en producción: "me duele la espalda" no devolvía nada.
-- Dos causas:
--   1) El stemmer español no une "duele" (verbo doler) con "dolor"
--      (sustantivo): quedan como lexemas distintos.
--   2) `websearch_to_tsquery` exige que TODOS los términos coincidan, así que
--      una sola palabra fuera del vocabulario tumbaba la consulta entera.
--
-- Solución: (a) columna `aliases` con las formas coloquiales reales con que la
-- gente escribe, (b) búsqueda por OR con ranking en vez de AND — el nodo que
-- coincide en más términos sube solo.
-- ============================================================

alter table biocode_nodes
  add column if not exists aliases text[] not null default '{}';

-- El vector de búsqueda ahora incluye los alias.
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

-- Alias: cómo escribe la gente de verdad, no cómo se titula el nodo.
update biocode_nodes set aliases = '{"me duele la cabeza","dolor de cabeza","jaqueca","cefalea","migrañas","me estalla la cabeza","punzadas en la cabeza"}' where slug = 'migrana';
update biocode_nodes set aliases = '{"me duele la espalda","dolor de espalda","me duele la cintura","lumbago","lumbalgia","espalda baja","dolor lumbar","dolor de columna","me duele la zona lumbar","cargando peso"}' where slug = 'dolor-espalda';
update biocode_nodes set aliases = '{"me duele el estomago","dolor de estomago","me duele la barriga","acidez","gastritis","nudo en el estomago","colon irritable","me cae mal la comida","digestion pesada","nauseas"}' where slug = 'digestivo-estomago';
update biocode_nodes set aliases = '{"me duele el cuello","dolor de cuello","contractura","tension en los hombros","me duelen los hombros","torticolis","cervicales","rigidez en el cuello"}' where slug = 'cuello-hombros';
update biocode_nodes set aliases = '{"no puedo dormir","me cuesta dormir","insomnio","me despierto de madrugada","doy vueltas en la cama","no logro conciliar el sueño","duermo mal","desvelo"}' where slug = 'insomnio';
update biocode_nodes set aliases = '{"me van a dejar","miedo a que me dejen","siempre me abandonan","me dejan sola","miedo al abandono","termino con parejas que me abandonan","no soy suficiente","miedo a que se vayan"}' where slug = 'abandono';
update biocode_nodes set aliases = '{"me siento culpable","siento mucha culpa","culpa","me da culpa descansar","siento que fallo","me siento mal por decir que no"}' where slug = 'culpa';
update biocode_nodes set aliases = '{"me cuesta recibir","no merezco","no me siento suficiente","siento que no merezco","me cuesta pedir ayuda","siempre doy y no recibo","merecer"}' where slug = 'merecimiento';
update biocode_nodes set aliases = '{"me exijo mucho","soy muy exigente conmigo","perfeccionismo","tengo que poder con todo","no me permito fallar","siempre agotada","no descanso","me sobreexijo"}' where slug = 'sobreexigencia';
update biocode_nodes set aliases = '{"problemas con el dinero","no me alcanza","siempre que gano mas pasa algo","en mi familia todos tienen problemas con el dinero","me cuesta cobrar","escasez","deudas"}' where slug = 'dinero';

-- Fuerza el recálculo del tsv en las filas ya existentes.
update biocode_nodes set updated_at = updated_at;

-- Búsqueda por OR con ranking: un término suelto ya no tumba la consulta, y
-- el nodo que coincide en más términos queda arriba.
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
    select nullif(
      replace(plainto_tsquery('spanish', query_text)::text, '&', '|'),
      ''
    )::tsquery as tsq
  )
  select n.id, n.slug, n.name, n.category,
         n.body_zone, n.organ,
         n.scientific_info, n.complementary_info,
         n.symbolic_themes, n.emotions, n.beliefs,
         n.patterns, n.behaviors, n.questions, n.exercises,
         n.warning_signs, n.oceom_resource, n.oceom_link,
         n.evidence_level,
         ts_rank(n.tsv, q.tsq) as rank
  from biocode_nodes n, q
  where q.tsq is not null
    and n.is_active
    and n.tsv @@ q.tsq
  order by rank desc
  limit match_count;
$$;
