import { createClient } from "@/lib/supabase/server";

/* ============================================================
   Círculos en Vivo (live_sessions). Visibilidad por RLS:
   program_id null = abierto a todos; con programa = solo inscritos.
   ============================================================ */

export interface Circle {
  id: string;
  title: string;
  description: string | null;
  starts_at: string;
  ends_at: string | null;
  meeting_url: string | null;
  recording_url: string | null;
  status: string;
  program_id: string | null;
  programTitle: string | null;
}

export type CircleState = "live" | "upcoming" | "past";

const DEFAULT_DURATION_MS = 90 * 60 * 1000;

/** Estado temporal del círculo (en vivo / próximo / pasado). */
export function circleState(c: Pick<Circle, "starts_at" | "ends_at">): CircleState {
  const now = Date.now();
  const start = new Date(c.starts_at).getTime();
  const end = c.ends_at ? new Date(c.ends_at).getTime() : start + DEFAULT_DURATION_MS;
  if (now < start) return "upcoming";
  if (now <= end) return "live";
  return "past";
}

async function fetchCircles(): Promise<Circle[]> {
  const supabase = await createClient();
  const [{ data: sessions }, { data: programs }] = await Promise.all([
    supabase
      .from("live_sessions")
      .select(
        "id,title,description,starts_at,ends_at,meeting_url,recording_url,status,program_id",
      )
      .order("starts_at", { ascending: true }),
    supabase.from("programs").select("id,title"),
  ]);
  const pmap = new Map((programs ?? []).map((p) => [p.id, p.title as string]));
  return (sessions ?? []).map((s) => ({
    ...s,
    programTitle: s.program_id ? pmap.get(s.program_id) ?? null : null,
  })) as Circle[];
}

export async function listCirclesForStudent() {
  const all = await fetchCircles();
  return {
    live: all.filter((c) => circleState(c) === "live"),
    upcoming: all.filter((c) => circleState(c) === "upcoming"),
    past: all.filter((c) => circleState(c) === "past").reverse(),
  };
}

export async function listCirclesForAdmin() {
  const all = await fetchCircles();
  return {
    upcoming: all.filter((c) => circleState(c) !== "past"),
    past: all.filter((c) => circleState(c) === "past").reverse(),
  };
}

export async function getCircle(id: string): Promise<Circle | null> {
  const all = await fetchCircles();
  return all.find((c) => c.id === id) ?? null;
}
