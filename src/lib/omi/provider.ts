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
