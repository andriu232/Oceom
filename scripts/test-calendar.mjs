// Prueba directa de la sincronización con Google Calendar.
// Replica la lógica de src/lib/google/calendar.ts para verificar credenciales
// + permiso de calendario, sin levantar toda la app.
//   node --env-file=.env.local scripts/test-calendar.mjs
import { createSign } from "node:crypto";

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/calendar";

const clientEmail = process.env.GOOGLE_SA_CLIENT_EMAIL;
const privateKey = process.env.GOOGLE_SA_PRIVATE_KEY?.replace(/\\n/g, "\n");
const calendarId = process.env.GOOGLE_CALENDAR_ID;

if (!clientEmail || !privateKey || !calendarId) {
  console.error("❌ Faltan variables:", {
    GOOGLE_SA_CLIENT_EMAIL: !!clientEmail,
    GOOGLE_SA_PRIVATE_KEY: !!privateKey,
    GOOGLE_CALENDAR_ID: !!calendarId,
  });
  process.exit(1);
}

const b64url = (s) => Buffer.from(s).toString("base64url");

async function getToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = b64url(
    JSON.stringify({ iss: clientEmail, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 }),
  );
  const input = `${header}.${claims}`;
  const sig = createSign("RSA-SHA256").update(input).sign(privateKey, "base64url");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${input}.${sig}`,
    }),
  });
  if (!res.ok) throw new Error(`token ${res.status}: ${await res.text()}`);
  return (await res.json()).access_token;
}

async function main() {
  console.log("→ Pidiendo token OAuth2 (firmando JWT)...");
  const token = await getToken();
  console.log("✅ Token obtenido.");

  const start = new Date(Date.now() + 24 * 3600 * 1000); // mañana
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const body = {
    summary: "🌊 Prueba OCEOM · sincronización de agenda",
    description: "Evento de verificación. Puedes borrarlo.",
    start: { dateTime: start.toISOString(), timeZone: "America/Bogota" },
    end: { dateTime: end.toISOString(), timeZone: "America/Bogota" },
  };

  console.log(`→ Creando evento en el calendario: ${calendarId}`);
  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=none`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  if (!res.ok) {
    console.error("❌ Falló la creación:", res.status, await res.text());
    process.exit(1);
  }
  const ev = await res.json();
  console.log("✅ ¡Evento creado! id:", ev.id);
  console.log("   Míralo aquí:", ev.htmlLink);
  console.log("\n👉 Revisa el Google Calendar de Valeria: debe aparecer mañana un evento '🌊 Prueba OCEOM'.");
}

main().catch((e) => {
  console.error("❌ Error:", e.message);
  process.exit(1);
});
