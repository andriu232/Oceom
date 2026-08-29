import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

/* ============================================================
   Recuperación de la red de conocimiento de BIOCODE. Busca por texto completo
   en español (mismo enfoque que la Biblioteca IA de OMI) y arma el bloque de
   contexto que se le entrega al modelo, con el nivel de evidencia declarado
   nodo por nodo para que la respuesta no mezcle planos.
   ============================================================ */

export interface BiocodeNode {
  slug: string;
  name: string;
  category: string;
  body_zone: string | null;
  organ: string | null;
  scientific_info: string | null;
  complementary_info: string | null;
  symbolic_themes: string[];
  emotions: string[];
  beliefs: string[];
  patterns: string[];
  behaviors: string[];
  questions: string[];
  exercises: string[];
  warning_signs: string[];
  oceom_resource: string | null;
  oceom_link: string | null;
  evidence_level: "consolidada" | "investigacion" | "complementario" | "reflexion";
}

const EVIDENCE_LABEL: Record<BiocodeNode["evidence_level"], string> = {
  consolidada: "EVIDENCIA CIENTÍFICA CONSOLIDADA",
  investigacion: "EVIDENCIA EN INVESTIGACIÓN",
  complementario: "ENFOQUE COMPLEMENTARIO",
  reflexion: "REFLEXIÓN OCEOM",
};

/** Busca los nodos más relevantes para lo que escribió la persona. */
export async function retrieveNodes(query: string, limit = 5): Promise<BiocodeNode[]> {
  const q = query.trim().slice(0, 400);
  if (q.length < 3) return [];
  const svc = createServiceClient();
  const { data, error } = await svc.rpc("match_biocode_nodes", {
    query_text: q,
    match_count: limit,
  });
  if (error) {
    console.error("[biocode] retrieval", error.message);
    return [];
  }
  return (data ?? []) as BiocodeNode[];
}

/** Trae un nodo completo por su slug: es lo que dibuja la constelación de la
 *  zona (§4 del manual), sin pasar por el modelo. */
export async function getNodeBySlug(slug: string): Promise<BiocodeNode | null> {
  const svc = createServiceClient();
  const { data, error } = await svc
    .from("biocode_nodes")
    .select(
      "slug,name,category,body_zone,organ,scientific_info,complementary_info,symbolic_themes,emotions,beliefs,patterns,behaviors,questions,exercises,warning_signs,oceom_resource,oceom_link,evidence_level",
    )
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  if (error) {
    console.error("[biocode] nodo", error.message);
    return null;
  }
  return (data as BiocodeNode) ?? null;
}

function list(label: string, items: string[]): string | null {
  return items.length ? `${label}: ${items.join("; ")}.` : null;
}

/** Arma el bloque de conocimiento para el system prompt. */
export function buildNodesBlock(nodes: BiocodeNode[]): string {
  const parts: string[] = [
    "=== Red de conocimiento de BIOCODE relevante a esta consulta ===",
    "Úsala como insumo, no la recites. Respeta la etiqueta de evidencia de cada bloque: lo marcado como ENFOQUE COMPLEMENTARIO se presenta SIEMPRE declarado como tal, nunca como hecho. Si nada de esto encaja con lo que la persona trae, ignóralo y acompáñala igual.",
  ];

  for (const n of nodes) {
    const lines: string[] = [
      `--- ${n.name} (${n.category}${n.body_zone ? ` · ${n.body_zone}` : ""}) — ${EVIDENCE_LABEL[n.evidence_level]}`,
    ];
    if (n.scientific_info) lines.push(`Información educativa: ${n.scientific_info}`);
    if (n.warning_signs.length)
      lines.push(
        `Señales que piden valoración profesional: ${n.warning_signs.join("; ")}.`,
      );
    if (n.complementary_info)
      lines.push(`Lectura complementaria (declarar como tal): ${n.complementary_info}`);
    for (const l of [
      list("Temas simbólicos para explorar", n.symbolic_themes),
      list("Emociones para explorar", n.emotions),
      list("Creencias para explorar", n.beliefs),
      list("Patrones", n.patterns),
      list("Conductas posibles", n.behaviors),
      list("Preguntas de exploración", n.questions),
      list("Ejercicios", n.exercises),
    ]) {
      if (l) lines.push(l);
    }
    if (n.oceom_resource)
      lines.push(
        `Recurso de OCEOM que puedes sugerir: ${n.oceom_resource}${n.oceom_link ? ` (${n.oceom_link})` : ""}.`,
      );
    parts.push(lines.join("\n"));
  }

  return parts.join("\n\n");
}
