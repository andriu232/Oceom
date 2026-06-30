/* Envío de correos vía Resend (API REST, sin dependencia). Si falta
   RESEND_API_KEY, hace no-op silencioso (no rompe el flujo). */

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  /** Contenido .ics a adjuntar (se codifica en base64). */
  icsContent?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || "OCEOM <onboarding@resend.dev>";

  if (!key) {
    console.warn(`[email] RESEND_API_KEY ausente — no se envió: "${input.subject}"`);
    return false;
  }

  const body: Record<string, unknown> = {
    from,
    to: input.to,
    subject: input.subject,
    html: input.html,
  };
  if (input.replyTo) body.reply_to = input.replyTo;
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
    if (!res.ok) {
      console.error("[email] fallo Resend:", res.status, await res.text());
      return false;
    }
    return true;
  } catch (err) {
    console.error("[email] error de red:", err);
    return false;
  }
}
