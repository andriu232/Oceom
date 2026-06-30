"use client";

import { useEffect } from "react";
import { Video, Clock, ExternalLink, PlayCircle } from "lucide-react";
import { joinCircleAction } from "@/lib/actions/circles";
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
}: {
  id: string;
  state: CircleState;
  meetingUrl: string | null;
  recordingUrl: string | null;
  whenLabel: string;
}) {
  useEffect(() => {
    if (state === "live") joinCircleAction(id).catch(() => {});
  }, [id, state]);

  return (
    <div className="glass-strong relative aspect-video w-full overflow-hidden rounded-2xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{ background: "radial-gradient(70% 90% at 50% 0%, rgba(34,211,238,0.14), transparent 60%)" }}
      />
      <div className="relative flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
        {state === "live" && (
          <>
            <span className="inline-flex items-center gap-2 rounded-full bg-danger/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-danger">
              <span className="size-2 animate-pulse rounded-full bg-danger" /> En vivo
            </span>
            <div className="grid size-16 place-items-center rounded-full bg-ocean-cyan/15 text-ocean-cyan ring-1 ring-ocean-cyan/30">
              <Video className="size-7" />
            </div>
            {meetingUrl ? (
              <>
                <p className="text-sm text-muted">El círculo está en vivo.</p>
                <a
                  href={meetingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-[18px] bg-[linear-gradient(135deg,#7df0e2,#22d3ee_48%,#13b3c4)] px-5 py-3 text-sm font-semibold text-[#04121a] shadow-[0_0_28px_-6px_rgba(34,211,238,0.8)] transition hover:-translate-y-0.5"
                >
                  Entrar a la videollamada <ExternalLink className="size-4" />
                </a>
              </>
            ) : (
              <p className="max-w-sm text-sm text-muted">
                La sala de video nativa se activará en breve. Tu asistencia quedó
                registrada.
              </p>
            )}
          </>
        )}

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
