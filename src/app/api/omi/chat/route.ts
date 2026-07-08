import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { resolveProvider } from "@/lib/omi/provider";
import { getOmiUserContext } from "@/lib/omi/context";
import { OMI_SYSTEM_PROMPT, buildUserContext } from "@/lib/omi/system-prompt";

/* ============================================================
   POST /api/omi/chat — chat de OMI con streaming (SSE).
   Mismo patrón que QuanTrade (runtime Node, ReadableStream + eventos SSE),
   con auth por sesión Supabase y persistencia en omi_conversations/omi_messages.
   ============================================================ */

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

interface InMsg {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("No autorizado", { status: 401 });

  const provider = resolveProvider();
  if (!provider) {
    return new Response("OMI aún no está configurada (falta la API key del modelo).", {
      status: 503,
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response("Cuerpo inválido", { status: 400 });
  }
  const b = (body ?? {}) as { messages?: unknown; conversationId?: unknown };

  const messages: InMsg[] = (Array.isArray(b.messages) ? b.messages : [])
    .filter(
      (m): m is InMsg =>
        !!m &&
        typeof (m as InMsg).content === "string" &&
        ((m as InMsg).role === "user" || (m as InMsg).role === "assistant"),
    )
    .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    .slice(-10);

  // La API exige que el primer mensaje sea 'user' (descarta el saludo inicial
  // de OMI y cualquier assistant colgando al principio).
  while (messages.length && messages[0].role !== "user") messages.shift();

  const last = messages[messages.length - 1];
  if (!last || last.role !== "user" || !last.content.trim()) {
    return new Response("Mensaje inválido", { status: 400 });
  }

  // Contexto del estudiante para personalizar.
  const ctx = await getOmiUserContext(user.id);

  // Conversación: reutiliza la existente (si es del usuario) o crea una nueva.
  let conversationId =
    typeof b.conversationId === "string" ? b.conversationId : null;
  if (conversationId) {
    const { data: conv } = await supabase
      .from("omi_conversations")
      .select("id")
      .eq("id", conversationId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!conv) conversationId = null;
  }
  if (!conversationId) {
    const { data: created } = await supabase
      .from("omi_conversations")
      .insert({ user_id: user.id, title: last.content.trim().slice(0, 60) })
      .select("id")
      .single();
    conversationId = created?.id ?? null;
  }

  // Persiste el mensaje del usuario.
  if (conversationId) {
    await supabase.from("omi_messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: last.content,
    });
  }

  const client = new Anthropic({
    apiKey: provider.apiKey,
    baseURL: provider.baseURL,
  });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) =>
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );

      let full = "";
      try {
        send("start", { conversationId });

        const modelStream = client.messages.stream({
          model: provider.model,
          max_tokens: 1024,
          temperature: 0.7,
          system: [
            {
              type: "text",
              text: OMI_SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" },
            },
            { type: "text", text: buildUserContext(ctx) },
          ],
          messages,
        });

        modelStream.on("text", (delta) => {
          full += delta;
          send("token", { text: delta });
        });

        await modelStream.finalMessage();

        // Persiste la respuesta de OMI.
        if (conversationId && full.trim()) {
          await supabase.from("omi_messages").insert({
            conversation_id: conversationId,
            user_id: user.id,
            role: "assistant",
            content: full,
          });
          await supabase
            .from("omi_conversations")
            .update({ updated_at: new Date().toISOString() })
            .eq("id", conversationId);
        }

        send("done", { conversationId });
      } catch (err) {
        console.error("[omi] stream error", err);
        send("error", {
          message:
            "OMI tuvo un problema para responder. Respira un momento e inténtalo de nuevo.",
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
