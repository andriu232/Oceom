-- ============================================================
-- OCEOM — OMI en Bitácora y Sueños (Sprint S2)
-- Guarda la interpretación/feedback de OMI dentro de la propia entrada,
-- para que persista y alimente las métricas del panel (Sprint S3).
-- El dueño ya puede actualizar sus entradas ("dueño gestiona" = for all),
-- así que no hacen falta policies nuevas.
-- ============================================================

alter table dream_entries  add column if not exists omi_interpretation text;
alter table dream_entries  add column if not exists omi_at timestamptz;

alter table journal_entries add column if not exists omi_feedback text;
alter table journal_entries add column if not exists omi_at timestamptz;
