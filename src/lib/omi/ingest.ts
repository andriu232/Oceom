import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { chunkText } from "@/lib/omi/biblioteca";

/* ============================================================
   Ingesta de material al cerebro de OMI: extraer texto → trocear → indexar.
   Vive fuera del archivo de server actions para poder reutilizarse tanto
   desde una action ("pegar texto") como desde la ruta /api/biblioteca/ingest
   (archivos grandes, que suben directo a Storage).
   ============================================================ */

/** Bucket privado donde aterrizan los archivos antes de indexarse. */
export const BIBLIOTECA_BUCKET = "omi-biblioteca";

export const MAX_UPLOAD_BYTES = 26_214_400; // 25 MB
const MAX_CHARS = 600_000;
const BATCH = 200;

export type IngestResult = { ok: true; chunks: number } | { error: string };

/** Crea el documento, lo trocea e indexa sus fragmentos. */
export async function ingestDocument(input: {
  title: string;
  text: string;
  source: "text" | "file";
  fileName: string | null;
  createdBy?: string | null;
}): Promise<IngestResult> {
  const svc = createServiceClient();
  const body = input.text.trim().slice(0, MAX_CHARS);
  if (!body) return { error: "El documento está vacío o no se pudo leer el texto." };

  const { data: doc, error: docErr } = await svc
    .from("omi_documents")
    .insert({
      title: input.title.slice(0, 200) || "Sin título",
      source_type: input.source,
      file_name: input.fileName,
      char_count: body.length,
      status: "processing",
      created_by: input.createdBy ?? null,
    })
    .select("id")
    .single();
  if (docErr || !doc) return { error: `No se pudo crear el documento: ${docErr?.message ?? ""}` };

  const fail = async (msg: string): Promise<IngestResult> => {
    await svc
      .from("omi_documents")
      .update({ status: "error", error: msg.slice(0, 300) })
      .eq("id", doc.id);
    return { error: msg };
  };

  const chunks = chunkText(body);
  if (chunks.length === 0) return fail("El documento no tiene contenido para indexar.");

  const rows = chunks.map((content, chunk_index) => ({
    document_id: doc.id,
    chunk_index,
    content,
  }));
  for (let i = 0; i < rows.length; i += BATCH) {
    const { error } = await svc.from("omi_chunks").insert(rows.slice(i, i + BATCH));
    if (error) return fail(`Error indexando: ${error.message}`);
  }

  await svc
    .from("omi_documents")
    .update({ status: "ready", chunk_count: chunks.length, error: null })
    .eq("id", doc.id);
  return { ok: true, chunks: chunks.length };
}

/** Extrae texto plano de un archivo soportado (PDF / TXT / MD). */
export async function extractText(
  bytes: Uint8Array,
  fileName: string,
  mimeType?: string,
): Promise<{ text: string } | { error: string }> {
  const ext = fileName.includes(".") ? fileName.split(".").pop()!.toLowerCase() : "";
  try {
    if (ext === "pdf" || mimeType === "application/pdf") {
      const { extractText: pdfText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(bytes);
      const res = await pdfText(pdf, { mergePages: true });
      const text = Array.isArray(res.text) ? res.text.join("\n") : res.text;
      if (text.trim().length < 20)
        return {
          error:
            "No se extrajo texto del PDF (¿es un PDF escaneado, de imágenes?). Pega el texto a mano.",
        };
      return { text };
    }
    if (["txt", "md", "markdown"].includes(ext) || mimeType?.startsWith("text/")) {
      return { text: new TextDecoder().decode(bytes) };
    }
    return { error: "Formato no soportado. Usa PDF, TXT o MD (o pega el texto)." };
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    return { error: `No pude leer el archivo: ${detail.slice(0, 160)}` };
  }
}
