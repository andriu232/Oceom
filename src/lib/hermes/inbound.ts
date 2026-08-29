import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { detectRedFlag, redFlagResponse } from "@/lib/biocode/safety";
import { classifyAndReply, type ConversationTurn } from "./agent";
import { inboundVariants } from "./phone";
import { sendText, markRead } from "./wa";

/* ============================================================
   Qué pasa cuando alguien le escribe a HERMES.

   Orden deliberado:
     1) idempotencia — WhatsApp reintenta los webhooks; el mismo wamid no
        puede crear dos entradas de bitácora.
     2) identidad — número desconocido no escribe en la bitácora de nadie.
     3) comandos — BAJA / AYUDA se resuelven sin gastar una llamada al modelo.
     4) banderas rojas — se evalúan ANTES del modelo. La seguridad no se
        delega a la IA (mismo criterio que MAPA BIOCODE).
     5) el modelo — clasifica, extrae emoción y redacta la respuesta.
     6) se guarda y se responde.
   ============================================================ */

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://oceom.33vertebras.com";

const NO_RECONOCIDO = `Hola. Soy Hermes, el mensajero de OCEOM.

No reconozco este número todavía, así que no puedo guardar nada en tu bitácora.

Para vincularlo entra a ${SITE}/ajustes, escribe este mismo celular y confirma el código que te enviaré por aquí. Toma menos de un minuto.`;

const AYUDA = `Soy Hermes, y estoy aquí para que tu Bitácora Interior no dependa de que te acuerdes de abrir la app.

Escríbeme cuando quieras cómo te sientes o qué te pasó: lo guardo en tu bitácora dentro de OCEOM y te acompaño un momento.

Si me cuentas un sueño, lo guardo en tu diario de sueños.

Escribe BAJA si prefieres que deje de recordarte. Escribe VOLVER para reactivarlo.

Tu bitácora completa está en ${SITE}/bitacora`;

const BAJA_OK = `Listo, no te enviaré más recordatorios.

Si algún día quieres que vuelva a acompañarte, escríbeme VOLVER. Y aunque no te recuerde nada, si me escribes lo sigo guardando en tu bitácora.`;

const VOLVER_OK = `Qué bueno tenerte de vuelta. Retomo los recordatorios de tu bitácora.`;

export interface InboundMessage {
  waMessageId: string;
  from: string;
  /** "text" | "audio" | otros tipos que no manejamos. */
  type: string;
  text?: string;
}

/** Procesa un mensaje entrante de punta a punta. Nunca lanza: cualquier
 *  error se registra y se devuelve, para que el webhook siga respondiendo 200
 *  (si no, Meta reintenta en bucle). */
