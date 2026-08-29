import "server-only";

/* ============================================================
   Configuración de HERMES — el mensajero de OCEOM en WhatsApp.

   Hay DOS transportes posibles y el resto del código no debe saber cuál está
   activo (igual que `omi/provider.ts` esconde si detrás hay Kimi o Claude):

   - "bridge" — un servicio Node propio con Baileys, conectado por QR a un
     celular normal. Sin trámites con Meta, sin plantillas y sin ventana de
     24 h. A cambio: servidor siempre encendido y riesgo de que Meta banee
     el número (va contra sus términos).
   - "cloud"  — WhatsApp Cloud API oficial de Meta. Sin riesgo de baneo,
     pero exige app en Meta, plantillas aprobadas y respetar la ventana.

   Si están los dos configurados gana el bridge. Si no hay ninguno, Hermes
   hace no-op: no envía ni recibe, y la UI lo avisa sin romperse.
   ============================================================ */

export interface BridgeConfig {
  transport: "bridge";
  /** URL del servicio bridge, p. ej. https://hermes-bridge.up.railway.app */
  url: string;
  /** Secreto compartido: firma los mensajes en ambos sentidos. */
  secret: string;
}

export interface CloudConfig {
  transport: "cloud";
  phoneNumberId: string;
  accessToken: string;
  appSecret: string;
  verifyToken: string;
  graphVersion: string;
  reminderTemplate: string;
  verifyTemplate: string;
  templateLang: string;
}

export type HermesConfig = BridgeConfig | CloudConfig;

/** Bridge propio (Baileys). Es el camino elegido para OCEOM. */
export function resolveBridge(): BridgeConfig | null {
  const url = process.env.HERMES_BRIDGE_URL;
  const secret = process.env.HERMES_BRIDGE_SECRET;
  if (!url || !secret) return null;
  return { transport: "bridge", url: url.replace(/\/+$/, ""), secret };
}

/** Cloud API de Meta. Se deja funcionando por si algún día hay que migrar. */
export function resolveCloud(): CloudConfig | null {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!phoneNumberId || !accessToken || !appSecret || !verifyToken) return null;

  return {
    transport: "cloud",
    phoneNumberId,
    accessToken,
    appSecret,
    verifyToken,
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION || "v23.0",
    reminderTemplate: process.env.WHATSAPP_TEMPLATE_RECORDATORIO || "hermes_recordatorio_bitacora",
    verifyTemplate: process.env.WHATSAPP_TEMPLATE_CODIGO || "hermes_codigo_vinculacion",
    templateLang: process.env.WHATSAPP_TEMPLATE_LANG || "es",
  };
}

/** El transporte activo, o null si Hermes no está conectado. */
export function resolveHermes(): HermesConfig | null {
  return resolveBridge() ?? resolveCloud();
}

/** ¿Hermes está conectado a WhatsApp? (para pintar avisos en la UI). */
export function hermesEnabled(): boolean {
  return resolveHermes() !== null;
}
