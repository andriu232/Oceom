"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/* ============================================================
   Materiales de apoyo: subida (mentora) y borrado. Los archivos
   viven en el bucket privado `materials`; en resources.file_url
   guardamos la RUTA en Storage (no una URL pública). La descarga
   genera un signed URL en /api/materials/[id]/download.
   ============================================================ */

const BUCKET = "materials";
const MAX_BYTES = 52_428_800; // 50 MB

export type MaterialState = { error?: string; ok?: boolean } | undefined;

export async function uploadMaterialAction(
  _prev: MaterialState,
  formData: FormData,
): Promise<MaterialState> {
  await requireRole("mentor", "super_admin");

  const lessonId = String(formData.get("lessonId") ?? "");
  const programId = String(formData.get("programId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const file = formData.get("file");

  if (!lessonId || !title) return { error: "Falta el título del material." };
  if (!(file instanceof File) || file.size === 0)
    return { error: "Selecciona un archivo." };
  if (file.size > MAX_BYTES) return { error: "El archivo supera los 50 MB." };

  const ext = file.name.includes(".")
    ? file.name.split(".").pop()!.toLowerCase().slice(0, 8)
    : "";
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${lessonId}/${rand}-${safe}`;

  const svc = createServiceClient();
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await svc.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type || undefined,
    upsert: false,
  });
  if (upErr) return { error: `No se pudo subir: ${upErr.message}` };

  // Inserta el recurso vía RLS (la mentora puede gestionar resources).
  const supabase = await createClient();
  const { error: insErr } = await supabase.from("resources").insert({
    lesson_id: lessonId,
    title,
    description,
    file_url: path,
    file_type: ext,
  });
  if (insErr) {
    await svc.storage.from(BUCKET).remove([path]); // rollback del archivo
    return { error: insErr.message };
  }

  revalidatePath(`/programas/${programId}/lecciones/${lessonId}`);
  revalidatePath(`/experiencia/${lessonId}`);
  return { ok: true };
}

/* ------------------------------------------------------------------
   Subida DIRECTA a Storage (para archivos grandes). El navegador sube
   el archivo directo a Supabase con una URL firmada, sin pasar por el
   server action ni por Vercel (que cortan las peticiones > 4.5 MB).
   1) createMaterialUpload  → firma una ruta de subida.
   2) el cliente sube el archivo a esa URL firmada.
   3) registerMaterialAction → registra el recurso en la BD.
   ------------------------------------------------------------------ */

export type SignedUpload = { path: string; token: string } | { error: string };

export async function createMaterialUpload(
  lessonId: string,
  fileName: string,
): Promise<SignedUpload> {
  await requireRole("mentor", "super_admin");
  if (!lessonId) return { error: "Falta la lección." };

  const safe = (fileName || "archivo").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
  const rand = Math.random().toString(36).slice(2, 10);
  const path = `${lessonId}/${rand}-${safe}`;

  const svc = createServiceClient();
  const { data, error } = await svc.storage
    .from(BUCKET)
    .createSignedUploadUrl(path);
  if (error || !data) {
    return { error: error?.message ?? "No se pudo iniciar la subida." };
  }
  return { path: data.path, token: data.token };
}

export async function registerMaterialAction(input: {
  lessonId: string;
  programId: string;
  title: string;
  description: string | null;
  path: string;
  fileType: string | null;
}): Promise<MaterialState> {
  await requireRole("mentor", "super_admin");

  const title = input.title?.trim();
  if (!input.lessonId || !title) return { error: "Falta el título del material." };
  if (!input.path) return { error: "No se recibió el archivo subido." };

  const supabase = await createClient();
  const { error } = await supabase.from("resources").insert({
    lesson_id: input.lessonId,
    title,
    description: input.description?.trim() || null,
    file_url: input.path,
    file_type: input.fileType,
  });
  if (error) {
    // Rollback: si no se pudo registrar, borra el archivo subido.
    await createServiceClient().storage.from(BUCKET).remove([input.path]);
    return { error: error.message };
  }

  revalidatePath(`/programas/${input.programId}/lecciones/${input.lessonId}`);
  revalidatePath(`/experiencia/${input.lessonId}`);
  return { ok: true };
}

export async function deleteMaterialAction(
  resourceId: string,
  lessonId: string,
  programId: string,
) {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();

  const { data: r } = await supabase
    .from("resources")
    .select("file_url")
    .eq("id", resourceId)
    .maybeSingle();

  // Borra el archivo de Storage si es una ruta interna (no una URL externa).
  if (r?.file_url && !/^https?:\/\//.test(r.file_url)) {
    await createServiceClient().storage.from(BUCKET).remove([r.file_url]);
  }

  await supabase.from("resources").delete().eq("id", resourceId);
  revalidatePath(`/programas/${programId}/lecciones/${lessonId}`);
  revalidatePath(`/experiencia/${lessonId}`);
}
