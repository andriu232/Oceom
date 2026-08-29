-- ============================================================
-- OCEOM by E-MOTION® — BIOCODE: el mapa personal.
--
-- Del manual de experiencia de Valeria: cada exploración deja un mapa de
-- conexiones descubiertas (§7, §16, §23) y una ficha "Lo que he descubierto"
-- (§18) que se guarda como EXPLORACIÓN #014 con su número, tema y estado
-- (§20), para poder revisarla en el historial (§21).
--
-- Se amplía `biocode_sessions` en vez de crear otra tabla: una exploración YA
-- es una sesión, y separarlas obligaría a mantener dos cosas en sincronía.
-- ============================================================

alter table biocode_sessions
  -- Número correlativo POR PERSONA: la ficha se titula "Exploración #14".
  add column if not exists numero integer,
  -- El mapa: los nodos que la persona fue eligiendo y cómo se conectan.
  -- {"nodos":[{"id","texto","dimension"}], "aristas":[{"de","a"}]}
  add column if not exists mapa jsonb not null default '{"nodos":[],"aristas":[]}'::jsonb,
  -- La ficha del cierre: zona, emoción, creencia, patrón, pregunta, reflexión.
  add column if not exists ficha jsonb,
  add column if not exists estado text not null default 'abierta',
  -- Tema principal, para el historial.
  add column if not exists tema text;

alter table biocode_sessions drop constraint if exists biocode_sessions_estado_check;
alter table biocode_sessions
  add constraint biocode_sessions_estado_check
  check (estado in ('abierta', 'completada'));

-- ---------- Numeración por persona ----------
-- Se calcula en la base y no en la aplicación: dos pestañas abiertas a la vez
-- se pisarían el número si lo contara el cliente.
create or replace function biocode_sessions_numero() returns trigger
language plpgsql as $$
begin
  if new.numero is null then
    select coalesce(max(numero), 0) + 1 into new.numero
      from biocode_sessions where user_id = new.user_id;
  end if;
  return new;
end; $$;

drop trigger if exists trg_biocode_sessions_numero on biocode_sessions;
create trigger trg_biocode_sessions_numero
  before insert on biocode_sessions
  for each row execute function biocode_sessions_numero();

-- Numera las exploraciones que ya existían.
with orden as (
  select id, row_number() over (partition by user_id order by created_at) as n
    from biocode_sessions where numero is null
)
update biocode_sessions s set numero = orden.n
  from orden where orden.id = s.id;

create index if not exists idx_biocode_sessions_estado
  on biocode_sessions (user_id, estado, updated_at desc);
