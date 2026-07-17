"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/* ============================================================
   Galería Astral (astral_items): Valeria publica fotos y poemas que los
   estudiantes recorren en la galería orbital 3D. Las fotos viven en el
   bucket PÚBLICO `galeria` (auto-creado) — la galería 3D necesita URLs
   directas para cargarlas como texturas.
   ============================================================ */

const BUCKET = "galeria";
const MAX_BYTES = 10_485_760; // 10 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

export type AstralState = { ok?: boolean; error?: string } | undefined;

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

function revalidateGaleria() {
  revalidatePath("/galeria-admin");
  revalidatePath("/galeria");
}

/** Publica un poema en la Galería Astral. */
export async function addAstralPoemAction(
  _prev: AstralState,
  formData: FormData,
): Promise<AstralState> {
  const profile = await requireRole("mentor", "super_admin");
  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  if (!title) return { error: "Ponle un título al poema." };
  if (content.length < 10) return { error: "El poema es muy corto." };
  if (content.length > 8000) return { error: "El poema es demasiado largo." };

  const supabase = await createClient();
  const { error } = await supabase.from("astral_items").insert({
    kind: "poema",
    title: title.slice(0, 160),
    content,
    created_by: profile.id,
  });
  if (error) return { error: "No se pudo publicar. Inténtalo de nuevo." };
  revalidateGaleria();
  return { ok: true };
}

/** Sube una foto a la Galería Astral. */
export async function uploadAstralFotoAction(
  _prev: AstralState,
  formData: FormData,
): Promise<AstralState> {
  const profile = await requireRole("mentor", "super_admin");
  const titleRaw = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim() || null;
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0)
    return { error: "Selecciona una imagen." };
  if (!ALLOWED.includes(file.type))
    return { error: "Formato no válido (usa JPG, PNG o WebP)." };
  if (file.size > MAX_BYTES) return { error: "La imagen supera los 10 MB." };

  const title = titleRaw || file.name.replace(/\.[^.]+$/, "");
  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const path = `${Math.random().toString(36).slice(2, 10)}-${Date.now()}.${ext}`;

  const svc = createServiceClient();
  await ensureBucket(svc);
  const buffer = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await svc.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: false,
  });
  if (upErr) return { error: `No se pudo subir: ${upErr.message}` };

  const {
    data: { publicUrl },
  } = svc.storage.from(BUCKET).getPublicUrl(path);

  const supabase = await createClient();
  const { error } = await supabase.from("astral_items").insert({
    kind: "foto",
    title: title.slice(0, 160),
    description,
    file_url: publicUrl,
    created_by: profile.id,
  });
  if (error) {
    await svc.storage.from(BUCKET).remove([path]);
    return { error: "No se pudo guardar el registro." };
  }
  revalidateGaleria();
  return { ok: true };
}

/** Muestra u oculta un elemento de la galería. */
export async function toggleAstralItemAction(
  id: string,
  isPublished: boolean,
): Promise<AstralState> {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { error } = await supabase
    .from("astral_items")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) return { error: "No se pudo actualizar." };
  revalidateGaleria();
  return { ok: true };
}

/** Elimina un elemento (y su foto del bucket si la tiene). */
export async function deleteAstralItemAction(id: string): Promise<AstralState> {
  await requireRole("mentor", "super_admin");
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("astral_items")
    .select("file_url")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("astral_items").delete().eq("id", id);
  if (error) return { error: "No se pudo eliminar." };
  const path = item?.file_url?.split(`/${BUCKET}/`)[1];
  if (path) await createServiceClient().storage.from(BUCKET).remove([path]);
  revalidateGaleria();
  return { ok: true };
}
