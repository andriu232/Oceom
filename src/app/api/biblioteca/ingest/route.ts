import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import {
  BIBLIOTECA_BUCKET,
  extractText,
  ingestDocument,
} from "@/lib/omi/ingest";

/* ============================================================
   Indexa un archivo que YA está en Storage (la subida es directa desde el
   navegador, así no pasa por el límite de cuerpo de la Server Action).
   Aquí solo se descarga, se extrae el texto y se trocea — por eso pide más
   tiempo de ejecución: un PDF largo tarda.
   ============================================================ */

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let profile;
  try {
    profile = await requireRole("mentor", "super_admin");
  } catch {
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  const { path, title, fileName } = (await req.json()) as {
    path?: string;
    title?: string;
    fileName?: string;
  };
  if (!path) return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });

  const svc = createServiceClient();
  const { data: blob, error: dlErr } = await svc.storage
    .from(BIBLIOTECA_BUCKET)
    .download(path);
  if (dlErr || !blob)
    return NextResponse.json(
      { error: `No se pudo leer el archivo subido: ${dlErr?.message ?? ""}` },
      { status: 400 },
    );

  const name = fileName || path.split("/").pop() || "archivo";
  const extracted = await extractText(
    new Uint8Array(await blob.arrayBuffer()),
    name,
    blob.type,
  );
  if ("error" in extracted) {
    await svc.storage.from(BIBLIOTECA_BUCKET).remove([path]);
    return NextResponse.json({ error: extracted.error }, { status: 400 });
  }

  const result = await ingestDocument({
    title: (title || "").trim() || name.replace(/\.[^.]+$/, ""),
    text: extracted.text,
    source: "file",
    fileName: name,
    createdBy: profile.id,
  });

  // El original ya no hace falta: lo indexado vive en omi_chunks.
  await svc.storage.from(BIBLIOTECA_BUCKET).remove([path]);

  if ("error" in result) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
