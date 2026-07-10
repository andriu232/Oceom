"use client";

import { useEffect, useRef, useState } from "react";
import "@livekit/components-styles";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import { DisconnectReason } from "livekit-client";
import { Loader2, Video, Sparkles, PhoneOff, RotateCcw } from "lucide-react";
import { roomOptions, connectOptions } from "@/lib/livekit/quality";
import { getDeviceId } from "@/lib/livekit/device";
import { endCircleAction } from "@/lib/actions/circles";

/**
 * Sala de video nativa (LiveKit) del círculo, afinada para máxima calidad:
 * captura 1080p, audio de alta fidelidad y adaptiveStream/dynacast (ver
 * `lib/livekit/quality.ts`). Pide el token — con id de dispositivo para una
 * reconexión limpia — y conecta al tocar el botón de entrada (el gesto es lo que
 * desbloquea el audio en iOS/Safari y pide permisos en el momento justo).
 *
 * Modo clase: la **mentora (host)** entra publicando cámara y micrófono; el
 * **estudiante** entra solo mirando/escuchando y puede encender su cámara o mic
 * cuando quiera participar. Así una clase con muchos estudiantes no se satura
 * (no hay 30 cámaras publicando a la vez) y el ancho de banda se prioriza para
 * recibir en HD a quien está enseñando.
 */
export function LiveCircle({ roomId, isHost }: { roomId: string; isHost: boolean }) {
  const [conn, setConn] = useState<{ token: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [ending, setEnding] = useState(false);
  // Nº de intento de conexión: al reintentar se refresca el token y se remonta
  // la sala (key) para partir de un estado limpio.
  const [attempt, setAttempt] = useState(0);
  const wasConnected = useRef(false);

  // Reintento manual tras un error: token nuevo + sala remontada.
  function retry() {
    setError(null);
    setConn(null);
    wasConnected.current = false;
    setAttempt((a) => a + 1);
  }

  // Finaliza el círculo (solo la mentora): lo marca terminado en la BD y cierra
  // la sala de LiveKit para desconectar a todos. Pide confirmación (es para todos).
  async function handleEnd() {
    if (ending) return;
    if (!window.confirm("¿Finalizar la sesión en vivo para todos los participantes?"))
      return;
    setEnding(true);
    const res = await endCircleAction(roomId);
    if (res?.error) {
      setEnding(false);
      setError(res.error);
      return;
    }
    setEnded(true);
  }

  useEffect(() => {
    let active = true;
    fetch(
      `/api/livekit/token?room=${encodeURIComponent(roomId)}&device=${encodeURIComponent(getDeviceId())}`,
    )
      .then(async (r) => {
        const data = await r.json();
        // 409 = el círculo ya no está en vivo → pantalla de finalizado, no error.
        if (r.status === 409) return "ended" as const;
        if (!r.ok) throw new Error(data.error ?? "No se pudo conectar");
        return data as { token: string; url: string };
      })
      .then((d) => {
        if (!active) return;
        if (d === "ended") setEnded(true);
        else setConn(d);
      })
      .catch((e) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [roomId, attempt]);

  if (error) {
    return (
      <Frame>
        <Video className="size-7 text-muted/60" />
        <p className="max-w-md px-6 text-center text-sm text-muted">{error}</p>
        <button
          onClick={retry}
          className="mt-1 inline-flex items-center gap-2 rounded-xl bg-ocean-cyan px-5 py-2.5 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110"
        >
          <RotateCcw className="size-4" /> Reintentar
        </button>
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
        {/* Distintivo EN VIVO pulsante: comunica al instante que está ocurriendo. */}
        <span className="inline-flex items-center gap-2 rounded-full bg-danger/15 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-danger ring-1 ring-danger/40">
          <span className="relative flex size-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-danger opacity-80" />
            <span className="relative inline-flex size-2 rounded-full bg-danger" />
          </span>
          En vivo ahora
        </span>

        <button
          onClick={() => setStarted(true)}
          className="group mt-1 flex flex-col items-center gap-4"
        >
          {/* Botón circular vibrante con halo pulsante (onda que llama la atención). */}
          <span className="relative grid size-24 place-items-center">
            <span
              aria-hidden
              className="absolute inset-0 animate-ping rounded-full bg-ocean-cyan/25"
            />
            <span
              aria-hidden
              className="absolute inset-1 rounded-full bg-gradient-to-br from-ocean-glow/40 to-ocean-violet/40 blur-md"
            />
            <span className="relative grid size-20 place-items-center rounded-full bg-gradient-to-br from-ocean-glow to-ocean-cyan text-[var(--ocean-abyss)] shadow-[0_10px_34px_rgba(34,211,238,0.45)] transition group-hover:scale-105">
              <Video className="size-8" />
            </span>
          </span>
          <span className="text-lg font-semibold text-foreground">
            {isHost ? "Iniciar la clase" : "Entrar a la clase"}
          </span>
          <span className="text-xs text-muted">
            {isHost
              ? "Se activarán tu cámara y micrófono"
              : "Verás y escucharás; activa tu cámara si quieres participar"}
          </span>
        </button>
      </Frame>
    );
  }

  return (
    <div
      data-lk-theme="default"
      className="oceom-live relative h-[70vh] min-h-[420px] overflow-hidden rounded-2xl border border-card-border"
    >
      {isHost && (
        <button
          onClick={handleEnd}
          disabled={ending}
          className="absolute right-4 top-4 z-30 inline-flex items-center gap-2 rounded-xl bg-danger px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
        >
          <PhoneOff className="size-4" />
          {ending ? "Finalizando…" : "Finalizar sesión en vivo"}
        </button>
      )}
      <LiveKitRoom
        key={attempt}
        token={conn.token}
        serverUrl={conn.url}
        options={roomOptions}
        connectOptions={connectOptions}
        connect
        // El host publica cámara+mic al entrar; el estudiante entra sin publicar
        // (puede encenderlos luego con los controles para pedir la palabra).
        video={isHost}
        audio={isHost}
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
          // La misma cuenta abrió la sala en otra pestaña/dispositivo y LiveKit
          // cerró esta sesión: explica qué pasó y ofrece volver a entrar.
          if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
            setError(
              "Entraste a esta sala desde otra pestaña o dispositivo, así que esta sesión se cerró. Si quieres seguir aquí, vuelve a entrar.",
            );
          }
        }}
        onError={(e) => {
          // Cancelación benigna: ocurre si algo interrumpe un connect en curso
          // (p. ej. un remontaje). No es una falla real — LiveKit continúa o el
          // remontaje reconecta. Mostrarla dejaba la sala en una pantalla muerta.
          if (/client initiated/i.test(e.message)) {
            console.warn("[LiveKit círculo] connect cancelado (benigno)", e.message);
            return;
          }
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
