/* Cliente de streaming de MAPA BIOCODE: POST a /api/biocode/chat y parseo del
   SSE (start/token/done/error), mismo transporte que OMI. */

export interface BiocodeMessage {
  role: "user" | "assistant";
  content: string;
}

export interface BiocodeStreamHandlers {
  onStart?: (sessionId: string | null) => void;
  onToken: (text: string) => void;
  onDone: (sessionId: string | null) => void;
  onError: (message: string) => void;
}

export async function streamBiocode(
  payload: {
    messages: BiocodeMessage[];
    conversationId: string | null;
    entryDoor?: string | null;
  },
  handlers: BiocodeStreamHandlers,
  signal?: AbortSignal,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/biocode/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });
  } catch {
    handlers.onError("No pude conectar con BIOCODE. Revisa tu conexión.");
    return;
  }

  if (!res.ok || !res.body) {
    let msg = "MAPA BIOCODE no está disponible ahora mismo.";
    try {
      const t = await res.text();
      if (t) msg = t;
    } catch {
      /* noop */
    }
    handlers.onError(msg);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  for (;;) {
    let chunk: ReadableStreamReadResult<Uint8Array>;
    try {
      chunk = await reader.read();
    } catch {
      break;
    }
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });

    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() ?? "";
    for (const block of blocks) {
      let event = "message";
      let data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) event = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (!data) continue;
      let parsed: { text?: string; conversationId?: string | null; message?: string };
      try {
        parsed = JSON.parse(data);
      } catch {
        continue;
      }
      if (event === "token") handlers.onToken(parsed.text ?? "");
      else if (event === "start") handlers.onStart?.(parsed.conversationId ?? null);
      else if (event === "done") handlers.onDone(parsed.conversationId ?? null);
      else if (event === "error")
        handlers.onError(parsed.message ?? "BIOCODE tuvo un problema.");
    }
  }
}
