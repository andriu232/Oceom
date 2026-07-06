/* Carga el currículo OFICIAL del Método E-MOTION® (Metodología de Sanación
 * Integral · Manual del Estudiante) con las 3 fases y 12 estaciones que pasó
 * Valeria. Idempotente y NO destructivo para inscripciones: conserva el
 * programa y sus enrollments; solo reemplaza fases/módulos/lecciones/tareas.
 *
 *   node --env-file=.env.local scripts/seed-emotion-curriculum.mjs
 */
import { createClient } from "@supabase/supabase-js";

const a = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const SLUG = "metodo-emotion";

// Helpers para componer el body con secciones (whitespace-pre-line en la UI).
const bullets = (items) => items.map((i) => `• ${i}`).join("\n");
function body(sections) {
  return sections
    .filter((s) => s && s.text)
    .map((s) => `${s.title}\n${s.text}`)
    .join("\n\n");
}

// ---------- FASE I — DESPERTAR Y RECONOCIMIENTO ----------
const FASE_1 = {
  phase: {
    title: "Fase I — Despertar y Reconocimiento",
    description:
      "Autoconocimiento profundo: identidad, niñez, padres, linaje y liberación de vínculos.",
  },
  module: "Despertar y Reconocimiento",
  stations: [
    {
      title: "Estación 1 · Diagnóstico del Ser",
      subtitle: "Identidad",
      content_type: "text",
      objective:
        "Iniciar un proceso profundo de autoconocimiento para comprender la estructura emocional, energética y psicológica desde la cual ha sido construida la identidad personal. Esta sesión representa el punto de partida del viaje interior.",
      body: body([
        {
          title: "¿QUÉ APRENDERÁS?",
          text: bullets([
            "Cómo está configurada tu energía según tu Diseño Humano.",
            "Cuáles son tus heridas emocionales predominantes.",
            "Cómo estas heridas han influido en tu personalidad.",
            "Cómo comenzó la construcción de tu identidad.",
          ]),
        },
        {
          title: "FUNDAMENTO",
          text: "Toda transformación comienza con la conciencia. No podemos sanar aquello que no conocemos. Las experiencias de la infancia crean programas inconscientes que más tarde dirigen nuestra manera de amar, trabajar, relacionarnos y tomar decisiones. En esta primera estación comenzaremos a observar la historia sin juicio para comprender que nuestra identidad actual fue una construcción y no una condena.",
        },
        {
          title: "DESARROLLO DE LA SESIÓN",
          text: bullets([
            "Presentación del estudiante.",
            "Diagnóstico emocional.",
            "Lectura de Diseño Humano.",
            "Identificación de heridas emocionales.",
            "Conversación profunda sobre la historia de vida.",
            "Reflexiones guiadas.",
            "Integración.",
          ]),
        },
        {
          title: "REFLEXIÓN",
          text: '"No soy mi pasado. Soy quien decide observarlo para transformarlo."',
        },
      ]),
      assignment: {
        title: "Tareas de integración",
        instructions: [
          "Carta al Niño Interior",
          "Escribir completamente a mano una carta dirigida al niño o niña interior. La carta debe contener: Perdón. Comprensión. Amor. Validación. Acompañamiento.",
          "",
          "Cuestionario",
          "Responder diez preguntas sobre el estado emocional del niño interior. Algunas preguntas:",
          "• ¿Qué necesitaba ese niño?",
          "• ¿Qué le hacía sentir miedo?",
          "• ¿Qué aprendió acerca del amor?",
          "• ¿Cuándo dejó de sentirse suficiente?",
          "• ¿Qué sigue esperando hoy?",
        ].join("\n"),
      },
    },
    {
      title: "Estación 2 · Sanación de la Niñez",
      subtitle: null,
      content_type: "text",
      objective:
        "Reconocer los acontecimientos que marcaron emocionalmente la infancia para iniciar un proceso de reconciliación con el niño interior.",
      body: body([
        {
          title: "¿QUÉ APRENDERÁS?",
          text: bullets([
            "Cómo los acontecimientos infantiles programaron el subconsciente.",
            "Cómo identificar eventos traumáticos.",
            "Cómo resignificar recuerdos.",
            "Cómo volver a abrazar al niño interior.",
          ]),
        },
        {
          title: "FUNDAMENTO",
          text: "La memoria emocional permanece activa incluso cuando el recuerdo consciente desaparece. Muchas decisiones adultas nacen desde heridas infantiles no resueltas.",
        },
        {
          title: "DESARROLLO",
          text: bullets([
            "Revisión de la carta.",
            "Construcción de la línea del tiempo.",
            "Identificación de eventos traumáticos.",
            "Relación entre eventos y heridas.",
            "Meditación profunda.",
            "Constelación del niño interior.",
            "Reconciliación.",
            "Perdón.",
          ]),
        },
        {
          title: "REFLEXIÓN",
          text: '"Mi niño nunca necesitó ser perfecto. Solo necesitaba sentirse amado."',
        },
      ]),
      assignment: {
        title: "Tareas de integración",
        instructions:
          "Escribir una carta completamente honesta para:\n• Madre\n• Padre\n\nSin filtros. Sin censura. Sin buscar quedar bien.",
      },
    },
    {
      title: "Estación 3 · Sanación de los Padres",
      subtitle: null,
      content_type: "text",
      objective:
        "Reconocer el impacto que tuvieron las figuras materna y paterna sobre la construcción de creencias inconscientes.",
      body: body([
        {
          title: "¿QUÉ APRENDERÁS?",
          text: bullets([
            "La energía femenina.",
            "La energía masculina.",
            "Cómo heredamos creencias.",
            "Cómo diferenciar nuestras creencias de las heredadas.",
          ]),
        },
        {
          title: "FUNDAMENTO",
          text: "Nuestros padres fueron nuestros primeros programadores. No heredamos únicamente genes. También heredamos maneras de pensar, modelos emocionales, creencias, miedos y lealtades invisibles.",
        },
        {
          title: "DESARROLLO",
          text:
            "Se construye un cuadro comparativo donde el estudiante identifica las creencias heredadas del padre y de la madre en las áreas de:\n" +
            bullets([
              "Amor",
              "Dinero",
              "Salud",
              "Estudio",
              "Inteligencia",
              "Merecimiento",
              "Relaciones",
              "Espiritualidad",
            ]) +
            "\n\nPosteriormente se realiza una constelación de ambos padres. Finalmente se reformula cada creencia limitante.",
        },
        {
          title: "REFLEXIÓN",
          text: '"Puedo honrar a mis padres sin repetir su historia."',
        },
      ]),
      assignment: {
        title: "Tareas de integración",
        instructions: [
          "Reescribir las cartas hacia ambos padres. Quemarlas. Sembrar las cenizas.",
          "",
          "Investigar el árbol genealógico. Buscar:",
          "• Enfermedades repetidas.",
          "• Divorcios.",
          "• Violencias.",
          "• Quiebras económicas.",
          "• Abandonos.",
          "• Muertes tempranas.",
          "• Patrones repetitivos.",
        ].join("\n"),
      },
    },
    {
      title: "Estación 4 · Árbol Transgeneracional y Biodescodificación Emocional",
      subtitle: null,
      content_type: "text",
      objective:
        "Comprender las lealtades invisibles que viajan entre generaciones y comenzar un proceso consciente de liberación del sistema familiar.",
      body: body([
        {
          title: "¿QUÉ APRENDERÁS?",
          text: bullets([
            "Qué es un patrón transgeneracional.",
            "Qué es una lealtad inconsciente.",
            "Cómo identificar repeticiones familiares.",
            "Cómo iniciar una liberación simbólica del clan.",
          ]),
        },
        {
          title: "DESARROLLO",
          text: bullets([
            "Revisión del árbol genealógico.",
            "Identificación de patrones.",
            "Respuesta a 10 preguntas de análisis.",
            "Carta extensa de liberación.",
            "Lectura en voz alta siete veces.",
            "Ritual simbólico de quema.",
            "Siembra de las cenizas y lentejas como símbolo de una nueva historia.",
          ]),
        },
        {
          title: "REFLEXIÓN",
          text: '"Honro a mi familia sin cargar aquello que no me corresponde."',
        },
      ]),
      assignment: {
        title: "Tareas de integración",
        instructions:
          "Elaborar una lista cronológica de todas las parejas formales y vínculos sexuales significativos para trabajar en la siguiente sesión.",
      },
    },
    {
      title: "Estación 5 · Liberación de Parejas y Vínculos",
      subtitle: null,
      content_type: "text",
      objective:
        "Cerrar ciclos afectivos y liberar cargas emocionales, energéticas y simbólicas asociadas a relaciones pasadas.",
      body: body([
        {
          title: "¿QUÉ APRENDERÁS?",
          text: bullets([
            "Cómo los vínculos dejan huellas emocionales.",
            "La importancia del cierre consciente.",
            "El valor del agradecimiento y la despedida.",
          ]),
        },
        {
          title: "DESARROLLO",
          text: bullets([
            "Narración de cada relación.",
            "Identificación de aprendizajes y desafíos.",
            "Constelación individual de cada vínculo.",
            "Oración de liberación psíquica, emocional, física y sexual.",
            "Ritual de quema y siembra.",
          ]),
        },
        {
          title: "REFLEXIÓN",
          text: '"Libero el pasado para abrir espacio al amor presente."',
        },
      ]),
      assignment: {
        title: "Tareas de integración",
        instructions:
          "Escribir una carta de agradecimiento dirigida a uno mismo, reconociendo el camino recorrido y la fortaleza desarrollada.",
      },
    },
  ],
};

