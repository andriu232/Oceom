import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { APP_URL } from "@/lib/email/layout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ============================================================
   Baja de los correos de OCEOM, SIN iniciar sesión.

   La credencial es `profiles.mail_token` (uuid único y secreto). Es lo único
   que se pide: quien recibe el correo tiene que poder salirse en un clic,
   aunque no recuerde su contraseña. El token solo permite apagar los
   correos — no da acceso a nada más.

   GET  → página de confirmación con un botón.
   POST → ejecuta la baja.

   Que el GET NO dé de baja es deliberado: los antivirus de correo y el
   pre-cargador de enlaces de Outlook visitan todos los enlaces del mensaje.
   Si el GET diera de baja, la gente aparecería dada de baja sin haber
   tocado nada. El POST lo hace tanto el botón como el "cancelar suscripción"
   de Gmail (RFC 8058, cabecera List-Unsubscribe-Post).
   ============================================================ */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function page(title: string, body: string, form?: string): Response {
  return new Response(
    `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} · OCEOM</title></head>
<body style="margin:0;background:#0a1124;font-family:'Segoe UI',Helvetica,Arial,sans-serif;color:#e8eefb">
  <div style="max-width:460px;margin:12vh auto;padding:0 20px;text-align:center">
    <div style="font-size:20px;font-weight:700;letter-spacing:3px">OCE<span style="color:#5eead4">OM</span></div>
    <h1 style="font-size:20px;margin:28px 0 12px">${title}</h1>
    <p style="color:#aab8d4;font-size:15px;line-height:1.6">${body}</p>
    ${form ?? ""}
    <p style="margin-top:32px"><a href="${APP_URL}/bitacora" style="color:#5eead4;font-size:13px">Ir a mi Bitácora Interior</a></p>
  </div>
</body></html>`,
    { status: 200, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("t") ?? "";
  if (!UUID.test(token)) {
    return page("Enlace no válido", "Este enlace de baja no es correcto o ya caducó.");
  }

  const svc = createServiceClient();
  const { data } = await svc
    .from("profiles")
    .select("full_name, mail_opt_in")
    .eq("mail_token", token)
    .maybeSingle();

  if (!data) {
    return page("Enlace no válido", "Este enlace de baja no es correcto o ya caducó.");
  }
  if (!data.mail_opt_in) {
    return page(
      "Ya estabas dado de baja",
      "No te vamos a enviar más correos. Puedes volver a activarlos cuando quieras desde tus Ajustes.",
    );
  }

  const nombre = (data.full_name ?? "").trim().split(/\s+/)[0];
  return page(
    "¿Dejamos de escribirte?",
    `${nombre ? nombre + ", d" : "D"}ejaremos de enviarte los correos de OCEOM (recordatorios, poemas y todo lo demás). Tu cuenta y todo lo que has escrito siguen intactos.`,
    `<form method="post" style="margin-top:24px">
       <input type="hidden" name="t" value="${token}">
       <button type="submit" style="background:#0ea5b7;color:#04121a;border:0;font-weight:600;font-size:15px;padding:12px 24px;border-radius:14px;cursor:pointer">Sí, dejar de recibirlos</button>
     </form>`,
  );
}

export async function POST(req: NextRequest) {
  // El token puede venir por la URL (Gmail, un clic) o por el formulario.
  let token = req.nextUrl.searchParams.get("t") ?? "";
  if (!UUID.test(token)) {
    try {
      const form = await req.formData();
      token = String(form.get("t") ?? "");
    } catch {
      /* Gmail manda un cuerpo que no es formulario: se queda con el de la URL. */
    }
  }
  if (!UUID.test(token)) {
    return NextResponse.json({ error: "enlace no válido" }, { status: 400 });
  }

  const svc = createServiceClient();
  const { data, error } = await svc
    .from("profiles")
    .update({ mail_opt_in: false })
    .eq("mail_token", token)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[baja correo]", error.message);
    return NextResponse.json({ error: "no se pudo procesar" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "enlace no válido" }, { status: 400 });
  }

  // Gmail y compañía no muestran nada: les basta un 200.
  if (!req.headers.get("accept")?.includes("text/html")) {
    return NextResponse.json({ ok: true });
  }
  return page(
    "Listo, no te escribimos más",
    "Dejamos de enviarte correos. Si algún día los quieres de vuelta, están en tus Ajustes.",
  );
}
