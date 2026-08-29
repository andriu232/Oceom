import "server-only";
import crypto from "node:crypto";
import {
  resolveHermes,
  resolveCloud,
  type CloudConfig,
  type BridgeConfig,
} from "./config";
import { reminderText, verificationText } from "./messages";

/* ============================================================
   Envío de mensajes de HERMES, agnóstico del transporte.

   Quien llame a este módulo NO debe saber si detrás hay un bridge de Baileys
   o la Cloud API de Meta. La diferencia importante entre los dos:

   - Bridge: todo es texto plano, sin restricciones. Iniciar conversación es
     igual que responder.
   - Cloud: iniciar conversación exige una PLANTILLA aprobada; el texto libre
     solo vale dentro de las 24 h siguientes al último mensaje de la persona.

   Por eso los envíos que inician conversación (recordatorio, código) tienen
   función propia: cada transporte la resuelve como puede.
   ============================================================ */

export interface SendResult {
  ok: boolean;
  /** ID del mensaje, para guardarlo en el log y descartar el eco. */
  messageId?: string;
  error?: string;
}

/* ---------------- bridge (Baileys) ---------------- */

/** Firma HMAC de las llamadas al bridge. El timestamp va dentro de la firma
 *  para que un mensaje capturado no se pueda reenviar más tarde. */
export function signBridgePayload(
  secret: string,
  timestamp: string,
  body: string,
): string {
  return crypto.createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");
}

async function sendViaBridge(
  cfg: BridgeConfig,
  to: string,
  text: string,
): Promise<SendResult> {
  const body = JSON.stringify({ to: to.replace(/\D/g, ""), text });
  const ts = String(Date.now());

  try {
    const res = await fetch(`${cfg.url}/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-hermes-timestamp": ts,
        "x-hermes-signature": signBridgePayload(cfg.secret, ts, body),
      },
      body,
      // El bridge puede estar reconectando; no vale la pena esperar eternamente.
      signal: AbortSignal.timeout(20_000),
    });

    const json = (await res.json().catch(() => null)) as {
      messageId?: string;
      error?: string;
    } | null;

    if (!res.ok) {
      const msg = json?.error ?? `HTTP ${res.status}`;
      console.error("[hermes bridge] envío falló:", msg);
      return { ok: false, error: msg };
    }
    return { ok: true, messageId: json?.messageId };
  } catch (e) {
    console.error("[hermes bridge] error de red:", e);
    return { ok: false, error: "El bridge de WhatsApp no responde." };
  }
}

/* ---------------- cloud (Meta) ---------------- */

function graphUrl(cfg: CloudConfig, path: string): string {
  return `https://graph.facebook.com/${cfg.graphVersion}/${path}`;
}

async function postCloud(cfg: CloudConfig, body: unknown): Promise<SendResult> {
  try {
    const res = await fetch(graphUrl(cfg, `${cfg.phoneNumberId}/messages`), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ messaging_product: "whatsapp", ...(body as object) }),
    });

    const json = (await res.json().catch(() => null)) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    } | null;

    if (!res.ok) {
      const msg = json?.error?.message ?? `HTTP ${res.status}`;
      console.error("[hermes cloud] envío falló:", msg);
      return { ok: false, error: msg };
    }
    return { ok: true, messageId: json?.messages?.[0]?.id };
  } catch (e) {
    console.error("[hermes cloud] error de red:", e);
    return { ok: false, error: "No se pudo contactar a WhatsApp." };
  }
}

async function sendCloudTemplate(
  cfg: CloudConfig,
  to: string,
  templateName: string,
  params: string[],
): Promise<SendResult> {
  return postCloud(cfg, {
    recipient_type: "individual",
    to: to.replace(/\D/g, ""),
    type: "template",
    template: {
      name: templateName,
      language: { code: cfg.templateLang },
      ...(params.length
        ? {
            components: [
              { type: "body", parameters: params.map((p) => ({ type: "text", text: p })) },
            ],
          }
        : {}),
    },
  });
}

/* ---------------- API pública ---------------- */

/** Texto libre. Por Cloud API solo es válido dentro de la ventana de 24 h;
 *  por el bridge, siempre. Se usa para RESPONDER a alguien. */
export async function sendText(to: string, text: string): Promise<SendResult> {
  const cfg = resolveHermes();
  if (!cfg) return { ok: false, error: "Hermes no está conectado a WhatsApp." };

  if (cfg.transport === "bridge") return sendViaBridge(cfg, to, text);

  return postCloud(cfg, {
    recipient_type: "individual",
    to: to.replace(/\D/g, ""),
    type: "text",
    text: { preview_url: false, body: text.slice(0, 4096) },
  });
}

/** Recordatorio de bitácora. INICIA conversación. */
export async function sendReminder(to: string, firstName: string): Promise<SendResult> {
  const cfg = resolveHermes();
  if (!cfg) return { ok: false, error: "Hermes no está conectado a WhatsApp." };

  if (cfg.transport === "bridge") return sendViaBridge(cfg, to, reminderText(firstName));
  return sendCloudTemplate(cfg, to, cfg.reminderTemplate, [firstName]);
}

/** Código de vinculación. INICIA conversación. */
export async function sendVerificationCode(to: string, code: string): Promise<SendResult> {
  const cfg = resolveHermes();
  if (!cfg) return { ok: false, error: "Hermes no está conectado a WhatsApp." };

  if (cfg.transport === "bridge") return sendViaBridge(cfg, to, verificationText(code));
  return sendCloudTemplate(cfg, to, cfg.verifyTemplate, [code]);
}

/** Marca el mensaje como leído. Solo aplica a Cloud API: el bridge lo hace
 *  por su cuenta al recibirlo. */
export async function markRead(waMessageId: string): Promise<void> {
  const cfg = resolveHermes();
  if (!cfg || cfg.transport !== "cloud") return;
  await postCloud(cfg, {
    status: "read",
    message_id: waMessageId,
    typing_indicator: { type: "text" },
  });
}

/** Verifica la firma del webhook de Meta (X-Hub-Signature-256 = HMAC-SHA256
 *  del cuerpo CRUDO con el App Secret). Solo aplica al transporte cloud. */
export function verifyWebhookSignature(rawBody: string, header: string | null): boolean {
  const cfg = resolveCloud();
  if (!cfg) return false;
  if (!header?.startsWith("sha256=")) return false;

  const expected = crypto.createHmac("sha256", cfg.appSecret).update(rawBody, "utf8").digest("hex");
  return timingSafeHexEqual(expected, header.slice("sha256=".length));
}

/** Comparación en tiempo constante de dos hex. Devuelve false si no parean
 *  en longitud, en vez de lanzar (timingSafeEqual exige igual tamaño). */
export function timingSafeHexEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}
