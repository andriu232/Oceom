-- ============================================================
-- 0005_calendar_sync.sql — sincronización con Google Calendar.
-- Guarda el id del evento creado en el calendario de la mentora para
-- poder borrarlo si el estudiante cancela la reserva.
-- Idempotente.
-- ============================================================

alter table class_slots
  add column if not exists google_event_id text;
