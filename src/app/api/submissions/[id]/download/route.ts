import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

const BUCKET = "materials";

/**
 * GET /api/submissions/[id]/download
 * Descarga el archivo de una entrega. El acceso lo decide RLS: el estudiante
 * dueño o la mentora. Si pasa, genera un signed URL corto y redirige.
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

  const { data: sub } = await supabase
    .from("submissions")
    .select("id,file_url")
    .eq("id", id)
    .maybeSingle();

  if (!sub?.file_url) {
    return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  }

  const { data: signed, error } = await createServiceClient()
    .storage.from(BUCKET)
    .createSignedUrl(sub.file_url, 120, { download: true });

  if (error || !signed?.signedUrl) {
    return NextResponse.json({ error: "No disponible" }, { status: 404 });
  }

  return NextResponse.redirect(signed.signedUrl);
}
