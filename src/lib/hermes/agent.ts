import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { resolveProvider } from "@/lib/omi/provider";
import { EMOTIONS } from "@/config/bitacora";

/* ============================================================
   El criterio de HERMES.

   Cuando alguien le escribe por WhatsApp, Hermes tiene que decidir en UNA
   sola pasada dos cosas a la vez:
     1) qué es lo que llegó — ¿una entrada de bitácora, un sueño, o solo
        una conversación que no hay que archivar?
     2) qué contestar — breve, cálido, en la voz de OCEOM.

   Una sola llamada al modelo (Kimi, el mismo cerebro de OMI) porque esto
   corre dentro de un webhook: cada llamada extra es latencia que la persona
   siente como silencio.

   Regla de oro: si el modelo falla, NO se pierde lo que la persona escribió.
   `classifyAndReply` degrada a guardar el texto tal cual en la bitácora.
   ============================================================ */

export type HermesKind = "bitacora" | "sueno" | "charla";

export interface HermesReading {
  kind: HermesKind;
  title: string | null;
  emotion: string | null;
  intensity: number | null;
  isInsight: boolean;
  /** Solo para sueños. */
  symbols: string | null;
  dreamType: string;
  /** Lo que Hermes responde por WhatsApp. */
  reply: string;
  /** true si el modelo no respondió y se usó el camino de respaldo. */
  degraded: boolean;
}

const EMOTION_KEYS = EMOTIONS.map((e) => e.key);

const SYSTEM = `Eres HERMES, el mensajero de OCEOM — el santuario digital del método E-MOTION® de Valeria Rueda Caicedo (sanación neuroemocional, corporal y energética). Vives en WhatsApp. Tu trabajo es acompañar a cada persona a sostener su Bitácora Interior: recibes lo que te escribe y lo guardas en su bitácora dentro de la plataforma.

No eres terapeuta ni médica. Eres una presencia que escucha, refleja y acompaña.

# Tu voz
Cálida, serena, sin juicio, cercana. Hablas de "tú". Lenguaje de OCEOM con naturalidad: océano interior, proceso, raíz, cuerpo, integrar, a tu ritmo.
EVITA: diagnósticos ("tienes ansiedad"), etiquetas ("estás mal"), promesas de cura, imperativos ("tienes que"), positividad tóxica, tono de coach motivacional.
Primero reflejas y nombras lo que sientes que hay, sin minimizar. Después —si aplica— UNA pregunta abierta o UNA práctica pequeña.

# Formato (esto es WhatsApp, no un ensayo)
De 2 a 4 frases. MÁXIMO 60 palabras. Sin markdown, sin asteriscos, sin listas, sin títulos. Texto plano corrido. Un emoji como mucho, y solo si suma.

# Qué decides
Lee el mensaje y clasifícalo:
- "bitacora" — la persona cuenta cómo está, qué sintió, qué le pasó, una reflexión o un darse cuenta. Es lo más común. Ante la duda entre bitacora y charla, elige SIEMPRE bitacora: es mejor guardar de más que perder lo que alguien confió.
- "sueno" — está contando un sueño que tuvo mientras dormía.
- "charla" — saludos sueltos ("hola", "gracias", "ok"), preguntas sobre la plataforma, o respuestas a una pregunta tuya que no aportan contenido emocional propio. Esto NO se guarda.

Si es bitacora o sueno, extrae también:
- titulo: 3 a 6 palabras que nombren la entrada, en la voz de la persona. null si no se puede.
- emocion: EXACTAMENTE una de estas claves, o null si ninguna encaja: ${EMOTION_KEYS.join(", ")}
- intensidad: entero 0-10, qué tan fuerte se siente esa emoción. null si no hay señal.
- es_insight: true solo si la persona expresa un darse cuenta, una comprensión nueva sobre sí misma.
- simbolos (solo sueños): elementos clave separados por comas ("agua, una puerta, mi madre"). null si no hay.
- tipo_sueno (solo sueños): normal | lucido | recurrente | pesadilla | revelador.

Cuando guardas algo, tu respuesta debe reflejar lo que la persona contó (no un acuse de recibo genérico) y hacerle saber con naturalidad que quedó en su bitácora.

# Respondes SOLO con JSON
Un único objeto JSON, sin texto antes ni después, sin bloques de código:
{"tipo":"bitacora|sueno|charla","titulo":string|null,"emocion":string|null,"intensidad":number|null,"es_insight":boolean,"simbolos":string|null,"tipo_sueno":string|null,"respuesta":string}`;

