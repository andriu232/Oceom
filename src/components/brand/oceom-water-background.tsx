"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import elementalMarksSource from "@/shaders/elements/sources/elemental-marks.html?raw";
import "@/shaders/threeui.subset.css";

/**
 * OceomWaterBackground — fondo de agua de toda la app.
 *
 * Monta el variant `water` de ThreeUI (ElementsCollection): ecuación de onda
 * ping-pong en WebGL2, refracción por gradiente de una marca y partículas en
 * suspensión. La fuente vive intacta en `src/shaders/elements/` y este módulo
 * solo la parchea por string, que es el mismo mecanismo que usa el componente
 * registrado (`DETAIL_PATCHES`).
 *
 * Se adapta en tres puntos, todos documentados abajo:
 *   1. La marca refractada era el logo de OpenAI → emblema de OCEOM.
 *   2. El puntero: el iframe se vuelve transparente al ratón y la página le
 *      reenvía las coordenadas, para que la app siga siendo clicable.
 *   3. Fondo transparente en vez de #060708, para que se vea el degradado
 *      oceánico de `globals.css` por debajo.
 *
 * No se usa `ElementsBackground` directamente porque construye el documento
 * internamente y no deja inyectar nada; ese archivo se conserva verbatim para
 * provenance. Los dos únicos DETAIL_PATCHES que afectan al agua (resolución del
 * SDF y DPR) se replican literalmente aquí.
 */

/** Emblema de OCEOM en viewBox 0 0 24 24: anillo + la onda del logo.
 *  La onda está vectorizada sobre las medidas reales de /brand/oceom-mark.png
 *  (trazado del contorno de la cresta, luego cintas Bézier con puntas afinadas). */
const OCEOM_MARK_PATH =
  "M23.4 12A11.4 11.4 0 1 1 0.6 12A11.4 11.4 0 1 1 23.4 12ZM22.3 12A10.3 10.3 0 1 0 1.7 12A10.3 10.3 0 1 0 22.3 12ZM3.80 16.25C3.80 15.80 5.02 14.97 5.71 14.42C6.40 13.86 7.21 13.47 7.96 12.92C8.71 12.37 9.46 11.67 10.21 11.14C10.96 10.61 11.71 10.04 12.46 9.73C13.21 9.42 13.96 9.26 14.71 9.26C15.46 9.26 16.21 9.25 16.96 9.73C17.71 10.21 18.67 11.62 19.21 12.17C19.75 12.72 20.20 12.86 20.20 13.05C20.20 13.24 19.75 13.58 19.21 13.29C18.67 13.00 17.71 11.64 16.96 11.33C16.21 11.02 15.46 11.23 14.71 11.42C13.96 11.61 13.21 11.97 12.46 12.45C11.71 12.93 10.96 13.71 10.21 14.32C9.46 14.93 8.71 15.64 7.96 16.11C7.21 16.58 6.40 17.12 5.71 17.14C5.02 17.16 3.80 16.70 3.80 16.25Z";

/** Copiados literalmente de DETAIL_PATCHES en ElementsBackground.tsx: los dos
 *  únicos que tocan al variant water (el resto son de lightning y fire). */
const WATER_DETAIL_PATCHES = [
  [
    "const SDF_SIZE = 512;\nconst SDF_SPREAD = 128;",
    "const SDF_SIZE = 768;\nconst SDF_SPREAD = 192;",
  ],
  [
    "const DPR = Math.min(window.devicePixelRatio || 1, 1.75);",
    "const DPR = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2.25);",
  ],
] as const;

/** Props del brief de ThreeUI, recalibrados para uso como fondo permanente.
 *  `size` baja de 1.02 al mínimo del clamp autoral (0.65) para encoger la marca
 *  refractada; `speed` de 0.95 a 0.55 y `opacity` de 0.72 a 0.52 porque de fondo
 *  a jornada completa el ajuste original satura y cansa. */
