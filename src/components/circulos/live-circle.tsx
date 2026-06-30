"use client";

import { useEffect, useState } from "react";
import "@livekit/components-styles";
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { Loader2, Video } from "lucide-react";

/** Sala de video nativa (LiveKit). Pide el token y conecta a la sala del círculo. */
export function LiveCircle({ roomId }: { roomId: string }) {
  const [conn, setConn] = useState<{ token: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/livekit/token?room=${encodeURIComponent(roomId)}`)
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

  if (!conn) {
    return (
      <Frame>
        <Loader2 className="size-7 animate-spin text-ocean-cyan" />
        <p className="text-sm text-muted">Conectando a la sala…</p>
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
        connect
        video
        audio
        style={{ height: "100%" }}
      >
        <VideoConference />
        <RoomAudioRenderer />
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
