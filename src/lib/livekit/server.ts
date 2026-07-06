import { RoomServiceClient } from "livekit-server-sdk";

/**
 * Cierra una sala de LiveKit: desconecta a TODOS los participantes al instante
 * (reciben `DisconnectReason.ROOM_DELETED`). Se usa al finalizar un Círculo en
 * Vivo. No-op si LiveKit no está configurado o si la sala no existe (p. ej.
 * nadie llegó a conectarse) — en esos casos no hay nada que cerrar.
 */
export async function endLiveKitRoom(roomId: string): Promise<void> {
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;
  const raw = process.env.LIVEKIT_URL ?? process.env.NEXT_PUBLIC_LIVEKIT_URL;
  if (!apiKey || !apiSecret || !raw) return;

  // RoomServiceClient habla por HTTP(S), no por WebSocket: ws→http, wss→https.
  const host = raw.replace(/^ws(s?):\/\//i, "http$1://");
  const svc = new RoomServiceClient(host, apiKey, apiSecret);
  try {
    await svc.deleteRoom(roomId);
  } catch {
    /* la sala puede no existir todavía: no es un error real */
  }
}
