-- ============================================================
-- OCEOM by E-MOTION® — Referidos multinivel (Sprint: Referidos)
-- Portado tal cual del sistema de Código Enigma, adaptado a las
-- convenciones de OCEOM (uuid-ossp, timezone('utc', now()),
-- helpers is_mentor()/is_super_admin()).
--
-- 3 piezas:
--   1) referral_settings: singleton (id=1) con % por nivel, max_levels,
--      moneda y mínimo pagable. Solo mentora/super admin escribe.
--   2) referrals: árbol de quién invitó a quién. PK = user_id (cada user
--      tiene UN referrer). `code` es el slug único compartible.
--   3) commission_events: cada compra/membresía de un referido genera
--      eventos de comisión para sus N referrers hasta max_levels.
--
-- Notas:
--   - Si una compra no tiene referido (referrer=null) no se crean events.
--   - El pago es off-chain: la mentora marca la comisión como 'paid'.
-- ============================================================

-- ----------------------------------------------------------------------------
-- 1. referral_settings (singleton)
-- ----------------------------------------------------------------------------
create table if not exists referral_settings (
  id                int primary key default 1 check (id = 1),
  -- % (0-100) que gana el referrer de nivel 1 (referido directo)
  level_1_pct       numeric(5,2) not null default 20.00 check (level_1_pct >= 0 and level_1_pct <= 100),
  -- Nivel 2: el que invitó al que invitó
  level_2_pct       numeric(5,2) not null default 5.00  check (level_2_pct  >= 0 and level_2_pct  <= 100),
  -- Nivel 3: nivel más profundo
  level_3_pct       numeric(5,2) not null default 2.00  check (level_3_pct  >= 0 and level_3_pct  <= 100),
  -- Niveles máximos a propagar (1, 2 o 3)
  max_levels        int not null default 3 check (max_levels between 1 and 3),
  -- Moneda en la que se calculan/pagan comisiones
  payout_currency   text not null default 'USDT',
  -- Mínimo cobrable (en USD cents) antes de poder pedir retiro
  min_payout_cents  int not null default 1000, -- $10
  -- Si true las comisiones se aprueban solas; si false la mentora aprueba
  auto_approve      boolean not null default false,
  updated_at        timestamptz not null default timezone('utc', now()),
  updated_by        uuid references auth.users(id) on delete set null
);

-- Sembrar la fila singleton si no existe
insert into referral_settings (id) values (1) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. referrals (árbol)
-- ----------------------------------------------------------------------------
create table if not exists referrals (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  -- Quién invitó a este user. NULL = se registró sin link de referido
  referrer_id  uuid references auth.users(id) on delete set null,
  -- Código único del USER (su propio link compartible)
  code         text not null unique,
  signup_at    timestamptz not null default timezone('utc', now()),
  check (referrer_id is null or referrer_id <> user_id)
);

create index if not exists referrals_referrer_idx on referrals(referrer_id);
create index if not exists referrals_code_idx     on referrals(code);

-- ----------------------------------------------------------------------------
-- 3. commission_events
-- ----------------------------------------------------------------------------
create table if not exists commission_events (
  id                       uuid primary key default uuid_generate_v4(),
  -- A quién se le acredita la comisión (el referrer)
  beneficiary_user_id      uuid not null references auth.users(id) on delete cascade,
  -- Quién hizo la compra (el referido)
  source_user_id           uuid not null references auth.users(id) on delete cascade,
  -- En qué nivel del árbol está el beneficiary respecto al source (1, 2, 3)
  level                    int not null check (level between 1 and 3),
  -- Qué causó la comisión: 'subscription' | 'purchase' | 'manual' | ...
  source_type              text not null,
  -- ID del recurso origen (order.id / subscription.id)
  source_ref               text,
  -- Monto base de la transacción que generó la comisión (USD cents)
  source_amount_cents      int not null,
  -- Comisión calculada para ESTE beneficiary (USD cents)
  commission_amount_cents  int not null,
  -- % aplicado al momento de generar (snapshot, por si las settings cambian)
  applied_pct              numeric(5,2) not null,
  status                   text not null default 'pending' check (status in ('pending','approved','paid','canceled')),
  paid_at                  timestamptz,
  paid_by                  uuid references auth.users(id) on delete set null,
  created_at               timestamptz not null default timezone('utc', now())
);

create index if not exists commission_events_beneficiary_status_idx
  on commission_events(beneficiary_user_id, status, created_at desc);
create index if not exists commission_events_source_idx
  on commission_events(source_user_id);
-- Evitar duplicar la misma comisión al mismo beneficiary por la misma fuente
create unique index if not exists commission_events_unique_per_source
  on commission_events(beneficiary_user_id, source_type, source_ref, level)
  where source_ref is not null;

-- ----------------------------------------------------------------------------
-- 4. Generador de códigos únicos para nuevos referrals (8 chars)
-- ----------------------------------------------------------------------------
create or replace function generate_referral_code()
returns text language plpgsql as $$
declare
  candidate text;
begin
  loop
    candidate := lower(substring(md5(uuid_generate_v4()::text) for 8));
    exit when not exists (select 1 from referrals where code = candidate);
  end loop;
  return candidate;
end;
$$;

-- ----------------------------------------------------------------------------
-- 5. RLS (la mentora/super admin es la "admin" del programa de referidos)
-- ----------------------------------------------------------------------------
alter table referral_settings enable row level security;
alter table referrals          enable row level security;
alter table commission_events  enable row level security;

-- referral_settings: todos leen (los % son públicos), solo mentora escribe
create policy "referidos: settings lectura" on referral_settings for select using (true);
create policy "referidos: settings mentora" on referral_settings for all
  using (is_mentor()) with check (is_mentor());

-- referrals: cada user ve su propia fila (code, referrer), mentora ve todo
create policy "referidos: dueño lee lo suyo" on referrals for select
  using (auth.uid() = user_id);
create policy "referidos: mentora gestiona" on referrals for all
  using (is_mentor()) with check (is_mentor());

-- commission_events: cada user ve donde es beneficiary, mentora ve todo
create policy "comisiones: dueño lee lo suyo" on commission_events for select
  using (auth.uid() = beneficiary_user_id);
create policy "comisiones: mentora gestiona" on commission_events for all
  using (is_mentor()) with check (is_mentor());

-- ----------------------------------------------------------------------------
-- 6. Comentarios
-- ----------------------------------------------------------------------------
comment on table referral_settings is 'Singleton con la configuración de porcentajes del programa de referidos.';
comment on table referrals         is 'Árbol de referidos: quién invitó a quién. Cada user tiene UN referrer.';
comment on table commission_events is 'Eventos de comisión generados cuando un referido hace una compra.';
