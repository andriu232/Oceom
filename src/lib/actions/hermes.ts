"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { requireRole } from "@/lib/auth";
import {
  startPhoneVerification,
  confirmPhoneVerification,
  linkPhoneAsMentor,
  unlinkPhone,
} from "@/lib/hermes/link";

/* ============================================================
   Acciones de HERMES.

   Autoservicio (estudiante): pedir código → confirmar código → preferencias.
   Manual (mentora): vincular o desvincular el número de un estudiante.
   ============================================================ */

export type HermesState = { ok?: boolean; error?: string; sent?: boolean } | undefined;

async function currentUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

/* ---------------- autoservicio ---------------- */

/** Paso 1: la persona declara su celular y Hermes le manda el código. */
export async function requestPhoneCodeAction(
  _prev: HermesState,
  formData: FormData,
): Promise<HermesState> {
  const userId = await currentUserId();
  if (!userId) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const phone = String(formData.get("phone") ?? "").trim();
  if (!phone) return { error: "Escribe tu número de WhatsApp." };

  const res = await startPhoneVerification(userId, phone);
  if (!res.ok) return { error: res.error };

  revalidatePath("/ajustes");
  return { ok: true, sent: true };
}

/** Paso 2: confirma el código de 6 dígitos. */
export async function confirmPhoneCodeAction(
  _prev: HermesState,
  formData: FormData,
): Promise<HermesState> {
  const userId = await currentUserId();
  if (!userId) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const code = String(formData.get("code") ?? "").trim();
  const res = await confirmPhoneVerification(userId, code);
  if (!res.ok) return { error: res.error };

  revalidatePath("/ajustes");
  return { ok: true };
}

const prefsSchema = z.object({
  opt_in: z.coerce.boolean(),
  hour: z.coerce.number().int().min(0).max(23),
  cadence: z.enum(["diario", "semanal", "nunca"]),
  tz: z.string().trim().min(1).max(64),
});

/** Ajusta cuándo y cada cuánto escribe Hermes. */
export async function updateHermesPrefsAction(
  _prev: HermesState,
  formData: FormData,
): Promise<HermesState> {
  const userId = await currentUserId();
  if (!userId) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const parsed = prefsSchema.safeParse({
    opt_in: formData.get("opt_in") === "on" || formData.get("opt_in") === "true",
    hour: formData.get("hour") ?? 20,
    cadence: formData.get("cadence") ?? "diario",
    tz: formData.get("tz") || "America/Bogota",
  });
  if (!parsed.success) return { error: "Revisa la hora y la frecuencia." };

  // La zona horaria la manda el navegador: se valida contra Intl antes de
  // guardarla, o el cron reventaría al formatear con una zona inventada.
  let tz = parsed.data.tz;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
  } catch {
    tz = "America/Bogota";
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      hermes_opt_in: parsed.data.opt_in,
      hermes_hour: parsed.data.hour,
      hermes_cadence: parsed.data.cadence,
      hermes_tz: tz,
    })
    .eq("id", userId);
  if (error) return { error: "No se pudieron guardar tus preferencias." };

  revalidatePath("/ajustes");
  return { ok: true };
}

/** Desvincula el número del propio usuario. */
export async function unlinkPhoneAction(): Promise<HermesState> {
  const userId = await currentUserId();
  if (!userId) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const res = await unlinkPhone(userId);
  if (!res.ok) return { error: res.error };

  revalidatePath("/ajustes");
  return { ok: true };
}

/* ---------------- panel de la mentora ---------------- */

/** Valeria vincula a mano el WhatsApp de un estudiante. */
export async function mentorLinkPhoneAction(
  _prev: HermesState,
  formData: FormData,
): Promise<HermesState> {
  await requireRole("mentor", "super_admin");

  const studentId = String(formData.get("student_id") ?? "");
  const phone = String(formData.get("phone") ?? "").trim();
  if (!studentId || !phone) return { error: "Falta el estudiante o el número." };

  const res = await linkPhoneAsMentor(studentId, phone);
  if (!res.ok) return { error: res.error };

  revalidatePath("/estudiantes");
  return { ok: true };
}

/** Valeria quita el número de un estudiante. */
export async function mentorUnlinkPhoneAction(formData: FormData): Promise<void> {
  await requireRole("mentor", "super_admin");

  const studentId = String(formData.get("student_id") ?? "");
  if (!studentId) return;

  const svc = createServiceClient();
  await svc
    .from("profiles")
    .update({
      phone_e164: null,
      phone_verified_at: null,
      phone_linked_by: null,
      hermes_opt_in: false,
    })
    .eq("id", studentId);

  revalidatePath("/estudiantes");
}
