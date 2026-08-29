import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { checkResend } from "@/lib/email/health";
import { sendEmailDetailed } from "@/lib/email/send";
import { renderFor, unsubUrlFor } from "@/lib/email/campaigns/run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   GET /api/correos/diagnostico — qué está pasando de verdad con Resend.

   Existe porque `RESEND_API_KEY` y `EMAIL_FROM` están marcadas Sensitive en
   Vercel: no se pueden leer ni con la CLI, así que desde fuera es imposible
   saber con qué remitente sale un correo ni si su dominio está verificado.
   Sin eso, un correo que "salió bien" y no llegó no se puede diagnosticar.

   Protegido con el mismo CRON_SECRET que dispara los envíos: quien puede
   mandar correo a todo el grupo ya puede ver esto.

   Con ?to=alguien@dominio.com manda UNA plantilla real a esa dirección y
   devuelve el id de Resend, para poder buscarlo en su panel.
   ============================================================ */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const health = await checkResend();
  const to = req.nextUrl.searchParams.get("to");
  const slug = req.nextUrl.searchParams.get("slug") ?? "bitacora";

  if (!to) return NextResponse.json({ health });

  // Se usa el token de baja de quien tenga ese correo, si existe; si no, uno
  // inventado — el enlace no funcionará, pero el correo se ve igual.
  const svc = createServiceClient();
  const { data: perfil } = await svc
    .from("profiles")
    .select("full_name, mail_token")
    .eq("email", to)
    .maybeSingle();

  const token =
    (perfil?.mail_token as string | undefined) ??
    "00000000-0000-0000-0000-000000000000";
  const mail = renderFor(slug, {
    full_name: (perfil?.full_name as string | null) ?? null,
    mail_token: token,
  });
  if (!mail) {
    return NextResponse.json({ health, error: `slug desconocido: ${slug}` }, { status: 400 });
  }

  const envio = await sendEmailDetailed({
    to,
    subject: mail.subject,
    html: mail.html,
    headers: {
      "List-Unsubscribe": `<${unsubUrlFor(token)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });

  return NextResponse.json({ health, to, slug, subject: mail.subject, envio });
}
