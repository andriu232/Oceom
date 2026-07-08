import { createServiceClient } from "@/lib/supabase/service";

/* ============================================================
   Biblioteca IA de OMI: troceado del material de Valeria y recuperación
   (retrieval) de los fragmentos relevantes para cada consulta. Retrieval por
   búsqueda de texto completo en español (Postgres FTS) — sin embeddings, sin
   claves extra. Se puede mejorar a búsqueda semántica más adelante.
   ============================================================ */

/** Trocea texto en fragmentos (~900 chars con solape), cortando en límites
 *  naturales (párrafo u oración) para no partir ideas a la mitad. */
export function chunkText(raw: string, size = 900, overlap = 120): string[] {
  const clean = raw
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  if (clean.length <= size) return clean.length > 20 ? [clean] : [];

  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + size, clean.length);
    if (end < clean.length) {
      const slice = clean.slice(i, end);
      const brk = Math.max(
        slice.lastIndexOf("\n\n"),
        slice.lastIndexOf(". "),
        slice.lastIndexOf("\n"),
      );
      if (brk > size * 0.5) end = i + brk + 1;
    }
    const piece = clean.slice(i, end).trim();
    if (piece.length > 20) chunks.push(piece);
    if (end >= clean.length) break;
    i = end - overlap;
  }
  return chunks;
}

export interface KnowledgeHit {
  content: string;
  title: string;
}

/** Recupera fragmentos del material de Valeria relevantes a la consulta. Usa el
 *  service client (bypass RLS) porque corre en la ruta del estudiante, y el
 *  material solo lo gestiona la mentora. Falla suave (devuelve []). */
export async function retrieveKnowledge(
  query: string,
  k = 5,
): Promise<KnowledgeHit[]> {
  const q = (query || "").trim();
  if (q.length < 3) return [];
  try {
    const svc = createServiceClient();
    const { data, error } = await svc.rpc("match_omi_chunks", {
      query_text: q,
      match_count: k,
    });
    if (error || !Array.isArray(data)) return [];
    return (data as { content: string; title: string }[]).map((r) => ({
      content: r.content,
      title: r.title,
    }));
  } catch {
    return [];
  }
}

/** Bloque de system prompt con el material recuperado (fuente prioritaria). */
export function buildKnowledgeBlock(hits: KnowledgeHit[]): string {
  const body = hits
    .map((h, i) => `[Fuente ${i + 1} · ${h.title}]\n${h.content}`)
    .join("\n\n---\n\n");
  return `# Material autorizado de Valeria (relevante a esta consulta)
Apóyate en esto como fuente PRIORITARIA: es la metodología y el conocimiento propio de Valeria y OCEOM. Intégralo con tus palabras y tu tono; NO lo cites textual, no menciones que estás leyendo documentos ni muestres los nombres de las fuentes. Si algo aquí no aplica a lo que la persona trae, ignóralo con naturalidad.

${body}`;
}