const WATER = {
  speed: 0.55,
  size: 0.65,
  particleAmount: 0.77,
  hue: 14,
  saturation: 1.23,
  brightness: 1.09,
  opacity: 0.52,
} as const;

const BASE_ZOOM = 1.56;
const BASE_PARTICLES = 160;

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function buildDocument() {
  const zoom = BASE_ZOOM / clamp(WATER.size, 0.65, 1.5);
  const particleCount = Math.max(
    0,
    Math.round(BASE_PARTICLES * clamp(WATER.particleAmount, 0, 2)),
  );

  // Mismo bloque de foco del componente registrado, con el fondo en
  // transparente: el degradado del sitio queda debajo del agua.
  const focusStyles = `<style data-elements-focus>
html, body, main { width: 100%; height: 100%; margin: 0; overflow: hidden; background: transparent; }
header, .hint, .info, .kanji { display: none !important; }
main { display: block; }
.panel { display: none; }
.panel[data-fx="water"] {
  position: absolute;
  inset: 0;
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
  opacity: 1;
  transform: none;
  animation: none;
}
.panel[data-fx="water"] canvas { width: 100%; height: 100%; }
</style>`;

  // Reloj virtual (igual que el registrado) + puente de puntero: el iframe no
  // recibe eventos del ratón, así que la página se los reenvía y aquí se
  // sintetizan sobre el panel, que ya trae sus propios listeners autorales.
  const controls = `<script data-elements-controls>
(function () {
  var nativeNow = performance.now.bind(performance);
  var last = nativeNow();
  var virtual = last;
  var state = { speed: 1, paused: false };
  window.__ELEMENTS_PAUSED = false;
  performance.now = function () {
    var real = nativeNow();
    if (!state.paused) virtual += (real - last) * state.speed;
    last = real;
    return virtual;
  };
  window.addEventListener('message', function (event) {
    var data = event.data;
    if (!data) return;
    if (data.type === 'elements-controls') {
      var next = data.controls || {};
      if (Number.isFinite(next.speed)) state.speed = Math.max(0, Math.min(3, next.speed));
      state.paused = Boolean(next.paused);
      window.__ELEMENTS_PAUSED = state.paused;
      return;
    }
    if (data.type === 'oceom-water-pointer') {
      var panel = document.querySelector('[data-fx="water"]');
      if (!panel) return;
      panel.dispatchEvent(new PointerEvent(data.kind, {
        clientX: data.x,
        clientY: data.y,
        bubbles: true,
        pointerId: 1,
        pointerType: 'mouse',
      }));
    }
  });
})();
</script>`;

  // Parche propio de OCEOM: el agua no refracta ningún logotipo. La fuente
  // pinta una marca en el centro (en el original, la de OpenAI); aquí no se
  // dibuja nada y la identidad la pone la Flor de la Vida, que va en su propia
  // capa por encima.
  //
  // El SDF SÍ se mantiene, con el emblema de OCEOM: las partículas en
  // suspensión nacen de los bordes de esa figura (`makeParticleData(logo.edges,
  // …)`), así que vaciarlo las dejaría sin puntos de origen. Queda como una
  // silueta invisible que solo siembra el plancton.
  //
  // Se comprobó que `d`, `logo` y `glow` no se usan en ninguna otra parte del
  // shader de agua antes de quitar el dibujado.
  const MARK_PATCH = [
    `  float logo = smoothstep(0.005, -0.005, d);
  float glow = exp(-max(d, 0.0) / 0.09) * 0.26;
  vec3 markCol = mix(vec3(0.55, 0.92, 1.0), vec3(0.95, 1.0, 1.0), logo * 0.6);
  col += markCol * (logo * 0.92 + glow);`,
    `  // sin marca refractada`,
  ] as const;

  // Parches de calma: la fuente está pensada como pieza de escaparate, donde el
  // agua es la protagonista y conviene que se mueva mucho. De fondo permanente
  // esa misma calibración satura, así que se rebaja en cuatro frentes.
  const CALM_PATCHES = [
    // 1. El simulador entero. Tres problemas en el original:
    //
    //    a) El laplaciano de 5 puntos (l+r+u+d) es anisótropo: propaga más
    //       rápido en diagonal que en los ejes, así que los anillos salen en
    //       rombo alineado con la rejilla y se ve "raro". Se sustituye por el
    //       de 9 puntos, que es isótropo: ondas redondas.
    //    b) Ese esquema deja vivo el modo de tablero de ajedrez (la longitud
    //       de onda más corta que cabe en la malla), que no propaga a ningún
    //       sitio y se queda vibrando. Un 5% de mezcla hacia la media de los
    //       vecinos lo mata sin difuminar las ondas de verdad.
    //    c) `next *= 0.984` amortiguaba tan poco que a los 2,5 s aún quedaba
    //       un 9% de amplitud: el estanque nunca se calmaba.
    //
    //    Además el radio de la gota pasa a depender de su fuerza: antes todas
    //    tenían exactamente el mismo tamaño y el rastro salía uniforme.
    [
      `  float next = (l + r + u + d) * 0.5 - s.g;
  next *= 0.984;
  if (uDrop.z != 0.0){
    float dd = distance(vUv, uDrop.xy);
    next += uDrop.z * exp(-dd * dd * 3800.0);
  }`,
      `  float ul = texture(uState, vUv + vec2(-uTexel.x,  uTexel.y)).r;
  float ur = texture(uState, vUv + vec2( uTexel.x,  uTexel.y)).r;
  float dl = texture(uState, vUv + vec2(-uTexel.x, -uTexel.y)).r;
  float dr = texture(uState, vUv + vec2( uTexel.x, -uTexel.y)).r;
  float orth = l + r + u + d;
  float diag = ul + ur + dl + dr;
  float lap = (4.0 * orth + diag - 20.0 * s.r) / 6.0;
  float next = 2.0 * s.r - s.g + 0.5 * lap;
  next *= 0.980;
  next = mix(next, (orth + diag) * 0.125, 0.02);
  if (uDrop.z != 0.0){
    float dd = distance(vUv, uDrop.xy);
    next += uDrop.z * exp(-dd * dd * (3800.0 / (1.0 + uDrop.z * 1.8)));
  }`,
    ],

    // 2. Caían gotas solas cada 0.5-1.9 s, así que había ondas aunque nadie
    //    tocara el ratón. Ahora son esporádicas y suaves: el agua respira, no
    //    hierve.
    [
      `      this.dropQueue.push({ x: 0.12 + Math.random() * 0.76, y: 0.12 + Math.random() * 0.76, s: 0.12 + Math.random() * 0.3 });
      this.nextAutoDrop = t + 0.5 + Math.random() * 1.4;`,
      `      this.dropQueue.push({ x: 0.12 + Math.random() * 0.76, y: 0.12 + Math.random() * 0.76, s: 0.04 + Math.random() * 0.07 });
      this.nextAutoDrop = t + 5.0 + Math.random() * 7.0;`,
    ],

    // 3. El puntero soltaba gota con casi cualquier micromovimiento
    //    (speed > 0.05) y con mucha fuerza. Ahora responde al gesto
    //    intencionado, no al temblor de la mano.
    [
      `        if (this.opts.sim && speed > 0.05 && this.dropQueue.length < 6)
          this.dropQueue.push({ x: p.x, y: p.y, s: Math.min(speed * 0.14, 0.55) });`,
      `        if (this.opts.sim && speed > 0.14 && this.dropQueue.length < 4)
          this.dropQueue.push({ x: p.x, y: p.y, s: Math.min(speed * 0.10, 0.34) });`,
    ],

    // 4. Crestas menos contrastadas: el relieve se nota, pero no destella.
    [
      `  col += vec3(0.09, 0.30, 0.40) * clamp(h * 1.8, -0.06, 1.0);
  col += vec3(0.25, 0.55, 0.65) * pow(clamp(h * 2.6, 0.0, 1.0), 2.0) * 0.5;`,
      `  col += vec3(0.075, 0.25, 0.33) * clamp(h * 1.55, -0.05, 1.0);
  col += vec3(0.20, 0.45, 0.54) * pow(clamp(h * 2.35, 0.0, 1.0), 2.0) * 0.40;`,
    ],

    // El clic sigue dejando su gota, pero sin el golpe de 0.9.
    ["this.dropQueue.push({ x: p.x, y: p.y, s: 0.9 });", "this.dropQueue.push({ x: p.x, y: p.y, s: 0.45 });"],
  ] as const;

  const patched = [...WATER_DETAIL_PATCHES, MARK_PATCH, ...CALM_PATCHES].reduce(
    (document, [original, enhanced]) => document.replace(original, enhanced),
    elementalMarksSource,
  );

  return patched
    .replace(/<link[^>]+fonts\.googleapis\.com[^>]*>/gi, "")
    .replace(/<link[^>]+fonts\.gstatic\.com[^>]*>/gi, "")
    .replace("</head>", `${focusStyles}${controls}</head>`)
    .replace(/openai: "[^"]*"/, `openai: "${OCEOM_MARK_PATH}"`)
    .replace("count: 160", `count: ${particleCount}`)
    .replace("zoom: 1.06", `zoom: ${zoom.toFixed(4)}`)
    .replace(
      "for (const p of panels) p.draw(t);",
      "if (!window.__ELEMENTS_PAUSED) for (const p of panels) p.draw(t);",
    );
}

