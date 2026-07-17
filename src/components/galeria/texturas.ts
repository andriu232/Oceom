"use client";

import * as THREE from "three";

/* ============================================================
   Texturas generadas en canvas para la galería orbital: paneles de
   poema (Galería Astral) y paneles de mundo (portada de OCEOM LAB).
   1024×640 (relación del panel 6.4:4). Solo cliente.
   ============================================================ */

// Sistema de dibujo LÓGICO (las coordenadas se escriben en 1024×640) pero el
// canvas se rasteriza a SCALE× para que el texto salga nítido en paneles grandes.
const W = 1024;
const H = 640;
const SCALE = 2;

function baseCanvas() {
  const c = document.createElement("canvas");
  c.width = W * SCALE;
  c.height = H * SCALE;
  const ctx = c.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#0a1e33");
  bg.addColorStop(1, "#03060e");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  return { c, ctx };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const probe = line ? line + " " + w : w;
    if (ctx.measureText(probe).width > maxWidth && line) {
      lines.push(line);
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = probe;
    }
  }
  if (lines.length < maxLines && line) lines.push(line);
  if (lines.length === maxLines && words.join(" ").length > lines.join(" ").length) {
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s+\S*$/, "") + "…";
  }
  return lines;
}

function toTexture(c: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.generateMipmaps = true;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  return tex;
}

/** Relación alto/ancho de la etiqueta 3D (para el plano que la muestra). */
export const LABEL_RATIO = 460 / 1200;

/** Etiqueta 3D que flota SOBRE cada panel: índice "0X / 0Y" + título +
 *  descripción justo debajo. Fondo transparente (como la referencia). */
export function labelTexture(
  numText: string,
  title: string,
  desc?: string,
): THREE.Texture {
  const w = 1200;
  const h = 460;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, w, h);
  ctx.textAlign = "left";

  ctx.fillStyle = "rgba(148,220,255,0.9)";
  ctx.font = "600 30px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(numText, 8, 44);

  ctx.fillStyle = "#f2f6ff";
  ctx.font = "700 74px Sora, Inter, system-ui, sans-serif";
  ctx.shadowColor = "rgba(3,6,14,0.9)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 3;
  const line = wrapText(ctx, title, w - 40, 2)[0] ?? title;
  ctx.fillText(line, 8, 128);

  // Descripción justo debajo del título.
  if (desc) {
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = "rgba(226,236,255,0.78)";
    ctx.font = "400 37px Sora, Inter, system-ui, sans-serif";
    wrapText(ctx, desc, w - 20, 3).forEach((l, i) =>
      ctx.fillText(l, 8, 196 + i * 48),
    );
  }

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/** Panel de poema: título + primeros versos, estética editorial OCEOM. */
export function poemTexture(title: string, body: string): THREE.Texture {
  const { c, ctx } = baseCanvas();

  // Aura sutil
  const glow = ctx.createRadialGradient(W / 2, 40, 10, W / 2, 40, 500);
  glow.addColorStop(0, "rgba(34,211,238,0.16)");
  glow.addColorStop(1, "rgba(34,211,238,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = "rgba(94,234,212,0.85)";
  ctx.font = "600 26px Sora, Inter, system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("P O E M A", W / 2, 84);

  ctx.fillStyle = "#e8eefb";
  ctx.font = "700 52px Sora, Inter, system-ui, sans-serif";
  const titleLines = wrapText(ctx, title, W - 220, 2);
  titleLines.forEach((l, i) => ctx.fillText(l, W / 2, 168 + i * 62));

  // Versos (respetando saltos de línea del poema)
  ctx.fillStyle = "rgba(232,238,251,0.78)";
  ctx.font = "italic 400 30px Georgia, 'Times New Roman', serif";
  const rawLines = body.split("\n").map((l) => l.trim()).filter(Boolean);
  const shown: string[] = [];
  for (const rl of rawLines) {
    for (const piece of wrapText(ctx, rl, W - 260, 2)) shown.push(piece);
    if (shown.length >= 6) break;
  }
  const startY = titleLines.length > 1 ? 320 : 268;
  shown.slice(0, 6).forEach((l, i) => ctx.fillText(l, W / 2, startY + i * 46));
  if (rawLines.length > 6) {
    ctx.fillStyle = "rgba(138,160,198,0.7)";
    ctx.font = "400 24px Sora, Inter, system-ui, sans-serif";
    ctx.fillText("· toca para leerlo completo ·", W / 2, H - 44);
  }

  // Hairline inferior
  const line = ctx.createLinearGradient(200, 0, W - 200, 0);
  line.addColorStop(0, "rgba(34,211,238,0)");
  line.addColorStop(0.5, "rgba(34,211,238,0.5)");
  line.addColorStop(1, "rgba(34,211,238,0)");
  ctx.fillStyle = line;
  ctx.fillRect(200, H - 84, W - 400, 2);

  return toTexture(c);
}

/** Panel de mundo del LAB: número + nombre + objetivo con acento propio. */
export function worldTexture(
  n: number,
  name: string,
  objetivo: string,
  accent: string,
): THREE.Texture {
  const { c, ctx } = baseCanvas();

  // Glow del acento
  const glow = ctx.createRadialGradient(180, 140, 20, 180, 140, 460);
  glow.addColorStop(0, accent + "3d");
  glow.addColorStop(1, accent + "00");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Anillos decorativos
  ctx.strokeStyle = accent + "2e";
  ctx.lineWidth = 2;
  for (const r of [150, 210, 270]) {
    ctx.beginPath();
    ctx.arc(W - 150, H - 90, r, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.textAlign = "left";
  ctx.fillStyle = accent;
  ctx.font = "700 34px 'JetBrains Mono', ui-monospace, monospace";
  ctx.fillText(`MUNDO ${String(n).padStart(2, "0")}`, 90, 130);

  ctx.fillStyle = "#e8eefb";
  ctx.font = "700 64px Sora, Inter, system-ui, sans-serif";
  const nameLines = wrapText(ctx, name, W - 220, 2);
  nameLines.forEach((l, i) => ctx.fillText(l, 90, 236 + i * 74));

  ctx.fillStyle = "rgba(232,238,251,0.7)";
  ctx.font = "400 30px Sora, Inter, system-ui, sans-serif";
  const objLines = wrapText(ctx, objetivo, W - 240, 3);
  const oy = nameLines.length > 1 ? 420 : 350;
  objLines.forEach((l, i) => ctx.fillText(l, 90, oy + i * 44));

  ctx.fillStyle = accent + "cc";
  ctx.font = "600 24px Sora, Inter, system-ui, sans-serif";
  ctx.fillText("· toca para explorar ·", 90, H - 60);

  return toTexture(c);
}
