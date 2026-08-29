import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { resolveProvider } from "@/lib/omi/provider";
import { getOmiUserContext } from "@/lib/omi/context";
import { buildUserContext } from "@/lib/omi/system-prompt";
import { BIOCODE_SYSTEM_PROMPT } from "@/lib/biocode/system-prompt";
import { detectRedFlag, redFlagResponse } from "@/lib/biocode/safety";
import { retrieveNodes, buildNodesBlock } from "@/lib/biocode/nodes";

/* ============================================================
   POST /api/biocode/chat — exploración de MAPA BIOCODE (SSE).
   Mismo transporte que OMI. La diferencia está antes del modelo: si el
   mensaje trae una bandera roja, la respuesta de seguridad se entrega escrita
   y NO se consulta a la IA.
   ============================================================ */

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface InMsg {
  role: "user" | "assistant";
  content: string;
}

const encoder = new TextEncoder();

/** Stream de un texto fijo (respuestas de seguridad): se emite en trozos para
 *  que la interfaz lo reciba igual que una respuesta del modelo. */
function scriptedStream(text: string, sessionId: string | null): Response {
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      send("start", { conversationId: sessionId });
      for (const chunk of text.match(/[\s\S]{1,40}/g) ?? [text]) {
        send("token", { text: chunk });
      }
      send("done", { conversationId: sessionId });
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Cuerpo inválido", { status: 400 });
  }
  const b = (body ?? {}) as {
    messages?: unknown;
    conversationId?: unknown;
    entryDoor?: unknown;
  };

  const messages: InMsg[] = (Array.isArray(b.messages) ? b.messages : [])
    .filter(
      (m): m is InMsg =>
        !!m &&
        typeof (m as InMsg).content === "string" &&
        ((m as InMsg).role === "user" || (m as InMsg).role === "assistant"),
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    .slice(-10);

  while (messages.length && messages[0].role !== "user") messages.shift();

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return new Response("Mensaje inválido", { status: 400 });
  }

  // ── Sesión de exploración ──
  let sessionId = typeof b.conversationId === "string" ? b.conversationId : null;
  if (sessionId) {
    const { data: s } = await supabase
      .from("biocode_sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!s) sessionId = null;
  }
  if (!sessionId) {
    const { data: created } = await supabase
      .from("biocode_sessions")
      .insert({
        user_id: user.id,
        title: last.content.trim().slice(0, 60),
        entry_door: typeof b.entryDoor === "string" ? b.entryDoor : null,
      })
      .select("id")
      .single();
    sessionId = created?.id ?? null;
  }

  const persist = async (role: "user" | "assistant", content: string) => {
    if (!sessionId || !content.trim()) return;
    await supabase
      .from("biocode_messages")
      .insert({ session_id: sessionId, user_id: user.id, role, content });
  };

  await persist("user", last.content);

  // ── Seguridad primero: si hay bandera roja, no se consulta al modelo ──
  const flag = detectRedFlag(last.content);
  if (flag) {
    const text = redFlagResponse(flag);
    await persist("assistant", text);
    return scriptedStream(text, sessionId);
  }

  const provider = resolveProvider();
  if (!provider) {
    return new Response(
      "MAPA BIOCODE aún no está configurado (falta la API key del modelo).",
      { status: 503 },
    );
  }

  const [ctx, nodes] = await Promise.all([
    getOmiUserContext(user.id),
    retrieveNodes(last.content, 5),
  ]);

  // Los slugs tocados alimentan "Mi Mapa BIOCODE" (vista longitudinal).
  if (sessionId && nodes.length) {
    const { data: current } = await supabase
      .from("biocode_sessions")
      .select("node_slugs")
      .eq("id", sessionId)
      .maybeSingle();
    const merged = Array.from(
      new Set([...(current?.node_slugs ?? []), ...nodes.map((n) => n.slug)]),
    );
    await supabase
      .from("biocode_sessions")
      .update({ node_slugs: merged })
      .eq("id", sessionId);
  }

  const client = new Anthropic({ apiKey: provider.apiKey, baseURL: provider.baseURL });

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );

      let full = "";
      try {
        send("start", { conversationId: sessionId });

        const modelStream = client.messages.stream({
          model: provider.model,
          max_tokens: 1400,
          temperature: 0.7,
          // Kimi K2.6 razona antes de escribir y su bloque de pensamiento
          // consume el mismo presupuesto de tokens. Medido contra Moonshot con
          // este mismo prompt: dejándolo pensar, la primera palabra visible
          // tardaba 40 s, se agotaban los 1400 tokens y llegaban 29 caracteres
          // truncados — con maxDuration en 60 s, a un paso de no responder
          // nunca. Desactivado: primera palabra en 1 s y respuesta completa en
          // 9 s con ~320 tokens. Acotarlo (`budget_tokens`) no sirve: Moonshot
          // ignora el presupuesto. Mismo ajuste que ya usa Hermes.
          thinking: { type: "disabled" as const },
          system: [
            {
              type: "text",
              text: BIOCODE_SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
            { type: "text", text: buildUserContext(ctx) },
            ...(nodes.length
              ? [{ type: "text" as const, text: buildNodesBlock(nodes) }]
              : []),
          ],
          messages,
        });

        modelStream.on("text", (delta) => {
          full += delta;
          send("token", { text: delta });
        });

        await modelStream.finalMessage();
        await persist("assistant", full);
        if (sessionId) {
          await supabase
            .from("biocode_sessions")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", sessionId);
        }
        send("done", { conversationId: sessionId });
      } catch (err) {
        console.error("[biocode] stream error", err);
        send("error", {
          message:
            "MAPA BIOCODE tuvo un problema para responder. Respira un momento e inténtalo de nuevo.",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
