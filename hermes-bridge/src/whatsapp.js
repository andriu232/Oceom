import { Boom } from "@hapi/boom";
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import pino from "pino";
import qrcode from "qrcode-terminal";
import { config } from "./config.js";

/* ============================================================
   La conexión con WhatsApp.

   El bridge es TONTO a propósito: sostiene el socket, reenvía lo que llega a
   OCEOM y envía lo que OCEOM le pide. No decide nada, no guarda nada, no
   habla con ningún modelo. Toda la inteligencia vive en OCEOM.

   Esto importa por dos razones: si el bridge se cae no se pierde ningún dato
   (solo la conexión), y cambiar a la Cloud API de Meta algún día es tirar
   esta carpeta a la basura sin tocar el resto.
   ============================================================ */

// Baileys es MUY hablador en nivel debug; solo interesan los errores.
const logger = pino({ level: process.env.BAILEYS_LOG_LEVEL || "error" });

let sock = null;
let estado = "arrancando";
let ultimoQr = null;
/** Reintentos consecutivos de reconexión, para espaciarlos. */
let intentos = 0;

/** IDs de los mensajes que enviamos nosotros. WhatsApp devuelve por el mismo
 *  canal lo que uno manda (`fromMe`), y sin esto Hermes se leería a sí mismo
 *  y contestaría a sus propias respuestas en bucle. */
const enviadosPorNosotros = new Set();
const MAX_ENVIADOS = 500;

function recordarEnviado(id) {
  enviadosPorNosotros.add(id);
  if (enviadosPorNosotros.size > MAX_ENVIADOS) {
    // Se descarta el más viejo: los Set de JS conservan orden de inserción.
    enviadosPorNosotros.delete(enviadosPorNosotros.values().next().value);
  }
}

export function estadoConexion() {
  return { estado, tieneQr: !!ultimoQr, intentos };
}

export function qrActual() {
  return ultimoQr;
}

/**
 * Abre la conexión y se reconecta sola.
 * @param {(mensajes: Array<{id:string,from:string,type:string,text?:string}>) => Promise<void>} onMessages
 */
export async function conectar(onMessages) {
  const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
  const { version } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    auth: state,
    logger,
    // El QR se pinta en el manejador de abajo, no aquí (esta opción está
    // deprecada en Baileys 6.7 y ensucia los logs).
    printQRInTerminal: false,
    // Sin esto WhatsApp muestra "Hermes está escribiendo" a destiempo y
    // marca presencia rara en los chats.
    markOnlineOnConnect: false,
    syncFullHistory: false,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      ultimoQr = qr;
      estado = "esperando-qr";
      console.log("\n[whatsapp] Escanea este QR con el celular de Hermes:\n");
      qrcode.generate(qr, { small: true });
      console.log("\nWhatsApp → Dispositivos vinculados → Vincular un dispositivo\n");
    }

    if (connection === "open") {
      ultimoQr = null;
      intentos = 0;
      estado = "conectado";
      console.log("[whatsapp] Conectado como", sock.user?.id ?? "(sin id)");
    }

    if (connection === "close") {
      const codigo = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const cerroSesion = codigo === DisconnectReason.loggedOut;

      if (cerroSesion) {
        // Sesión revocada desde el celular: no sirve reintentar, hay que
        // borrar la carpeta de auth y volver a escanear.
        estado = "sesion-cerrada";
        console.error(
          "[whatsapp] La sesión fue cerrada desde el teléfono. Borra la carpeta de auth y vuelve a escanear el QR.",
        );
        return;
      }

      intentos++;
      // Espera creciente hasta 60 s: reconectar en bucle rápido es justo lo
      // que hace que WhatsApp marque el número como abusivo.
      const espera = Math.min(60_000, 2_000 * 2 ** Math.min(intentos, 5));
      estado = "reconectando";
      console.warn(
        `[whatsapp] Conexión caída (código ${codigo ?? "?"}). Reintento ${intentos} en ${espera / 1000}s.`,
      );
      setTimeout(() => conectar(onMessages).catch((e) => console.error("[whatsapp]", e)), espera);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    // "notify" = mensajes nuevos. "append" es sincronización de historial,
    // que se ignora: si no, al reconectar Hermes reprocesaría días enteros.
    if (type !== "notify") return;

    const utiles = [];
    for (const m of messages) {
      const jid = m.key?.remoteJid ?? "";

      // Solo chats 1 a 1. Fuera grupos, estados y canales.
      if (!jid.endsWith("@s.whatsapp.net")) continue;
      // Fuera lo que enviamos nosotros.
      if (m.key?.fromMe) continue;
      if (m.key?.id && enviadosPorNosotros.has(m.key.id)) continue;

      const texto =
        m.message?.conversation ??
        m.message?.extendedTextMessage?.text ??
        null;

      const tipo = texto
        ? "text"
        : m.message?.audioMessage
          ? "audio"
          : m.message?.imageMessage
            ? "image"
            : "otro";

      utiles.push({
        id: m.key.id,
        from: jid.split("@")[0],
        type: tipo,
        ...(texto ? { text: texto } : {}),
      });
    }

    if (utiles.length === 0) return;

    try {
      // Marcar como leído es cosmético, pero la persona ve que llegó.
      await sock.readMessages(messages.map((m) => m.key)).catch(() => {});
      await onMessages(utiles);
    } catch (e) {
      console.error("[whatsapp] error reenviando a OCEOM:", e.message);
    }
  });

  return sock;
}

/** Envía un texto. Lo llama OCEOM por /send. */
export async function enviarTexto(numero, texto) {
  if (!sock || estado !== "conectado") {
    throw new Error(`El bridge no está conectado a WhatsApp (estado: ${estado}).`);
  }

  const jid = `${numero.replace(/\D/g, "")}@s.whatsapp.net`;

  // "escribiendo…" antes de responder: hace que Hermes se sienta presente
  // en vez de un bot que dispara texto instantáneo.
  await sock.presenceSubscribe(jid).catch(() => {});
  await sock.sendPresenceUpdate("composing", jid).catch(() => {});

  const res = await sock.sendMessage(jid, { text: texto });
  await sock.sendPresenceUpdate("paused", jid).catch(() => {});

  if (res?.key?.id) recordarEnviado(res.key.id);
  return res?.key?.id ?? null;
}
