"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { createClient } from "@/lib/supabase/server";
import {
  BIBLIOTECA_BUCKET,
  MAX_UPLOAD_BYTES,
  ingestDocument,
} from "@/lib/omi/ingest";

/* ============================================================
   Biblioteca IA (admin): la mentora sube material y se ingesta al "cerebro"
   de OMI (se trocea en omi_chunks e indexa para retrieval).

   Los ARCHIVOS no viajan por la Server Action: la plataforma corta el cuerpo
   de la petición muy por debajo de lo que pesa un PDF de libro. En su lugar
   el navegador sube directo a Storage con una URL firmada y luego
   /api/biblioteca/ingest hace el indexado (ver createBibliotecaUpload).
   ============================================================ */

export type BibliotecaState = { ok?: boolean; error?: string } | undefined;

/** Ingesta texto pegado directamente. */
export async function addTextDocumentAction(
  _prev: BibliotecaState,
  formData: FormData,
): Promise<BibliotecaState> {
  const profile = await requireRole("mentor", "super_admin");
  const title = String(formData.get("title") ?? "").trim();
  const text = String(formData.get("text") ?? "");
  if (!title) return { error: "Ponle un título al material." };
  if (text.trim().length < 20) return { error: "El texto es muy corto." };

  const res = await ingestDocument({
    title,
    text,
    source: "text",
    fileName: null,
    createdBy: profile.id,
  });
  if ("error" in res) return { error: res.error };
  revalidatePath("/biblioteca-ia");
  return { ok: true };
}

export type SignedUpload = { path: string; token: string } | { error: string };

/** Paso 1 de la subida de archivos: firma una ruta en el bucket privado. */
export async function createBibliotecaUpload(
  fileName: string,
  size: number,
): Promise<SignedUpload> {
  await requireRole("mentor", "super_admin");
  if (size > MAX_UPLOAD_BYTES) return { error: "El archivo supera los 25 MB." };

  const svc = createServiceClient();
  const { data: bucket } = await svc.storage.getBucket(BIBLIOTECA_BUCKET);
  if (!bucket)
    await svc.storage.createBucket(BIBLIOTECA_BUCKET, {
      public: false,
      fileSizeLimit: MAX_UPLOAD_BYTES,
    });

  const safe = (fileName || "archivo").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const rand = Math.random().toString(36).slice(2, 10);
  const { data, error } = await svc.storage
    .from(BIBLIOTECA_BUCKET)
    .createSignedUploadUrl(`${rand}-${safe}`);
  if (error || !data) return { error: error?.message ?? "No se pudo iniciar la subida." };
  return { path: data.path, token: data.token };
}

/** Refresca la lista tras indexar desde la ruta /api/biblioteca/ingest. */
export async function refreshBibliotecaAction(): Promise<void> {
  await requireRole("mentor", "super_admin");
  revalidatePath("/biblioteca-ia");
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