// ---------- FASE II — REPROGRAMACIÓN DEL SUBCONSCIENTE ----------
const FASE_2 = {
  phase: {
    title: "Fase II — Reprogramación del Subconsciente",
    description:
      "Instalar nuevas creencias: tapping, aformaciones, protocolo híbrido e hipnosis reprogramativa.",
  },
  module: "Reprogramación del Subconsciente",
  stations: [
    {
      title: "Estación 6 · Reprogramación del Subconsciente I: Tapping",
      subtitle: null,
      content_type: "exercise",
      objective:
        "Instalar nuevas creencias en las áreas de amor, salud y dinero mediante técnicas de regulación del sistema nervioso y repetición consciente.",
      body: body([
        {
          title: "CONTENIDO DE APOYO",
          text: "Introducción al funcionamiento del subconsciente, la neuroplasticidad y el papel del tapping en la reducción de respuestas emocionales automáticas.",
        },
        {
          title: "DESARROLLO",
          text: bullets([
            "Retroalimentación del proceso de sanación.",
            "Identificación de cambios.",
            "Creación de tres comandos personalizados.",
            "Práctica guiada de tapping.",
          ]),
        },
      ]),
      assignment: {
        title: "Tareas de integración",
        instructions:
          "• Realizar un comando de tapping diario durante 7 días.\n• Escribir una carta de la versión evolucionada hacia la versión antigua de sí mismo.",
      },
    },
    {
      title: "Estación 7 · Reprogramación Mental y Emocional con Aformaciones",
      subtitle: null,
      content_type: "exercise",
      objective:
        "Fortalecer nuevas redes neuronales mediante preguntas expansivas (aformaciones) enfocadas en las principales áreas de la vida.",
      body: body([
        {
          title: "CONTENIDO DE APOYO",
          text: "Diferencia entre afirmaciones y aformaciones, y cómo las preguntas movilizan la búsqueda de respuestas en el cerebro.",
        },
        {
          title: "DESARROLLO",
          text: bullets([
            "Creación de aformaciones para las áreas mental, emocional, relacional, merecimiento, dinero y creatividad.",
            "Integración con tapping.",
          ]),
        },
      ]),
      assignment: {
        title: "Tareas de integración",
        instructions: "Practicar diariamente la secuencia completa durante 7 días.",
      },
    },
    {
      title: "Estación 8 · Reprogramación Híbrida Mental y Emocional",
      subtitle: null,
      content_type: "exercise",
      objective:
        "Integrar las herramientas aprendidas en un protocolo único y personalizado.",
      body: body([
        {
          title: "CONTENIDO DE APOYO",
          text: "La repetición consciente como mecanismo de consolidación de hábitos y creencias.",
        },
        {
          title: "DESARROLLO",
          text: bullets([
            "Selección de puntos de tapping.",
            "Diálogo interno guiado.",
            "Integración de creencias renovadas.",
          ]),
        },
      ]),
      assignment: {
        title: "Tareas de integración",
        instructions:
          "• Practicar la secuencia integral durante 7 días.\n• Escribir una carta desde la versión antigua hacia la versión actual, expresando el proceso de transformación.",
      },
    },
    {
      title: "Estación 9 · Hipnosis Reprogramativa",
      subtitle: null,
      content_type: "hypnosis",
      objective:
        "Consolidar la nueva programación mental accediendo a estados profundos de relajación y alta receptividad.",
      body: body([
        {
          title: "CONTENIDO DE APOYO",
          text: "Explicación de qué es la hipnosis clínica, cómo funciona el estado hipnagógico y por qué favorece el aprendizaje y la modificación de patrones.",
        },
        {
          title: "DESARROLLO",
          text: bullets([
            "Hipnosis personalizada.",
            "Uso de comandos numéricos.",
            "Frases gatillo.",
            "Instalación de nuevas respuestas mentales y emocionales.",
          ]),
        },
      ]),
      assignment: {
        title: "Tareas de integración",
        instructions:
          "Escuchar la autohipnosis personalizada todas las noches durante 7 días.",
      },
    },
  ],
};

