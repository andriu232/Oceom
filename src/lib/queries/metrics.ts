import { createClient } from "@/lib/supabase/server";

/* ============================================================
   Métricas del admin — agregación real desde Supabase.
   Sigue el patrón del repo: `count:"exact", head:true` para
   conteos y agregación en JS (no hay RPC/agregaciones SQL).
   Degrada con gracia: si una tabla aún no está desplegada
   (ej. orders/class_slots), su métrica queda en 0 sin romper.
   ============================================================ */

export interface ProgramStat {
  id: string;
  title: string;
  activeEnrollments: number;
  revenueCop: number;
}

export interface AdminMetrics {
  students: { total: number; new30d: number };
  enrollmentStatus: {
    active: number;
    completed: number;
    paused: number;
    cancelled: number;
    inactive: number;
    total: number;
  };
  avgProgress: number; // 0–100, sobre inscripciones activas
  submissions: { pending: number; reviewed: number; total: number };
  revenue: {
    approvedCop: number;
    monthCop: number;
    pendingCop: number;
    pendingCount: number;
  };
  programs: ProgramStat[];
  upcomingSessions: { title: string; startsAt: string }[];
  upcoming1on1: number;
}

type EnrollmentRow = {
  status: string | null;
  progress_percentage: number | null;
  program_id: string | null;
};
type OrderRow = {
  status: string | null;
  amount_cop: number | null;
  program_id: string | null;
  created_at: string | null;
};

export async function getAdminMetrics(): Promise<AdminMetrics> {
  const supabase = await createClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const since30 = new Date(now.getTime() - 30 * 864e5).toISOString();
  const monthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString();

  const [
    studentsRes,
    new30Res,
    enrollmentsRes,
    submissionsRes,
    ordersRes,
    programsRes,
    sessionsRes,
    slotsRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "student")
      .gte("created_at", since30),
    supabase.from("enrollments").select("status, progress_percentage, program_id"),
    supabase.from("submissions").select("status"),
    supabase.from("orders").select("status, amount_cop, program_id, created_at"),
    supabase.from("programs").select("id, title"),
    supabase
      .from("live_sessions")
      .select("title, starts_at")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(6),
    supabase
      .from("class_slots")
      .select("id", { count: "exact", head: true })
      .eq("status", "booked")
      .gte("starts_at", nowIso),
  ]);

  const enrollments = (enrollmentsRes.data ?? []) as EnrollmentRow[];
  const orders = (ordersRes.data ?? []) as OrderRow[];
  const programsList = (programsRes.data ?? []) as { id: string; title: string }[];
  const submissions = (submissionsRes.data ?? []) as { status: string | null }[];

  // ---- Inscripciones: estado + progreso promedio (sobre activas) ----
  const enrollmentStatus = {
    active: 0,
    completed: 0,
    paused: 0,
    cancelled: 0,
    inactive: 0,
    total: enrollments.length,
  };
  let progressSum = 0;
  let progressCount = 0;
  for (const e of enrollments) {
    switch (e.status) {
      case "active":
        enrollmentStatus.active++;
        break;
      case "completed":
        enrollmentStatus.completed++;
        break;
      case "paused":
        enrollmentStatus.paused++;
        break;
      case "cancelled":
        enrollmentStatus.cancelled++;
        break;
      case "inactive":
        enrollmentStatus.inactive++;
        break;
    }
    if (e.status === "active" && typeof e.progress_percentage === "number") {
      progressSum += e.progress_percentage;
      progressCount++;
    }
  }
  const avgProgress =
    progressCount > 0 ? Math.round(progressSum / progressCount) : 0;

  // ---- Entregas ----
  let pending = 0;
  let reviewed = 0;
  for (const s of submissions) {
    if (s.status === "submitted") pending++;
    else if (s.status === "reviewed") reviewed++;
  }

  // ---- Ingresos ----
  let approvedCop = 0;
  let monthCop = 0;
  let pendingCop = 0;
  let pendingCount = 0;
  for (const o of orders) {
    const amt = o.amount_cop ?? 0;
    if (o.status === "approved") {
      approvedCop += amt;
      if (o.created_at && o.created_at >= monthStart) monthCop += amt;
    } else if (o.status === "pending") {
      pendingCop += amt;
      pendingCount++;
    }
  }

  // ---- Por programa: inscripciones activas + ingresos aprobados ----
  const progMap = new Map<string, ProgramStat>();
  for (const p of programsList) {
    progMap.set(p.id, {
      id: p.id,
      title: p.title,
      activeEnrollments: 0,
      revenueCop: 0,
    });
  }
  for (const e of enrollments) {
    if (e.status === "active" && e.program_id) {
      const ps = progMap.get(e.program_id);
      if (ps) ps.activeEnrollments++;
    }
  }
  for (const o of orders) {
    if (o.status === "approved" && o.program_id && progMap.has(o.program_id)) {
      progMap.get(o.program_id)!.revenueCop += o.amount_cop ?? 0;
    }
  }
  const programs = [...progMap.values()]
    .filter((p) => p.activeEnrollments > 0 || p.revenueCop > 0)
    .sort(
      (a, b) =>
        b.activeEnrollments - a.activeEnrollments || b.revenueCop - a.revenueCop,
    );

  return {
    students: { total: studentsRes.count ?? 0, new30d: new30Res.count ?? 0 },
    enrollmentStatus,
    avgProgress,
    submissions: { pending, reviewed, total: submissions.length },
    revenue: { approvedCop, monthCop, pendingCop, pendingCount },
    programs,
    upcomingSessions: (
      (sessionsRes.data ?? []) as { title: string; starts_at: string }[]
    ).map((s) => ({ title: s.title, startsAt: s.starts_at })),
    upcoming1on1: slotsRes.count ?? 0,
  };
}
