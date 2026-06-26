-- ============================================================
-- OCEOM by E-MOTION® — Seed demo (Sprint 1)
-- Crea los dos programas base con fases, módulos y experiencias.
-- Idempotente: limpia los programas demo antes de insertarlos.
-- NOTA: los usuarios (mentora/estudiantes) se crean vía Supabase Auth;
-- luego se ajusta su rol con: update profiles set role='mentor' where email='...';
-- ============================================================

delete from programs where slug in ('metodo-emotion', 'arquitectura-neuropsiquica');

do $$
declare
  v_prog uuid;
  v_phase uuid;
  v_module uuid;
begin
  -- ========================================================
  -- PROGRAMA 1: Método E-MOTION®
  -- ========================================================
  insert into programs (title, slug, subtitle, description, type, status, duration_label, level, benefits)
  values (
    'Método E-MOTION®',
    'metodo-emotion',
    'Sanación Integral Neuroemocional, Corporal y Energética.',
    'Proceso profundo y personalizado de transformación interior: comprende, libera e integra heridas emocionales, memoria corporal y patrones inconscientes.',
    'emotion', 'published', '9 sesiones · 2 por semana', 'Integral',
    '["Identifica tu herida emocional predominante","Libera memorias de infancia y linaje","Reprograma creencias limitantes","Integra la sanación a nivel subconsciente"]'
  ) returning id into v_prog;

  -- Fase 1 — Raíz emocional
  insert into program_phases (program_id, title, description, order_index)
  values (v_prog, 'Fase 1 — Raíz emocional', 'Identificar y liberar la raíz emocional.', 1)
  returning id into v_phase;
  insert into modules (program_id, phase_id, title, order_index, status)
  values (v_prog, v_phase, 'Raíz emocional', 1, 'published') returning id into v_module;
  insert into lessons (program_id, module_id, title, objective, content_type, order_index, status) values
    (v_prog, v_module, 'Mapa de las heridas emocionales', 'Identificar la herida emocional predominante y sus manifestaciones conscientes e inconscientes.', 'video', 1, 'published'),
    (v_prog, v_module, 'La niñez y la memoria emocional', 'Explorar y liberar memorias emocionales originadas en la infancia.', 'video', 2, 'published'),
    (v_prog, v_module, 'Linaje y raíz ancestral', 'Liberar cargas emocionales heredadas del sistema familiar.', 'video', 3, 'published');

  -- Fase 2 — Cuerpo y reprogramación
  insert into program_phases (program_id, title, description, order_index)
  values (v_prog, 'Fase 2 — Cuerpo y reprogramación', 'El cuerpo como lenguaje y la reprogramación consciente.', 2)
  returning id into v_phase;
  insert into modules (program_id, phase_id, title, order_index, status)
  values (v_prog, v_phase, 'Cuerpo y reprogramación', 2, 'published') returning id into v_module;
  insert into lessons (program_id, module_id, title, objective, content_type, order_index, status) values
    (v_prog, v_module, 'Parejas y patrones vinculares', 'Identificar y sanar patrones repetitivos en relaciones afectivas y sexuales.', 'video', 4, 'published'),
    (v_prog, v_module, 'Cuerpo, chakras y biodecodificación', 'Comprender el síntoma físico como lenguaje emocional y energético.', 'video', 5, 'published'),
    (v_prog, v_module, 'Reprogramación emocional consciente', 'Transformar creencias limitantes a nivel emocional y mental.', 'video', 6, 'published');

  -- Fase 3 — Integración y visión
  insert into program_phases (program_id, title, description, order_index)
  values (v_prog, 'Fase 3 — Integración y visión', 'Integrar la sanación y crear el futuro.', 3)
  returning id into v_phase;
  insert into modules (program_id, phase_id, title, order_index, status)
  values (v_prog, v_phase, 'Integración y visión', 3, 'published') returning id into v_module;
  insert into lessons (program_id, module_id, title, objective, content_type, order_index, status) values
    (v_prog, v_module, 'Hipnosis terapéutica integrativa', 'Integrar la sanación a nivel subconsciente y sistema nervioso profundo.', 'hypnosis', 7, 'published'),
    (v_prog, v_module, 'Mapa de sueños neurocientífico', 'Activar la creación consciente del futuro desde la coherencia interna.', 'exercise', 8, 'published'),
    (v_prog, v_module, 'Integración del método', 'Consolidar la experiencia y fortalecer la autonomía del proceso personal.', 'video', 9, 'published');

  -- ========================================================
  -- PROGRAMA 2: Arquitectura Neuropsíquica
  -- ========================================================
  insert into programs (title, slug, subtitle, description, type, status, duration_label, level, benefits)
  values (
    'Arquitectura Neuropsíquica',
    'arquitectura-neuropsiquica',
    'Habilidades psíquicas, conciencia multidimensional y entrenamiento neuroenergético.',
    'Programa avanzado: 70% práctico, 30% teórico. Incluye diploma.',
    'neuropsychic', 'published', '15 clases · 2 por semana', 'Avanzado',
    '["Coherencia cardíaca y liberación emocional","Percepción sutil: telepatía y clarividencia","Sanación a distancia","Rito de maestría e integración"]'
  ) returning id into v_prog;

  -- Etapa 1 — Reconexión y desintoxicación
  insert into program_phases (program_id, title, description, order_index)
  values (v_prog, 'Etapa 1 — Reconexión y desintoxicación', 'Reconectar y depurar el sistema.', 1)
  returning id into v_phase;
  insert into modules (program_id, phase_id, title, order_index, status)
  values (v_prog, v_phase, 'Reconexión y desintoxicación', 1, 'published') returning id into v_module;
  insert into lessons (program_id, module_id, title, content_type, order_index, status) values
    (v_prog, v_module, 'Respiraciones conscientes y coherencia cardíaca', 'meditation', 1, 'published'),
    (v_prog, v_module, 'Liberación emocional: método básico', 'exercise', 2, 'published'),
    (v_prog, v_module, 'Introducción a la neuroplasticidad emocional', 'video', 3, 'published'),
    (v_prog, v_module, 'Activación de cuerpos dimensionales', 'meditation', 4, 'published'),
    (v_prog, v_module, 'Arquitectura Neuropsíquica I: el mapa interior', 'video', 5, 'published');

  -- Etapa 2 — Percepción sutil
  insert into program_phases (program_id, title, description, order_index)
  values (v_prog, 'Etapa 2 — Percepción sutil', 'Desarrollo de la percepción extrasensorial.', 2)
  returning id into v_phase;
  insert into modules (program_id, phase_id, title, order_index, status)
  values (v_prog, v_phase, 'Percepción sutil', 2, 'published') returning id into v_module;
  insert into lessons (program_id, module_id, title, content_type, order_index, status) values
    (v_prog, v_module, 'Telepatía I: recepción básica', 'exercise', 6, 'published'),
    (v_prog, v_module, 'Clarividencia y visualización', 'exercise', 7, 'published'),
    (v_prog, v_module, 'Sanación a distancia I', 'exercise', 8, 'published'),
    (v_prog, v_module, 'Clariaudiencia y escucha sutil', 'exercise', 9, 'published'),
    (v_prog, v_module, 'Psicometría y lectura energética', 'exercise', 10, 'published');

  -- Etapa 3 — Maestría e integración
  insert into program_phases (program_id, title, description, order_index)
  values (v_prog, 'Etapa 3 — Maestría e integración', 'Consolidación y maestría.', 3)
  returning id into v_phase;
  insert into modules (program_id, phase_id, title, order_index, status)
  values (v_prog, v_phase, 'Maestría e integración', 3, 'published') returning id into v_module;
  insert into lessons (program_id, module_id, title, content_type, order_index, status) values
    (v_prog, v_module, 'Sanación a distancia II avanzada', 'exercise', 11, 'published'),
    (v_prog, v_module, 'Mantrams y llaves tonales', 'meditation', 12, 'published'),
    (v_prog, v_module, 'Telepatía II: emisión y canalización', 'exercise', 13, 'published'),
    (v_prog, v_module, 'Arquitectura Neuropsíquica II: rediseño interno', 'video', 14, 'published'),
    (v_prog, v_module, 'Integración y rito de maestría', 'live_recording', 15, 'published');
end $$;
