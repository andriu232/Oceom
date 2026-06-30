import { sendEmail } from "./send";
import { buildIcs, googleCalendarUrl, type CalEvent } from "./ics";
import { formatDayLabel, formatTime } from "@/lib/scheduling/time";

/* Correos de la Agenda: confirmación al estudiante + aviso a la mentora,
   ambos con invitación .ics y botón "Agregar a Google Calendar". */

const BRAND = "#0ea5b7";

function shell(title: string, inner: string): string {
  return `
  <div style="background:#0a1124;padding:32px 0;font-family:'Segoe UI',Helvetica,Arial,sans-serif">
    <div style="max-width:520px;margin:0 auto;background:#0f1a36;border:1px solid rgba(94,234,212,0.18);border-radius:18px;overflow:hidden">
      <div style="padding:22px 28px;border-bottom:1px solid rgba(255,255,255,0.06)">
        <span style="font-size:20px;font-weight:700;letter-spacing:3px;color:#e8eefb">OCE<span style="color:#5eead4">OM</span></span>
        <div style="font-size:10px;letter-spacing:3px;color:#8aa0c6;margin-top:2px">BY E-MOTION®</div>
      </div>
      <div style="padding:28px">
        <h1 style="margin:0 0 14px;font-size:19px;color:#e8eefb">${title}</h1>
        ${inner}
      </div>
      <div style="padding:16px 28px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px;color:#8aa0c6">
        OCEOM · Donde el océano interior despierta
      </div>
    </div>
  </div>`;
}

function row(label: string, value: string): string {
  return `<p style="margin:6px 0;color:#aab8d4;font-size:14px"><strong style="color:#e8eefb">${label}:</strong> ${value}</p>`;
}

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
