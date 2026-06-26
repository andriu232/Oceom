"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Player from "@vimeo/player";
import { buildVimeoEmbedUrl } from "@/lib/lessons/vimeo";

/**
 * Reproductor Vimeo con tracking (portado de Código Enigma, adaptado a OCEOM):
 *  - Reanuda en startSeconds.
 *  - Envía progreso cada 15s mientras reproduce, y en pause/end/seek.
 *  - Marca completed al 95% vía POST /api/lessons/heartbeat.
 *  - Al completar por primera vez, refresca la UI (chulito + progreso).
 */
export function VimeoPlayer({
  lessonId,
  vimeoId,
  startSeconds = 0,
}: {
  lessonId: string;
  vimeoId: string;
  startSeconds?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastSentRef = useRef(0);
  const completedRef = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (!containerRef.current) return;

    const player = new Player(containerRef.current, {
      url: buildVimeoEmbedUrl(vimeoId, { controls: true, pip: true }),
      responsive: true,
    } as unknown as ConstructorParameters<typeof Player>[1]);

    if (startSeconds > 5) {
      player.ready().then(() => {
        player.setCurrentTime(startSeconds).catch(() => {});
      });
    }

    let interval: ReturnType<typeof setInterval> | null = null;

    const sendProgress = async () => {
      try {
        const [pos, dur] = await Promise.all([
          player.getCurrentTime(),
          player.getDuration(),
        ]);
        if (!dur || dur <= 0) return;
        if (Math.abs(pos - lastSentRef.current) < 5) return;
        lastSentRef.current = pos;

        const r = await fetch("/api/lessons/heartbeat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lessonId,
            positionSeconds: pos,
            durationSeconds: dur,
          }),
          cache: "no-store",
        });
        const json = await r.json().catch(() => ({ ok: false }));
        if (json.transitioned && !completedRef.current) {
          completedRef.current = true;
          router.refresh();
        }
      } catch {
        // Vimeo a veces lanza race conditions; no romper la reproducción.
      }
    };

    const start = () => {
      if (interval) return;
      interval = setInterval(sendProgress, 15000);
    };
    const stop = () => {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    };

    player.on("play", start);
    player.on("pause", () => {
      stop();
      sendProgress();
    });
    player.on("ended", () => {
      stop();
      sendProgress();
    });
    player.on("seeked", () => {
      sendProgress();
    });

    return () => {
      stop();
      player.off("play");
      player.off("pause");
      player.off("ended");
      player.off("seeked");
      player.destroy().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId, vimeoId]);

  return (
    <div className="glass overflow-hidden rounded-2xl p-1">
      <div
        ref={containerRef}
        className="aspect-video w-full overflow-hidden rounded-xl bg-black"
      />
    </div>
  );
}
