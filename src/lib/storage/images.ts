import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/* ============================================================
   Subida de imágenes públicas a Supabase Storage. El bucket se crea
   la primera vez (público), igual que hace la Tienda con `productos`.
   ============================================================ */

export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const IMAGE_MAX_BYTES = 4_194_304; // 4 MB — margen bajo el límite de la plataforma

export type UploadResult = { url: string } | { error: string };

/** Sube `file` al bucket indicado y devuelve su URL pública. */
export async function uploadPublicImage(
  bucket: string,
  prefix: string,
  file: File,
): Promise<UploadResult> {
  if (!IMAGE_TYPES.includes(file.type))
    return { error: "Formato no válido. Usa JPG, PNG o WEBP." };
  if (file.size > IMAGE_MAX_BYTES) return { error: "La imagen supera los 4 MB." };

  const svc = createServiceClient();
  const { data: existing } = await svc.storage.getBucket(bucket);
  if (!existing)
    await svc.storage.createBucket(bucket, {
      public: true,
      fileSizeLimit: IMAGE_MAX_BYTES,
      allowedMimeTypes: IMAGE_TYPES,
    });

  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${prefix}/${Date.now().toString(36)}.${ext}`;
  const buffer = new Uint8Array(await file.arrayBuffer());

  const { error } = await svc.storage
    .from(bucket)
    .upload(path, buffer, { contentType: file.type, upsert: true });
  if (error) return { error: `No se pudo subir la imagen: ${error.message}` };

  return { url: svc.storage.from(bucket).getPublicUrl(path).data.publicUrl };
}