// ---------- FASE III — CREACIÓN DE LA NUEVA IDENTIDAD ----------
const FASE_3 = {
  phase: {
    title: "Fase III — Creación de la Nueva Identidad",
    description:
      "Traducir la nueva identidad en visión, integrar el proceso y reforzar los cambios.",
  },
  module: "Creación de la Nueva Identidad",
  stations: [
    {
      title: "Estación 10 · Mapa de Sueños Neurocientífico",
      subtitle: null,
      content_type: "exercise",
      objective:
        "Traducir la nueva identidad en una representación visual que favorezca el enfoque, la motivación y la coherencia con los objetivos personales.",
      body: body([
        {
          title: "CONTENIDO DE APOYO",
          text: "Principios de visualización, activación emocional y atención dirigida en la construcción de metas.",
        },
        {
          title: "DESARROLLO",
          text: bullets([
            "Definición de objetivos en las áreas mental, emocional, espiritual, creativa y financiera.",
            "Creación de imágenes con inteligencia artificial.",
            "Diseño del mapa en espiral.",
            "Asociación de colores, símbolos y decretos.",
          ]),
        },
      ]),
      assignment: {
        title: "Tareas de integración",
        instructions:
          "Observar el mapa diariamente, visualizar los objetivos y conectar con las emociones asociadas a su cumplimiento.",
      },
    },
    {
      title: "Estación 11 · Maestría y Retroalimentación",
      subtitle: null,
      content_type: "text",
      objective:
        "Integrar el aprendizaje de todo el proceso y reconocer la evolución alcanzada.",
      body: body([
        {
          title: "CONTENIDO DE APOYO",
          text: "La importancia de la reflexión consciente para consolidar cambios duraderos.",
        },
        {
          title: "DESARROLLO",
          text: bullets([
            "Revisión de las doce estaciones.",
            "Evaluación comparativa entre el estado inicial y el actual.",
            "Identificación de fortalezas y aspectos por seguir desarrollando.",
            "Espacio para preguntas y cierre del proceso formativo.",
          ]),
        },
      ]),
      assignment: {
        title: "Tareas de integración",
        instructions:
          "Completar la evaluación final y elaborar un compromiso escrito con la continuidad del crecimiento personal.",
      },
    },
    {
      title: "Estación 12 · Sesión de Refuerzo (21 días después)",
      subtitle: null,
      content_type: "text",
      objective:
        "Verificar la integración de los cambios, resolver dificultades surgidas tras la práctica y reforzar las herramientas aprendidas.",
      body: body([
        {
          title: "CONTENIDO DE APOYO",
          text: "Explicación sobre la consolidación de hábitos y la importancia del seguimiento en los procesos de cambio.",
        },
        {
          title: "DESARROLLO",
          text: bullets([
            "Revisión de avances.",
            "Resolución de dudas.",
            "Ajuste de ejercicios personalizados.",
            "Refuerzo de las técnicas que requieran mayor práctica.",
            "Celebración de los logros alcanzados.",
          ]),
        },
        {
          title: "RESULTADO ESPERADO",
          text: "El estudiante concluye el programa con un plan de continuidad y con herramientas prácticas para sostener los cambios en el tiempo.",
        },
      ]),
      assignment: null,
    },
  ],
};

