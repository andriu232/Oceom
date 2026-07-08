"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

/* ============================================================
   Foto de perfil: subida y borrado. Las imágenes viven en el
   bucket PÚBLICO `avatars` (para poder mostrarlas con <img>), en
   la ruta {userId}/{ts}.{ext}. En profiles.avatar_url guardamos la
   URL pública. La subida la hace el service_role (bypass RLS).
   El default (foto de Google) lo pone el trigger handle_new_user.
   ============================================================ */

const BUCKET = "avatars";
const MAX_BYTES = 5_242_880; // 5 MB
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export type AvatarState =
  | { ok?: boolean; url?: string | null; error?: string }
  | undefined;

/** Asegura que el bucket público `avatars` exista (idempotente). Así funciona
 *  aunque no se haya corrido la migración 0009 en Supabase. */
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

/** Sube una foto de perfil y la guarda en profiles.avatar_url. */
export async function updateAvatarAction(
  _prev: AvatarState,
  formData: FormData,
): Promise<AvatarState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0)
    return { error: "Selecciona una imagen." };
  if (!ALLOWED.includes(file.type))
    return { error: "Formato no válido (usa JPG, PNG, WebP o GIF)." };
  if (file.size > MAX_BYTES) return { error: "La imagen supera los 5 MB." };

  const svc = createServiceClient();
  await ensureBucket(svc);

  const ext = (file.type.split("/")[1] || "jpg").replace("jpeg", "jpg");
  const path = `${user.id}/${Date.now()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: upErr } = await svc.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  });
  if (upErr) return { error: `No se pudo subir la imagen: ${upErr.message}` };

  const {
    data: { publicUrl },
  } = svc.storage.from(BUCKET).getPublicUrl(path);

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: publicUrl })
    .eq("id", user.id);
  if (error)
    return { error: "Subimos la imagen pero no se pudo guardar. Reintenta." };

  // Limpia fotos anteriores del usuario (deja solo la nueva).
  const { data: olds } = await svc.storage.from(BUCKET).list(user.id);
  const stale = (olds ?? [])
    .map((o) => `${user.id}/${o.name}`)
    .filter((p) => p !== path);
  if (stale.length) await svc.storage.from(BUCKET).remove(stale);

  revalidatePath("/ajustes");
  revalidatePath("/configuracion");
  revalidatePath("/", "layout"); // refresca el avatar en la barra lateral
  return { ok: true, url: publicUrl };
}

/** Quita la foto de perfil (vuelve a las iniciales) y borra los archivos. */
export async function removeAvatarAction(): Promise<AvatarState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (error) return { error: "No se pudo quitar la foto. Reintenta." };

  const svc = createServiceClient();
  const { data: olds } = await svc.storage.from(BUCKET).list(user.id);
  if (olds?.length)
    await svc.storage
      .from(BUCKET)
      .remove(olds.map((o) => `${user.id}/${o.name}`));

  revalidatePath("/ajustes");
  revalidatePath("/configuracion");
  revalidatePath("/", "layout");
  return { ok: true, url: null };
}
