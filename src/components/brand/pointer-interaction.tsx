"use client";

import { useEffect, useRef, useState } from "react";

/* ============================================================
   Interacción de puntero para la geometría sagrada de OCEOM.

   Un único estado mutable (PointerControl) alimentado por
   listeners a nivel `window` — porque el <Canvas> vive dentro de
   un backdrop `pointer-events-none` y NO recibe eventos propios.
   Lo consumen:
     • CursorAura  → spotlight CSS que "alumbra" donde pasa el mouse.
     • las escenas → inclinan el mandala hacia el cursor, lo giran
       al arrastrar/click (con inercia) y lo hacen brillar.

   Solo se activa en punteros finos (mouse/trackpad). En táctil se
   deja la atmósfera base intacta y no se secuestra el scroll.
   ============================================================ */

export type PointerControl = {
  /** Puntero en píxeles de viewport (para el spotlight CSS). */
  px: number;
  py: number;
  /** Puntero normalizado -1..1 (x → derecha, y → arriba) para el 3D. */
  nx: number;
  ny: number;
  /** ¿El puntero está presente? (fade in/out del aura y del parallax). */
  present: boolean;
  /** Velocidad angular extra del mandala (rad/s); sube al arrastrar/click. */
  spin: number;
  /** Arrastrando el fondo para girar el mandala. */
  dragging: boolean;
};

const SPIN_CLAMP = 3.2;
const INTERACTIVE =
  'a, button, input, textarea, select, label, summary, [role="button"], [contenteditable], [data-no-spin]';

/** Crea el estado compartido y engancha los listeners globales. */
export function usePointerControl(): PointerControl {
  const ref = useRef<PointerControl>({
    px: 0,
    py: 0,
    nx: 0,
    ny: 0,
    present: false,
    spin: 0,
    dragging: false,
  });

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const c = ref.current;

    let lastX = 0; // para el delta de arrastre
    let downX = 0;
    let downY = 0;
    let downT = 0;

    const clampSpin = () => {
      c.spin = Math.max(-SPIN_CLAMP, Math.min(SPIN_CLAMP, c.spin));
    };

    const onMove = (e: PointerEvent) => {
      c.px = e.clientX;
      c.py = e.clientY;
      c.nx = (e.clientX / window.innerWidth) * 2 - 1;
      c.ny = -((e.clientY / window.innerHeight) * 2 - 1);
      c.present = true;
      if (c.dragging) {
        // giro tipo "tocadiscos": el arrastre horizontal impulsa el mandala.
        c.spin += (e.clientX - lastX) * 0.0016;
        clampSpin();
      }
      lastX = e.clientX;
    };

    const onDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      const t = e.target as Element | null;
      if (t && t.closest(INTERACTIVE)) return; // no secuestrar botones/links/campos
      c.dragging = true;
      lastX = downX = e.clientX;
      downY = e.clientY;
      downT = e.timeStamp;
    };

    const onUp = (e: PointerEvent) => {
      if (!c.dragging) return;
      c.dragging = false;
      const dist = Math.abs(e.clientX - downX) + Math.abs(e.clientY - downY);
      // click "seco" (sin arrastre) → impulso de giro.
      if (e.timeStamp - downT < 350 && dist < 6) {
        c.spin += 2.4;
        clampSpin();
      }
    };

    const onLeave = () => {
      c.present = false;
      c.dragging = false;
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    window.addEventListener("blur", onLeave);
    document.addEventListener("pointerleave", onLeave);

    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("blur", onLeave);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return ref.current;
}

/**
 * CursorAura — spotlight de luz que sigue al cursor y "re-ilumina" la
 * geometría por encima del velo oscuro (mix-blend-screen). Va como capa
 * dentro del backdrop, después del velo de legibilidad.
 */
export function CursorAura({ control }: { control: PointerControl }) {
  const layer = useRef<HTMLDivElement>(null);
  const [fine, setFine] = useState(false);

  useEffect(() => {
    setFine(window.matchMedia("(pointer: fine)").matches);
  }, []);

  useEffect(() => {
    if (!fine) return;
    const el = layer.current;
    if (!el) return;

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    let op = 0;
    let raf = 0;

    const tick = () => {
      const tx = control.present ? control.px : x;
      const ty = control.present ? control.py : y;
      x += (tx - x) * 0.14; // seguimiento suave (trailing)
      y += (ty - y) * 0.14;
      op += ((control.present ? 1 : 0) - op) * 0.08;
      el.style.setProperty("--ax", `${x}px`);
      el.style.setProperty("--ay", `${y}px`);
      el.style.opacity = op.toFixed(3);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [fine, control]);

  if (!fine) return null;

  return (
    <div
      ref={layer}
      className="pointer-events-none absolute inset-0 opacity-0 mix-blend-screen"
      style={{
        background:
          "radial-gradient(22rem 22rem at var(--ax, 50%) var(--ay, 50%)," +
          " rgba(94,234,212,0.17) 0%, rgba(56,189,248,0.10) 34%, transparent 68%)",
      }}
    />
  );
}
