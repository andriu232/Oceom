import "server-only";
import {
  resolveProvider,
  modelParams,
  createModelClient,
  modelErrorMessage,
} from "./provider";

/* ============================================================
   OMI — informes (no streaming). Reusa el mismo provider que el chat
   (Kimi K2.6 / Claude). Se usa para analizar las respuestas de la
   comunidad a la pregunta semanal, e (más adelante) sueños y bitácora.
   ============================================================ */

export interface OmiReport {
  ok: boolean;
  report?: string;
  message?: string;
}

/** Ejecuta una consulta puntual a OMI y devuelve el texto.
 *
 *  Antes había una opción para desactivar el razonamiento de Kimi solo en
 *  sueños y bitácora, dejándolo activo en el informe semanal "porque conviene
 *  detectar patrones". Medido, era al revés: razonando, el informe tardaba
 *  86 s —más que el tiempo máximo de ejecución— y llegaba cortado a la mitad,
 *  justo por donde va SEÑALES DE ALERTA. Sin razonar sale en 15 s, completo y
 *  más largo. Ahora no razona nunca; el ajuste vive en `modelParams`. */
async function runOmi(
  system: string,
  userMessage: string,
  opts: { maxTokens?: number } = {},
): Promise<OmiReport> {
  const provider = resolveProvider();
  if (!provider)
    return {
      ok: false,
      message: "OMI aún no está configurada (falta la API key del modelo).",
    };

  const client = createModelClient(provider);

  // Sin razonamiento, el informe más largo que se midió gastó 679 tokens.
  const maxTokens = opts.maxTokens ?? 2000;
  try {
    const msg = await client.messages.create({
      ...modelParams(provider),
      max_tokens: maxTokens,
      temperature: 0.4,
      system,
      messages: [{ role: "user", content: userMessage }],
    });
    const report = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("")
      .trim();
    if (!report) return { ok: false, message: "OMI no devolvió respuesta." };
    return { ok: true, report };
  } catch (e) {
    console.error("[omi analyze]", e);
    return { ok: false, message: modelErrorMessage(e, "OMI") };
  }
}

const WEEKLY_SYSTEM = `Eres OMI, la inteligencia de acompañamiento de OCEOM (método E-MOTION® de Valeria Rueda, sanación neuroemocional). Analizas con calidez y lenguaje humano (no clínico) las respuestas de la comunidad a la pregunta semanal de la mentora. Este informe es PARA LA MENTORA (Valeria): la ayuda a leer el estado emocional colectivo del grupo esta semana.

Entrega un informe claro y accionable con estas secciones (usa TÍTULOS EN MAYÚSCULAS, sin markdown ni asteriscos):

SÍNTESIS — 2 o 3 líneas con el sentir general del grupo.
EMOCIONES Y TEMAS PREDOMINANTES — nómbralos con una estimación de frecuencia (ej.: "amor — ~60% de las respuestas").
VOCES PARTICULARES — 1 a 3 respuestas que se salen del patrón o ameritan atención.
SEÑALES DE ALERTA — cualquier respuesta que sugiera sufrimiento intenso que Valeria debería atender personalmente. Si no hay, dilo explícitamente.
SUGERENCIA DE ACOMPAÑAMIENTO — 1 o 2 ideas concretas para la mentora esta semana.

No inventes datos: básate SOLO en las respuestas dadas. Español neutro y cálido.`;

/** Informe de OMI sobre las respuestas a una pregunta semanal. */
export async function analyzeWeeklyAnswers(
  question: string,
  answers: string[],
): Promise<OmiReport> {
  if (answers.length === 0)
    return { ok: false, message: "Todavía no hay respuestas para analizar." };

  const block = answers
    .map((a, i) => `${i + 1}. ${a.replace(/\s+/g, " ").trim()}`)
    .join("\n");
  const userMessage = `Pregunta semanal:\n"${question}"\n\nRespuestas de la comunidad (${answers.length}):\n${block}`;

  return runOmi(WEEKLY_SYSTEM, userMessage);
}

