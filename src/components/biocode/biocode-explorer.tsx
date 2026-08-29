"use client";

import { memo, useRef, useState } from "react";
import {
  Search,
  Send,
  ShieldAlert,
  PersonStanding,
  Activity,
  Heart,
  Brain,
  Repeat,
  Clock,
  TreeDeciduous,
  Compass,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { streamBiocode } from "@/lib/biocode/stream-client";
import { ENTRY_DOORS } from "@/lib/biocode/system-prompt";
import { BodyViewerLazy } from "@/components/biocode/body-viewer-lazy";

/* ============================================================
   MAPA BIOCODE — la exploración. Dos estados: el buscador con las 7 puertas
   de entrada (antes de empezar) y la conversación (una vez que arranca).
   ============================================================ */

interface Msg {
  role: "user" | "assistant";
  content: string;
}

const DOOR_ICON: Record<string, LucideIcon> = {
  body: PersonStanding,
  activity: Activity,
  heart: Heart,
  brain: Brain,
  repeat: Repeat,
  clock: Clock,
  tree: TreeDeciduous,
};

const DISCLAIMER =
  "MAPA BIOCODE es una herramienta de exploración y autoconocimiento: no diagnostica, no predice enfermedades y no sustituye atención médica ni psicológica. Si algo en tu cuerpo te preocupa, consúltalo con un profesional.";

const EJEMPLOS = [
  "Me duele la espalda",
  "Siento mucha culpa",
  "Me cuesta recibir",
  "Siempre termino cuidando a todos",
];

/** Limpia markdown ligero para mantener el texto conversacional. */
function clean(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^\s*[-*]\s+/gm, "· ");
}

function TypingDots() {
  return (
    <span className="flex gap-1 py-0.5" aria-label="BIOCODE está explorando">
      <span className="size-1.5 animate-bounce rounded-full bg-ocean-violet [animation-delay:-0.3s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-ocean-violet [animation-delay:-0.15s]" />
      <span className="size-1.5 animate-bounce rounded-full bg-ocean-violet" />
    </span>
  );
}

const MessageBubble = memo(function MessageBubble({
  role,
  content,
  isTyping,
}: {
  role: "user" | "assistant";
  content: string;
  isTyping: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={cn("flex gap-2.5", isUser && "flex-row-reverse")}>
      {!isUser && (
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full border border-ocean-violet/30 bg-ocean-violet/10">
          <Compass className="size-3.5 text-ocean-violet" />
        </span>
      )}
      <div
        className={cn(
          "whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "max-w-[560px] rounded-br-md bg-ocean-violet/15 text-foreground"
            : "max-w-[640px] rounded-bl-md border border-card-border bg-ocean-surface/45 text-foreground/90",
        )}
      >
        {isTyping ? <TypingDots /> : isUser ? content : clean(content)}
      </div>
    </div>
  );
});

export function BiocodeExplorer({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [door, setDoor] = useState<string | null>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stick = useRef(true);

  const started = messages.length > 0;

  const scrollDown = () =>
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el && stick.current) el.scrollTop = el.scrollHeight;
    });

  const onScroll = () => {
    const el = scrollRef.current;
    if (el) stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
  };

  async function send(text: string, entryDoor?: string | null) {
    const content = text.trim();
    if (!content || streaming) return;
    setInput("");
    stick.current = true;

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

    await streamBiocode(
      {
        conversationId: sessionId.current,
        entryDoor: entryDoor ?? door,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      },
      {
        onStart: (id) => {
          if (id) sessionId.current = id;
        },
        onToken: (t) => {
          acc += t;
          setLast(acc);
          scrollDown();
        },
        onDone: (id) => {
          if (id) sessionId.current = id;
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

  /* ── Estado inicial: buscador + puertas ── */
  if (!started) {
    return (
      <div className="mx-auto w-full max-w-[900px] space-y-8">
        <div className="glass rounded-[24px] border border-ocean-violet/15 p-6 sm:p-8">
          <p className="text-sm text-muted">
            Hola, {firstName}. Tu cuerpo no es un enemigo que combatir: es un
            territorio que puedes aprender a escuchar. Empieza por donde quieras.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mt-5 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted/70" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="¿Qué quieres explorar de ti?"
                className="h-12 w-full rounded-xl border border-card-border bg-ocean-surface/60 pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-ocean-violet focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim()}
              aria-label="Explorar"
              className="grid size-12 shrink-0 place-items-center rounded-xl bg-ocean-violet text-white transition hover:brightness-110 disabled:opacity-50"
            >
              <Send className="size-4" />
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {EJEMPLOS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-card-border bg-ocean-surface/50 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-ocean-violet/40 hover:text-ocean-violet"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div ref={bodyRef} className="space-y-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-foreground">
              Tu cuerpo
            </h2>
            <p className="mt-0.5 text-sm text-muted">
              Gíralo, acércate y toca una zona para explorarla.
            </p>
          </div>
          <BodyViewerLazy onExplore={(message) => send(message, "cuerpo")} />
        </div>

        {/* Las 7 puertas de entrada */}
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            O entra por una puerta
          </h2>
          <p className="mt-1 text-sm text-muted">
            Todas llevan al mismo mapa. Elige la que te resuene hoy.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ENTRY_DOORS.map((d, i) => {
              const Icon = DOOR_ICON[d.iconKey] ?? Compass;
              return (
                <button
                  key={d.key}
                  onClick={() => {
                    setDoor(d.key);
                    if (d.key === "cuerpo")
                      bodyRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    else send(d.question, d.key);
                  }}
                  className="glass group flex items-start gap-3 rounded-2xl p-4 text-left transition hover:border-ocean-violet/40"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-ocean-violet/12 text-ocean-violet">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[0.7rem] font-medium uppercase tracking-wider text-muted/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="block font-medium text-foreground">{d.label}</span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                      {d.question}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-card-border bg-ocean-violet/8 px-4 py-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-ocean-violet" />
          <p className="text-xs leading-relaxed text-muted">{DISCLAIMER}</p>
        </div>
      </div>
    );
  }

  /* ── Conversación ── */
  return (
    <div className="glass mx-auto flex h-[min(68vh,720px)] min-h-[24rem] w-full max-w-[900px] flex-col overflow-hidden rounded-[24px] border border-ocean-violet/15">
      <div className="flex items-start gap-2 border-b border-card-border bg-ocean-violet/10 px-5 py-2.5">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-ocean-violet" />
        <p className="text-xs leading-relaxed text-muted">{DISCLAIMER}</p>
      </div>

      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="flex-1 space-y-5 overflow-y-auto overscroll-contain p-5 sm:p-6"
      >
        {messages.map((m, i) => (
          <MessageBubble
            key={i}
            role={m.role}
            content={m.content}
            isTyping={typing && i === messages.length - 1}
          />
        ))}
      </div>

      <div className="border-t border-card-border p-4">
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
            placeholder="Sigue explorando…"
            disabled={streaming}
            className="h-11 flex-1 rounded-xl border border-card-border bg-ocean-surface/60 px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-ocean-violet focus:ring-2 focus:ring-[var(--ring)] disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={streaming || !input.trim()}
            aria-label="Enviar"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-ocean-violet text-white transition hover:brightness-110 disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[0.65rem] text-muted/60">
          Exploración simbólica y educativa · no es un diagnóstico
        </p>
      </div>
    </div>
  );
}