export function OceomWaterBackground() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [documentVisible, setDocumentVisible] = useState(
    () => typeof document === "undefined" || !document.hidden,
  );
  const source = useMemo(() => buildDocument(), []);
  const paused = !documentVisible;

  const postControls = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      { type: "elements-controls", controls: { speed: WATER.speed, paused } },
      "*",
    );
  }, [paused]);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;
    const update = () => setDocumentVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  useEffect(() => {
    postControls();
  }, [postControls, source]);

  // El puntero de la página se reenvía al iframe. Se acumula en un ref y se
  // envía una vez por frame: mover el ratón no debe disparar un postMessage
  // por cada evento.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    let frame = 0;
    let pending: { kind: string; x: number; y: number } | null = null;

    const flush = () => {
      frame = 0;
      if (!pending) return;
      iframeRef.current?.contentWindow?.postMessage(
        { type: "oceom-water-pointer", ...pending },
        "*",
      );
      pending = null;
    };
    const queue = (kind: string, event: PointerEvent) => {
      pending = { kind, x: event.clientX, y: event.clientY };
      if (!frame) frame = requestAnimationFrame(flush);
    };

    const onMove = (event: PointerEvent) => queue("pointermove", event);
    const onDown = (event: PointerEvent) => queue("pointerdown", event);
    const onUp = (event: PointerEvent) => queue("pointerup", event);
    const onLeave = (event: PointerEvent) => queue("pointerleave", event);

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.addEventListener("pointerleave", onLeave, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return (
    <div
      aria-hidden
      className="threeui-background elements"
      data-element="water"
      /* La posición va inline a propósito: `.threeui-background` de ThreeUI
         declara `position: relative` y gana a las utilidades de Tailwind, lo
         que dejaba el host con altura 0. */
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -10,
        pointerEvents: "none",
        background: "transparent",
      }}
    >
      <iframe
        ref={iframeRef}
        title="Fondo de agua"
        srcDoc={source}
        sandbox="allow-scripts"
        onLoad={postControls}
        aria-hidden="true"
        tabIndex={-1}
        style={{
          position: "absolute",
          inset: 0,
          display: "block",
          width: "100%",
          height: "100%",
          border: 0,
          background: "transparent",
          pointerEvents: "none",
          opacity: clamp(WATER.opacity, 0.05, 1),
          filter: `hue-rotate(${clamp(WATER.hue, -180, 180)}deg) saturate(${clamp(WATER.saturation, 0, 2)}) brightness(${clamp(WATER.brightness, 0.35, 1.8)})`,
        }}
      />
    </div>
  );
}
