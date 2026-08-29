import { NextRequest, NextResponse } from "next/server";
import { runCampaigns } from "@/lib/email/campaigns/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A la hora punta (las 8 p. m. de Bogotá) sale el correo de todo el grupo.
export const maxDuration = 300;

/* ============================================================
   GET /api/correos/cron — barrido horario de las campañas encendidas.

   Lo dispara Vercel Cron (ver vercel.json) con el header
   `Authorization: Bearer $CRON_SECRET`. Sin ese secreto la ruta sería
   pública y cualquiera podría hacer que le llegue correo a todo el grupo.
   ============================================================ */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const run = await runCampaigns();
  return NextResponse.json({ ok: true, ...run });
}
