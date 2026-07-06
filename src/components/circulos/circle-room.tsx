"use client";

import { useEffect } from "react";
import { Clock, ExternalLink, PlayCircle } from "lucide-react";
import { joinCircleAction } from "@/lib/actions/circles";
import { LiveCircle } from "@/components/circulos/live-circle";
import type { CircleState } from "@/lib/queries/circles";

/**
 * Sala del círculo. Registra asistencia al entrar en vivo. El recuadro de
 * video queda listo para montar LiveKit (cuando haya llaves); mientras tanto
 * usa el enlace externo si la mentora lo puso.
 */
export function CircleRoom({
  id,
  state,
  meetingUrl,
  recordingUrl,
  whenLabel,
  isHost = false,
}: {
  id: string;
  state: CircleState;
  meetingUrl: string | null;
  recordingUrl: string | null;
  whenLabel: string;
  /** La mentora (host) publica al entrar; el estudiante entra solo mirando. */
  isHost?: boolean;
}) {
  useEffect(() => {
    if (state === "live") joinCircleAction(id).catch(() => {});
  }, [id, state]);

  // En vivo → sala de video nativa (LiveKit).
  if (state === "live") {
    return (
      <div className="space-y-3">
        <LiveCircle roomId={id} isHost={isHost} />
        {meetingUrl && (
          <p className="text-center text-xs text-muted">
            ¿Problemas con el video?{" "}
            <a href={meetingUrl} target="_blank" rel="noreferrer" className="text-ocean-cyan hover:underline">
              Entra por el enlace externo
            </a>
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="glass-strong relative aspect-video w-full overflow-hidden rounded-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: "radial-gradient(70% 90% at 50% 0%, rgba(34,211,238,0.14), transparent 60%)" }}
      />
      <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        {state === "upcoming" && (
          <>
            <div className="grid size-16 place-items-center rounded-full bg-ocean-violet/15 text-ocean-violet ring-1 ring-ocean-violet/30">
              <Clock className="size-7" />
            </div>
            <p className="text-sm text-muted">Este círculo aún no comienza.</p>
            <p className="font-medium text-foreground">{whenLabel}</p>
          </>
        )}

        {state === "past" && (
          <>
            <div className="grid size-16 place-items-center rounded-full bg-ocean-cyan/12 text-ocean-cyan ring-1 ring-ocean-cyan/30">
              <PlayCircle className="size-7" />
            </div>
            {recordingUrl ? (
              <a
                href={recordingUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-[18px] border border-ocean-cyan/40 px-5 py-3 text-sm font-medium text-ocean-cyan transition hover:bg-ocean-cyan/10"
              >
                Ver grabación <ExternalLink className="size-4" />
              </a>
            ) : (
              <p className="text-sm text-muted">Este círculo ya terminó. Aún no hay grabación.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
