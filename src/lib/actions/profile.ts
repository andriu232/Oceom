"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type ProfileFormState = { ok?: boolean; error?: string } | undefined;

const profileSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(2, "Tu nombre es muy corto")
    .max(80, "El nombre es demasiado largo"),
  avatar_url: z.string().trim().max(500).optional(),
});

/** Actualiza el perfil (nombre y foto) del usuario autenticado. */
export async function updateProfileAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = profileSchema.safeParse({
    full_name: formData.get("full_name"),
    avatar_url: formData.get("avatar_url") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      avatar_url: parsed.data.avatar_url || null,
    })
    .eq("id", user.id);

  if (error) return { error: "No se pudo guardar. Inténtalo de nuevo." };

  revalidatePath("/ajustes");
  revalidatePath("/", "layout"); // refresca el nombre/avatar en la barra lateral
  return { ok: true };
}

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    message: "Las contraseñas no coinciden",
    path: ["confirm"],
  });

/** Cambia la contraseña del usuario autenticado. */
export async function updatePasswordAction(
  _prev: ProfileFormState,
  formData: FormData,
): Promise<ProfileFormState> {
  const parsed = passwordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos no válidos" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { error: "No se pudo cambiar la contraseña. Inténtalo de nuevo." };
  }

  return { ok: true };
}
