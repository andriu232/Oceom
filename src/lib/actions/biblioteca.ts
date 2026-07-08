"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { chunkText } from "@/lib/omi/biblioteca";

/* ============================================================
   Biblioteca IA (admin): la mentora sube material y se ingesta al "cerebro"
   de OMI (se trocea en omi_chunks e indexa para retrieval). Texto pegado,
   o archivos .pdf / .txt / .md.
   ============================================================ */

export type BibliotecaState = { ok?: boolean; error?: string } | undefined;

const MAX_BYTES = 10_485_760; // 10 MB
const MAX_CHARS = 600_000;

async function ingest(
  title: string,
  text: string,
  source: "text" | "file",
  fileName: string | null,
): Promise<BibliotecaState> {
  const supabase = await createClient();
  const body = text.trim().slice(0, MAX_CHARS);
  if (!body) return { error: "El documento está vacío o no se pudo leer el texto." };

  const { data: doc, error: docErr } = await supabase
    .from("omi_documents")
    .insert({
      title: title.slice(0, 200),
      source_type: source,
      file_name: fileName,
      char_count: body.length,
      status: "processing",
    })
    .select("id")
    .single();
  if (docErr || !doc) return { error: "No se pudo crear el documento." };

  const chunks = chunkText(body);
  if (chunks.length === 0) {
    await supabase
      .from("omi_documents")
      .update({ status: "error", error: "Sin contenido indexable." })
      .eq("id", doc.id);
    return { error: "El documento no tiene contenido para indexar." };
  }

  const rows = chunks.map((content, chunk_index) => ({
    document_id: doc.id,
    chunk_index,
    content,
  }));
  for (let i = 0; i < rows.length; i += 200) {
    const { error } = await supabase.from("omi_chunks").insert(rows.slice(i, i + 200));
    if (error) {
      await supabase
        .from("omi_documents")
        .update({ status: "error", error: error.message.slice(0, 200) })
        .eq("id", doc.id);
      return { error: "Hubo un problema indexando el documento." };
    }
  }

  await supabase
    .from("omi_documents")
    .update({ status: "ready", chunk_count: chunks.length })
    .eq("id", doc.id);
  revalidatePath("/biblioteca-ia");
  return { ok: true };
}

/** Ingesta texto pegado directamente. */
export async function addTextDocumentAction(
  _prev: BibliotecaState,
  formData: FormData,
): Promise<BibliotecaState> {
  await requireRole("mentor", "super_admin");
  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("text") ?? "");
  if (!title) return { error: "Ponle un título al material." };
  if (text.trim().length < 20) return { error: "El texto es muy corto." };
  return ingest(title, text, "text", null);
}

/** Ingesta un archivo (.pdf / .txt / .md). */
export async function uploadDocumentAction(
  _prev: BibliotecaState,
  formData: FormData,
): Promise<BibliotecaState> {
  await requireRole("mentor", "super_admin");
  const file = formData.get("file");
  const titleRaw = String(formData.get("title") ?? "").trim();
  if (!(file instanceof File) || file.size === 0)
    return { error: "Selecciona un archivo." };
  if (file.size > MAX_BYTES) return { error: "El archivo supera los 10 MB." };

  const name = file.name;
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  const title = titleRaw || name.replace(/\.[^.]+$/, "");

  let text = "";
  try {
    if (ext === "pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const buf = new Uint8Array(await file.arrayBuffer());
      const pdf = await getDocumentProxy(buf);
      const res = await extractText(pdf, { mergePages: true });
      text = Array.isArray(res.text) ? res.text.join("\n") : res.text;
    } else if (
      ext === "txt" ||
      ext === "md" ||
      ext === "markdown" ||
      file.type.startsWith("text/")
    ) {
      text = await file.text();
    } else {
      return { error: "Formato no soportado. Usa PDF, TXT o MD (o pega el texto)." };
    }
  } catch {
    return {
      error:
        "No pude leer el archivo. Si es un PDF escaneado (imagen), pega el texto a mano.",
    };
  }

  if (text.trim().length < 20)
    return {
      error:
        "No se extrajo texto del archivo (¿PDF escaneado?). Pega el texto a mano.",
    };
  return ingest(title, text, "file", name);
}

/** Elimina un documento (y sus fragmentos, en cascada). */
export async function deleteDocumentAction(id: string): Promise<BibliotecaState> {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { error } = await supabase.from("omi_documents").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  revalidatePath("/biblioteca-ia");
  return { ok: true };
}

/** Activa/desactiva un documento (si está inactivo, OMI no lo usa). */
export async function toggleDocumentAction(
  id: string,
  isActive: boolean,
): Promise<BibliotecaState> {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("omi_documents")
    .update({ is_active: isActive })
    .eq("id", id);
  if (error) return { error: "No se pudo actualizar." };
  revalidatePath("/biblioteca-ia");
  return { ok: true };
}
