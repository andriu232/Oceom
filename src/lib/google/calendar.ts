/* Sincronización con Google Calendar vía Service Account.
 *
 * Sin dependencias: firmamos un JWT RS256 con node:crypto, lo cambiamos por un
 * access token OAuth2, y llamamos a la Calendar API por REST (fetch).
 *
 * Configuración (una sola vez):
 *   1. Google Cloud → crea un Service Account, habilita "Google Calendar API".
 *   2. Genera una llave JSON. De ahí salen client_email y private_key.
 *   3. Valeria abre Google Calendar → Configuración del calendario que use para
 *      las clases → "Compartir con determinadas personas" → agrega el
 *      client_email del service account con permiso "Hacer cambios en eventos".
 *   4. Copia el ID de ese calendario (Configuración → "ID del calendario";
 *      suele ser el propio correo de Valeria) a GOOGLE_CALENDAR_ID.
 *
 * Si falta alguna env var, todas las funciones hacen no-op silencioso (no
 * rompen la reserva), igual que el envío de correos. */

import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/calendar";
const TZ = "America/Bogota";

function config() {
  const clientEmail = process.env.GOOGLE_SA_CLIENT_EMAIL;
  // La private_key suele venir con "\n" escapados en el .env; los normalizamos.
  const privateKey = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!clientEmail || !privateKey || !calendarId) return null;
  return { clientEmail, privateKey, calendarId };
}

function b64url(input: string | Buffer): string {
  return Buffer.from(input).toString("base64url");
}

/** Firma un JWT de service account y lo cambia por un access token OAuth2. */
async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({
      iss: clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    }),
  );
  const signingInput = `${header}.${claims}`;
  const signature = createSign("RSA-SHA256").update(signingInput).sign(privateKey, "base64url");
  const assertion = `${signingInput}.${signature}`;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`token ${res.status}: ${await res.text()}`);
  }
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new Error("respuesta sin access_token");
  return json.access_token;
}

export interface CalendarEventInput {
  title: string;
  description?: string;
  startIso: string;
  endIso: string;
}

/** Crea el evento en el calendario de Valeria. Devuelve el id del evento de
 *  Google (para poder borrarlo si se cancela), o null si no está configurado o
 *  si falla (no lanza: la reserva no debe romperse por esto). */
export async function createCalendarEvent(input: CalendarEventInput): Promise<string | null> {
  const cfg = config();
  if (!cfg) {
    console.warn("[calendar] sin credenciales — se omite sincronización con Google Calendar");
    return null;
  }

  try {
    const token = await getAccessToken(cfg.clientEmail, cfg.privateKey);
    const body: Record<string, unknown> = {
      summary: input.title,
      description: input.description ?? "",
      start: { dateTime: input.startIso, timeZone: TZ },
      end: { dateTime: input.endIso, timeZone: TZ },
      reminders: { useDefault: true },
    };

    // NO agregamos attendees: un service account sobre un calendario personal
    // no puede invitar asistentes sin Domain-Wide Delegation (error 403). Los
    // datos del estudiante van en la descripción, y el correo lo envía Resend.
    // sendUpdates=none por la misma razón.
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cfg.calendarId)}/events?sendUpdates=none`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );
    if (!res.ok) {
      console.error("[calendar] insert falló:", res.status, await res.text());
      return null;
    }
    const json = (await res.json()) as { id?: string };
    return json.id ?? null;
  } catch (err) {
    console.error("[calendar] error creando evento:", err);
    return null;
  }
}

/** Borra un evento del calendario de Valeria. No-op si no hay id/credenciales. */
export async function deleteCalendarEvent(eventId: string | null | undefined): Promise<void> {
  if (!eventId) return;
  const cfg = config();
  if (!cfg) return;

  try {
    const token = await getAccessToken(cfg.clientEmail, cfg.privateKey);
    const res = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(cfg.calendarId)}/events/${encodeURIComponent(eventId)}?sendUpdates=none`,
      { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
    );
    // 410 = ya borrado; lo tratamos como éxito.
    if (!res.ok && res.status !== 410) {
      console.error("[calendar] delete falló:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[calendar] error borrando evento:", err);
  }
}
