import http from "node:http";
import { config, sign, safeEqual } from "./config.js";
import { conectar, enviarTexto, estadoConexion, qrActual } from "./whatsapp.js";

/* ============================================================
   HERMES bridge — puente entre WhatsApp y OCEOM.

   Entrante:  WhatsApp → este proceso → POST {OCEOM_URL}/api/hermes/bridge
   Saliente:  OCEOM → POST /send de este proceso → WhatsApp

   Ambos sentidos van firmados con HMAC-SHA256 sobre `timestamp.cuerpo`,
   con el mismo secreto compartido. Sin eso, cualquiera que descubra la URL
   del bridge podría escribirle a los estudiantes en nombre de Hermes.
   ============================================================ */

const MAX_SKEW_MS = 5 * 60 * 1000;

/* ---------------- entrante: WhatsApp → OCEOM ---------------- */

async function reenviarAOceom(mensajes) {
  const body = JSON.stringify({ messages: mensajes });
  const ts = String(Date.now());

  const res = await fetch(`${config.oceomUrl}/api/hermes/bridge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-hermes-timestamp": ts,
      "x-hermes-signature": sign(ts, body),
    },
    body,
    // OCEOM llama al modelo antes de responder; puede tardar.
    signal: AbortSignal.timeout(60_000),
  });

  if (!res.ok) {
    const detalle = await res.text().catch(() => "");
    throw new Error(`OCEOM respondió ${res.status}: ${detalle.slice(0, 200)}`);
  }
  console.log(`[bridge] ${mensajes.length} mensaje(s) entregado(s) a OCEOM.`);
}

/* ---------------- saliente: OCEOM → WhatsApp ---------------- */

function leerCuerpo(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => {
      data += c;
      // Freno de cordura: un mensaje de WhatsApp no llega a 100 KB.
      if (data.length > 100_000) reject(new Error("cuerpo demasiado grande"));
    });
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  // Salud: lo usan Railway/Fly para saber si el proceso vive, y tú para
  // saber si WhatsApp sigue conectado.
  if (req.method === "GET" && url.pathname === "/health") {
    return json(res, 200, { ok: true, ...estadoConexion() });
  }

  // El QR también por HTTP, por si despliegas donde no ves la consola.
  // Va detrás del mismo secreto: quien lo escanee se lleva la sesión.
  if (req.method === "GET" && url.pathname === "/qr") {
    if (url.searchParams.get("secret") !== config.secret) {
      return json(res, 401, { error: "no autorizado" });
    }
    const qr = qrActual();
    if (!qr) return json(res, 404, { error: "no hay QR pendiente", ...estadoConexion() });
    return json(res, 200, { qr });
  }

  if (req.method === "POST" && url.pathname === "/send") {
    let raw;
    try {
      raw = await leerCuerpo(req);
    } catch {
      return json(res, 413, { error: "cuerpo demasiado grande" });
    }

    const ts = req.headers["x-hermes-timestamp"];
    const sig = req.headers["x-hermes-signature"];
    if (!ts || !sig) return json(res, 401, { error: "falta firma" });

    const edad = Math.abs(Date.now() - Number(ts));
    if (!Number.isFinite(edad) || edad > MAX_SKEW_MS) {
      return json(res, 401, { error: "timestamp fuera de rango" });
    }
    if (!safeEqual(sign(ts, raw), String(sig))) {
      return json(res, 401, { error: "firma inválida" });
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      return json(res, 400, { error: "json inválido" });
    }
    if (!payload?.to || !payload?.text) {
      return json(res, 400, { error: "faltan 'to' o 'text'" });
    }

    try {
      const messageId = await enviarTexto(payload.to, payload.text);
      return json(res, 200, { ok: true, messageId });
    } catch (e) {
      console.error("[bridge] envío falló:", e.message);
      return json(res, 503, { error: e.message });
    }
  }

  return json(res, 404, { error: "no encontrado" });
});

server.listen(config.port, () => {
  console.log(`[bridge] Escuchando en :${config.port} · OCEOM = ${config.oceomUrl}`);
});

conectar(reenviarAOceom).catch((e) => {
  console.error("[bridge] no se pudo conectar a WhatsApp:", e);
  process.exit(1);
});

// Cierre limpio: si el contenedor se reinicia, que no quede el socket a medias.
for (const señal of ["SIGTERM", "SIGINT"]) {
  process.on(señal, () => {
    console.log(`[bridge] ${señal} recibido, cerrando.`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
