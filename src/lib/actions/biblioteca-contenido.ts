"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/* ============================================================
   Biblioteca de OCEOM (library_items): Valeria sube textos, poemas y
   archivos (PDF y similares) para los estudiantes. Los archivos viven en
   el bucket PRIVADO `biblioteca` (auto-creado); la descarga sale por
   signed URL en /api/biblioteca/[id]/download.
   (No confundir con la Biblioteca IA, que alimenta a OMI.)
   ============================================================ */

const BUCKET = "biblioteca";
const MAX_BYTES = 20_971_520; // 20 MB
const FILE_EXTS = ["pdf", "doc", "docx", "epub", "txt", "md"];

export type LibraryState = { ok?: boolean; error?: string } | undefined;

async function ensureBucket(svc: ReturnType<typeof createServiceClient>) {
  const { data } = await svc.storage.getBucket(BUCKET);
  if (!data) {
    await svc.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: MAX_BYTES,
    });
  }
}

function revalidateLibrary() {
  revalidatePath("/biblioteca-admin");
  revalidatePath("/biblioteca");
}

/** Publica un texto o poema escrito directamente. */
export async function addLibraryTextAction(
  _prev: LibraryState,
  formData: FormData,
): Promise<LibraryState> {
  const profile = await requireRole("mentor", "super_admin");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim();
  const kindRaw = String(formData.get("kind") ?? "texto");
  const kind = kindRaw === "poema" ? "poema" : "texto";

  if (!title) return { error: "Ponle un título." };
  if (content.length < 10) return { error: "El contenido es muy corto." };
  if (content.length > 60_000) return { error: "El contenido es demasiado largo." };

  const supabase = await createClient();
  const { error } = await supabase.from("library_items").insert({
    title: title.slice(0, 160),
    description,
    kind,
    content,
    created_by: profile.id,
  });
  if (error) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  revalidateLibrary();
  return { ok: true };
}

/** Sube un archivo (PDF, DOC, EPUB, TXT, MD) a la Biblioteca. */
export async function uploadLibraryFileAction(
  _prev: LibraryState,
  formData: FormData,
): Promise<LibraryState> {
  const profile = await requireRole("mentor", "super_admin");
  const titleRaw = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0)
    return { error: "Selecciona un archivo." };
  if (file.size > MAX_BYTES) return { error: "El archivo supera los 20 MB." };

  const name = file.name;
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (!FILE_EXTS.includes(ext))
    return { error: `Formato no soportado (usa ${FILE_EXTS.join(", ").toUpperCase()}).` };

  const title = titleRaw || name.replace(/\.[^.]+$/, "");
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${rand}-${safe}`;

  const svc = createServiceClient();
  await ensureBucket(svc);
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await svc.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (upErr) return { error: `No se pudo subir: ${upErr.message}` };

  const supabase = await createClient();
  const { error } = await supabase.from("library_items").insert({
    title: title.slice(0, 160),
    description,
    kind: "archivo",
    file_path: path,
    file_name: name,
    created_by: profile.id,
  });
  if (error) {
    await svc.storage.from(BUCKET).remove([path]); // rollback del archivo
    return { error: "No se pudo guardar el registro." };
  }

  revalidateLibrary();
  return { ok: true };
}

/** Muestra u oculta un elemento para los estudiantes. */
export async function toggleLibraryItemAction(
  id: string,
  isPublished: boolean,
): Promise<LibraryState> {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("library_items")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) return { error: "No se pudo actualizar." };
  revalidateLibrary();
  return { ok: true };
}

/** Elimina un elemento (y su archivo en Storage si lo tiene). */
export async function deleteLibraryItemAction(id: string): Promise<LibraryState> {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("library_items")
    .select("file_path")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("library_items").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  if (item?.file_path) {
    await createServiceClient().storage.from(BUCKET).remove([item.file_path]);
  }
  revalidateLibrary();
  return { ok: true };
}
