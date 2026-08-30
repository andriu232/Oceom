"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Nivel, PersonaArbol } from "@/lib/biocode/arbol";

/* ============================================================
   MI ÁRBOL BIOCODE (§14).

   Lo que se guarda aquí es información de terceros que nunca dieron su
   consentimiento: la familia de quien escribe. Todas las consultas van con
   `user_id = auth.uid()` además de la política de RLS, y no hay ninguna vía
   por la que la mentora pueda leerlo.
   ============================================================ */

export interface ArbolCargado {
  personas: PersonaArbol[];
  /** Falta aplicar la 0031. */
  faltaMigracion: boolean;
}

export async function getArbol(): Promise<ArbolCargado> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { personas: [], faltaMigracion: false };

  const { data, error } = await supabase
    .from("biocode_arbol")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at");

  if (error) {
    // 42P01 = la tabla no existe todavía.
    const faltaMigracion = error.code === "42P01";
    if (!faltaMigracion) console.error("[biocode] árbol", error.message);
    return { personas: [], faltaMigracion };
  }

  return {
    personas: (data ?? []).map((p) => ({
      id: p.id as string,
      nivel: p.nivel as Nivel,
      parentesco: (p.parentesco as string | null) ?? null,
      nombre: (p.nombre as string | null) ?? null,
      nacimiento: (p.nacimiento as string | null) ?? null,
      fallecimiento: (p.fallecimiento as string | null) ?? null,
      profesion: (p.profesion as string | null) ?? null,
      economia: (p.economia as string | null) ?? null,
      enfermedades: (p.enfermedades as string[] | null) ?? [],
      acontecimientos: (p.acontecimientos as PersonaArbol["acontecimientos"] | null) ?? [],
      separacion: Boolean(p.separacion),
      migracion: Boolean(p.migracion),
      perdida: Boolean(p.perdida),
      conflicto: Boolean(p.conflicto),
      notas: (p.notas as string | null) ?? null,
    })),
    faltaMigracion: false,
  };
}

export type PersonaGuardable = Omit<PersonaArbol, "id"> & { id?: string };

export async function guardarPersona(
  p: PersonaGuardable,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Entra de nuevo." };

  const fila = {
    user_id: user.id,
    nivel: p.nivel,
    parentesco: p.parentesco?.trim() || null,
    nombre: p.nombre?.trim() || null,
    nacimiento: p.nacimiento || null,
    fallecimiento: p.fallecimiento || null,
    profesion: p.profesion?.trim() || null,
    economia: p.economia || null,
    enfermedades: p.enfermedades.map((e) => e.trim()).filter(Boolean).slice(0, 20),
    acontecimientos: p.acontecimientos
      .filter((a) => a.texto.trim())
      .map((a) => ({ texto: a.texto.trim().slice(0, 300), edad: a.edad ?? null }))
      .slice(0, 20),
    separacion: p.separacion,
    migracion: p.migracion,
    perdida: p.perdida,
    conflicto: p.conflicto,
    notas: p.notas?.trim().slice(0, 2000) || null,
  };

  const q = p.id
    ? supabase.from("biocode_arbol").update(fila).eq("id", p.id).eq("user_id", user.id)
    : supabase.from("biocode_arbol").insert(fila);

  const { data, error } = await q.select("id").maybeSingle();
  if (error) {
    console.error("[biocode] guardar persona", error.message);
    return { ok: false, error: "No pude guardarlo. Inténtalo otra vez." };
  }
  revalidatePath("/biocode/arbol");
  return { ok: true, id: (data?.id as string) ?? p.id };
}

export async function borrarPersona(id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Entra de nuevo." };

  const { error } = await supabase
    .from("biocode_arbol")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) {
    console.error("[biocode] borrar persona", error.message);
    return { ok: false, error: "No pude borrarlo." };
  }
  revalidatePath("/biocode/arbol");
  return { ok: true };
}
