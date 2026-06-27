import { createClient } from "@/lib/supabase/server";
import { getStudentRoute } from "@/lib/queries/route";
import {
  computeTraveler,
  type TravelerState,
  type TravelerSignals,
} from "@/config/journey";

/* ============================================================
   Query de la Ruta del Viajero: reúne las señales REALES del
   estudiante y las convierte en su estado de viaje (puntos,
   etapa, insignias). Devuelve null si aún no tiene programa.
   ============================================================ */

export interface TravelerView extends TravelerState {
  programTitle: string;
  completedLessons: number;
  totalLessons: number;
  completedPhases: number;
  totalPhases: number;
  checkins: number;
  journalEntries: number;
}

export async function getTravelerState(
  studentId: string,
): Promise<TravelerView | null> {
  const supabase = await createClient();

  const [route, checkinsRes, journalRes] = await Promise.all([
    getStudentRoute(studentId),
    supabase
      .from("emotional_checkins")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId),
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("student_id", studentId),
  ]);

  if (!route) return null;

  // Fases completadas al 100% (con al menos una lección).
  const completedPhases = route.phases.filter((phase) => {
    const lessons = phase.modules.flatMap((m) => m.lessons);
    return lessons.length > 0 && lessons.every((l) => l.completed);
  }).length;

  const checkins = checkinsRes.count ?? 0;
  const journalEntries = journalRes.count ?? 0;

  const signals: TravelerSignals = {
    completedLessons: route.completedLessons,
    totalLessons: route.totalLessons,
    progressPct: route.progressPct,
    completedPhases,
    checkins,
    journalEntries,
    hasActiveProgram: true,
  };

  const state = computeTraveler(signals);

  return {
    ...state,
    programTitle: route.program.title,
    completedLessons: route.completedLessons,
    totalLessons: route.totalLessons,
    completedPhases,
    totalPhases: route.phases.length,
    checkins,
    journalEntries,
  };
}
