import { NextRequest, NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";
import { getUser } from "@/lib/auth";
import { getCircle, circleState } from "@/lib/queries/circles";

export const dynamic = "force-dynamic";

/**
 * GET /api/livekit/token?room=<circleId>
 * Emite un token de LiveKit para entrar a la sala del círculo. El acceso lo
 * decide RLS (getCircle solo devuelve el círculo si el usuario tiene acceso),
 * y solo se permite mientras el círculo está EN VIVO.
 */
export async function GET(req: NextRequest) {
  const params = new URL(req.url).searchParams;
  const room = params.get("room");
  if (!room) return NextResponse.json({ error: "room requerido" }, { status: 400 });

  // Id de dispositivo/pestaña (lo genera y persiste el cliente). Sanitizado.
  const device = (params.get("device") ?? "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24);

  const user = await getUser();
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });

  const circle = await getCircle(room);
  if (!circle) return NextResponse.json({ error: "Sin acceso a este círculo" }, { status: 403 });
  if (circleState(circle) !== "live") {
    return NextResponse.json({ error: "El círculo no está en vivo" }, { status: 409 });
  }

  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const url = process.env.LIVEKIT_URL ?? process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!apiKey || !apiSecret || !url) {
    return NextResponse.json({ error: "LiveKit no está configurado" }, { status: 500 });
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ||
    user.email ||
    "Invitado";

  // Identidad = usuario + dispositivo/pestaña: la misma cuenta puede entrar desde
  // varios dispositivos y recargar sin que LiveKit expulse a las demás sesiones
  // por identidad duplicada. TTL amplio (12h) para que una reconexión tras una
  // caída de red o suspensión reuse el token en vez de dejar la sala colgada.
  const identity = device ? `${user.id}__${device}` : user.id;
  const at = new AccessToken(apiKey, apiSecret, { identity, name, ttl: "12h" });
  at.addGrant({
    roomJoin: true,
    room,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canUpdateOwnMetadata: true,
  });

  return NextResponse.json({ token: await at.toJwt(), url });
}
