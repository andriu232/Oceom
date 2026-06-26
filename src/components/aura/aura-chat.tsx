"use client";

import { useRef, useState } from "react";
import { Sparkles, Send, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

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

const GUIDES = [
  "Gracias por compartir eso conmigo. Respira hondo un momento. ¿En qué parte del cuerpo sientes esa emoción ahora mismo?",
  "Te acompaño. Si esa emoción pudiera hablar, ¿qué crees que está intentando protegerte o decirte?",
  "Hermosa intención. Te propongo una práctica de Deep Waves: 4 respiraciones lentas, alargando la exhalación. ¿Cómo te sientes después?",
  "Eso que nombras suele tener raíz en una herida emocional. ¿Recuerdas la primera vez que sentiste algo parecido?",
  "Estás haciendo un trabajo profundo. Para integrar tu última experiencia, ¿qué insight te llevas y qué acción pequeña puedes dar hoy?",
];

const SUGGESTIONS = [
  "¿Cómo integro la clase de hoy?",
  "Me siento bloqueado/a",
  "Sugiéreme una práctica",
  "¿Qué es una herida emocional?",
];

export function AuraChat({ firstName }: { firstName: string }) {
  const [messages, setMessages] = useState<Msg[]>([
    {
      role: "assistant",
      content: `Hola, ${firstName}. Soy AURA, tu guía dentro de OCEOM. Estoy aquí para acompañarte en tu proceso. ¿Qué quieres explorar hoy?`,
    },
  ]);
  const [input, setInput] = useState("");
  const turn = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  function reply(text: string): string {
    const lower = text.toLowerCase();
    if (CRISIS.some((k) => lower.includes(k))) {
      return `Lamento mucho que estés pasando por esto y te agradezco la confianza. Esto es importante y merece atención humana inmediata. Por favor contacta a una línea de ayuda de tu país o a alguien de confianza ahora mismo. ${DISCLAIMER}`;
    }
    const g = GUIDES[turn.current % GUIDES.length];
    turn.current += 1;
    return g;
  }

  function send(text: string) {
    const content = text.trim();
    if (!content) return;
    const aura = reply(content);
    setMessages((m) => [
      ...m,
      { role: "user", content },
      { role: "assistant", content: aura },
    ]);
    setInput("");
    requestAnimationFrame(() =>
      endRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
  }

  return (
    <div className="glass flex h-[calc(100dvh-12rem)] min-h-[28rem] flex-col overflow-hidden rounded-2xl">
      {/* Disclaimer de seguridad */}
      <div className="flex items-start gap-2 border-b border-card-border bg-ocean-violet/10 px-5 py-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-ocean-violet" />
        <p className="text-xs text-muted">{DISCLAIMER}</p>
      </div>

      {/* Mensajes */}
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn("flex gap-3", m.role === "user" && "flex-row-reverse")}
          >
            {m.role === "assistant" && (
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet text-[var(--ocean-abyss)]">
                <Sparkles className="size-4" />
              </div>
            )}
            <div
              className={cn(
                "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                m.role === "user"
                  ? "bg-ocean-cyan/15 text-foreground"
                  : "border border-card-border bg-ocean-surface/50 text-foreground/90",
              )}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Sugerencias + input */}
      <div className="border-t border-card-border p-4">
        {messages.length <= 1 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-card-border bg-ocean-surface/50 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-ocean-cyan/40 hover:text-ocean-cyan"
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
            placeholder="Escribe a AURA…"
            className="h-11 flex-1 rounded-xl border border-card-border bg-ocean-surface/60 px-4 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]"
          />
          <button
            type="submit"
            className="grid size-11 shrink-0 place-items-center rounded-xl bg-ocean-cyan text-[var(--ocean-abyss)] transition hover:brightness-110"
          >
            <Send className="size-4" />
          </button>
        </form>
        <p className="mt-2 text-center text-[0.65rem] text-muted/60">
          Vista previa de AURA · La IA con tus fuentes autorizadas llega en el Sprint 8–9
        </p>
      </div>
    </div>
  );
}
