"use client";

import { useEffect, useRef } from "react";

/**
 * OceomSacredLayer — la Flor de la Vida y las estrellas que la acompañaban,
 * sobre el agua.
 *
 * Es una reescritura de la escena que había en `flower-scene.tsx`, que usaba
 * react-three-fiber. Aquí no hay three.js ni un segundo contexto WebGL: un solo
 * canvas 2D. El motivo es que el fondo de agua ya consume una GPU entera, y
 * apilar encima el runtime de three (más su propio contexto) era justo lo que
 * ponía lenta la página.
 *
 * Optimizaciones, por orden de impacto:
 *
 *  1. La flor se rasteriza UNA vez a un canvas fuera de pantalla. Por frame son
 *     3 `drawImage` con transformación, en vez de las ~1.700 aristas que
 *     redibujaba three.
 *  2. Las estrellas son un sprite pequeño con degradado radial, también
 *     pre-rasterizado. La versión anterior reescribía un Float32Array de 1.000
 *     puntos y lo re-subía a la GPU en cada frame; eso desaparece.
 *  3. El número de estrellas se calcula según el área real de la ventana y está
 *     topado, así que una pantalla grande no multiplica el trabajo sin control.
 *  4. Se para sola: fuera de pantalla, con la pestaña en segundo plano, o si el
 *     sistema pide menos movimiento (`prefers-reduced-motion`), en cuyo caso
 *     pinta un fotograma quieto y no vuelve a tocar la CPU.
 *  5. DPR topado a 2.
 */

const CYAN = "34, 211, 238";   /* --ocean-cyan  */
const GLOW = "94, 234, 212";   /* --ocean-glow  */

/** Centros de la Flor de la Vida hasta el anillo `rings` (retícula hexagonal). */
function flowerCenters(rings: number, r = 1): [number, number][] {
  const ax: [number, number] = [r, 0];
  const bx: [number, number] = [r * 0.5, (r * Math.sqrt(3)) / 2];
  const centers: [number, number][] = [];
  for (let i = -rings; i <= rings; i += 1) {
    for (let j = -rings; j <= rings; j += 1) {
      const dist = (Math.abs(i) + Math.abs(j) + Math.abs(i + j)) / 2;
      if (dist <= rings) centers.push([i * ax[0] + j * bx[0], i * ax[1] + j * bx[1]]);
    }
  }
  return centers;
}

/** Rasteriza una capa de la flor a su propio canvas. `unit` = píxeles por radio. */
function renderFlower(
  centers: [number, number][],
  ringRadius: number,
  unit: number,
  rgb: string,
  alpha: number,
  lineWidth: number,
) {
  const span = Math.ceil((ringRadius + 1) * unit) * 2 + 8;
  const canvas = document.createElement("canvas");
  canvas.width = span;
  canvas.height = span;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.translate(span / 2, span / 2);
  ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  for (const [cx, cy] of centers) {
    ctx.moveTo(cx * unit + unit, cy * unit);
    ctx.arc(cx * unit, cy * unit, unit, 0, Math.PI * 2);
  }
  ctx.stroke();
  fadeEdges(ctx, span);
  return canvas;
}

/** Disuelve la capa hacia los bordes. En la escena de three.js esto lo hacía
 *  la niebla; aquí se hornea una vez en el propio sprite, así que no cuesta
 *  nada por frame. Sin esto la flor se recorta en seco y pesa demasiado. */
function fadeEdges(ctx: CanvasRenderingContext2D, span: number) {
  const g = ctx.createRadialGradient(0, 0, span * 0.06, 0, 0, span * 0.5);
  g.addColorStop(0, "rgba(0,0,0,1)");
  g.addColorStop(0.55, "rgba(0,0,0,0.85)");
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalCompositeOperation = "destination-in";
  ctx.fillStyle = g;
  ctx.fillRect(-span / 2, -span / 2, span, span);
  ctx.globalCompositeOperation = "source-over";
}

/** Anillo suelto que enmarca la flor. */
function renderRing(radius: number, unit: number, rgb: string, alpha: number) {
  const span = Math.ceil(radius * unit) * 2 + 8;
  const canvas = document.createElement("canvas");
  canvas.width = span;
  canvas.height = span;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  ctx.translate(span / 2, span / 2);
  ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.arc(0, 0, radius * unit, 0, Math.PI * 2);
  ctx.stroke();
  fadeEdges(ctx, span);
  return canvas;
}

