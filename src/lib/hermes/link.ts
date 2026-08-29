import "server-only";
import crypto from "node:crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { resolveHermes } from "./config";
import { sendVerificationCode } from "./wa";
import { toE164 } from "./phone";

/* ============================================================
   Vinculación de un número de WhatsApp con una persona de OCEOM.

   Dos caminos, como pidió Andrés:
   - Autoservicio: la persona escribe su celular en Ajustes, Hermes le manda
     un código por WhatsApp y ella lo confirma. Es el camino por defecto y el
     único que PRUEBA que el número es suyo.
   - Manual: Valeria vincula el número desde el panel de estudiantes, para
     quien no lo haga sola. Queda marcado `phone_linked_by = 'mentor'` para
     saber que ese número no está probado.

   El código nunca se guarda en claro: se guarda sha256(código + id del
   registro). Caduca a los 10 minutos y admite 5 intentos.
   ============================================================ */

const CODE_TTL_MIN = 10;
const MAX_ATTEMPTS = 5;

function hashCode(code: string, salt: string): string {
  return crypto.createHash("sha256").update(`${code}:${salt}`).digest("hex");
}

/** 6 dígitos con aleatoriedad criptográfica (no Math.random). */
function makeCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
}

export type LinkResult = { ok: true } | { ok: false; error: string };

/**
 * Paso 1: la persona declara su número. Se emite y envía el código.
 * No revela si el número ya pertenece a alguien más de forma explícita,
 * pero sí lo bloquea: un número = una persona.
 */
export async function startPhoneVerification(
  userId: string,
  rawPhone: string,
): Promise<LinkResult> {
  if (!resolveHermes()) {
    return { ok: false, error: "Hermes todavía no está conectado a WhatsApp." };
  }

  const phone = toE164(rawPhone);
  if (!phone) {
    return { ok: false, error: "Ese número no parece válido. Escríbelo con indicativo, ej. +57 300 123 4567." };
  }

  const svc = createServiceClient();

  // Un número pertenece a una sola persona.
  const { data: taken } = await svc
    .from("profiles")
    .select("id")
    .eq("phone_e164", phone)
    .neq("id", userId)
    .maybeSingle();
  if (taken) {
    return { ok: false, error: "Ese número ya está vinculado a otra cuenta de OCEOM." };
  }

  // Freno simple contra abuso: máximo 3 códigos por hora y por persona.
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await svc
    .from("hermes_verifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", hourAgo);
  if ((count ?? 0) >= 3) {
    return { ok: false, error: "Pediste varios códigos seguidos. Espera un rato e inténtalo de nuevo." };
  }

  const code = makeCode();
  const expiresAt = new Date(Date.now() + CODE_TTL_MIN * 60 * 1000).toISOString();

  // Se inserta primero para tener el id, que hace de sal del hash.
  const { data: row, error } = await svc
    .from("hermes_verifications")
    .insert({ user_id: userId, phone_e164: phone, code_hash: "pendiente", expires_at: expiresAt })
    .select("id")
    .single();
  if (error || !row) {
    return { ok: false, error: "No se pudo generar el código. Inténtalo de nuevo." };
  }

  await svc
    .from("hermes_verifications")
    .update({ code_hash: hashCode(code, row.id) })
    .eq("id", row.id);

  const sent = await sendVerificationCode(phone, code);

  await svc.from("hermes_messages").insert({
    user_id: userId,
    phone_e164: phone,
    direction: "out",
    kind: "verificacion",
    body: "Código de vinculación enviado.",
    wa_message_id: sent.messageId ?? null,
    error: sent.ok ? null : sent.error,
  });

  if (!sent.ok) {
    return { ok: false, error: "No pudimos enviar el código a ese WhatsApp. Revisa el número." };
  }
  return { ok: true };
}

/** Paso 2: la persona escribe el código en OCEOM. */
export async function confirmPhoneVerification(
  userId: string,
  rawCode: string,
): Promise<LinkResult> {
  const code = rawCode.replace(/\D/g, "");
  if (code.length !== 6) return { ok: false, error: "El código son 6 dígitos." };

  const svc = createServiceClient();
  const { data: row } = await svc
    .from("hermes_verifications")
    .select("id, phone_e164, code_hash, attempts, expires_at, consumed_at")
    .eq("user_id", userId)
    .is("consumed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!row) return { ok: false, error: "No hay ningún código pendiente. Pide uno nuevo." };
  if (new Date(row.expires_at as string).getTime() < Date.now()) {
    return { ok: false, error: "Ese código ya caducó. Pide uno nuevo." };
  }
  if ((row.attempts as number) >= MAX_ATTEMPTS) {
    return { ok: false, error: "Demasiados intentos. Pide un código nuevo." };
  }

  const expected = row.code_hash as string;
  const given = hashCode(code, row.id as string);
  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(given, "hex");
  const match = a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);

  if (!match) {
    await svc
      .from("hermes_verifications")
      .update({ attempts: (row.attempts as number) + 1 })
      .eq("id", row.id);
    return { ok: false, error: "El código no coincide. Revísalo e inténtalo de nuevo." };
  }

  await svc
    .from("hermes_verifications")
    .update({ consumed_at: new Date().toISOString() })
    .eq("id", row.id);

  const { error } = await svc
    .from("profiles")
    .update({
      phone_e164: row.phone_e164,
      phone_verified_at: new Date().toISOString(),
      phone_linked_by: "self",
      // Verificar el número ES el consentimiento: la persona pidió el código.
      hermes_opt_in: true,
    })
    .eq("id", userId);
  if (error) return { ok: false, error: "No se pudo guardar tu número. Inténtalo de nuevo." };

  return { ok: true };
}

/** Vinculación manual hecha por la mentora (sin prueba de posesión). */
export async function linkPhoneAsMentor(
  studentId: string,
  rawPhone: string,
): Promise<LinkResult> {
  const phone = toE164(rawPhone);
  if (!phone) return { ok: false, error: "Ese número no parece válido (ej. +57 300 123 4567)." };

  const svc = createServiceClient();
  const { data: taken } = await svc
    .from("profiles")
    .select("id, full_name")
    .eq("phone_e164", phone)
    .neq("id", studentId)
    .maybeSingle();
  if (taken) {
    return { ok: false, error: `Ese número ya está vinculado a ${taken.full_name ?? "otra cuenta"}.` };
  }

  const { error } = await svc
    .from("profiles")
    .update({
      phone_e164: phone,
      // Sin verificar: lo puso la mentora, no la persona.
      phone_verified_at: null,
      phone_linked_by: "mentor",
      hermes_opt_in: true,
    })
    .eq("id", studentId);
  if (error) return { ok: false, error: "No se pudo guardar el número." };

  return { ok: true };
}

/** Desvincula el número y apaga los recordatorios. */
export async function unlinkPhone(userId: string): Promise<LinkResult> {
  const svc = createServiceClient();
  const { error } = await svc
    .from("profiles")
    .update({
      phone_e164: null,
      phone_verified_at: null,
      phone_linked_by: null,
      hermes_opt_in: false,
    })
    .eq("id", userId);
  if (error) return { ok: false, error: "No se pudo desvincular el número." };
  return { ok: true };
}
