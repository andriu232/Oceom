import { NextRequest, NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/**
 * Webhook de LiveKit. Cuando una sala se cierra (`room_finished` — por
 * `deleteRoom` al Finalizar, o por `empty_timeout` cuando el host se va sin
 * finalizar), marcamos el círculo como terminado en la BD. Así no quedan
 * círculos fantasma "en vivo" que dejen a los estudiantes eternamente en
 * "conectando…". El `name` de la sala en LiveKit === `live_sessions.id`.
 *
 * Configurar en LiveKit Cloud → Project → Settings → Webhooks:
 *   URL: https://<tu-dominio>/api/livekit/webhook
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  if (!apiKey || !apiSecret) {
    return NextResponse.json({ error: "LiveKit no configurado" }, { status: 500 });
  }

  const receiver = new WebhookReceiver(apiKey, apiSecret);
  const body = await req.text();
  const authHeader = req.headers.get("Authorization") ?? "";

  let event;
  try {
    // Verifica la firma (rechaza si no viene de LiveKit).
    event = await receiver.receive(body, authHeader);
  } catch (e) {
    console.error(
      "[livekit webhook] firma inválida:",
      e instanceof Error ? e.message : e,
    );
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  if (event.event === "room_finished" && event.room?.name) {
    try {
      const admin = createServiceClient();
      // ends_at = ahora → circleState pasa a "past"; status ended por consistencia.
      const { error } = await admin
        .from("live_sessions")
        .update({ status: "ended", ends_at: new Date().toISOString() })
        .eq("id", event.room.name)
        .neq("status", "ended");
      if (error) console.error("[livekit webhook] update:", error.message);
    } catch (e) {
      console.error("[livekit webhook] error:", e instanceof Error ? e.message : e);
    }
  }

  return NextResponse.json({ ok: true });
}
