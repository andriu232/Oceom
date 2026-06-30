import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const BUCKET = "materials";

/**
 * GET /api/materials/[id]/download
 * Descarga un material. El acceso lo decide RLS: el select con el cliente de
 * sesión solo devuelve el recurso si el usuario tiene acceso al programa
 * (o es mentora). Si pasa, generamos un signed URL corto y redirigimos.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "UNAUTH" }, { status: 401 });

  const { data: resource } = await supabase
    .from("resources")
    .select("id,file_url")
    .eq("id", id)
    .maybeSingle();

  if (!resource?.file_url) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  // Si fuera una URL externa, redirige directo.
  if (/^https?:\/\//.test(resource.file_url)) {
    return NextResponse.redirect(resource.file_url);
  }

  const { data: signed, error } = await createServiceClient()
    .storage.from(BUCKET)
    .createSignedUrl(resource.file_url, 120, { download: true });

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
