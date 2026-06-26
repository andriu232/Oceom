-- ============================================================
-- OCEOM by E-MOTION® — Esquema inicial (Sprint 1)
-- ============================================================

create extension if not exists "uuid-ossp";
create extension if not exists vector;

-- ---------- Enums ----------
create type user_role        as enum ('super_admin','mentor','student');
create type program_type     as enum ('emotion','neuropsychic','custom');
create type content_status   as enum ('draft','published','archived');
create type lesson_content   as enum ('video','audio','text','meditation','hypnosis','live_recording','exercise');
create type assignment_kind  as enum ('text','checklist','file','journal','dream_map','emotional_checkin');
create type submission_state as enum ('draft','submitted','reviewed');
create type enrollment_state as enum ('active','paused','completed','cancelled','inactive');
create type ai_source_type   as enum ('note','transcript','exercise','meditation','hypnosis','faq','summary','protocol');
create type ai_role          as enum ('user','assistant','system');

-- ---------- updated_at trigger ----------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end; $$;

-- ---------- profiles ----------
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  role user_role not null default 'student',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create trigger trg_profiles_updated before update on profiles
  for each row execute function set_updated_at();

-- Crea profile automáticamente al registrarse en auth.users
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end; $$;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

-- ---------- contenido ----------
create table programs (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text unique not null,
  subtitle text,
  description text,
  cover_image_url text,
  type program_type not null default 'custom',
  status content_status not null default 'draft',
  duration_label text,
  level text,
  price_cop integer,
  benefits jsonb not null default '[]',
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create trigger trg_programs_updated before update on programs
  for each row execute function set_updated_at();

create table program_phases (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid not null references programs(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0
);

create table modules (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid not null references programs(id) on delete cascade,
  phase_id uuid references program_phases(id) on delete set null,
  title text not null,
  description text,
  order_index integer not null default 0,
  status content_status not null default 'draft'
);

create table lessons (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid not null references programs(id) on delete cascade,
  module_id uuid not null references modules(id) on delete cascade,
  title text not null,
  subtitle text,
  description text,
  objective text,
  content_type lesson_content not null default 'video',
  video_url text,
  audio_url text,
  body_content text,
  duration_seconds integer,
  order_index integer not null default 0,
  status content_status not null default 'draft',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create trigger trg_lessons_updated before update on lessons
  for each row execute function set_updated_at();

create table resources (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  title text not null,
  description text,
  file_url text,
  file_type text,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------- inscripción ----------
create table cohorts (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid not null references programs(id) on delete cascade,
  title text not null,
  description text,
  start_date date,
  end_date date,
  status text not null default 'active'
);

create table enrollments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  program_id uuid not null references programs(id) on delete cascade,
  cohort_id uuid references cohorts(id) on delete set null,
  status enrollment_state not null default 'active',
  progress_percentage numeric(5,2) not null default 0,
  started_at timestamptz default timezone('utc', now()),
  completed_at timestamptz,
  unique (student_id, program_id)
);

-- ---------- tareas / integraciones ----------
create table assignments (
  id uuid primary key default uuid_generate_v4(),
  lesson_id uuid not null references lessons(id) on delete cascade,
  title text not null,
  instructions text,
  assignment_type assignment_kind not null default 'text',
  status content_status not null default 'published',
  created_at timestamptz not null default timezone('utc', now())
);

create table submissions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  content jsonb,
  file_url text,
  status submission_state not null default 'draft',
  mentor_feedback text,
  reviewed_by uuid references profiles(id) on delete set null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  unique (assignment_id, student_id)
);

-- ---------- progreso ----------
create table lesson_progress (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid not null references lessons(id) on delete cascade,
  watched_seconds integer not null default 0,
  last_position_seconds integer not null default 0,
  progress_percentage numeric(5,2) not null default 0,
  completed_at timestamptz,
  updated_at timestamptz not null default timezone('utc', now()),
  unique (student_id, lesson_id)
);

-- ---------- capa emocional ----------
create table emotional_checkins (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  emotion text,
  intensity integer check (intensity between 0 and 10),
  body_location text,
  note text,
  created_at timestamptz not null default timezone('utc', now())
);

create table journal_entries (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  lesson_id uuid references lessons(id) on delete set null,
  title text,
  content text,
  emotion text,
  intensity integer check (intensity between 0 and 10),
  is_insight boolean not null default false,
  is_private boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create trigger trg_journal_updated before update on journal_entries
  for each row execute function set_updated_at();

-- ---------- mapa de visión ----------
create table dream_maps (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  title text,
  version integer not null default 1,
  status text not null default 'active',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create trigger trg_dream_maps_updated before update on dream_maps
  for each row execute function set_updated_at();

create table dream_map_items (
  id uuid primary key default uuid_generate_v4(),
  dream_map_id uuid not null references dream_maps(id) on delete cascade,
  area text not null,
  vision_text text,
  affirmation text,
  image_url text,
  action_steps jsonb not null default '[]',
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------- sesiones en vivo ----------
create table live_sessions (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid references programs(id) on delete cascade,
  cohort_id uuid references cohorts(id) on delete set null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  meeting_url text,
  recording_url text,
  status text not null default 'scheduled',
  created_by uuid references profiles(id) on delete set null
);

create table session_attendance (
  id uuid primary key default uuid_generate_v4(),
  session_id uuid not null references live_sessions(id) on delete cascade,
  student_id uuid not null references profiles(id) on delete cascade,
  joined_at timestamptz,
  left_at timestamptz,
  unique (session_id, student_id)
);

-- ---------- notas de mentora ----------
create table mentor_notes (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  mentor_id uuid not null references profiles(id) on delete cascade,
  note text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);
create trigger trg_mentor_notes_updated before update on mentor_notes
  for each row execute function set_updated_at();

-- ---------- IA (AURA) ----------
create table ai_sources (
  id uuid primary key default uuid_generate_v4(),
  program_id uuid references programs(id) on delete set null,
  title text not null,
  content text not null,
  source_type ai_source_type not null default 'note',
  status content_status not null default 'published',
  embedding vector(1536),
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz not null default timezone('utc', now())
);
create index ai_sources_embedding_idx on ai_sources
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table ai_conversations (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references profiles(id) on delete cascade,
  title text,
  created_at timestamptz not null default timezone('utc', now())
);

create table ai_messages (
  id uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references ai_conversations(id) on delete cascade,
  role ai_role not null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------- comunidad ----------
create table community_posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid not null references profiles(id) on delete cascade,
  program_id uuid references programs(id) on delete cascade,
  cohort_id uuid references cohorts(id) on delete set null,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

create table community_comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid not null references community_posts(id) on delete cascade,
  author_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------- auditoría (super admin) ----------
create table audit_log (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id) on delete set null,
  action text not null,
  entity text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

-- ---------- índices de apoyo ----------
create index idx_modules_program on modules(program_id);
create index idx_lessons_module on lessons(module_id);
create index idx_lessons_program on lessons(program_id);
create index idx_enrollments_student on enrollments(student_id);
create index idx_enrollments_program on enrollments(program_id);
create index idx_progress_student on lesson_progress(student_id);
create index idx_journal_student on journal_entries(student_id);
create index idx_checkins_student on emotional_checkins(student_id);
create index idx_submissions_student on submissions(student_id);
create index idx_ai_messages_conversation on ai_messages(conversation_id);
