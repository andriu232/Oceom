import { sendEmail } from "./send";
import { buildIcs, googleCalendarUrl, type CalEvent } from "./ics";
import { formatDayLabel, formatTime } from "@/lib/scheduling/time";
import { BRAND, APP_URL, shell, row, linkButton } from "./layout";

/* Correos de la Agenda: confirmación al estudiante + aviso a la mentora,
   ambos con invitación .ics y botón "Agregar a Google Calendar". */

function calButton(ev: CalEvent): string {
  return `<a href="${googleCalendarUrl(ev)}" style="display:inline-block;margin-top:18px;background:${BRAND};color:#04121a;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:14px">Agregar a Google Calendar</a>`;
}

export interface BookingNotice {
  studentName: string;
  studentEmail: string;
  mentorName: string;
  mentorEmail: string;
  startsAtIso: string;
  durationMin: number;
  note: string | null;
}

export async function notifyBooking(b: BookingNotice): Promise<void> {
  const endIso = new Date(
    new Date(b.startsAtIso).getTime() + b.durationMin * 60000,
  ).toISOString();
  const when = `${formatDayLabel(b.startsAtIso)} · ${formatTime(b.startsAtIso)} (hora Colombia)`;

  const ev: CalEvent = {
    uid: `oceom-${Date.parse(b.startsAtIso)}-${b.studentEmail}`,
    title: `Clase OCEOM · ${b.studentName} con ${b.mentorName}`,
    description: b.note ? `Nota: ${b.note}` : "Sesión agendada en OCEOM.",
    startIso: b.startsAtIso,
    endIso,
    organizerEmail: b.mentorEmail,
    attendeeEmail: b.studentEmail,
  };
  const ics = buildIcs(ev);

  // Estudiante
  await sendEmail({
    to: b.studentEmail,
    subject: `Tu clase con ${b.mentorName} quedó agendada`,
    replyTo: b.mentorEmail,
    icsContent: ics,
    html: shell(
      "Tu clase quedó agendada 🌊",
      `<p style="color:#aab8d4;font-size:14px;margin:0 0 16px">Hola ${b.studentName}, confirmamos tu sesión:</p>
       ${row("Cuándo", when)}
       ${row("Con", b.mentorName)}
       ${b.note ? row("Tu nota", b.note) : ""}
       ${calButton(ev)}
       <p style="color:#8aa0c6;font-size:12px;margin-top:18px">Adjuntamos la invitación para tu calendario.</p>`,
    ),
  });

  // Mentora
  await sendEmail({
    to: b.mentorEmail,
    subject: `Nueva clase agendada: ${b.studentName}`,
    replyTo: b.studentEmail,
    icsContent: ics,
    html: shell(
      "Tienes una nueva clase agendada",
      `${row("Estudiante", b.studentName)}
       ${row("Correo", b.studentEmail)}
       ${row("Cuándo", when)}
       ${b.note ? row("Nota del estudiante", b.note) : ""}
       ${calButton(ev)}`,
    ),
  });
}

export interface CancellationNotice {
  studentName: string;
  studentEmail: string;
  mentorName: string;
  mentorEmail: string;
  startsAtIso: string;
  reason: string;
}

/** Correos cuando el estudiante cancela una clase: aviso a la mentora (con el
 *  motivo) + confirmación al estudiante. */
export async function notifyCancellation(c: CancellationNotice): Promise<void> {
  const when = `${formatDayLabel(c.startsAtIso)} · ${formatTime(c.startsAtIso)} (hora Colombia)`;

  // Mentora
  await sendEmail({
    to: c.mentorEmail,
    subject: `Clase cancelada: ${c.studentName}`,
    replyTo: c.studentEmail,
    html: shell(
      "Se canceló una clase",
      `${row("Estudiante", c.studentName)}
       ${row("Correo", c.studentEmail)}
       ${row("Era", when)}
       ${row("Motivo", c.reason)}
       <p style="color:#8aa0c6;font-size:12px;margin-top:18px">La franja quedó disponible de nuevo para otros estudiantes.</p>`,
    ),
  });

  // Estudiante
  await sendEmail({
    to: c.studentEmail,
    subject: `Cancelaste tu clase con ${c.mentorName}`,
    replyTo: c.mentorEmail,
    html: shell(
      "Tu clase fue cancelada",
      `<p style="color:#aab8d4;font-size:14px;margin:0 0 16px">Hola ${c.studentName}, confirmamos la cancelación de tu sesión:</p>
       ${row("Era", when)}
       ${row("Con", c.mentorName)}
       ${row("Motivo", c.reason)}
       <p style="color:#8aa0c6;font-size:12px;margin-top:18px">Cuando quieras puedes volver a agendar. 🌊</p>`,
    ),
  });
}

export interface EnrollmentNotice {
  studentName: string;
  studentEmail: string;
  programTitle: string;
  mentorName: string;
  mentorEmail: string;
}

/** Correo de bienvenida/acceso: la mentora inscribió al estudiante en un programa. */
export async function notifyEnrollment(n: EnrollmentNotice): Promise<void> {
  await sendEmail({
    to: n.studentEmail,
    subject: `Ya tienes acceso a ${n.programTitle} en OCEOM`,
    replyTo: n.mentorEmail || undefined,
    html: shell(
      "Tu viaje comienza 🌊",
      `<p style="color:#aab8d4;font-size:14px;margin:0 0 16px">Hola ${n.studentName}, ${n.mentorName} te abrió el acceso a tu proceso en OCEOM:</p>
       ${row("Programa", n.programTitle)}
       ${row("Tu mentora", n.mentorName)}
       <p style="color:#aab8d4;font-size:14px;margin:16px 0 0">Entra a tu <strong style="color:#e8eefb">Santuario</strong> para comenzar tu ruta, tus experiencias y tus materiales.</p>
       ${linkButton(`${APP_URL}/login`, "Entrar a mi Santuario")}
       <p style="color:#8aa0c6;font-size:12px;margin-top:18px">Ingresa con este correo (${n.studentEmail}). Si aún no creaste tu contraseña, usa “Acceder con Google” o regístrate con este mismo correo.</p>`,
    ),
  });
}
