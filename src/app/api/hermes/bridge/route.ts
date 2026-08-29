import { NextRequest, NextResponse } from "next/server";
import { resolveBridge } from "@/lib/hermes/config";
import { signBridgePayload, timingSafeHexEqual } from "@/lib/hermes/wa";
import { handleInbound } from "@/lib/hermes/inbound";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/* ============================================================
   POST /api/hermes/bridge — mensajes que llegan desde el bridge de Baileys.

   El bridge es tonto a propósito: solo sostiene la conexión con WhatsApp y
   reenvía. Toda la inteligencia (identidad, seguridad, modelo, bitácora)
   vive aquí, igual que con Cloud API.

   Autenticación: HMAC-SHA256 sobre `timestamp.cuerpo` con el secreto
   compartido. El timestamp entra en la firma y se rechaza si es viejo, para
   que capturar una petición no permita reenviarla después.
   ============================================================ */

/** Ventana de tolerancia del timestamp. Cubre desfases de reloj razonables
 *  sin dejar abierta una ventana de reenvío larga. */
const MAX_SKEW_MS = 5 * 60 * 1000;

interface BridgePayload {
  messages?: Array<{
    id: string;
    from: string;
    type: string;
    text?: string;
  }>;
}

export async function POST(req: NextRequest) {
  const cfg = resolveBridge();
  if (!cfg) {
    return NextResponse.json({ error: "bridge no configurado" }, { status: 503 });
  }

  const raw = await req.text();
  const ts = req.headers.get("x-hermes-timestamp");
  const sig = req.headers.get("x-hermes-signature");

  if (!ts || !sig) {
    return NextResponse.json({ error: "falta firma" }, { status: 401 });
  }

  const age = Math.abs(Date.now() - Number(ts));
  if (!Number.isFinite(age) || age > MAX_SKEW_MS) {
    return NextResponse.json({ error: "timestamp fuera de rango" }, { status: 401 });
  }

  if (!timingSafeHexEqual(signBridgePayload(cfg.secret, ts, raw), sig)) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  let payload: BridgePayload;
  try {
    payload = JSON.parse(raw) as BridgePayload;
  } catch {
    return NextResponse.json({ ok: true, skipped: "json inválido" });
  }

  const messages = payload.messages ?? [];

  // En serie: si alguien manda tres mensajes seguidos, el hilo que lee
  // Hermes tiene que quedar en orden.
  for (const m of messages) {
    try {
      await handleInbound({
        waMessageId: m.id,
        from: m.from,
        type: m.type,
        text: m.text,
      });
    } catch (e) {
      console.error("[hermes bridge] fallo procesando", m.id, e);
    }
  }

  return NextResponse.json({ ok: true, procesados: messages.length });
}
