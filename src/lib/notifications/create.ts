import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { sendEmail } from "@/lib/email/send";

/* ============================================================
   Notificaciones — creación (fan-out). El servidor inserta una fila
   por usuario con service_role (bypassa RLS, porque una acción crea
   avisos para muchas personas). Opcionalmente envía también correo
   reusando el transporte de la Agenda (no-op si falta RESEND_API_KEY).
   ============================================================ */

export const APP_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://oceom.vercel.app"
).replace(/\/+$/, "");

export interface NotifyInput {
  kind: string; // 'comunidad' | 'pregunta_semanal' | ...
  title: string;
  body?: string;
  link?: string; // ruta interna, p. ej. /comunidad/comunidad
  /** Si se pasa, además del aviso in-app envía correo a cada destinatario. */
  email?: { subject: string; html: string };
}

/** Inserta una notificación in-app para cada usuario dado. */
export async function notifyUsers(
  userIds: string[],
  n: NotifyInput,
): Promise<void> {
  const ids = [...new Set(userIds)].filter(Boolean);
  if (ids.length === 0) return;
  const svc = createServiceClient();
  await svc.from("notifications").insert(
    ids.map((user_id) => ({
      user_id,
      kind: n.kind,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
    })),
  );
}

/** Avisa a todos los estudiantes (p. ej. cuando la mentora publica en
 *  Comunidad). Devuelve cuántos fueron notificados. */
export async function notifyAllStudents(
  n: NotifyInput,
  opts: { excludeUserId?: string } = {},
): Promise<number> {
  const svc = createServiceClient();
  const { data } = await svc
    .from("profiles")
    .select("id, email")
    .eq("role", "student");
  let students = (data ?? []) as { id: string; email: string | null }[];
  if (opts.excludeUserId)
    students = students.filter((s) => s.id !== opts.excludeUserId);
  if (students.length === 0) return 0;

  await notifyUsers(
    students.map((s) => s.id),
    n,
  );

  // Correo (además del in-app). No-op silencioso si falta RESEND_API_KEY.
  if (n.email) {
    await Promise.allSettled(
      students
        .filter((s) => s.email)
        .map((s) =>
          sendEmail({
            to: s.email as string,
            subject: n.email!.subject,
            html: n.email!.html,
          }),
        ),
    );
  }
  return students.length;
}