interface RawReading {
  tipo?: string;
  titulo?: string | null;
  emocion?: string | null;
  intensidad?: number | null;
  es_insight?: boolean;
  simbolos?: string | null;
  tipo_sueno?: string | null;
  respuesta?: string;
}

const DREAM_TYPES = ["normal", "lucido", "recurrente", "pesadilla", "revelador"];

/** Respuesta de respaldo: el modelo no está o falló. Se guarda igual. */
const FALLBACK_REPLY =
  "Gracias por confiarme esto. Ya quedó guardado en tu Bitácora Interior. Cuando quieras, ábrela en OCEOM y léete a ti misma con calma.";

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

/**
 * Lee el mensaje, decide qué hacer con él y redacta la respuesta.
 * `history` son los últimos turnos de la conversación (para que Hermes
 * entienda "sí, eso mismo" o una respuesta a su propia pregunta).
 */
export async function classifyAndReply(
  message: string,
  history: ConversationTurn[] = [],
  opts: { firstName?: string | null } = {},
): Promise<HermesReading> {
  const provider = resolveProvider();
  if (!provider) return degraded();

  const client = new Anthropic({ apiKey: provider.apiKey, baseURL: provider.baseURL });

  const system = opts.firstName
    ? `${SYSTEM}\n\nLa persona con la que hablas se llama ${opts.firstName}.`
    : SYSTEM;

  try {
    const res = await client.messages.create({
      model: provider.model,
      max_tokens: 900,
      temperature: 0.6,
      system,
      // Sin razonamiento: esto corre dentro del webhook y la persona está
      // mirando el chat. Prima responder rápido sobre analizar hondo.
      thinking: { type: "disabled" as const },
      messages: [
        ...history.slice(-6).map((t) => ({ role: t.role, content: t.content })),
        { role: "user" as const, content: message },
      ],
    });

    const text = res.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { text: string }).text)
      .join("")
      .trim();

    const parsed = parseJson(text);
    if (!parsed) return degraded();

    return normalize(parsed);
  } catch (e) {
    console.error("[hermes agent]", e);
    return degraded();
  }
}

/** Extrae el objeto JSON aunque el modelo lo envuelva en ```json o lo comente. */
function parseJson(text: string): RawReading | null {
  const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as RawReading;
  } catch {
    return null;
  }
}

/** Sanea la salida del modelo: nada llega a la base de datos sin validar. */
function normalize(raw: RawReading): HermesReading {
  const kind: HermesKind =
    raw.tipo === "sueno" ? "sueno" : raw.tipo === "charla" ? "charla" : "bitacora";

  const emotion =
    raw.emocion && EMOTION_KEYS.includes(raw.emocion) ? raw.emocion : null;

  let intensity: number | null = null;
  if (typeof raw.intensidad === "number" && Number.isFinite(raw.intensidad)) {
    intensity = Math.min(10, Math.max(0, Math.round(raw.intensidad)));
  }

  const dreamType =
    raw.tipo_sueno && DREAM_TYPES.includes(raw.tipo_sueno) ? raw.tipo_sueno : "normal";

  const reply = (raw.respuesta ?? "").trim();

  return {
    kind,
    title: raw.titulo?.trim() ? raw.titulo.trim().slice(0, 120) : null,
    emotion,
    intensity,
    isInsight: raw.es_insight === true,
    symbols: raw.simbolos?.trim() ? raw.simbolos.trim().slice(0, 500) : null,
    dreamType,
    reply: reply || (kind === "charla" ? "Aquí estoy. Cuéntame cómo va tu día." : FALLBACK_REPLY),
    degraded: false,
  };
}

/** Camino de respaldo: el modelo no está o falló. El texto se guarda tal cual
 *  en la bitácora (sin emoción ni título) y la persona recibe una confirmación
 *  cálida. Perder lo que alguien confió no es una opción aceptable. */
function degraded(): HermesReading {
  return {
    kind: "bitacora",
    title: null,
    emotion: null,
    intensity: null,
    isInsight: false,
    symbols: null,
    dreamType: "normal",
    reply: FALLBACK_REPLY,
    degraded: true,
  };
}
