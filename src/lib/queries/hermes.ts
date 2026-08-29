import { createClient } from "@/lib/supabase/server";

/* ============================================================
   Consultas del panel de HERMES (solo mentora — la protege requireRole
   en la página y las policies de hermes_messages).
   ============================================================ */

export interface HermesStudentRow {
  id: string;
  full_name: string | null;
  email: string | null;
  phone_e164: string | null;
  phone_verified_at: string | null;
  phone_linked_by: string | null;
  hermes_opt_in: boolean;
  hermes_hour: number;
  hermes_cadence: string;
  hermes_last_reminder_at: string | null;
  /** Entradas de bitácora que entraron por WhatsApp. */
  entriesFromWhatsapp: number;
}

export interface HermesAlert {
  id: string;
  user_id: string | null;
  full_name: string | null;
  body: string | null;
  red_flag: string;
  created_at: string;
}

export interface HermesOverview {
  /** true si la migración 0025 todavía no está aplicada en esta base. La
   *  página lo dice en pantalla en vez de reventar con un error de Postgres. */
  migrationPending: boolean;
  students: HermesStudentRow[];
  alerts: HermesAlert[];
  stats: {
    linked: number;
    verified: number;
    optIn: number;
    entriesFromWhatsapp: number;
    remindersLast7d: number;
  };
}

export async function getHermesOverview(): Promise<HermesOverview> {
  const supabase = await createClient();

  const [
    { data: profiles, error: profilesError },
    { data: waEntries },
    { data: alertRows },
    { count: reminders },
  ] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "id, full_name, email, phone_e164, phone_verified_at, phone_linked_by, hermes_opt_in, hermes_hour, hermes_cadence, hermes_last_reminder_at",
        )
        .eq("role", "student")
        .order("full_name", { ascending: true }),

      // Cuántas entradas llegaron por WhatsApp, por estudiante.
      supabase.from("journal_entries").select("student_id").eq("source", "whatsapp"),

      supabase
        .from("hermes_messages")
        .select("id, user_id, body, red_flag, created_at")
        .not("red_flag", "is", null)
        .order("created_at", { ascending: false })
        .limit(20),

      supabase
        .from("hermes_messages")
        .select("id", { count: "exact", head: true })
        .eq("kind", "recordatorio")
        .is("error", null)
        .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString()),
    ]);

  // Las columnas de Hermes viven en la migración 0025. Si falta, Postgres
  // responde 42703 (columna inexistente): se informa y no se pinta nada.
  if (profilesError) {
    console.warn("[hermes] la migración 0025 parece no estar aplicada:", profilesError.message);
    return {
      migrationPending: true,
      students: [],
      alerts: [],
      stats: { linked: 0, verified: 0, optIn: 0, entriesFromWhatsapp: 0, remindersLast7d: 0 },
    };
  }

  const byStudent = new Map<string, number>();
  for (const row of waEntries ?? []) {
    const id = row.student_id as string;
    byStudent.set(id, (byStudent.get(id) ?? 0) + 1);
  }

  const nameById = new Map<string, string | null>();
  const students: HermesStudentRow[] = (profiles ?? []).map((p) => {
    nameById.set(p.id as string, (p.full_name as string | null) ?? null);
    return {
      id: p.id as string,
      full_name: (p.full_name as string | null) ?? null,
      email: (p.email as string | null) ?? null,
      phone_e164: (p.phone_e164 as string | null) ?? null,
      phone_verified_at: (p.phone_verified_at as string | null) ?? null,
      phone_linked_by: (p.phone_linked_by as string | null) ?? null,
      hermes_opt_in: (p.hermes_opt_in as boolean) ?? false,
      hermes_hour: (p.hermes_hour as number) ?? 20,
      hermes_cadence: (p.hermes_cadence as string) ?? "diario",
      hermes_last_reminder_at: (p.hermes_last_reminder_at as string | null) ?? null,
      entriesFromWhatsapp: byStudent.get(p.id as string) ?? 0,
    };
  });

  const alerts: HermesAlert[] = (alertRows ?? []).map((a) => ({
    id: a.id as string,
    user_id: (a.user_id as string | null) ?? null,
    full_name: a.user_id ? (nameById.get(a.user_id as string) ?? null) : null,
    body: (a.body as string | null) ?? null,
    red_flag: a.red_flag as string,
    created_at: a.created_at as string,
  }));

  const linked = students.filter((s) => s.phone_e164).length;

  return {
    migrationPending: false,
    students,
    alerts,
    stats: {
      linked,
      verified: students.filter((s) => s.phone_verified_at).length,
      optIn: students.filter((s) => s.hermes_opt_in && s.phone_e164).length,
      entriesFromWhatsapp: waEntries?.length ?? 0,
      remindersLast7d: reminders ?? 0,
    },
  };
}
