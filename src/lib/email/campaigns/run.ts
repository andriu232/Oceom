import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmailDetailed } from "../send";
import { APP_URL } from "../layout";
import { RENDERERS, type RenderedMail } from "./content";

/* ============================================================
   El barrido de campañas de correo.

   El cron corre CADA HORA. En cada pasada mira las campañas encendidas y, de
   cada una, a quién le toca AHORA según SU hora local. "Las 8 de la noche"
   son las de cada persona, no las del servidor de Vercel.

   Nadie recibe dos correos de la misma campaña el mismo día local, ni aunque
   el cron se dispare dos veces: la verdad está en `mail_sends`, no en una
   marca en el perfil.
   ============================================================ */

export interface CampaignResult {
  slug: string;
  name: string;
  candidates: number;
  sent: number;
  skipped: number;
  failed: number;
  reason?: string;
}

export interface CampaignRun {
  hourUtc: number;
  campaigns: CampaignResult[];
}

interface Campaign {
  id: string;
  slug: string;
  name: string;
  enabled: boolean;
  cadence: "diaria" | "semanal" | "quincenal" | "mensual";
  weekday: number | null;
  hour: number | null;
  audience: "todos" | "elegidos" | "activos";
  skip_if_wrote: boolean;
}

interface Person {
  id: string;
  full_name: string | null;
  email: string | null;
  mail_hour: number;
  mail_tz: string;
  mail_token: string;
}

/* ---------------- tiempo local ---------------- */

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

/** Fecha local (YYYY-MM-DD) de esa persona. */
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

/** Día de la semana local: 0 = domingo … 6 = sábado. */
function localWeekday(tz: string, d: Date): number {
  try {
    const s = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "short",
    }).format(d);
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(s.slice(0, 3));
  } catch {
    return d.getUTCDay();
  }
}

/** Días completos entre dos instantes. */
function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}

/**
 * ¿A esta persona le toca esta campaña ahora mismo?
 * `last` es el último envío de ESTA campaña a ESTA persona.
 */
function isDue(c: Campaign, p: Person, last: Date | null, now: Date): boolean {
  const hora = c.hour ?? p.mail_hour;
  if (localHour(p.mail_tz, now) !== hora) return false;

  // Nunca dos veces el mismo día local.
  if (last && localDay(p.mail_tz, last) === localDay(p.mail_tz, now)) return false;

  switch (c.cadence) {
    case "diaria":
      return true;
    case "semanal":
      if (c.weekday !== null && localWeekday(p.mail_tz, now) !== c.weekday) return false;
      // 6 días y no 7: deja margen para el desfase horario y el cambio de hora.
      return !last || daysBetween(last, now) >= 6;
    case "quincenal":
      return !last || daysBetween(last, now) >= 14;
    case "mensual":
      return !last || daysBetween(last, now) >= 28;
  }
}

/* ---------------- datos ---------------- */

/** Quién puede recibir esta campaña, antes de mirar la hora. */
async function audienciaDe(
  svc: ReturnType<typeof createServiceClient>,
  c: Campaign,
): Promise<Person[]> {
  const base = svc
    .from("profiles")
    .select("id, full_name, email, mail_hour, mail_tz, mail_token")
    .eq("role", "student")
    .eq("mail_opt_in", true)
    .not("email", "is", null);

  if (c.audience === "elegidos") {
    const { data } = await svc
      .from("mail_campaign_recipients")
      .select("user_id")
      .eq("campaign_id", c.id);
    const ids = (data ?? []).map((r) => r.user_id as string);
    if (ids.length === 0) return [];
    const { data: people } = await base.in("id", ids);
    return (people ?? []) as Person[];
  }

  if (c.audience === "activos") {
    const { data } = await svc
      .from("enrollments")
      .select("student_id")
      .eq("status", "active");
    const ids = [...new Set((data ?? []).map((r) => r.student_id as string))];
    if (ids.length === 0) return [];
    const { data: people } = await base.in("id", ids);
    return (people ?? []) as Person[];
  }

  const { data: people } = await base;
  return (people ?? []) as Person[];
}

/** Último envío bueno de esta campaña, por persona. */
async function ultimosEnvios(
  svc: ReturnType<typeof createServiceClient>,
  campaignId: string,
): Promise<Map<string, Date>> {
  // 60 días cubre de sobra la cadencia más larga (mensual).
  const desde = new Date(Date.now() - 60 * 86_400_000).toISOString();
  const { data } = await svc
    .from("mail_sends")
    .select("user_id, sent_at")
    .eq("campaign_id", campaignId)
    .eq("ok", true)
    .eq("is_test", false)
    .gte("sent_at", desde)
    .order("sent_at", { ascending: false });

  const m = new Map<string, Date>();
  for (const r of data ?? []) {
    const id = r.user_id as string | null;
    if (id && !m.has(id)) m.set(id, new Date(r.sent_at as string));
  }
  return m;
}

