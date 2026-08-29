import crypto from "node:crypto";

/* ============================================================
   Configuración del bridge. Se valida al arrancar: es preferible no
   levantar a levantar mal y que los mensajes se pierdan en silencio.
   ============================================================ */

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`[config] Falta la variable ${name}. El bridge no puede arrancar.`);
    process.exit(1);
  }
  return v;
}

export const config = {
  oceomUrl: (process.env.OCEOM_URL || "https://oceom.33vertebras.com").replace(/\/+$/, ""),
  secret: required("HERMES_BRIDGE_SECRET"),
  port: Number(process.env.PORT || 8080),
  authDir: process.env.AUTH_DIR || "./auth",
};

/** Firma HMAC compartida con OCEOM. El timestamp entra en la firma para que
 *  capturar una petición no permita reenviarla más tarde. Debe coincidir
 *  exactamente con `signBridgePayload` de src/lib/hermes/wa.ts. */
export function sign(timestamp, body) {
  return crypto
    .createHmac("sha256", config.secret)
    .update(`${timestamp}.${body}`)
    .digest("hex");
}

/** Comparación en tiempo constante de dos hex. */
export function safeEqual(a, b) {
  const ba = Buffer.from(a, "hex");
  const bb = Buffer.from(b, "hex");
  if (ba.length !== bb.length || ba.length === 0) return false;
  return crypto.timingSafeEqual(ba, bb);
}
