"use server";

import { createClient } from "@/lib/supabase/server";
import { getNodeBySlug, retrieveNodes, type BiocodeNode } from "@/lib/biocode/nodes";
import type { Mapa } from "@/lib/biocode/dimensiones";

/* ============================================================
   Acciones de MAPA BIOCODE.

   La constelación de una zona se arma con lo que el nodo ya tiene guardado,
   así que abrirla no cuesta una llamada al modelo: aparece de inmediato. La
   IA entra solo cuando la persona quiere conversar.
   ============================================================ */

/** El nodo detrás de una zona del cuerpo. */
export async function nodoPorSlug(slug: string): Promise<BiocodeNode | null> {
  return getNodeBySlug(slug);
}

/** El nodo que mejor responde a lo que la persona escribió. */
export async function nodoPorTexto(texto: string): Promise<BiocodeNode | null> {
  const nodos = await retrieveNodes(texto, 1);
  return nodos[0] ?? null;
}

export interface Ficha {
  zona?: string;
  emocion?: string;
  creencia?: string;
  patron?: string;
  pregunta?: string;
  reflexion?: string;
  ejercicio?: string;
}

/** Guarda el mapa y la ficha de la exploración. Devuelve el número que le
 *  tocó (§20: "EXPLORACIÓN #014"). */
export async function guardarExploracion(input: {
  sessionId: string;
  mapa: Mapa;
  ficha: Ficha;
  tema?: string | null;
  completada?: boolean;
}): Promise<{ ok: boolean; numero?: number; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Tu sesión expiró. Entra de nuevo." };

  // El texto de la reflexión es de la persona: se recorta, no se interpreta.
  const ficha: Ficha = {
    ...input.ficha,
    reflexion: input.ficha.reflexion?.slice(0, 4000),
  };

  const { data, error } = await supabase
    .from("biocode_sessions")
    .update({
      mapa: input.mapa,
      ficha,
      tema: input.tema ?? null,
      estado: input.completada ? "completada" : "abierta",
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.sessionId)
    .eq("user_id", user.id)
    .select("numero")
    .maybeSingle();

  if (error) {
    console.error("[biocode] guardar", error.message);
    return { ok: false, error: "No pude guardar tu exploración. Inténtalo otra vez." };
  }
  if (!data) return { ok: false, error: "Esa exploración ya no existe." };
  return { ok: true, numero: data.numero ?? undefined };
}