const FASES = [FASE_1, FASE_2, FASE_3];

async function main() {
  const { data: prog, error: progErr } = await a
    .from("programs")
    .select("id,title,slug")
    .eq("slug", SLUG)
    .maybeSingle();
  if (progErr || !prog) throw new Error("No se encontró el programa " + SLUG);
  console.log("Programa:", prog.title, prog.id);

  // 1) Actualiza metadatos del programa (conserva título/precio/marca).
  await a
    .from("programs")
    .update({
      subtitle: "Metodología de Sanación Integral · Manual del Estudiante",
      description:
        "Proceso profundo y personalizado 1 a 1 estructurado en 3 fases y 12 estaciones: despertar y reconocimiento, reprogramación del subconsciente y creación de la nueva identidad. Cada estación integra teoría, práctica guiada y tareas entre sesiones, e incluye una sesión de refuerzo a los 21 días.",
      duration_label: "12 estaciones · 3 fases · 1 a 1",
      benefits: [
        "Fase I — Despertar y reconocimiento: diagnóstico del ser, niñez, padres, árbol transgeneracional y liberación de vínculos.",
        "Fase II — Reprogramación del subconsciente: tapping, aformaciones, protocolo híbrido e hipnosis reprogramativa.",
        "Fase III — Creación de la nueva identidad: mapa de sueños neurocientífico, maestría y sesión de refuerzo.",
        "12 estaciones guiadas 1 a 1 con tareas de integración entre sesiones.",
        "Incluye sesión de refuerzo a los 21 días.",
      ],
    })
    .eq("id", prog.id);

  // 2) Limpia el currículo anterior (conserva el programa y sus enrollments).
  //    Borrar lecciones cascada a assignments/submissions/lesson_progress/resources.
  await a.from("lessons").delete().eq("program_id", prog.id);
  await a.from("modules").delete().eq("program_id", prog.id);
  await a.from("program_phases").delete().eq("program_id", prog.id);

  // 3) Inserta fases → módulos → lecciones → tareas.
  let lessonOrder = 0;
  const assignmentsToInsert = [];
  for (let f = 0; f < FASES.length; f++) {
    const fase = FASES[f];
    const { data: phase } = await a
      .from("program_phases")
      .insert({
        program_id: prog.id,
        title: fase.phase.title,
        description: fase.phase.description,
        order_index: f + 1,
      })
      .select("id")
      .single();

    const { data: mod } = await a
      .from("modules")
      .insert({
        program_id: prog.id,
        phase_id: phase.id,
        title: fase.module,
        order_index: f + 1,
        status: "published",
      })
      .select("id")
      .single();

    for (const st of fase.stations) {
      lessonOrder++;
      const { data: lesson } = await a
        .from("lessons")
        .insert({
          program_id: prog.id,
          module_id: mod.id,
          title: st.title,
          subtitle: st.subtitle,
          objective: st.objective,
          body_content: st.body,
          content_type: st.content_type,
          order_index: lessonOrder,
          status: "published",
        })
        .select("id")
        .single();

      if (st.assignment) {
        assignmentsToInsert.push({
          lesson_id: lesson.id,
          title: st.assignment.title,
          instructions: st.assignment.instructions,
          assignment_type: "text",
          status: "published",
        });
      }
      console.log(`  ✓ ${st.title}`);
    }
  }

  if (assignmentsToInsert.length) {
    const { error: aErr } = await a.from("assignments").insert(assignmentsToInsert);
    if (aErr) throw new Error("assignments: " + aErr.message);
  }

  console.log(
    `\n✅ Currículo cargado: ${FASES.length} fases, ${lessonOrder} estaciones, ${assignmentsToInsert.length} tareas.`,
  );
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
