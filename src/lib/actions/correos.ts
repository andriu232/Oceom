"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireRole } from "@/lib/auth";
import { sendEmailDetailed } from "@/lib/email/send";
import { renderFor, unsubUrlFor } from "@/lib/email/campaigns/run";

/* ============================================================
   Acciones del centro de correos. Todas exigen mentora o super admin, y
   además las policies de mail_campaigns solo dejan pasar a is_mentor():
   dos cerrojos, porque un fallo aquí manda correo a gente real.
   ============================================================ */

export type CorreosState = { ok?: boolean; error?: string; info?: string } | undefined;

const prefsSchema = z.object({
  id: z.string().uuid(),
  enabled: z.boolean(),
  cadence: z.enum(["diaria", "semanal", "quincenal", "mensual"]),
  weekday: z.coerce.number().int().min(0).max(6).nullable(),
  hour: z.coerce.number().int().min(0).max(23).nullable(),
  audience: z.enum(["todos", "elegidos", "activos"]),
});

/** Guarda la configuración de una campaña. */
export async function updateCampaignAction(
  _prev: CorreosState,
  formData: FormData,
): Promise<CorreosState> {
  await requireRole("mentor", "super_admin");

  const rawHour = String(formData.get("hour") ?? "");
  const rawWeekday = String(formData.get("weekday") ?? "");
  const parsed = prefsSchema.safeParse({
    id: formData.get("id"),
    enabled: formData.get("enabled") === "on" || formData.get("enabled") === "true",
    cadence: formData.get("cadence") ?? "diaria",
    // "" = a la hora que eligió cada persona.
    hour: rawHour === "" ? null : rawHour,
    weekday: rawWeekday === "" ? null : rawWeekday,
    audience: formData.get("audience") ?? "todos",
  });
  if (!parsed.success) return { error: "Revisa la frecuencia, el día y la hora." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("mail_campaigns")
    .update({
      enabled: parsed.data.enabled,
      cadence: parsed.data.cadence,
      weekday: parsed.data.cadence === "semanal" ? parsed.data.weekday : null,
      hour: parsed.data.hour,
      audience: parsed.data.audience,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.id);
  if (error) return { error: "No se pudo guardar la campaña." };

  revalidatePath("/correos-admin");
  return { ok: true };
}

/** Reemplaza la lista de destinatarios elegidos a mano. */
export async function setRecipientsAction(
  _prev: CorreosState,
  formData: FormData,
): Promise<CorreosState> {
  await requireRole("mentor", "super_admin");

  const campaignId = String(formData.get("id") ?? "");
  if (!z.string().uuid().safeParse(campaignId).success) {
    return { error: "Campaña no válida." };
  }
  const ids = formData
    .getAll("user")
    .map(String)
    .filter((v) => z.string().uuid().safeParse(v).success);

  const supabase = await createClient();
  // Se borra y se vuelve a insertar: la lista completa llega en cada guardado,
  // así que calcular altas y bajas por separado solo añadiría formas de fallar.
  const { error: delErr } = await supabase
    .from("mail_campaign_recipients")
    .delete()
    .eq("campaign_id", campaignId);
  if (delErr) return { error: "No se pudo actualizar la lista." };

  if (ids.length > 0) {
    const { error } = await supabase
      .from("mail_campaign_recipients")
      .insert(ids.map((user_id) => ({ campaign_id: campaignId, user_id })));
    if (error) return { error: "No se pudo actualizar la lista." };
  }

  revalidatePath("/correos-admin");
  return { ok: true, info: `${ids.length} destinatario(s) guardados.` };
}

/** Se manda a sí misma una prueba, para leer el correo antes que nadie. */
export async function sendTestAction(
  _prev: CorreosState,
  formData: FormData,
): Promise<CorreosState> {
  const me = await requireRole("mentor", "super_admin");
  if (!me.email) return { error: "Tu perfil no tiene correo." };

  const slug = String(formData.get("slug") ?? "");
  const campaignId = String(formData.get("id") ?? "");

  // El token de baja es el suyo de verdad: si el enlace del correo está roto,
  // es mejor descubrirlo aquí que cuando ya salió para todo el grupo.
  const svc = createServiceClient();
  const { data: perfil } = await svc
    .from("profiles")
    .select("full_name, mail_token")
    .eq("id", me.id)
    .maybeSingle();
  if (!perfil) return { error: "No se encontró tu perfil." };

  const mail = renderFor(slug, {
    full_name: perfil.full_name as string | null,
    mail_token: perfil.mail_token as string,
  });
  if (!mail) return { error: "Esa campaña no tiene plantilla en el código." };

  const unsubUrl = unsubUrlFor(perfil.mail_token as string);
  const envio = await sendEmailDetailed({
    to: me.email,
    subject: `[Prueba] ${mail.subject}`,
    html: mail.html,
    text: mail.text,
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    headers: {
      "List-Unsubscribe": `<${unsubUrl}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  await svc.from("mail_sends").insert({
    campaign_id: campaignId || null,
    user_id: me.id,
    subject: `[Prueba] ${mail.subject}`,
    ok: envio.ok,
    is_test: true,
    error: envio.error,
  });

  revalidatePath("/correos-admin");
  if (!envio.ok) {
    // El motivo viene de Resend tal cual: "domain is not verified", "invalid
    // API key"… Decirlo ahorra media hora de adivinar.
    return { error: `No salió: ${envio.error ?? "motivo desconocido"}` };
  }
  return { ok: true, info: `Prueba enviada a ${me.email}.` };
}

/** Vuelve a activar los correos de alguien que se dio de baja. */
export async function resubscribeAction(
  _prev: CorreosState,
  formData: FormData,
): Promise<CorreosState> {
  await requireRole("mentor", "super_admin");

  const userId = String(formData.get("user") ?? "");
  if (!z.string().uuid().safeParse(userId).success) return { error: "Persona no válida." };

  // Con service_role a propósito: la policy de profiles solo deja editar el
  // perfil propio, y la mentora necesita poder deshacer una baja por error.
  // El rol ya se comprobó arriba.
  const svc = createServiceClient();
  const { error } = await svc
    .from("profiles")
    .update({ mail_opt_in: true })
    .eq("id", userId);
  if (error) return { error: "No se pudo reactivar." };

  revalidatePath("/correos-admin");
  return { ok: true };
}