/** Sprite de estrella: un punto con halo, para dibujarla con un solo drawImage. */
function renderStarSprite() {
  const size = 16;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(224, 248, 255, 1)");
  g.addColorStop(0.35, "rgba(150, 226, 245, 0.55)");
  g.addColorStop(1, "rgba(120, 200, 230, 0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return canvas;
}

type Star = { x: number; y: number; depth: number; phase: number; drift: number };

export function OceomSacredLayer() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return undefined;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sprite = renderStarSprite();

    let width = 1;
    let height = 1;
    let dpr = 1;
    let unit = 1;
    let outer = document.createElement("canvas");
    let inner = document.createElement("canvas");
    let ring = document.createElement("canvas");
    let stars: Star[] = [];
    let frame = 0;
    let visible = true;
    // Puntero normalizado (-1..1) con seguimiento suave, para el paralaje.
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const startedAt = performance.now();

    const build = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      // La flor ocupa algo menos que el lado corto, para respirar.
      unit = (Math.min(width, height) * 0.36) / 3.05;
      outer = renderFlower(flowerCenters(2), 3.05, unit, CYAN, 0.13, 1);
      inner = renderFlower(flowerCenters(1), 3.05, unit, GLOW, 0.18, 1.15);
      ring = renderRing(3.05, unit, GLOW, 0.11);

      const count = Math.min(220, Math.round((width * height) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random(),
        y: Math.random(),
        depth: 0.3 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        drift: 0.4 + Math.random() * 0.6,
      }));
    };

    const draw = (now: number) => {
      frame = 0;
      const t = (now - startedAt) * 0.001;
      const still = reduced.matches;

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Aditivo: la luz se suma sobre el agua, no la tapa.
      ctx.globalCompositeOperation = "lighter";

      // Paralaje suave hacia el cursor.
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;

      // --- estrellas ---
      for (let i = 0; i < stars.length; i += 1) {
        const s = stars[i];
        const drift = still ? 0 : t * 0.012 * s.drift;
        const x = ((s.x - drift) % 1 + 1) % 1 * width + pointer.x * 26 * s.depth;
        const y = ((s.y - t * (still ? 0 : 0.004) * s.depth) % 1 + 1) % 1 * height + pointer.y * 18 * s.depth;
        // Parpadeo lento y solo en la opacidad. Modularlo también en tamaño
        // hacía que las estrellas "latieran" y eso, de fondo permanente, es
        // justo lo que cansa.
        const twinkle = still ? 0.72 : 0.68 + Math.sin(t * 0.32 + s.phase) * 0.16;
        const size = 1.6 + s.depth * 2.6;
        ctx.globalAlpha = Math.max(0.05, twinkle * s.depth * 0.5);
        ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
      }
      ctx.globalAlpha = 1;

      // --- flor de la vida ---
      const cx = width / 2 + pointer.x * 14;
      const cy = height / 2 + pointer.y * 10;
      const breathe = still ? 1 : 1 + Math.sin(t * 0.3) * 0.022;
      const spin = still ? 0 : t * 0.05;

      const blit = (layer: HTMLCanvasElement, rotation: number, scale: number) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        ctx.drawImage(layer, -layer.width / 2, -layer.height / 2);
        ctx.restore();
      };
      blit(ring, spin, breathe);
      blit(outer, spin, breathe);
      blit(inner, -spin, breathe);

      ctx.globalCompositeOperation = "source-over";
      if (!still && visible && !document.hidden) frame = requestAnimationFrame(draw);
    };

    const start = () => {
      if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const onResize = () => {
      build();
      stop();
      requestAnimationFrame(draw);
    };
    const onVisibility = () => (document.hidden ? stop() : start());
    const onPointer = (event: PointerEvent) => {
      pointer.tx = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (event.clientY / window.innerHeight) * 2 - 1;
    };

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? true;
      if (visible) start();
      else stop();
    });
    observer.observe(canvas);

    build();
    start();
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -9,
        pointerEvents: "none",
        display: "block",
      }}
    />
  );
}
