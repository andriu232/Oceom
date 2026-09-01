import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const BUCKET = "infoproductos";

/**
 * GET /api/descargas/[token]
 *
 * Entrega un infoproducto comprado. El token es el permiso: se crea al
 * confirmarse el pago y viaja en el correo, así que funciona también para
 * quien compró sin cuenta.
 *
 * El archivo NUNCA se sirve desde una URL pública: se firma una URL de dos
 * minutos contra el bucket privado. Un enlace copiado a un grupo de WhatsApp
 * caduca antes de que alguien lo abra.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const svc = createServiceClient();

  const { data: grant } = await svc
    .from("store_downloads")
    .select("id, path, downloads, max_downloads, expires_at, order_id")
    .eq("token", token)
    .maybeSingle();

  if (!grant) {
    return NextResponse.json({ error: "Enlace no válido." }, { status: 404 });
  }
  if (grant.expires_at && new Date(grant.expires_at) < new Date()) {
    return NextResponse.json({ error: "Este enlace caducó." }, { status: 410 });
  }
  if (grant.downloads >= grant.max_downloads) {
    return NextResponse.json(
      { error: "Se alcanzó el número de descargas. Escríbenos y te ayudamos." },
      { status: 429 },
    );
  }

  // El pedido tiene que seguir pagado (una devolución retira el acceso).
  const { data: order } = await svc
    .from("store_orders")
    .select("status")
    .eq("id", grant.order_id)
    .maybeSingle();
  if (order?.status !== "paid") {
    return NextResponse.json({ error: "Este pedido no está pagado." }, { status: 403 });
  }

  const { data: signed, error } = await svc.storage
    .from(BUCKET)
    .createSignedUrl(grant.path, 120, { download: true });

  if (error || !signed?.signedUrl) {
    console.error("[descargas] no se pudo firmar", grant.path, error);
    return NextResponse.json({ error: "El archivo no está disponible." }, { status: 404 });
  }

  await svc
    .from("store_downloads")
    .update({ downloads: grant.downloads + 1 })
    .eq("id", grant.id);

  return NextResponse.redirect(signed.signedUrl);
}
