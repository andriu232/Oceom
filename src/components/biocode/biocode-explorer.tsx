"use client";

import { memo, useRef, useState, useTransition } from "react";
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
  ArrowLeft,
  MessageCircle,
  Sparkles,
  Loader2,
  AlertTriangle,
  Map,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { streamBiocode } from "@/lib/biocode/stream-client";
import { ENTRY_DOORS } from "@/lib/biocode/system-prompt";
import { BodyViewerLazy } from "@/components/biocode/body-viewer-lazy";
import { Constelacion } from "@/components/biocode/constelacion";
import { Ficha } from "@/components/biocode/ficha";
import { SelectorEmocional } from "@/components/biocode/selector-emocional";
import type { Emocion, ZonaCuerpo } from "@/lib/biocode/emociones";
import { PuertaGuiada } from "@/components/biocode/puerta-guiada";
import { PUERTAS, type OpcionPuerta } from "@/lib/biocode/puertas";
import { MapaParejas } from "@/components/biocode/mapa-parejas";
import { CICLO, type RespuestasPareja } from "@/lib/biocode/parejas";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { nodoPorSlug, nodoPorTexto, guardarExploracion } from "@/lib/actions/biocode";
import type { BiocodeNode } from "@/lib/biocode/nodes";
import {
  dimensionesDe,
  opcionesDe,
  alternarEnMapa,
  elegidasDe,
  MAPA_VACIO,
  type Mapa,
} from "@/lib/biocode/dimensiones";

/* ============================================================
   MAPA BIOCODE — la exploración.

   Tres momentos, siguiendo el manual de experiencia de Valeria:
   · Entrar: el cuerpo interactivo y el buscador (§1, §2).
   · Explorar: la constelación de la zona, donde cada elección de la persona
     se cuelga del mapa (§4, §7). La IA acompaña cuando ella la llama (§22),
     no antes: el mapa se dibuja con la red de conocimiento, al instante.
   · Cerrar: la ficha "Lo que he descubierto" (§18) con su ejercicio (§19).
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

/** La nota que el manual pide fija en la interfaz (§27). */
const DISCLAIMER =
  "MAPA BIOCODE es una herramienta educativa y de autoconocimiento. Las interpretaciones emocionales y simbólicas no constituyen diagnósticos médicos ni establecen que una emoción sea la causa de una enfermedad.";

/** La aclaración obligatoria antes de cualquier lectura simbólica (§6). */
const ACLARACION_SIMBOLICA =
  "Estos temas pertenecen a una exploración emocional y simbólica. No significan que una emoción sea la causa de una enfermedad.";

const EJEMPLOS = [
  "Migraña",
  "Dolor de espalda",
  "No merezco recibir",
  "Siempre repito el mismo tipo de pareja",
];

/** Los saltos del botón "Profundizar" (§24). */
const PROFUNDIZAR = [
  { label: "Explorar infancia", slug: "historia-infancia" },
  { label: "Explorar pareja", slug: "pareja" },
  { label: "Explorar familia", slug: "arbol-familiar" },
  { label: "Explorar trabajo", slug: "trabajo-agotamiento" },
  { label: "Explorar merecimiento", slug: "merecimiento" },
];

const EVIDENCIA: Record<BiocodeNode["evidence_level"], { label: string; color: string }> = {
  consolidada: { label: "Evidencia consolidada", color: "#4ade80" },
  investigacion: { label: "En investigación", color: "#fbbf24" },
  complementario: { label: "Enfoque complementario", color: "#fb923c" },
  reflexion: { label: "Reflexión OCEOM", color: "#60a5fa" },
};

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