export async function handleInbound(msg: InboundMessage): Promise<void> {
  const svc = createServiceClient();
  const phone = `+${msg.from.replace(/\D/g, "")}`;

  // ---- 1) Idempotencia ----
  const { data: seen } = await svc
    .from("hermes_messages")
    .select("id")
    .eq("wa_message_id", msg.waMessageId)
    .maybeSingle();
  if (seen) return;

  // ---- 2) Identidad ----
  // Meta puede entregar el número con o sin el 9/1 de Argentina y México.
  const { data: profile } = await svc
    .from("profiles")
    .select("id, full_name, hermes_opt_in")
    .in("phone_e164", inboundVariants(msg.from))
    .maybeSingle();

  if (!profile) {
    // Se registra el mensaje (sin user_id) para que quede rastro, pero no se
    // guarda su contenido en ninguna bitácora.
    await svc.from("hermes_messages").insert({
      phone_e164: phone,
      direction: "in",
      kind: "texto",
      body: msg.text ?? `[${msg.type}]`,
      wa_message_id: msg.waMessageId,
      error: "número no vinculado",
    });
    await reply(svc, null, phone, NO_RECONOCIDO, "sistema");
    return;
  }

  await markRead(msg.waMessageId);

  // ---- Resolver el texto ----
  // Hoy Hermes solo lee texto. Las notas de voz se reconocen y se responden
  // con cariño en vez de perderse en silencio (transcribirlas es el paso
  // siguiente: `downloadMedia` en wa.ts ya trae el audio).
  const body = (msg.text ?? "").trim();

  if (msg.type !== "text" || !body) {
    const esAudio = msg.type === "audio";
    await logIn(svc, profile.id, phone, esAudio ? "audio" : "texto", msg.text ?? `[${msg.type}]`, msg.waMessageId, {
      error: msg.type !== "text" ? `tipo no soportado: ${msg.type}` : "mensaje vacío",
    });
    await reply(
      svc,
      profile.id,
      phone,
      esAudio
        ? "Escuché que me mandaste un audio, pero por ahora solo sé leer. ¿Me lo escribes? Aunque sea en pocas palabras, lo guardo en tu bitácora."
        : "Por ahora solo puedo leer texto. Cuéntame por aquí cómo estás y lo guardo en tu bitácora.",
      "sistema",
    );
    return;
  }

  // ---- 3) Comandos ----
  const command = parseCommand(body);
  if (command) {
    await logIn(svc, profile.id, phone, "texto", body, msg.waMessageId);

    if (command === "baja") {
      await svc.from("profiles").update({ hermes_opt_in: false }).eq("id", profile.id);
      await reply(svc, profile.id, phone, BAJA_OK, "sistema");
    } else if (command === "volver") {
      await svc.from("profiles").update({ hermes_opt_in: true }).eq("id", profile.id);
      await reply(svc, profile.id, phone, VOLVER_OK, "sistema");
    } else {
      await reply(svc, profile.id, phone, AYUDA, "sistema");
    }
    return;
  }

  // ---- 4) Banderas rojas (antes del modelo) ----
  const flag = detectRedFlag(body);
  if (flag) {
    // Se guarda igual en la bitácora: es información que Valeria necesita ver.
    const entryId = await saveJournal(svc, profile.id, {
      title: null,
      content: body,
      emotion: null,
      intensity: null,
      isInsight: false,
    });

    await logIn(svc, profile.id, phone, "texto", body, msg.waMessageId, {
      journalEntryId: entryId,
      redFlag: flag,
    });

    await reply(svc, profile.id, phone, redFlagResponse(flag), "sistema");
    await notifyMentor(svc, profile.id, profile.full_name ?? "Una persona", flag);
    return;
  }

  // ---- 5) El modelo ----
  const history = await recentTurns(svc, profile.id);
  const reading = await classifyAndReply(body, history, {
    firstName: firstName(profile.full_name as string | null),
  });

  // ---- 6) Guardar y responder ----
  let journalEntryId: string | null = null;
  let dreamEntryId: string | null = null;

  if (reading.kind === "sueno") {
    dreamEntryId = await saveDream(svc, profile.id, {
      title: reading.title,
      content: body,
      emotion: reading.emotion,
      intensity: reading.intensity,
      symbols: reading.symbols,
      dreamType: reading.dreamType,
    });
  } else if (reading.kind === "bitacora") {
    journalEntryId = await saveJournal(svc, profile.id, {
      title: reading.title,
      content: body,
      emotion: reading.emotion,
      intensity: reading.intensity,
      isInsight: reading.isInsight,
    });
  }

  await logIn(svc, profile.id, phone, "texto", body, msg.waMessageId, {
    journalEntryId,
    dreamEntryId,
    error: reading.degraded ? "modelo no disponible (guardado sin análisis)" : null,
  });

  await reply(svc, profile.id, phone, reading.reply, "texto");
}

/* ---------------- piezas ---------------- */

type Svc = ReturnType<typeof createServiceClient>;

function firstName(full: string | null): string | null {
  return full?.trim().split(/\s+/)[0] ?? null;
}

/** Comandos que se resuelven sin modelo. Solo si el mensaje ES el comando:
 *  "no quiero darme de baja de la vida" no debe apagar los recordatorios. */
function parseCommand(text: string): "baja" | "volver" | "ayuda" | null {
  const t = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z\s]/g, "")
    .trim();
  if (t.length > 20) return null;

  if (/^(baja|darme de baja|stop|parar|no mas mensajes|desactivar)$/.test(t)) return "baja";
  if (/^(volver|reactivar|activar|regresar)$/.test(t)) return "volver";
  if (/^(ayuda|help|menu|que puedes hacer|info)$/.test(t)) return "ayuda";
  return null;
}

