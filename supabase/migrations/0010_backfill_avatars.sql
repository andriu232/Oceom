-- ============================================================
-- 0010_backfill_avatars.sql — rellena la foto de perfil de quienes se
-- registraron con Google ANTES del trigger de avatar (0004): su foto vive en
-- auth.users.raw_user_meta_data pero profiles.avatar_url quedó en null.
-- Idempotente y no destructiva (solo toca filas con avatar_url null).
-- (Ya se aplicó en producción vía script; se deja para reproducir el estado
-- en una base nueva y como fuente de verdad del repo.)
-- ============================================================

update public.profiles p
set avatar_url = coalesce(
  u.raw_user_meta_data ->> 'avatar_url',
  u.raw_user_meta_data ->> 'picture'
)
from auth.users u
where u.id = p.id
  and p.avatar_url is null
  and coalesce(
    u.raw_user_meta_data ->> 'avatar_url',
    u.raw_user_meta_data ->> 'picture'
  ) is not null;
