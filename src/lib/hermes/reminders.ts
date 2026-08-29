import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { resolveHermes } from "./config";
import { sendReminder } from "./wa";

/* ============================================================
   El recordatorio diario de HERMES.

   El texto lo resuelve `wa.ts` según el transporte: por el bridge va como
   mensaje normal; por Cloud API iría como plantilla aprobada. Aquí solo se
   decide A QUIÉN le toca y CUÁNDO.

   El cron corre CADA HORA y en cada pasada envía solo a quien tiene su
   `hermes_hour` en ese momento según SU zona horaria. Así "a las 8 de la
   noche" significa las 8 de la noche de cada quien, no las de Vercel.
   ============================================================ */

export interface ReminderRun {
  hourUtc: number;
  candidates: number;
  sent: number;
  skipped: number;
  failed: number;
}

interface Candidate {
  id: string;
  full_name: string | null;
  phone_e164: string;
  hermes_hour: number;
  hermes_tz: string;
  hermes_cadence: string;
  hermes_last_reminder_at: string | null;
}

/** Hora local (0-23) que es ahora mismo en esa zona horaria. */
function localHour(tz: string, now: Date): number | null {
  try {
    const h = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      hour: "numeric",
      hour12: false,
    }).format(now);
    const n = Number(h);
    return Number.isFinite(n) ? n % 24 : null;
  } catch {
    // Zona horaria inválida en el perfil: se salta en vez de reventar el cron.
    return null;
  }
}

/** Fecha local (YYYY-MM-DD) de esa persona, para no repetir en el mismo día. */
function localDay(tz: string, d: Date): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(d);
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** ¿Le toca recordatorio ahora? */
function isDue(c: Candidate, now: Date): boolean {
  if (c.hermes_cadence === "nunca") return false;

  const hour = localHour(c.hermes_tz, now);
  if (hour === null || hour !== c.hermes_hour) return false;

  if (c.hermes_last_reminder_at) {
    const last = new Date(c.hermes_last_reminder_at);

    // Nunca dos veces el mismo día local (protege de un cron que se repita).
    if (localDay(c.hermes_tz, last) === localDay(c.hermes_tz, now)) return false;

    // Semanal: al menos 6 días entre uno y otro (margen para el desfase horario).
    if (c.hermes_cadence === "semanal") {
      const dias = (now.getTime() - last.getTime()) / 86_400_000;
      if (dias < 6) return false;
    }
  }

  return true;
}

/**
 * Barrido de recordatorios. Lo llama el cron cada hora.
 * Solo escribe a quien: tiene número, dio consentimiento y le toca ahora.
 */
export async function runReminders(now = new Date()): Promise<ReminderRun> {
  const cfg = resolveHermes();
  const run: ReminderRun = {
    hourUtc: now.getUTCHours(),
    candidates: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };
  if (!cfg) return run;

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("profiles")
    .select(
      "id, full_name, phone_e164, hermes_hour, hermes_tz, hermes_cadence, hermes_last_reminder_at",
    )
    .eq("hermes_opt_in", true)
    .not("phone_e164", "is", null);

  if (error) {
    console.error("[hermes cron]", error.message);
    return run;
  }

  const candidates = (data ?? []) as Candidate[];
  run.candidates = candidates.length;

  for (const c of candidates) {
    if (!isDue(c, now)) {
      run.skipped++;
      continue;
    }

    const nombre = c.full_name?.trim().split(/\s+/)[0] || "Hola";
    const sent = await sendReminder(c.phone_e164, nombre);

    await svc.from("hermes_messages").insert({
      user_id: c.id,
      phone_e164: c.phone_e164,
      direction: "out",
      kind: "recordatorio",
      body: "Recordatorio de bitácora.",
      wa_message_id: sent.messageId ?? null,
      error: sent.ok ? null : sent.error,
    });

    if (sent.ok) {
      // Se marca solo si salió: si falló, mañana se reintenta.
      await svc
        .from("profiles")
        .update({ hermes_last_reminder_at: now.toISOString() })
        .eq("id", c.id);
      run.sent++;
    } else {
      run.failed++;
    }
  }

  return run;
}
