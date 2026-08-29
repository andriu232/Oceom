import { NextRequest, NextResponse } from "next/server";
import { runReminders } from "@/lib/hermes/reminders";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Puede haber muchos envíos en una misma hora punta (ej. las 8 p. m. de Bogotá).
export const maxDuration = 300;

/* ============================================================
   GET /api/hermes/cron — barrido horario de recordatorios.

   Lo dispara Vercel Cron (ver vercel.json), que manda el header
   `Authorization: Bearer $CRON_SECRET`. Sin ese secreto la ruta es pública
   y cualquiera podría hacer que Hermes escriba a todo el mundo.
   ============================================================ */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const run = await runReminders();
  return NextResponse.json({ ok: true, ...run });
}
