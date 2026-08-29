/* Envío de correos vía Resend (API REST, sin dependencia). Si falta
   RESEND_API_KEY, hace no-op silencioso (no rompe el flujo). */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  /** Contenido .ics a adjuntar (se codifica en base64). */
  icsContent?: string;
  /** Cabeceras extra. Se usan para List-Unsubscribe en los correos
   *  recurrentes: sin ellas, Gmail y Outlook empiezan a mandar a spam. */
  headers?: Record<string, string>;
}

export interface SendResult {
  ok: boolean;
  /** Id del correo en Resend, para buscarlo en su panel. */
  id: string | null;
  /** Motivo real del fallo, tal como lo devuelve Resend. Se guarda en
   *  mail_sends para que el panel diga QUÉ pasó y no solo que falló. */
  error: string | null;
}

/** Envía y cuenta qué pasó. `sendEmail` es la versión corta para quien solo
 *  necesita saber si salió. */
export async function sendEmailDetailed(input: SendEmailInput): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "OCEOM <onboarding@resend.dev>";

  if (!key) {
    console.warn(`[email] RESEND_API_KEY ausente — no se envió: "${input.subject}"`);
    return { ok: false, id: null, error: "Falta RESEND_API_KEY en el entorno." };
  }

  const body: Record<string, unknown> = {
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  };
  if (input.replyTo) body.reply_to = input.replyTo;
  if (input.headers && Object.keys(input.headers).length > 0) {
    body.headers = input.headers;
  }
  if (input.icsContent) {
    body.attachments = [
      {
        filename: "oceom-clase.ics",
        content: Buffer.from(input.icsContent).toString("base64"),
      },
    ];
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const texto = await res.text();
    if (!res.ok) {
      console.error("[email] fallo Resend:", res.status, texto);
      let motivo = `Resend respondió ${res.status}.`;
      try {
        const j = JSON.parse(texto) as { message?: string };
        if (j.message) motivo = j.message;
      } catch {
        /* Resend devolvió algo que no es JSON: queda el código de estado. */
      }
      return { ok: false, id: null, error: motivo };
    }

    let id: string | null = null;
    try {
      id = (JSON.parse(texto) as { id?: string }).id ?? null;
    } catch {
      /* El envío salió bien; solo nos quedamos sin el id. */
    }
    return { ok: true, id, error: null };
  } catch (err) {
    const motivo = err instanceof Error ? err.message : "error de red";
    console.error("[email] error de red:", err);
    return { ok: false, id: null, error: motivo };
  }
}

/** Versión corta: true si salió. */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  return (await sendEmailDetailed(input)).ok;
}
