-- ============================================================
-- 0033_suplementos_no_son_programas.sql
--
-- La 0032 intentó reclasificar los suplementos (estaban como 'program'
-- porque el formulario viejo no ofrecía otra cosa), pero la condición
-- exigía `program_id is null` y NO se cumplía: los cinco apuntan al
-- programa "Método E-MOTION®".
--
-- El efecto real en producción es caro: comprar un frasco de $90.000
-- inscribe a la compradora al programa insignia — el mismo acceso que
-- otorga la mentoría de $3.000.000. Además, al no estar marcados como
-- envío, no piden dirección ni descuentan inventario.
--
-- Aquí se corrigen por título (los cinco llevan "SUPLEMENTO"), sin tocar
-- "MENTORIA E - MOTION", que sí debe seguir inscribiendo al programa.
-- Idempotente.
-- ============================================================

update store_products
   set kind = 'product',
       requires_shipping = true,
       program_id = null
 where title ilike '%suplemento%'
   and kind = 'program';

-- Comprobación: no debe quedar ningún suplemento inscribiendo a un programa.
do $$
declare
  n integer;
begin
  select count(*) into n
    from store_products
   where title ilike '%suplemento%'
     and (kind = 'program' or program_id is not null);
  if n > 0 then
    raise exception 'Quedan % suplementos enlazados a un programa', n;
  end if;
end $$;