// ── Interpretación de sueños ─────────────────────────────────────────────────

const DREAM_SYSTEM = `Eres OMI, la inteligencia de acompañamiento de OCEOM (método E-MOTION® de Valeria Rueda, sanación neuroemocional). Interpretas el sueño de un estudiante con calidez, respeto y una mirada simbólica y emocional — NUNCA como adivinación, diagnóstico ni verdad absoluta; siempre como posibilidades para que la persona reflexione.

Responde en segunda persona (tú), cálido y cercano, con estas secciones (TÍTULOS EN MAYÚSCULAS, sin markdown ni asteriscos):

LO QUE ME COMPARTES — 1 o 2 líneas que reflejan lo esencial del sueño (que la persona se sienta escuchada).
SÍMBOLOS Y POSIBLES SIGNIFICADOS — los elementos clave del sueño y qué PODRÍAN estar señalando a nivel emocional (usa "quizá", "tal vez", "podría").
EMOCIÓN Y CUERPO — qué emoción parece atravesar el sueño y dónde podría estar viviendo en el cuerpo.
UNA PREGUNTA PARA TI — una sola pregunta reflexiva y abierta para que la persona siga explorando.
UN GESTO SUAVE — una micro-práctica o invitación amable para hoy.

No patologices ni alarmes. Si el sueño trae contenido muy angustiante, valida con ternura e invita a compartirlo con Valeria en un Círculo o sesión. Español neutro y cálido.`;

/** Interpreta un sueño (para el estudiante). */
export async function interpretDream(input: {
  content: string;
  emotion?: string | null;
  intensity?: number | null;
  dreamType?: string | null;
  symbols?: string | null;
}): Promise<OmiReport> {
  const meta = [
    input.dreamType ? `Tipo: ${input.dreamType}` : "",
    input.emotion ? `Emoción al despertar: ${input.emotion}` : "",
    typeof input.intensity === "number" ? `Intensidad: ${input.intensity}/10` : "",
    input.symbols ? `Símbolos que notó: ${input.symbols}` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const userMessage = `${meta ? meta + "\n\n" : ""}Sueño:\n${input.content.trim()}`;
  return runOmi(DREAM_SYSTEM, userMessage);
}

// ── Feedback de bitácora ─────────────────────────────────────────────────────

const JOURNAL_SYSTEM = `Eres OMI, la inteligencia de acompañamiento de OCEOM (método E-MOTION® de Valeria Rueda, sanación neuroemocional). Un estudiante acaba de escribir en su Bitácora Interior. Le devuelves un acompañamiento breve, cálido y humano — NO un análisis clínico ni consejos genéricos.

Responde en segunda persona (tú), con estas secciones (TÍTULOS EN MAYÚSCULAS, sin markdown ni asteriscos):

TE LEO — 1 o 2 líneas que reflejan lo que escribió, para que se sienta visto/a.
LO QUE NOTO — un matiz emocional o patrón amable que aparece en su escritura (con "quizá"/"parece").
UN ESPEJO — una frase o pregunta que le ayude a mirar más hondo, sin dirigir.
UN PASO PEQUEÑO — una micro-práctica o invitación suave para hoy.

Valida siempre la emoción. No minimices ni fuerces positividad. Si hay señales de sufrimiento intenso o riesgo, valida con ternura e invita a hablarlo con Valeria. Español neutro y cálido.`;

/** Feedback de OMI sobre una entrada de bitácora (para el estudiante). */
export async function giveJournalFeedback(input: {
  content: string;
  emotion?: string | null;
  intensity?: number | null;
}): Promise<OmiReport> {
  const meta = [
    input.emotion ? `Emoción: ${input.emotion}` : "",
    typeof input.intensity === "number" ? `Intensidad: ${input.intensity}/10` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const userMessage = `${meta ? meta + "\n\n" : ""}Entrada de bitácora:\n${input.content.trim()}`;
  return runOmi(JOURNAL_SYSTEM, userMessage);
}