/** Últimos turnos de la conversación, para que Hermes tenga hilo. */
async function recentTurns(svc: Svc, userId: string): Promise<ConversationTurn[]> {
  const { data } = await svc
    .from("hermes_messages")
    .select("direction, body, created_at")
    .eq("user_id", userId)
    .not("body", "is", null)
    .order("created_at", { ascending: false })
    .limit(6);

  return (data ?? [])
    .reverse()
    .map((m) => ({
      role: (m.direction === "in" ? "user" : "assistant") as "user" | "assistant",
      content: m.body as string,
    }));
}

async function saveJournal(
  svc: Svc,
  studentId: string,
  e: {
    title: string | null;
    content: string;
    emotion: string | null;
    intensity: number | null;
    isInsight: boolean;
  },
): Promise<string | null> {
  const { data, error } = await svc
    .from("journal_entries")
    .insert({
      student_id: studentId,
      title: e.title,
      content: e.content,
      emotion: e.emotion,
      intensity: e.intensity,
      is_insight: e.isInsight,
      is_private: false,
      source: "whatsapp",
    })
    .select("id")
    .single();
  if (error) {
    console.error("[hermes] no se pudo guardar la entrada:", error.message);
    return null;
  }
  return data.id as string;
}

async function saveDream(
  svc: Svc,
  studentId: string,
  d: {
    title: string | null;
    content: string;
    emotion: string | null;
    intensity: number | null;
    symbols: string | null;
    dreamType: string;
  },
): Promise<string | null> {
  const { data, error } = await svc
    .from("dream_entries")
    .insert({
      student_id: studentId,
      title: d.title,
      content: d.content,
      emotion: d.emotion,
      intensity: d.intensity,
      symbols: d.symbols,
      dream_type: d.dreamType,
      source: "whatsapp",
    })
    .select("id")
    .single();
  if (error) {
    console.error("[hermes] no se pudo guardar el sueño:", error.message);
    return null;
  }
  return data.id as string;
}

async function logIn(
  svc: Svc,
  userId: string | null,
  phone: string,
  kind: string,
  body: string,
  waMessageId: string,
  extra: {
    journalEntryId?: string | null;
    dreamEntryId?: string | null;
    redFlag?: string | null;
    error?: string | null;
  } = {},
): Promise<void> {
  await svc.from("hermes_messages").insert({
    user_id: userId,
    phone_e164: phone,
    direction: "in",
    kind,
    body,
    wa_message_id: waMessageId,
    journal_entry_id: extra.journalEntryId ?? null,
    dream_entry_id: extra.dreamEntryId ?? null,
    red_flag: extra.redFlag ?? null,
    error: extra.error ?? null,
  });
}

/** Envía la respuesta y la deja registrada en la conversación. */
async function reply(
  svc: Svc,
  userId: string | null,
  phone: string,
  text: string,
  kind: string,
): Promise<void> {
  const sent = await sendText(phone, text);
  await svc.from("hermes_messages").insert({
    user_id: userId,
    phone_e164: phone,
    direction: "out",
    kind,
    body: text,
    wa_message_id: sent.messageId ?? null,
    error: sent.ok ? null : sent.error,
  });
}

/** Una bandera roja no se queda solo en el log: Valeria tiene que enterarse. */
async function notifyMentor(
  svc: Svc,
  studentId: string,
  studentName: string,
  flag: string,
): Promise<void> {
  const { data: mentors } = await svc
    .from("profiles")
    .select("id")
    .in("role", ["mentor", "super_admin"]);

  if (!mentors?.length) return;

  const title =
    flag === "crisis"
      ? `⚠️ ${studentName} escribió algo que necesita tu atención`
      : `⚠️ ${studentName} describió síntomas que piden valoración médica`;

  await svc.from("notifications").insert(
    mentors.map((m) => ({
      user_id: m.id,
      kind: "hermes_alerta",
      title,
      body: "Hermes ya le respondió con el protocolo de seguridad y detuvo el acompañamiento. Revisa su bitácora.",
      link: `/seguimiento?estudiante=${studentId}`,
    })),
  );
}
