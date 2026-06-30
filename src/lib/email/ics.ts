/* Generación de invitaciones de calendario (.ics) + enlace "Agregar a Google
   Calendar". Sin dependencias. */

function icsDate(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

export interface CalEvent {
  uid: string;
  title: string;
  description?: string;
  startIso: string;
  endIso: string;
  organizerEmail?: string;
  attendeeEmail?: string;
}

export function buildIcs(e: CalEvent): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//OCEOM//Agenda//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${e.uid}`,
    `DTSTAMP:${icsDate(new Date().toISOString())}`,
    `DTSTART:${icsDate(e.startIso)}`,
    `DTEND:${icsDate(e.endIso)}`,
    `SUMMARY:${escapeText(e.title)}`,
    e.description ? `DESCRIPTION:${escapeText(e.description)}` : "",
    e.organizerEmail ? `ORGANIZER:mailto:${e.organizerEmail}` : "",
    e.attendeeEmail ? `ATTENDEE;RSVP=TRUE:mailto:${e.attendeeEmail}` : "",
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.join("\r\n");
}

/** Enlace para agregar el evento a Google Calendar con un clic. */
export function googleCalendarUrl(e: CalEvent): string {
  const dates = `${icsDate(e.startIso)}/${icsDate(e.endIso)}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates,
    details: e.description ?? "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
