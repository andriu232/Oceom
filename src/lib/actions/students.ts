"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/* ============================================================
   Gestión de estudiantes desde el modo admin (Valeria).
   ============================================================ */

export type DeleteStudentState = { ok?: boolean; error?: string };

/** Elimina PERMANENTEMENTE a un estudiante: su cuenta de acceso y, en cascada,
 *  todos sus datos (inscripciones, progreso, bitácora, comunidad, entregas…).
 *  Solo mentora / super admin. No permite borrar cuentas que no sean de
 *  estudiante, ni la propia. */
export async function deleteStudentAction(
  studentId: string,
): Promise<DeleteStudentState> {
  const me = await requireRole("mentor", "super_admin");
  if (!studentId) return { error: "Falta el estudiante." };
  if (studentId === me.id)
    return { error: "No puedes eliminar tu propia cuenta." };

  const supabase = await createClient();
  const { data: target } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", studentId)
    .single();

  if (!target) return { error: "Ese estudiante ya no existe." };
  if (target.role !== "student")
    return { error: "Solo se pueden eliminar cuentas de estudiante." };

  // Borra el usuario de auth.users → cascada a profiles y a todos sus datos.
  const svc = createServiceClient();
  const { error } = await svc.auth.admin.deleteUser(studentId);
  if (error) return { error: `No se pudo eliminar: ${error.message}` };

  revalidatePath("/estudiantes");
  return { ok: true };
}
