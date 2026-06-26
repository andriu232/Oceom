-- ============================================================
-- OCEOM by E-MOTION® — Seed demo (pensum OFICIAL de los PDFs)
-- Estructura tal cual los documentos de Valeria Rueda Caicedo.
-- Idempotente: limpia los programas demo antes de insertarlos.
-- OJO: borrar programas cascada a lessons/modules/phases/enrollments/
-- lesson_progress. Tras correr esto, re-ejecutar el seed de estudiantes.
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
  -- Sanación Integral Neuroemocional, Corporal y Energética.
  -- 9 clases · 3 fases · 1 a 1 · 2 sesiones/semana · 2h c/u.
  -- ========================================================
  insert into programs (title, slug, subtitle, description, type, status, duration_label, level, price_cop, benefits)
  values (
    'Método E-MOTION®',
    'metodo-emotion',
    'Sanación Integral Neuroemocional, Corporal y Energética.',
    'Guiar un proceso profundo y personalizado de sanación integral que transforme heridas emocionales en conciencia, memoria corporal en liberación y supervivencia en una vida más coherente, plena y consciente. Desactiva patrones emocionales inconscientes almacenados en el cuerpo y el sistema nervioso para crear nuevas rutas neuronales y equilibrio energético.',
    'emotion', 'published', '9 sesiones · 2 por semana · 2h c/u', 'Integral · 1 a 1',
    2200000,
    '["Identifica y sana tu herida emocional predominante","Libera memorias de infancia y cargas del linaje","Comprende el síntoma físico como lenguaje emocional","Reprograma creencias e integra la sanación a nivel subconsciente","Incluye tareas entre sesiones y sesión de refuerzo"]'
  ) returning id into v_prog;

  -- Fase 1 — Raíz emocional
  insert into program_phases (program_id, title, description, order_index)
  values (v_prog, 'Fase 1 — Raíz emocional', 'Abrir y liberar la raíz emocional.', 1)
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
  -- 15 clases · 3 etapas · 2 sesiones/semana · 2h · 70% práctico · diploma.
  -- Cada clase: título + 3 sub-temas (en body_content).
  -- ========================================================
  insert into programs (title, slug, subtitle, description, type, status, duration_label, level, price_cop, benefits)
  values (
    'Arquitectura Neuropsíquica',
    'arquitectura-neuropsiquica',
    'Habilidades psíquicas, conciencia multidimensional y entrenamiento neuroenergético.',
    'Programa avanzado de entrenamiento neuroenergético: 70% práctico, 30% teórico. 2 sesiones por semana, cada clase de 2 horas. Incluye diploma de maestría.',
    'neuropsychic', 'published', '15 clases · 2 por semana · 2h · 70% práctico', 'Avanzado',
    2750000,
    '["Reconexión y desintoxicación del sistema nervioso","Percepción sutil: telepatía, clarividencia, clariaudiencia","Sanación a distancia y psicometría","Maestría: canalización, mantrams y rito de integración","Incluye diploma"]'
  ) returning id into v_prog;

  -- Etapa 1 — Reconexión y desintoxicación
  insert into program_phases (program_id, title, description, order_index)
  values (v_prog, 'Etapa 1 — Reconexión y desintoxicación', 'Reconectar y depurar el sistema; fundamentos.', 1)
  returning id into v_phase;
  insert into modules (program_id, phase_id, title, order_index, status)
  values (v_prog, v_phase, 'Reconexión y desintoxicación', 1, 'published') returning id into v_module;
  insert into lessons (program_id, module_id, title, body_content, content_type, order_index, status) values
    (v_prog, v_module, 'Reconexión y desintoxicación',
      E'• Respiraciones conscientes y coherencia cardíaca\n• Liberación emocional: método básico\n• Introducción a la neuroplasticidad emocional', 'meditation', 1, 'published'),
    (v_prog, v_module, 'Activación de cuerpos dimensionales',
      E'• Visualización guiada para cuerpo energético\n• Alineación de los campos sutiles\n• Fundamentos de la conciencia multidimensional', 'meditation', 2, 'published'),
    (v_prog, v_module, 'Arquitectura Neuropsíquica I: el mapa interior',
      E'• Cerebro triuno y funciones psíquicas\n• Cómo se forman las creencias y hábitos mentales\n• Diseño de un "espacio sagrado" interno', 'video', 3, 'published'),
    (v_prog, v_module, 'Neurociencia de la atención y concentración',
      E'• Ejercicios con objetos y sonidos (mindfulness + enfoque)\n• Juegos de foco sostenido\n• Introducción a los "anclajes neurosensoriales"', 'exercise', 4, 'published'),
    (v_prog, v_module, 'Activación de la glándula pineal',
      E'• Fisiología y mitos: ciencia + tradición\n• Ejercicios con luz, sonido y respiración\n• Estimulación con visualización guiada', 'meditation', 5, 'published');

  -- Etapa 2 — Percepción sutil
  insert into program_phases (program_id, title, description, order_index)
  values (v_prog, 'Etapa 2 — Percepción sutil', 'Desarrollo de la percepción extrasensorial.', 2)
  returning id into v_phase;
  insert into modules (program_id, phase_id, title, order_index, status)
  values (v_prog, v_phase, 'Percepción sutil', 2, 'published') returning id into v_module;
  insert into lessons (program_id, module_id, title, body_content, content_type, order_index, status) values
    (v_prog, v_module, 'Telepatía I: recepción básica',
      E'• Lectura de pensamientos simples\n• Ejercicios en parejas o a distancia\n• Relación con la empatía neuronal (neuronas espejo)', 'exercise', 6, 'published'),
    (v_prog, v_module, 'Clarividencia y visualización',
      E'• Activación del tercer ojo\n• Lectura simbólica (formas, colores, imágenes)\n• Práctica con cartas y escenas', 'exercise', 7, 'published'),
    (v_prog, v_module, 'Clariaudiencia y escucha sutil',
      E'• Entrenamiento del oído interno\n• Prácticas con sonidos binaurales y mantrams\n• Diferencias entre intuición mental y psíquica', 'meditation', 8, 'published'),
    (v_prog, v_module, 'Psicometría y lectura energética',
      E'• Lectura de objetos, fotos y espacios\n• Transferencia de información sutil\n• Resonancia vibracional e intuición asociativa', 'exercise', 9, 'published'),
    (v_prog, v_module, 'Sanación a distancia I',
      E'• Campos cuánticos y coherencia energética\n• Protocolo básico de intención + canalización\n• Auto-sanación y limpieza del canal', 'exercise', 10, 'published');

  -- Etapa 3 — Maestría e integración
  insert into program_phases (program_id, title, description, order_index)
  values (v_prog, 'Etapa 3 — Maestría e integración', 'Consolidación, canalización y rito de maestría.', 3)
  returning id into v_phase;
  insert into modules (program_id, phase_id, title, order_index, status)
  values (v_prog, v_phase, 'Maestría e integración', 3, 'published') returning id into v_module;
  insert into lessons (program_id, module_id, title, body_content, content_type, order_index, status) values
    (v_prog, v_module, 'Sanación a distancia II (avanzada)',
      E'• Lectura intuitiva del campo energético del otro\n• Técnicas de intervención: color, sonido, símbolo\n• Protección y cierre energético', 'exercise', 11, 'published'),
    (v_prog, v_module, 'Mantrams y llaves tonales',
      E'• Vibración sonora y sus efectos neurosensoriales\n• Tono personal y llaves de activación\n• Mantras específicos para cada facultad psíquica', 'meditation', 12, 'published'),
    (v_prog, v_module, 'Telepatía II: emisión y canalización',
      E'• Canalización consciente vs inconsciente\n• Ejercicios de mensaje directo, simbólico y emocional\n• Uso terapéutico de la telepatía', 'exercise', 13, 'published'),
    (v_prog, v_module, 'Arquitectura Neuropsíquica II: rediseño interno',
      E'• Reprogramación de creencias limitantes\n• Construcción de un "yo psíquico expandido"\n• Mapa mental de dones y rutas de entrenamiento continuo', 'video', 14, 'published'),
    (v_prog, v_module, 'Integración y rito de maestría',
      E'• Práctica final grupal de habilidades combinadas\n• Testimonio de dones activados\n• Ceremonia simbólica de cierre e integración', 'live_recording', 15, 'published');
end $$;