function Evidencia({ nivel }: { nivel: BiocodeNode["evidence_level"] }) {
  const e = EVIDENCIA[nivel];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-medium"
      style={{ background: `${e.color}1a`, color: e.color }}
    >
      <span className="size-1.5 rounded-full" style={{ background: e.color }} />
      {e.label}
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
  const router = useRouter();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [door, setDoor] = useState<string | null>(null);

  /* La exploración en curso */
  const [nodo, setNodo] = useState<BiocodeNode | null>(null);
  const [mapa, setMapa] = useState<Mapa>(MAPA_VACIO);
  const [activa, setActiva] = useState<string | null>(null);
  const [verFicha, setVerFicha] = useState(false);
  const [verChat, setVerChat] = useState(false);
  const [buscando, empezarBusqueda] = useTransition();
  const [sinNodo, setSinNodo] = useState<string | null>(null);
  const [verEmociones, setVerEmociones] = useState(false);
  const [puerta, setPuerta] = useState<string | null>(null);
  const [entrada, setEntrada] = useState<string | null>(null);
  const [verParejas, setVerParejas] = useState(false);

  const bodyRef = useRef<HTMLDivElement>(null);
  /* El id de la exploración vive en dos sitios a propósito: el estado es el
     que puede leer el render (la ficha lo necesita) y el ref es el que leen
     los callbacks del stream, que se disparan fuera del ciclo de React y
     tomarían un valor viejo del cierre. */
  const [sessionId, setSessionId] = useState<string | null>(null);
  const sessionRef = useRef<string | null>(null);
  const setSession = (id: string | null) => {
    sessionRef.current = id;
    setSessionId(id);
  };
  const scrollRef = useRef<HTMLDivElement>(null);
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

  async function send(text: string, entryDoor?: string | null) {
    const content = text.trim();
    if (!content || streaming) return;
    setInput("");
    setVerChat(true);
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
        conversationId: sessionRef.current,
        entryDoor: entryDoor ?? door,
        messages: history.map((m) => ({ role: m.role, content: m.content })),
      },
      {
        onStart: (id) => {
          if (id) setSession(id);
        },
        onToken: (t) => {
          acc += t;
          setLast(acc);
          scrollDown();
        },
        onDone: (id) => {
          if (id) setSession(id);
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

  /** Abre la constelación de una zona o de un tema. */
  function abrirNodo(n: BiocodeNode) {
    setNodo(n);
    setEntrada(null);
    setMapa(MAPA_VACIO);
    // El manual abre por la información corporal y desde ahí ofrece pasar a
    // lo emocional (§5). Si el nodo no tiene esa parte, se abre la primera
    // que sí pueda llenar.
    setActiva(dimensionesDe(n)[0]?.key ?? null);
    setVerFicha(false);
    setSinNodo(null);
  }

  /** Desde el cuerpo 3D: la estructura ya viene resuelta a un nodo. */
  function desdeElCuerpo(mensaje: string, estructura: string, slug: string | null) {
    if (!slug) {
      // No hay material propio de esa zona: la IA acompaña igual.
      setSinNodo(estructura);
      send(mensaje, "cuerpo");
      return;
    }
    empezarBusqueda(async () => {
      const n = await nodoPorSlug(slug);
      if (n) abrirNodo(n);
      else send(mensaje, "cuerpo");
    });
  }

  /** Desde el selector emocional (§8): la emoción y la zona donde se siente.
   *  El mapa nace con las dos elecciones puestas, que es el vínculo
   *  EMOCIÓN → CUERPO que pide el manual. Si la emoción no tiene nodo propio
   *  —las agradables no lo tienen— la exploración se centra en la zona. */
  function desdeLaEmocion(emocion: Emocion, zona: ZonaCuerpo) {
    empezarBusqueda(async () => {
      const slug = emocion.slug ?? zona.slug;
      const n = slug ? await nodoPorSlug(slug) : null;
      if (!n) {
        setVerEmociones(false);
        send(
          `Estoy sintiendo ${emocion.label.toLowerCase()} y lo noto ${zona.slug ? `en ${zona.label.toLowerCase()}` : zona.label.toLowerCase()}.`,
          "emocion",
        );
        return;
      }
      abrirNodo(n);
      setVerEmociones(false);
      let inicial = alternarEnMapa(MAPA_VACIO, n.slug, "emociones", emocion.label);
      if (zona.slug) inicial = alternarEnMapa(inicial, n.slug, "cuerpo", zona.label);
      setMapa(inicial);
    });
  }

  /** Desde una puerta guiada (§9, §10, §12, §13): la respuesta abre el nodo
   *  que corresponda y la conversación arranca sabiendo por dónde entró. */
  function desdeLaPuerta(key: string, respuesta: string, opcion: OpcionPuerta | null) {
    const p = PUERTAS[key];
    empezarBusqueda(async () => {
      const n = opcion?.slug
        ? await nodoPorSlug(opcion.slug)
        : await nodoPorTexto(respuesta);
      setPuerta(null);
      setDoor(key);
      if (!n) {
        send(p.arranque(respuesta), key);
        return;
      }
      abrirNodo(n);
      setEntrada(respuesta);
      send(p.arranque(respuesta), key);
    });
  }

  /** Desde el buscador: se busca el nodo y, si no hay, conversa. */
  function buscar(texto: string) {
    const q = texto.trim();
    if (!q) return;
    setInput("");
    empezarBusqueda(async () => {
      const n = await nodoPorTexto(q);
      if (n) abrirNodo(n);
      else send(q);
    });
  }

  const typing =
    streaming &&
    messages.length > 0 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 1].content === "";

  const dims = nodo ? dimensionesDe(nodo) : [];
  const dim = dims.find((d) => d.key === activa) ?? null;

  /* ══════════════ Mapa de parejas (§11) ══════════════ */
  if (verParejas) {
    return (
      <MapaParejas
        onVolver={() => setVerParejas(false)}
        onListo={(respuestas: RespuestasPareja, resumen) => {
          setVerParejas(false);
          // Cada etapa respondida se queda en el mapa, bajo Relaciones.
          if (nodo) {
            let m = mapa;
            for (const e of CICLO) {
              const dicho = respuestas[e.key]?.trim();
              if (dicho) m = alternarEnMapa(m, nodo.slug, "relaciones", `${e.label}: ${dicho}`);
            }
            setMapa(m);
          }
          send(resumen, "patron");
        }}
      />
    );
  }

  /* ══════════════ Puertas guiadas (§9, §10, §12, §13) ══════════════ */
  if (puerta && PUERTAS[puerta] && !nodo) {
    return (
      <PuertaGuiada
        puerta={PUERTAS[puerta]}
        onElegido={(r, o) => desdeLaPuerta(puerta, r, o)}
        onVolver={() => setPuerta(null)}
        cargando={buscando}
      />
    );
  }

  /* ══════════════ Puerta de la emoción (§8) ══════════════ */
  if (verEmociones && !nodo) {
    return (
      <SelectorEmocional
        onElegido={desdeLaEmocion}
        onVolver={() => setVerEmociones(false)}
        cargando={buscando}
      />
    );
  }

  /* ══════════════ Entrar (§1, §2) ══════════════ */
  if (!nodo && messages.length === 0) {
    return (
      <div className="mx-auto w-full max-w-[1000px] space-y-8">
        <div ref={bodyRef} className="-mx-2 sm:-mx-6">
          <div className="px-2 text-center sm:px-6">
            <p className="font-display text-base leading-relaxed text-foreground/90">
              Tu cuerpo tiene un territorio. Tus emociones tienen un lenguaje.
              <br className="hidden sm:block" /> Tu historia tiene patrones.
            </p>
            <p className="mt-1.5 text-sm text-muted">
              {firstName}, ¿qué quieres explorar de ti hoy? Gira el cuerpo, acércate y toca
              una zona.
            </p>
          </div>
          <BodyViewerLazy onExplore={desdeElCuerpo} />
        </div>

        <div className="glass rounded-[24px] border border-ocean-violet/15 p-6 sm:p-8">
          <h2 className="font-display text-lg font-semibold text-foreground">
            O búscalo con tus palabras
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              buscar(input);
            }}
            className="mt-4 flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted/70" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe un síntoma, emoción, parte del cuerpo, pensamiento o situación…"
                className="h-12 w-full rounded-xl border border-card-border bg-ocean-surface/60 pl-11 pr-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-ocean-violet focus:ring-2 focus:ring-[var(--ring)]"
              />
            </div>
            <button
              type="submit"
              disabled={!input.trim() || buscando}
              aria-label="Explorar"
              className="grid size-12 shrink-0 place-items-center rounded-xl bg-ocean-violet text-white transition hover:brightness-110 disabled:opacity-50"
            >
              {buscando ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {EJEMPLOS.map((s) => (
              <button
                key={s}
                onClick={() => buscar(s)}
                className="rounded-full border border-card-border bg-ocean-surface/50 px-3 py-1.5 text-xs text-foreground/80 transition-colors hover:border-ocean-violet/40 hover:text-ocean-violet"
              >
                {s}
              </button>
            ))}
          </div>
        </div>

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
                    else if (d.key === "emocion") setVerEmociones(true);
                    else if (d.key === "arbol") router.push("/biocode/arbol");
                    else if (PUERTAS[d.key]) setPuerta(d.key);
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

        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">
            Módulos del método
          </h2>
          <p className="mt-1 text-sm text-muted">
            Dos exploraciones guiadas, con las preguntas del método E-MOTION®.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {["merecimiento", "proposito"].map((k) => (
              <button
                key={k}
                onClick={() => setPuerta(k)}
                className="glass rounded-2xl p-4 text-left transition hover:border-ocean-violet/40"
              >
                <span className="block font-medium text-foreground">
                  {PUERTAS[k].titulo}
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-muted">
                  {PUERTAS[k].pregunta}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/biocode/mi-mapa"
            className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-2 text-sm text-foreground/85 transition hover:border-ocean-violet/40 hover:text-ocean-violet"
          >
            <Map className="size-4" /> Ver mi mapa
          </Link>
          <Link
            href="/biocode/arbol"
            className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-2 text-sm text-foreground/85 transition hover:border-ocean-violet/40 hover:text-ocean-violet"
          >
            <TreeDeciduous className="size-4" /> Mi árbol
          </Link>
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-card-border bg-ocean-violet/8 px-4 py-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-ocean-violet" />
          <p className="text-xs leading-relaxed text-muted">{DISCLAIMER}</p>
        </div>
      </div>
    );
  }

  /* ══════════════ Explorar (§3, §4, §7) ══════════════ */
  return (
    <div className="mx-auto w-full max-w-[1100px] space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => {
            // Si hubo elecciones, la exploración se cierra sola: nadie
            // debería perder su mapa por no haber pulsado "Guardar".
            if (nodo && sessionId && mapa.nodos.length > 0) {
              void guardarExploracion({
                sessionId,
                mapa,
                ficha: {
                  zona: elegidasDe(mapa, "cuerpo")[0] ?? nodo.name,
                  emocion: elegidasDe(mapa, "emociones")[0],
                  creencia: elegidasDe(mapa, "creencias")[0],
                  patron: elegidasDe(mapa, "patrones")[0],
                  pregunta: elegidasDe(mapa, "reflexion")[0],
                  ejercicio: elegidasDe(mapa, "ejercicio")[0],
                },
                tema: entrada ?? nodo.name,
                completada: true,
              });
            }
            setNodo(null);
            setMessages([]);
            setVerFicha(false);
            setVerChat(false);
            setSession(null);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl border border-card-border bg-ocean-surface/60 px-3 py-1.5 text-xs text-foreground/85 transition hover:text-ocean-violet"
        >
          <ArrowLeft className="size-3.5" /> Volver al cuerpo
        </button>
        {nodo && <Evidencia nivel={nodo.evidence_level} />}
        <Link
          href="/biocode/mi-mapa"
          className="inline-flex items-center gap-1.5 rounded-xl border border-card-border bg-ocean-surface/60 px-3 py-1.5 text-xs text-foreground/85 transition hover:text-ocean-violet"
        >
          <Map className="size-3.5" /> Ver mi mapa
        </Link>
        {mapa.nodos.length > 0 && (
          <button
            onClick={() => setVerFicha((v) => !v)}
            className="ml-auto inline-flex items-center gap-1.5 rounded-xl border border-ocean-violet/40 bg-ocean-violet/12 px-3 py-1.5 text-xs text-ocean-violet transition hover:bg-ocean-violet/20"
          >
            <Sparkles className="size-3.5" />
            {verFicha ? "Volver al mapa" : "Lo que he descubierto"}
          </button>
        )}
      </div>

      {sinNodo && (
        <div className="flex items-start gap-2 rounded-2xl border border-card-border bg-ocean-surface/50 px-4 py-3">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ocean-violet" />
          <p className="text-xs leading-relaxed text-muted">
            Todavía no hay material propio sobre {sinNodo}, así que aquí no hay mapa que
            dibujar. Te acompaño con preguntas.
          </p>
        </div>
      )}

      {nodo && verFicha && (
        <Ficha
          nodo={nodo}
          mapa={mapa}
          entrada={entrada}
          sessionId={sessionId}
          onSeguir={() => setVerFicha(false)}
        />
      )}

      {nodo && !verFicha && (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* El mapa radial */}
          <div className="glass rounded-[24px] border border-ocean-violet/15 p-4 sm:p-6">
            <Constelacion
              centro={nodo.name}
              dimensiones={dims}
              mapa={mapa}
              activa={activa}
              onAbrir={(k) => setActiva((a) => (a === k ? null : k))}
            />
            <p className="mt-2 text-center text-xs text-muted">
              Toca una dimensión para explorarla. Lo que elijas se queda en tu mapa.
            </p>
          </div>

          {/* El panel de la dimensión abierta (§3) */}
          <div className="glass rounded-[24px] border border-ocean-violet/15 p-6">
            {!dim ? (
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {nodo.name}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Toca una dimensión del mapa para empezar.
                </p>
              </div>
            ) : (
              <div>
                <h2 className="font-display text-xl font-semibold text-foreground">
                  {nodo.name}
                </h2>
                <div className="mt-3 flex items-center gap-2 border-t border-card-border pt-3">
                  <span className="size-2 rounded-full" style={{ background: dim.color }} />
                  <p className="text-sm font-medium" style={{ color: dim.color }}>
                    {dim.panel ?? dim.label}
                  </p>
                </div>
                <p className="mt-1 text-sm text-muted">{dim.pregunta}</p>

                {dim.modo === "lectura" && (
                  <div className="mt-4 space-y-4">
                    {nodo.scientific_info && (
                      <p className="text-sm leading-relaxed text-foreground/90">
                        {nodo.scientific_info}
                      </p>
                    )}
                    {nodo.warning_signs.length > 0 && (
                      <div className="rounded-2xl border border-danger/25 bg-danger/8 p-4">
                        <p className="text-[0.7rem] uppercase tracking-wider text-danger">
                          Cuándo consultar
                        </p>
                        <ul className="mt-1.5 space-y-1">
                          {nodo.warning_signs.map((w) => (
                            <li key={w} className="text-xs leading-relaxed text-foreground/85">
                              · {w}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {nodo.complementary_info && (
                      <div className="rounded-2xl border border-card-border bg-ocean-surface/40 p-4">
                        <Evidencia nivel="complementario" />
                        <p className="mt-2 text-sm leading-relaxed text-foreground/85">
                          {nodo.complementary_info}
                        </p>
                      </div>
                    )}
                    {dims.some((d) => d.key === "emociones") && (
                      <div>
                        <p className="text-sm text-muted">
                          ¿Quieres explorar también la dimensión emocional?
                        </p>
                        <button
                          onClick={() => setActiva("emociones")}
                          className="mt-2 rounded-xl bg-ocean-violet px-4 py-2 text-sm font-medium text-white transition hover:brightness-110"
                        >
                          Explorar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {dim.modo === "opciones" && (
                  <div className="mt-4">
                    {dim.key !== "reflexion" && dim.key !== "ejercicio" && (
                      <p className="mb-3 rounded-xl border border-card-border bg-ocean-surface/40 px-3 py-2 text-[0.7rem] leading-relaxed text-muted">
                        {ACLARACION_SIMBOLICA}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {opcionesDe(nodo, dim).map((op) => {
                        const puesta = elegidasDe(mapa, dim.key).includes(op);
                        return (
                          <button
                            key={op}
                            onClick={() =>
                              setMapa((m) => alternarEnMapa(m, nodo.slug, dim.key, op))
                            }
                            aria-pressed={puesta}
                            className="rounded-xl border px-3 py-2 text-left text-xs leading-snug transition"
                            style={{
                              borderColor: puesta ? dim.color : "var(--card-border)",
                              background: puesta ? `${dim.color}20` : "transparent",
                              color: puesta ? dim.color : "var(--foreground)",
                            }}
                          >
                            {op}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {dim.modo === "conversacion" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => send(dim.arranque ?? dim.pregunta, dim.key)}
                      className="inline-flex items-center gap-2 rounded-xl bg-ocean-violet px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
                    >
                      <MessageCircle className="size-4" /> Explorar conmigo
                    </button>
                    {dim.key === "relaciones" && (
                      <button
                        onClick={() => setVerParejas(true)}
                        className="inline-flex items-center gap-2 rounded-xl border border-ocean-violet/40 bg-ocean-violet/10 px-4 py-2.5 text-sm text-ocean-violet transition hover:bg-ocean-violet/20"
                      >
                        <Repeat className="size-4" /> Armar mi mapa de pareja
                      </button>
                    )}
                    {dim.key === "familia" && (
                      <Link
                        href="/biocode/arbol"
                        className="inline-flex items-center gap-2 rounded-xl border border-ocean-violet/40 bg-ocean-violet/10 px-4 py-2.5 text-sm text-ocean-violet transition hover:bg-ocean-violet/20"
                      >
                        <TreeDeciduous className="size-4" /> Ir a mi árbol
                      </Link>
                    )}
                  </div>
                )}
              </div>
            )}

            {mapa.nodos.length > 0 && (
            <div className="mt-6 border-t border-card-border pt-4">
              <p className="text-[0.7rem] uppercase tracking-wider text-muted/70">
                Profundizar
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {PROFUNDIZAR.filter((x) => x.slug !== nodo.slug).map((x) => (
                  <button
                    key={x.slug}
                    onClick={() =>
                      empezarBusqueda(async () => {
                        const n = await nodoPorSlug(x.slug);
                        if (n) abrirNodo(n);
                      })
                    }
                    className="rounded-full border border-card-border bg-ocean-surface/50 px-3 py-1.5 text-xs text-foreground/85 transition hover:border-ocean-violet/40 hover:text-ocean-violet"
                  >
                    {x.label}
                  </button>
                ))}
              </div>
            </div>
            )}

            {!verChat && dim?.modo !== "conversacion" && (
              <button
                onClick={() => send(`Quiero explorar ${nodo.name.toLowerCase()}.`)}
                className="mt-6 inline-flex items-center gap-2 rounded-xl border border-ocean-violet/40 bg-ocean-violet/10 px-4 py-2.5 text-sm text-ocean-violet transition hover:bg-ocean-violet/20"
              >
                <MessageCircle className="size-4" /> Explorar conmigo
              </button>
            )}
          </div>
        </div>
      )}

      {/* La conversación (§22): una pregunta a la vez */}
      {verChat && (
        <div className="glass flex h-[min(52vh,560px)] min-h-[20rem] w-full flex-col overflow-hidden rounded-[24px] border border-ocean-violet/15">
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
      )}
    </div>
  );
}
