import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { resolveProvider } from "./provider";

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

/** Ejecuta una consulta puntual a OMI y devuelve el texto. */
async function runOmi(
  system: string,
  userMessage: string,
  maxTokens = 1200,
): Promise<OmiReport> {
  const provider = resolveProvider();
  if (!provider)
    return {
      ok: false,
      message: "OMI aún no está configurada (falta la API key del modelo).",
    };

  const client = new Anthropic({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
  });

  try {
    const msg = await client.messages.create({
      model: provider.model,
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
    return { ok: false, message: "OMI no pudo generar el informe. Inténtalo de nuevo." };
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
