import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const BUCKET = "biblioteca";

/**
 * GET /api/biblioteca/[id]/download
 * Descarga un archivo de la Biblioteca. El acceso lo decide RLS: el select con
 * el cliente de sesión solo devuelve el ítem si está publicado (o si quien pide
 * es la mentora). Si pasa, generamos un signed URL corto y redirigimos.
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

  const { data: item } = await supabase
    .from("library_items")
    .select("id,file_path")
    .eq("id", id)
    .maybeSingle();

  if (!item?.file_path) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const { data: signed, error } = await createServiceClient()
    .storage.from(BUCKET)
    .createSignedUrl(item.file_path, 120, { download: true });

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
