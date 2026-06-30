-- ============================================================
-- 0004_oauth.sql — soporte para acceso social (Google).
-- Mejora handle_new_user para capturar nombre/foto que envía
-- el proveedor OAuth en raw_user_meta_data, con respaldos.
-- Idempotente: reemplaza la función; el trigger existente sigue igual.
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name'
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end; $$;
