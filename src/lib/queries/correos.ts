import { createClient } from "@/lib/supabase/server";
import { checkResend, type ResendHealth } from "@/lib/email/health";

/* ============================================================
   Consultas del centro de correos (solo mentora — la protege requireRole en
   la página y las policies de mail_campaigns).
   ============================================================ */

export interface CampaignRow {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  enabled: boolean;
  cadence: string;
  weekday: number | null;
  hour: number | null;
  audience: string;
  skip_if_wrote: boolean;
  last_run_at: string | null;
  /** Destinatarios elegidos a mano (solo cuenta si audience = 'elegidos'). */
  chosen: string[];
  /** Cuántos correos de esta campaña salieron en los últimos 30 días. */
  sent30d: number;
}

export interface RecipientRow {
  id: string;
  full_name: string | null;
  email: string | null;
  mail_opt_in: boolean;
  mail_hour: number;
  mail_tz: string;
}

export interface SendRow {
  id: string;
  campaign_id: string | null;
  campaign_name: string | null;
  full_name: string | null;
  subject: string | null;
  ok: boolean;
  error: string | null;
  is_test: boolean;
  sent_at: string;
}

export interface CorreosOverview {
  /** true si la migración 0029 todavía no está aplicada en esta base. La
   *  página lo dice en pantalla en vez de reventar con un error de Postgres. */
  migrationPending: boolean;
  /** Estado real de Resend: key, dominio del remitente, verificación. */
  resend: ResendHealth;
  campaigns: CampaignRow[];
  people: RecipientRow[];
  recent: SendRow[];
  stats: { activas: number; personas: number; bajas: number; enviados30d: number };
}

const HACE_30D = () => new Date(Date.now() - 30 * 86_400_000).toISOString();

export async function getCorreosOverview(): Promise<CorreosOverview> {
  const supabase = await createClient();

  const [resend, campaigns, recipients, people, sends] = await Promise.all([
    checkResend(),
    supabase
      .from("mail_campaigns")
      .select(
        "id, slug, name, description, enabled, cadence, weekday, hour, audience, skip_if_wrote, last_run_at",
      )
      .order("created_at"),
    supabase.from("mail_campaign_recipients").select("campaign_id, user_id"),
    supabase
      .from("profiles")
      .select("id, full_name, email, mail_opt_in, mail_hour, mail_tz")
      .eq("role", "student")
      .order("full_name"),
    supabase
      .from("mail_sends")
      .select("id, campaign_id, user_id, subject, ok, error, is_test, sent_at")
      .gte("sent_at", HACE_30D())
      .order("sent_at", { ascending: false })
      .limit(200),
  ]);

  // La tabla no existe todavía: 42P01 de Postgres.
  if (campaigns.error) {
    return {
      migrationPending: true,
      resend,
      campaigns: [],
      people: [],
      recent: [],
      stats: { activas: 0, personas: 0, bajas: 0, enviados30d: 0 },
    };
  }

  const elegidos = new Map<string, string[]>();
  for (const r of recipients.data ?? []) {
    const cid = r.campaign_id as string;
    const arr = elegidos.get(cid);
    if (arr) arr.push(r.user_id as string);
    else elegidos.set(cid, [r.user_id as string]);
  }

  const enviosPorCampana = new Map<string, number>();
  for (const s of sends.data ?? []) {
    if (!s.ok || s.is_test) continue;
    const cid = s.campaign_id as string | null;
    if (cid) enviosPorCampana.set(cid, (enviosPorCampana.get(cid) ?? 0) + 1);
  }

  const gente = (people.data ?? []) as RecipientRow[];
  const nombres = new Map(gente.map((p) => [p.id, p.full_name]));

  const rows: CampaignRow[] = ((campaigns.data ?? []) as CampaignRow[]).map((c) => ({
    ...c,
    chosen: elegidos.get(c.id) ?? [],
    sent30d: enviosPorCampana.get(c.id) ?? 0,
  }));
  const porId = new Map(rows.map((c) => [c.id, c.name]));

  const recent: SendRow[] = (sends.data ?? []).slice(0, 60).map((s) => ({
    id: s.id as string,
    campaign_id: (s.campaign_id as string | null) ?? null,
    campaign_name: s.campaign_id ? (porId.get(s.campaign_id as string) ?? null) : null,
    full_name: s.user_id ? (nombres.get(s.user_id as string) ?? null) : null,
    subject: (s.subject as string | null) ?? null,
    ok: s.ok as boolean,
    error: (s.error as string | null) ?? null,
    is_test: s.is_test as boolean,
    sent_at: s.sent_at as string,
  }));

  return {
    migrationPending: false,
    resend,
    campaigns: rows,
    people: gente,
    recent,
    stats: {
      activas: rows.filter((c) => c.enabled).length,
      personas: gente.filter((p) => p.mail_opt_in).length,
      bajas: gente.filter((p) => !p.mail_opt_in).length,
      enviados30d: (sends.data ?? []).filter((s) => s.ok && !s.is_test).length,
    },
  };
}