/** Quiénes escribieron algo (bitácora o sueños) en las últimas 36 horas. */
async function escribieronReciente(
  svc: ReturnType<typeof createServiceClient>,
  desde: Date,
): Promise<Map<string, string[]>> {
  const iso = desde.toISOString();
  const out = new Map<string, string[]>();
  const add = (id: string, at: string) => {
    const prev = out.get(id);
    if (prev) prev.push(at);
    else out.set(id, [at]);
  };

  const [journal, dreams] = await Promise.all([
    svc.from("journal_entries").select("student_id, created_at").gte("created_at", iso),
    svc.from("dream_entries").select("student_id, created_at").gte("created_at", iso),
  ]);
  for (const r of journal.data ?? []) add(r.student_id as string, r.created_at as string);
  for (const r of dreams.data ?? []) add(r.student_id as string, r.created_at as string);
  return out;
}

/* ---------------- envío ---------------- */

export function unsubUrlFor(token: string): string {
  return `${APP_URL}/api/correos/baja?t=${token}`;
}

/** Arma el correo de una campaña para una persona. Devuelve null si el slug
 *  no tiene plantilla en el catálogo. */
export function renderFor(
  slug: string,
  person: { full_name: string | null; mail_token: string },
  day = new Date(),
): RenderedMail | null {
  const render = RENDERERS[slug];
  if (!render) return null;
  return render({
    firstName: person.full_name?.trim().split(/\s+/)[0] || "Hola",
    unsubUrl: unsubUrlFor(person.mail_token),
    day,
  });
}

async function correrCampana(
  svc: ReturnType<typeof createServiceClient>,
  c: Campaign,
  now: Date,
): Promise<CampaignResult> {
  const res: CampaignResult = {
    slug: c.slug,
    name: c.name,
    candidates: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
  };

  if (!RENDERERS[c.slug]) {
    // Alguien creó una campaña con un slug que no existe en el código. Mejor
    // decirlo que mandar un correo vacío.
    res.reason = "sin plantilla en el código";
    return res;
  }

  const gente = await audienciaDe(svc, c);
  res.candidates = gente.length;
  if (gente.length === 0) return res;

  const ultimos = await ultimosEnvios(svc, c.id);
  const debidos = gente.filter((p) => isDue(c, p, ultimos.get(p.id) ?? null, now));
  res.skipped = gente.length - debidos.length;
  if (debidos.length === 0) return res;

  const escrituras = c.skip_if_wrote
    ? await escribieronReciente(svc, new Date(now.getTime() - 36 * 3600 * 1000))
    : new Map<string, string[]>();

  for (const p of debidos) {
    if (c.skip_if_wrote) {
      const hoy = localDay(p.mail_tz, now);
      const suyas = escrituras.get(p.id) ?? [];
      if (suyas.some((at) => localDay(p.mail_tz, new Date(at)) === hoy)) {
        res.skipped++;
        continue;
      }
    }

    const mail = renderFor(c.slug, p, now);
    if (!mail) continue;

    const unsubUrl = unsubUrlFor(p.mail_token);
    const envio = await sendEmailDetailed({
      to: p.email as string,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      replyTo: process.env.EMAIL_REPLY_TO || undefined,
      headers: {
        // Sin esto, un correo recurrente a todo el grupo acaba en spam. El
        // "One-Click" hace que Gmail muestre su propio botón de baja.
        "List-Unsubscribe": `<${unsubUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
    });

    await svc.from("mail_sends").insert({
      campaign_id: c.id,
      user_id: p.id,
      subject: mail.subject,
      ok: envio.ok,
      error: envio.error,
    });

    if (envio.ok) res.sent++;
    else res.failed++;
  }

  return res;
}

/** Barrido completo. Lo llama el cron cada hora. */
export async function runCampaigns(now = new Date()): Promise<CampaignRun> {
  const svc = createServiceClient();
  const run: CampaignRun = { hourUtc: now.getUTCHours(), campaigns: [] };

  const { data, error } = await svc
    .from("mail_campaigns")
    .select("id, slug, name, enabled, cadence, weekday, hour, audience, skip_if_wrote")
    .eq("enabled", true);

  if (error) {
    console.error("[correos]", error.message);
    return run;
  }

  for (const c of (data ?? []) as Campaign[]) {
    const res = await correrCampana(svc, c, now);
    run.campaigns.push(res);
    if (res.sent > 0) {
      await svc
        .from("mail_campaigns")
        .update({ last_run_at: now.toISOString() })
        .eq("id", c.id);
    }
  }

  return run;
}
