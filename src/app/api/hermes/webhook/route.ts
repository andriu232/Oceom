import { NextRequest, NextResponse } from "next/server";
import { resolveCloud } from "@/lib/hermes/config";
import { verifyWebhookSignature } from "@/lib/hermes/wa";
import { handleInbound, type InboundMessage } from "@/lib/hermes/inbound";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// El modelo puede tardar unos segundos en clasificar y redactar la respuesta.
export const maxDuration = 60;

/* ============================================================
   Webhook de WhatsApp Cloud API — puerta de entrada de HERMES por el
   transporte OFICIAL de Meta. Hoy OCEOM usa el bridge de Baileys
   (/api/hermes/bridge); esta ruta se mantiene lista por si hay que migrar.

   GET  → handshake de Meta al registrar la URL (devuelve hub.challenge).
   POST → mensajes entrantes.

   Dos reglas que Meta impone y hay que respetar:
   - La firma se calcula sobre el cuerpo CRUDO. Hay que leer el texto antes
     de parsear el JSON, o la verificación falla siempre.
   - Siempre 200. Si se devuelve un error, Meta reintenta el mismo mensaje
     en bucle y termina desactivando el webhook.
   ============================================================ */

/** Handshake de verificación al conectar la URL en Meta. */
export async function GET(req: NextRequest) {
  const cfg = resolveCloud();
  if (!cfg) return new NextResponse("Cloud API no está configurada", { status: 503 });

  const params = req.nextUrl.searchParams;
  const mode = params.get("hub.mode");
  const token = params.get("hub.verify_token");
  const challenge = params.get("hub.challenge");

  if (mode === "subscribe" && token === cfg.verifyToken && challenge) {
    // Meta espera el challenge en texto plano, tal cual.
    return new NextResponse(challenge, {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  }
  return new NextResponse("Verificación fallida", { status: 403 });
}

/* Forma del payload de Meta que nos interesa. */
interface WaPayload {
  entry?: Array<{
    changes?: Array<{
      field?: string;
      value?: {
        messages?: Array<{
          id: string;
          from: string;
          type: string;
          text?: { body?: string };
        }>;
      };
    }>;
  }>;
}

export async function POST(req: NextRequest) {
  if (!resolveCloud()) {
    return NextResponse.json({ ok: true, skipped: "cloud api no configurada" });
  }

  // El cuerpo crudo primero: la firma se calcula sobre estos bytes exactos.
  const raw = await req.text();
  if (!verifyWebhookSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  let payload: WaPayload;
  try {
    payload = JSON.parse(raw) as WaPayload;
  } catch {
    return NextResponse.json({ ok: true, skipped: "json inválido" });
  }

  const messages: InboundMessage[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      // El webhook también trae acuses de entrega/lectura ("statuses"),
      // que aquí no interesan: solo se procesan mensajes.
      for (const m of change.value?.messages ?? []) {
        messages.push({
          waMessageId: m.id,
          from: m.from,
          type: m.type,
          text: m.text?.body,
        });
      }
    }
  }

  // En serie y no en paralelo: si alguien manda tres mensajes seguidos, el
  // hilo de conversación que lee Hermes tiene que quedar en orden.
  for (const msg of messages) {
    try {
      await handleInbound(msg);
    } catch (e) {
      // Nunca se propaga: un mensaje que falla no debe bloquear a los demás
      // ni provocar reintentos infinitos de Meta.
      console.error("[hermes webhook] fallo procesando", msg.waMessageId, e);
    }
  }

  return NextResponse.json({ ok: true, procesados: messages.length });
}
