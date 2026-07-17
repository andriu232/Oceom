"use server";

import { revalidatePath } from "next/cache";
import { requireStudentArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { VISION_AREA_KEYS } from "@/config/vision";

/* ============================================================
   Imágenes del Mapa de Visión (vision_images): el estudiante sube fotos que
   representan sus metas, por área. Se muestran como collage (vision board).
   Los archivos viven en el bucket PÚBLICO `vision` (auto-creado).
   ============================================================ */

const BUCKET = "vision";
const MAX_BYTES = 10_485_760; // 10 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];
const AREAS = new Set(["general", ...VISION_AREA_KEYS]);

export type VisionImgState = { ok?: boolean; error?: string; added?: number } | undefined;

async function ensureBucket(svc: ReturnType<typeof createServiceClient>) {
  const { data } = await svc.storage.getBucket(BUCKET);
  if (!data) {
    await svc.storage.createBucket(BUCKET, {
      public: true,
      fileSizeLimit: MAX_BYTES,
      allowedMimeTypes: ALLOWED,
    });
  }
}

/** Sube una o varias imágenes a un área del vision board. */
export async function uploadVisionImagesAction(
  _prev: VisionImgState,
  formData: FormData,
): Promise<VisionImgState> {
  const profile = await requireStudentArea();
  const area = String(formData.get("area") ?? "general");
  if (!AREAS.has(area)) return { error: "Área no válida." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { error: "Selecciona al menos una imagen." };

  const svc = createServiceClient();
  await ensureBucket(svc);

  const supabase = await createClient();
  const rows: { student_id: string; area: string; url: string }[] = [];

  for (const file of files) {
    if (!ALLOWED.includes(file.type)) continue;
    if (file.size > MAX_BYTES) continue;
    const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
    const path = `${profile.id}/${Math.random().toString(36).slice(2, 10)}-${Date.now()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: upErr } = await svc.storage.from(BUCKET).upload(path, buffer, {
      contentType: file.type,
      upsert: false,
    });
    if (upErr) continue;
    const {
      data: { publicUrl },
    } = svc.storage.from(BUCKET).getPublicUrl(path);
    rows.push({ student_id: profile.id, area, url: publicUrl });
  }

  if (rows.length === 0) return { error: "No se pudo subir (formato o tamaño)." };

  const { error } = await supabase.from("vision_images").insert(rows);
  if (error) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  revalidatePath("/mapa-vision");
  return { ok: true, added: rows.length };
}

/** Elimina una imagen del vision board (y su archivo del bucket). */
export async function deleteVisionImageAction(id: string): Promise<VisionImgState> {
  const profile = await requireStudentArea();
  const supabase = await createClient();
  const { data: img } = await supabase
    .from("vision_images")
    .select("url, student_id")
    .eq("id", id)
    .maybeSingle();
  if (!img || img.student_id !== profile.id) return { error: "No encontrada." };

  const { error } = await supabase.from("vision_images").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };

  const path = (img.url as string).split(`/${BUCKET}/`)[1];
  if (path) await createServiceClient().storage.from(BUCKET).remove([path]);

  revalidatePath("/mapa-vision");
  return { ok: true };
}
