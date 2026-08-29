import Anthropic from "@anthropic-ai/sdk";

/* ============================================================
   Resolución del proveedor de OMI. Mismo patrón que QuanTrade: un solo
   @anthropic-ai/sdk sirve para Kimi y para Claude cambiando baseURL/model/key.
   - Primario: Kimi K2.6 (Moonshot) vía su endpoint compatible con Anthropic.
   - Fallback: Claude Sonnet 4.5 (Anthropic directo) si solo hay ANTHROPIC_API_KEY.
   ============================================================ */

export interface OmiProvider {
  id: "kimi" | "claude";
  /** baseURL Anthropic-compatible; undefined = api.anthropic.com por defecto. */
  baseURL?: string;
  apiKey: string;
  model: string;
  /** Etiqueta legible para mostrar/telemetría. */
  label: string;
}

/** Devuelve el proveedor disponible según las env vars, o null si no hay ninguna
 *  configurada (para responder 503 "OMI no configurado" en vez de romper). */
export function resolveProvider(): OmiProvider | null {
  const moonshot = process.env.MOONSHOT_API_KEY;
  if (moonshot) {
    return {
      id: "kimi",
      baseURL: "https://api.moonshot.ai/anthropic",
      apiKey: moonshot,
      model: process.env.OMI_KIMI_MODEL || "kimi-k2.6",
      label: "Kimi K2.6",
    };
  }

  const anthropic = process.env.ANTHROPIC_API_KEY;
  if (anthropic) {
    return {
      id: "claude",
      apiKey: anthropic,
      model: process.env.OMI_CLAUDE_MODEL || "claude-sonnet-4-5",
      label: "Claude Sonnet 4.5",
    };
  }

  return null;
}

/* ============================================================
   Parámetros y cliente compartidos por TODAS las llamadas al modelo.

   Existen porque el ajuste de abajo se olvidó en la mitad de los sitios y el
   síntoma no parece un error: el modelo responde, pero tarde y a medias.
   ============================================================ */

/** Modelo + el ajuste que Kimi necesita sí o sí.
 *
 *  Kimi K2.6 razona antes de escribir y ese bloque de pensamiento consume el
 *  MISMO presupuesto de `max_tokens` que la respuesta. Medido contra Moonshot
 *  con los prompts reales de la plataforma:
 *
 *    chat de BIOCODE   razonando 40,8 s → 29 caracteres truncados
 *                      sin razonar  6,7 s → respuesta completa
 *    informe semanal   razonando 86,1 s → informe cortado a la mitad
 *                      sin razonar 15,4 s → informe completo y más largo
 *
 *  Los 86 s del informe estaban por encima del tiempo máximo de ejecución, y
 *  lo que se cortaba era el final: la sección de SEÑALES DE ALERTA, que es
 *  justo la que la mentora necesita leer. Acotar el razonamiento no es
 *  alternativa: Moonshot ignora `budget_tokens` y vuelve a agotar el tope.
 *
 *  Claude no razona salvo que se le pida, así que ahí no hace falta. */
export function modelParams(provider: OmiProvider) {
  return provider.id === "kimi"
    ? { model: provider.model, thinking: { type: "disabled" as const } }
    : { model: provider.model };
}

/** Cliente con límites.
 *
 *  · `timeout`: por defecto el SDK espera 10 minutos. Una llamada colgada se
 *    quedaba ahí hasta que la plataforma mataba la función entera.
 *  · `maxRetries`: la cuenta de Moonshot está topada en **3 peticiones por
 *    minuto para toda la organización** (comprobado: la 4ª seguida devuelve
 *    429 `max RPM: 3` con `retry-after: 1`). Con OMI, BIOCODE, Hermes y el
 *    acompañamiento de bitácora compartiendo ese tope, tres personas a la vez
 *    lo agotan. El SDK respeta `retry-after`, y reintentar rescata el choque
 *    justo en el cambio de ventana; medido, tres llamadas simultáneas pasan y
 *    la cuarta del mismo minuto falla igual tras 4,5 s de reintentos. Esto NO
 *    sustituye subir el plan de Moonshot: con estudiantes reales en línea,
 *    3 RPM se queda corto y lo que verán es el mensaje de saturación. */
export function createModelClient(
  provider: OmiProvider,
  opts: { timeoutMs?: number } = {},
) {
  return new Anthropic({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
    timeout: opts.timeoutMs ?? 45_000,
    maxRetries: 3,
  });
}

/** Traduce un fallo del modelo a algo que la persona pueda entender.
 *
 *  Importa distinguirlos: un 429 se resuelve esperando unos segundos, pero un
 *  401 significa que la clave dejó de servir (rotada, revocada o sin saldo) y
 *  no se arregla reintentando — con el mensaje genérico anterior, esa
 *  diferencia solo se veía en los registros del servidor. */
export function modelErrorMessage(err: unknown, sujeto: string): string {
  const status = (err as { status?: number } | null)?.status;
  const nombre = (err as { name?: string } | null)?.name ?? "";

  if (status === 429)
    return `${sujeto} está recibiendo muchas consultas ahora mismo. Espera unos segundos y vuelve a intentarlo.`;
  if (status === 401 || status === 403)
    return `${sujeto} no puede conectarse con el modelo: la clave de acceso fue rechazada. Avísale al equipo.`;
  if (status === 400)
    return `${sujeto} no pudo procesar ese mensaje. Prueba a escribirlo más corto.`;
  if (/timeout/i.test(nombre) || status === 408 || status === 504)
    return `${sujeto} tardó demasiado en responder. Inténtalo de nuevo.`;
  if (status && status >= 500)
    return `El modelo de ${sujeto} está caído en este momento. Inténtalo en unos minutos.`;
  return `${sujeto} tuvo un problema para responder. Respira un momento e inténtalo de nuevo.`;
}
