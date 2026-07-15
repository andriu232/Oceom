-- ============================================================
-- 0014_referidos_15pct.sql — la comisión de nivel 1 baja de 20% a 15%
-- (decisión de negocio, jul 2026). Idempotente.
-- ============================================================

alter table referral_settings alter column level_1_pct set default 15.00;
update referral_settings set level_1_pct = 15.00 where id = 1 and level_1_pct = 20.00;
