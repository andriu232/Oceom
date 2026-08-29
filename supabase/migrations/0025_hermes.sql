-- ============================================================
-- 0025_hermes.sql — HERMES, el mensajero de OCEOM
--
-- Hermes es el agente que vive en WhatsApp: recuerda a cada persona escribir
-- en su Bitácora Interior y convierte lo que escribe por WhatsApp en una
-- entrada real de la plataforma (con emoción e intensidad detectadas por OMI).
--
-- Piezas:
--   1) Teléfono verificado en profiles + preferencias de recordatorio.
--   2) hermes_verifications — códigos de vinculación (autoservicio).
--   3) hermes_messages — bitácora técnica de todo lo enviado/recibido.
--      Sirve de idempotencia: WhatsApp reintenta los webhooks.
--   4) journal_entries.source / dream_entries.source — de dónde vino la entrada.
--
-- Todo lo de Hermes lo escribe el servidor con service_role (webhook y cron),
-- por eso NO hay policies de insert: cada persona solo LEE lo suyo.
-- Idempotente.
-- ============================================================

-- ---------- 1) Teléfono y preferencias en el perfil ----------
alter table profiles
  add column if not exists phone_e164 text,
  add column if not exists phone_verified_at timestamptz,
  -- Quién vinculó el número: 'self' (el estudiante con código) | 'mentor'.
  add column if not exists phone_linked_by text,
  -- Consentimiento explícito de recibir mensajes de Hermes.
  add column if not exists hermes_opt_in boolean not null default false,
  -- Hora local (0-23) a la que Hermes envía el recordatorio.
  add column if not exists hermes_hour smallint not null default 20,
  add column if not exists hermes_tz text not null default 'America/Bogota',
  -- Cadencia: 'diario' | 'semanal' | 'nunca'.
  add column if not exists hermes_cadence text not null default 'diario',
  -- Último recordatorio enviado (evita duplicados si el cron corre dos veces).
  add column if not exists hermes_last_reminder_at timestamptz;

alter table profiles
  drop constraint if exists profiles_hermes_hour_check;
alter table profiles
  add constraint profiles_hermes_hour_check check (hermes_hour between 0 and 23);

alter table profiles
  drop constraint if exists profiles_hermes_cadence_check;
alter table profiles
  add constraint profiles_hermes_cadence_check
  check (hermes_cadence in ('diario', 'semanal', 'nunca'));

-- Un número de WhatsApp pertenece a una sola persona: es la llave con la que
-- el webhook resuelve la identidad de quien escribe.
create unique index if not exists idx_profiles_phone_e164
  on profiles (phone_e164) where phone_e164 is not null;

-- ---------- 2) Códigos de vinculación ----------
create table if not exists hermes_verifications (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references profiles(id) on delete cascade,
  phone_e164 text not null,
  -- Nunca se guarda el código en claro: sha256(code || id).
  code_hash text not null,
  attempts smallint not null default 0,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists idx_hermes_verif_user
  on hermes_verifications (user_id, created_at desc);

alter table hermes_verifications enable row level security;
-- Sin policies: solo el servidor (service_role) toca esta tabla.

-- ---------- 3) Bitácora técnica de mensajes ----------
create table if not exists hermes_messages (
  id uuid primary key default uuid_generate_v4(),
  -- Puede ser null: alguien escribe desde un número que no reconocemos.
  user_id uuid references profiles(id) on delete set null,
  phone_e164 text not null,
  direction text not null check (direction in ('in', 'out')),
  -- 'texto' | 'audio' | 'recordatorio' | 'verificacion' | 'sistema'
  kind text not null default 'texto',
  body text,
  -- ID del mensaje en WhatsApp. Único → hace el webhook idempotente.
  wa_message_id text,
  -- Entrada de bitácora / sueño creada a partir de este mensaje.
  journal_entry_id uuid references journal_entries(id) on delete set null,
  dream_entry_id uuid references dream_entries(id) on delete set null,
  -- Bandera roja detectada (crisis | medica), para que Valeria pueda revisarlo.
  red_flag text,
  error text,
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists idx_hermes_msg_wa_id
  on hermes_messages (wa_message_id) where wa_message_id is not null;
create index if not exists idx_hermes_msg_user
  on hermes_messages (user_id, created_at desc);
create index if not exists idx_hermes_msg_phone
  on hermes_messages (phone_e164, created_at desc);

alter table hermes_messages enable row level security;

-- Cada quien lee su propia conversación con Hermes; la mentora la ve toda
-- (igual que la bitácora: acompaña el proceso).
drop policy if exists "hermes: dueño lee" on hermes_messages;
create policy "hermes: dueño lee" on hermes_messages
  for select using (user_id = auth.uid());

drop policy if exists "hermes: mentora lee" on hermes_messages;
create policy "hermes: mentora lee" on hermes_messages
  for select using (is_mentor());

-- ---------- 4) Procedencia de las entradas ----------
alter table journal_entries
  add column if not exists source text not null default 'app';
alter table dream_entries
  add column if not exists source text not null default 'app';
-- valores: 'app' (escrita en la plataforma) | 'whatsapp' (dictada a Hermes)
