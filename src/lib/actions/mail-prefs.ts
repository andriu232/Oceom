"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

/* ============================================================
   Preferencias de correo de la persona: si quiere recibirlos y a qué hora.
   QUÉ se le manda lo decide la mentora desde /correos-admin; esto es lo que
   decide cada quien sobre su propia bandeja.

   Va contra el cliente con RLS (no service_role) a propósito: la policy
   "perfil: edita propio" ya garantiza que nadie cambie las preferencias de
   otra persona, y así no hay una ruta con poderes de admin de por medio.
   ============================================================ */

export type MailPrefsState = { ok?: boolean; error?: string } | undefined;

const schema = z.object({
  opt_in: z.boolean(),
  hour: z.coerce.number().int().min(0).max(23),
  tz: z.string().min(1).max(64),
});

export async function updateMailPrefsAction(
  _prev: MailPrefsState,
  formData: FormData,
): Promise<MailPrefsState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const parsed = schema.safeParse({
    opt_in: formData.get("opt_in") === "on" || formData.get("opt_in") === "true",
    hour: formData.get("hour") ?? 20,
    tz: formData.get("tz") || "America/Bogota",
  });
  if (!parsed.success) return { error: "Revisa la hora." };

  // La zona horaria la manda el navegador: se valida contra Intl antes de
  // guardarla, o el cron reventaría al formatear con una zona inventada.
  let tz = parsed.data.tz;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    tz = "America/Bogota";
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      mail_opt_in: parsed.data.opt_in,
      mail_hour: parsed.data.hour,
      mail_tz: tz,
    })
    .eq("id", user.id);
  if (error) return { error: "No se pudieron guardar tus preferencias." };

  revalidatePath("/ajustes");
  return { ok: true };
}
