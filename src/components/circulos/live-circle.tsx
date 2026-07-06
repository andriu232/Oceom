"use client";

import { useEffect, useRef, useState } from "react";
import "@livekit/components-styles";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { DisconnectReason } from "livekit-client";
import { Loader2, Video, Sparkles } from "lucide-react";
import { roomOptions, connectOptions } from "@/lib/livekit/quality";
import { getDeviceId } from "@/lib/livekit/device";

/**
 * Sala de video nativa (LiveKit) del círculo, afinada para máxima calidad:
 * captura 1080p, audio de alta fidelidad y adaptiveStream/dynacast (ver
 * `lib/livekit/quality.ts`). Pide el token — con id de dispositivo para una
 * reconexión limpia — y conecta al tocar "Entrar al círculo" (el gesto es lo
 * que desbloquea el audio en iOS/Safari y pide cámara y micrófono en el momento
 * justo).
 */
export function LiveCircle({ roomId }: { roomId: string }) {
  const [conn, setConn] = useState<{ token: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const wasConnected = useRef(false);

  useEffect(() => {
    let active = true;
    fetch(
      `/api/livekit/token?room=${encodeURIComponent(roomId)}&device=${encodeURIComponent(getDeviceId())}`,
    )
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error ?? "No se pudo conectar");
        return data as { token: string; url: string };
      })
      .then((d) => active && setConn(d))
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [roomId]);

  if (error) {
    return (
      <Frame>
        <Video className="size-7 text-muted/60" />
        <p className="text-sm text-muted">{error}</p>
      </Frame>
    );
  }

  if (ended) {
    return (
      <Frame>
        <Sparkles className="size-7 text-ocean-violet/70" />
        <p className="text-sm text-muted">El círculo ha finalizado. Gracias por acompañarnos.</p>
      </Frame>
    );
  }

  if (!conn) {
    return (
      <Frame>
        <Loader2 className="size-7 animate-spin text-ocean-cyan" />
        <p className="text-sm text-muted">Preparando la sala…</p>
      </Frame>
    );
  }

  // Gate de arranque: el gesto del usuario desbloquea el audio (iOS/Safari) y
  // dispara el permiso de cámara/micrófono justo al entrar.
  if (!started) {
    return (
      <Frame>
        <button
          onClick={() => setStarted(true)}
          className="group flex flex-col items-center gap-4 rounded-2xl px-8 py-6 transition"
        >
          <span className="grid size-20 place-items-center rounded-full bg-ocean-cyan/15 text-ocean-cyan ring-1 ring-ocean-cyan/40 transition group-hover:bg-ocean-cyan/25 group-hover:ring-ocean-cyan/60">
            <Video className="size-8" />
          </span>
          <span className="text-base font-medium text-foreground">Entrar al círculo</span>
          <span className="text-xs text-muted">Se activarán tu cámara y micrófono</span>
        </button>
      </Frame>
    );
  }

  return (
    <div
      data-lk-theme="default"
      className="h-[70vh] min-h-[420px] overflow-hidden rounded-2xl border border-card-border"
    >
      <LiveKitRoom
        token={conn.token}
        serverUrl={conn.url}
        options={roomOptions}
        connectOptions={connectOptions}
        connect
        video
        audio
        style={{ height: "100%" }}
        onConnected={() => {
          wasConnected.current = true;
        }}
        onDisconnected={(reason) => {
          // Solo cerramos si el círculo terminó o nos removieron. Ante caídas de
          // red, LiveKit reintenta solo → no sacamos al participante.
          const finished =
            reason === DisconnectReason.ROOM_DELETED ||
            reason === DisconnectReason.ROOM_CLOSED ||
            reason === DisconnectReason.SERVER_SHUTDOWN ||
            reason === DisconnectReason.PARTICIPANT_REMOVED;
          if (wasConnected.current && finished) setEnded(true);
        }}
        onError={(e) => {
          console.error("[LiveKit círculo]", e);
          setError(e.message);
        }}
      >
        {/* VideoConference ya incluye RoomAudioRenderer: no lo dupliques o el
            audio de cada participante se reproduce dos veces. */}
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="glass-strong flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl">
      {children}
    </div>
  );
}
