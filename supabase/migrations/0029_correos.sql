-- ============================================================
-- 0029_correos.sql — El centro de correos de OCEOM
--
-- Valeria decide desde /correos-admin QUÉ se manda, A QUIÉN y CADA CUÁNTO.
-- Las PLANTILLAS viven en el código (`src/lib/email/campaigns/`), no aquí:
-- una campaña es una fila que apunta a una plantilla por su `slug`. Así la
-- redacción se revisa en un pull request y la base solo guarda decisiones.
--
-- Piezas:
--   1) Preferencias de correo en profiles (hora local + baja global + token).
--   2) mail_campaigns        — las campañas y su configuración.
--   3) mail_campaign_recipients — destinatarios cuando el público es "elegidos".
--   4) mail_sends            — qué se le mandó a quién y cuándo.
--      Sirve de idempotencia (no dos veces el mismo día) y de historial.
--
-- Todo lo manda el cron con service_role, por eso NO hay policies de insert
-- para nadie más: la mentora lee y configura, el sistema escribe.
-- Idempotente.
-- ============================================================

-- ---------- 1) Preferencias de la persona ----------
-- La baja es GLOBAL a propósito: quien pulsa "no quiero más correos" no está
-- pensando en campañas, está pidiendo silencio. Las bajas por campaña se
-- manejan quitándola de los destinatarios desde el panel.
alter table public.profiles
  add column if not exists mail_opt_in boolean  not null default true,
  add column if not exists mail_hour   smallint not null default 20,
  add column if not exists mail_tz     text     not null default 'America/Bogota',
  add column if not exists mail_token  uuid     not null default gen_random_uuid();

comment on column public.profiles.mail_opt_in is 'Quiere recibir correos de OCEOM. Lo apaga el enlace de baja.';
comment on column public.profiles.mail_hour   is 'Hora local (0-23) a la que prefiere recibirlos.';
comment on column public.profiles.mail_tz     is 'Zona horaria IANA con la que se interpreta mail_hour.';
comment on column public.profiles.mail_token  is 'Credencial del enlace de baja de un clic. Secreta.';

do $$ begin
  alter table public.profiles
    add constraint profiles_mail_hour_check check (mail_hour between 0 and 23);
exception when duplicate_object then null; end $$;

create unique index if not exists profiles_mail_token_key on public.profiles (mail_token);

-- ---------- 2) Campañas ----------
create table if not exists public.mail_campaigns (
  id          uuid primary key default gen_random_uuid(),
  -- Apunta a la plantilla del código. Si el slug no existe en el catálogo,
  -- el cron se la salta y lo dice en los logs en vez de mandar un correo roto.
  slug        text not null unique,
  name        text not null,
  description text,
  enabled     boolean not null default false,
  cadence     text not null default 'diaria'
              check (cadence in ('diaria', 'semanal', 'quincenal', 'mensual')),
  -- Solo para 'semanal': 0 = domingo … 6 = sábado.
  weekday     smallint check (weekday between 0 and 6),
  -- NULL = a la hora que cada persona eligió. Un número = hora fija (pero
  -- sigue siendo la hora LOCAL de cada quien, no la del servidor).
  hour        smallint check (hour between 0 and 23),
  audience    text not null default 'todos'
              check (audience in ('todos', 'elegidos', 'activos')),
  -- Solo tiene sentido en el recordatorio de bitácora: no molestar a quien
  -- ya escribió hoy.
  skip_if_wrote boolean not null default false,
  last_run_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.mail_campaigns is 'Correos recurrentes que configura la mentora. La plantilla vive en el código, referenciada por slug.';

-- ---------- 3) Destinatarios elegidos a mano ----------
create table if not exists public.mail_campaign_recipients (
  campaign_id uuid not null references public.mail_campaigns(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (campaign_id, user_id)
);

-- ---------- 4) Historial de envíos ----------
create table if not exists public.mail_sends (
  id          uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.mail_campaigns(id) on delete cascade,
  user_id     uuid references public.profiles(id) on delete set null,
  subject     text,
  ok          boolean not null default true,
  error       text,
  -- true si lo disparó el botón "enviarme una prueba" del panel.
  is_test     boolean not null default false,
  sent_at     timestamptz not null default now()
);

create index if not exists mail_sends_campaign_user_idx
  on public.mail_sends (campaign_id, user_id, sent_at desc);
create index if not exists mail_sends_recent_idx
  on public.mail_sends (sent_at desc);

-- ---------- RLS ----------
alter table public.mail_campaigns           enable row level security;
alter table public.mail_campaign_recipients enable row level security;
alter table public.mail_sends               enable row level security;

do $$ begin
  create policy "correos: la mentora gestiona" on public.mail_campaigns
    for all using (is_mentor()) with check (is_mentor());
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "destinatarios: la mentora gestiona" on public.mail_campaign_recipients
    for all using (is_mentor()) with check (is_mentor());
exception when duplicate_object then null; end $$;

-- El historial es de solo lectura incluso para la mentora: lo escribe el cron
-- con service_role. Nadie edita lo que ya se envió.
do $$ begin
  create policy "historial: la mentora lee" on public.mail_sends
    for select using (is_mentor());
exception when duplicate_object then null; end $$;

-- ---------- Las campañas ya creadas ----------
-- El recordatorio de bitácora entra ACTIVO: es el que se pidió. Los demás
-- entran apagados para que Valeria los encienda cuando revise el texto.
insert into public.mail_campaigns (slug, name, description, enabled, cadence, weekday, hour, audience, skip_if_wrote)
values
  ('bitacora', 'Recordatorio de bitácora',
   'Invita a escribir en la Bitácora Interior, con enlace directo. No le llega a quien ya escribió ese día.',
   true,  'diaria',   null, null, 'todos', true),

  ('poema', 'Poema de la semana',
   'Un poema breve para abrir la semana. Sin tareas ni enlaces: solo el texto.',
   false, 'semanal',  1,    8,    'todos', false),

  ('valor', 'Info de valor',
   'Una idea corta y aplicable sobre emociones, cuerpo o hábitos. Con un gesto concreto para ese día.',
   false, 'semanal',  4,    9,    'todos', false),

  ('pregunta', 'Pregunta para sentarse',
   'Una sola pregunta para quedarse con ella. Enlaza a la bitácora por si quiere responderla escribiendo.',
   false, 'quincenal', null, 19,  'todos', false)
on conflict (slug) do nothing;
