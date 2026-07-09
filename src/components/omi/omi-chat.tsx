"use client";

import { useRef, useState } from "react";
import { Send, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { streamOmi } from "@/lib/omi/stream-client";
import { OmiChatAvatar } from "@/components/omi/omi-chat-avatar";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const DISCLAIMER =
  "Puedo acompañarte con preguntas de reflexión y prácticas del programa, pero no reemplazo apoyo profesional ni atención terapéutica o médica. Si estás atravesando una crisis, busca ayuda humana inmediata.";

const CRISIS = [
  "suicid", "matarme", "quitarme la vida", "hacerme daño", "lastimarme",
  "no quiero vivir", "no puedo más", "morir",
];

const CRISIS_REPLY =
  "Lamento mucho que estés pasando por esto, y gracias por confiármelo. Lo que sientes importa y merece atención humana ahora mismo. Por favor, contacta a una línea de ayuda de tu país o a alguien de confianza en este momento. No estás sola/o. " +
  DISCLAIMER;

const SUGGESTIONS = [
  "¿Cómo integro la clase de hoy?",
  "Me siento bloqueado/a",
  "Sugiéreme una práctica",
  "Ayúdame a decodificar algo que viví",
];

/** Limpia markdown ligero que el modelo pueda colar, para mantener el texto
 *  natural (sin asteriscos/negritas/viñetas crudas) acorde al tono de OMI. */
function clean(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "· ");
}

export function OmiChat({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Hola, ${firstName}. Soy OMI, tu acompañamiento consciente dentro de OCEOM. Estoy aquí para escucharte, comprenderte y acompañarte en tu evolución. ¿Qué quieres explorar hoy?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const convId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  // Auto-scroll SOLO dentro del contenedor del chat (no la página) y SOLO si el
  // usuario ya está abajo; si sube a leer, no lo arrastramos de vuelta.
  const stick = useRef(true);

  const scrollDown = () =>
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el && stick.current) el.scrollTop = el.scrollHeight;
    });

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;
    setInput("");
    stick.current = true; // el usuario mandó → seguimos su mensaje y la respuesta

    // Guarda de crisis: respuesta segura garantizada, sin llamar al modelo.
    if (CRISIS.some((k) => content.toLowerCase().includes(k))) {
      setMessages((m) => [
        ...m,
        { role: "user", content },
        { role: "assistant", content: CRISIS_REPLY },
      ]);
      scrollDown();
      return;
    }

    const userMsg: Msg = { role: "user", content };
    const history = [...messages, userMsg];
    setMessages((m) => [...m, userMsg, { role: "assistant", content: "" }]);
    setStreaming(true);
    scrollDown();

    let acc = "";
    const setLast = (value: string) =>
      setMessages((m) => {
        const copy = [...m];
        copy[copy.length - 1] = { role: "assistant", content: value };
        return copy;
      });

    await streamOmi(
      {
        conversationId: convId.current,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      },
      {
        onStart: (id) => {
          if (id) convId.current = id;
        },
        onToken: (t) => {
          acc += t;
          setLast(acc);
          scrollDown();
        },
        onDone: (id) => {
          if (id) convId.current = id;
          setStreaming(false);
          scrollDown();
        },
        onError: (msg) => {
          setLast(acc || msg);
          setStreaming(false);
          scrollDown();
        },
      },
    );
  }

  const typing =
    streaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === "";

  return (
    <div className="glass flex h-[calc(100dvh-16rem)] min-h-[26rem] flex-col overflow-hidden rounded-2xl">
      {/* Disclaimer de seguridad */}
      <div className="flex items-start gap-2 border-b border-card-border bg-ocean-violet/10 px-5 py-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-ocean-violet" />
        <p className="text-xs text-muted">{DISCLAIMER}</p>
      </div>

      {/* Mensajes */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 space-y-4 overflow-y-auto overscroll-contain p-5"
      >
        {messages.map((m, i) => {
          const isTypingBubble = typing && i === messages.length - 1;
          return (
            <div
              key={i}
              className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}
            >
              {m.role === "assistant" && <OmiChatAvatar className="size-8" />}
              <div
                className={cn(
                  "max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm",
                  m.role === "user"
                    ? "bg-ocean-cyan/15 text-foreground"
                    : "border border-card-border bg-ocean-surface/50 text-foreground/90",
                )}
              >
                {isTypingBubble ? (
                  <span
                    className="flex gap-1 py-0.5"
                    aria-label="OMI está escribiendo"
                  >
                    <span className="size-1.5 animate-bounce rounded-full bg-ocean-cyan [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-ocean-cyan [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-ocean-cyan" />
                  </span>
                ) : m.role === "assistant" ? (
                  clean(m.content)
                ) : (
                  m.content
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sugerencias + input */}
      <div className="border-t border-card-border p-4">
        {messages.length <= 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                disabled={streaming}
                className="rounded-full border border-card-border bg-ocean-surface/50 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-ocean-cyan/40 hover:text-ocean-cyan disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe a OMI…"
            disabled={streaming}
            className="h-11 flex-1 rounded-xl border border-card-border bg-ocean-surface/60 px-4 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-ocean-cyan text-[var(--ocean-abyss)] transition hover:brightness-110 disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[0.65rem] text-muted/60">
          OMI acompaña tu proceso · puede equivocarse, confía también en tu sentir
        </p>
      </div>
    </div>
  );
}
