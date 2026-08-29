"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

/* El visor arrastra three.js y el atlas: se carga solo cuando la persona abre
   la puerta "Cuerpo", nunca en el bundle inicial. Sin SSR (usa WebGL). */
export const BodyViewerLazy = dynamic(
  () => import("./body-viewer").then((m) => m.BodyViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[min(82vh,860px)] min-h-[28rem] flex-col items-center justify-center gap-3">
        <Loader2 className="size-6 animate-spin text-ocean-violet" />
        <p className="text-sm text-muted">Preparando el cuerpo…</p>
      </div>
    ),
  },
);
