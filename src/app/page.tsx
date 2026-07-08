import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  RefreshCw,
  HeartCrack,
  Activity,
  Lock,
  Sparkles,
  AudioLines,
  BookOpenText,
  Map,
  Users,
  CalendarDays,
  Check,
  Waves,
  Brain,
  HeartHandshake,
  Route,
  Leaf,
  ShieldCheck,
  AtSign,
  Mail,
} from "lucide-react";
import { SacredOceanBackdrop } from "@/components/brand/sacred-ocean-backdrop";
import { Reveal } from "@/components/marketing/reveal";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/config/site";

export const metadata = {
  title: "OCEOM — Donde el océano interior despierta",
  description:
    "Santuario digital del método E-MOTION® de Valeria Rueda Caicedo. Sanación integral neuroemocional, corporal y energética, acompañada 1 a 1.",
};

/* ── Contenedor base: ancho premium (1180px) con foco central ── */
const SHELL = "relative mx-auto w-full max-w-[1180px] px-6";

/* ── Base de tarjeta: casi transparente y SIN blur, para que la geometría
   sagrada del backdrop se vea nítida detrás. Esquinas casi rectas (editorial,
   nada de "rounded-2xl" genérico) + hairline. El marco iluminado y los acentos
   de esquina los aporta <CardFrame />. ── */
const CARD =
  "group relative rounded-[3px] border border-white/10 bg-ocean-surface/35 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_70px_-42px_rgba(34,211,238,0.5)] motion-reduce:transition-none motion-reduce:hover:translate-y-0";

/* WhatsApp directo de Valeria: en vez de mostrar precio, cada mentoría abre una
   conversación para agendar/cerrar 1 a 1. */
const WHATSAPP_URL = "https://wa.me/message/PRKZNWXFMPP2J1";

const PROBLEMS = [
  {
    icon: RefreshCw,
    title: "Bloqueos emocionales repetitivos",
    desc: "Tristeza, ansiedad o vacío que parecen no tener explicación. No nacen en el presente: son memorias emocionales no integradas.",
  },
  {
    icon: HeartCrack,
    title: "Patrones en las relaciones",
    desc: "Miedo al abandono, dependencia, dar más de lo que recibes. El problema no es la pareja: es la herida que busca resolverse en el otro.",
  },
  {
    icon: Activity,
    title: "Síntomas físicos sin causa",
    desc: "Dolores, tensión crónica, fatiga. El cuerpo habla cuando la emoción no fue escuchada. El síntoma es un mensaje, no un error.",
  },
  {
    icon: Lock,
    title: "Autosabotaje y culpa",
    desc: "Postergar, sentirte insuficiente, miedo al éxito. No es falta de voluntad: es un mecanismo de protección aprendido.",
  },
];

/* El método real: 3 fases · 12 estaciones (alineado al pensum oficial —
   "Manual del Estudiante"). Nombres tomados del currículo real. */
const FASES = [
  {
    label: "Fase I",
    name: "Despertar y reconocimiento",
    estaciones: [
      { n: "01", name: "Diagnóstico del Ser", desc: "Identificamos tu herida predominante y el patrón que se repite." },
      { n: "02", name: "Sanación de la niñez", desc: "Liberas las memorias que se grabaron antes de las palabras." },
      { n: "03", name: "Sanación de los padres", desc: "Reconcilias el vínculo que moldeó tu forma de amar y sostenerte." },
      { n: "04", name: "Árbol transgeneracional", desc: "Biodescodificación: sanas lo heredado, lo que no empezó en ti." },
      { n: "05", name: "Parejas y vínculos", desc: "Cierras lazos y patrones que intentabas resolver en el otro." },
    ],
  },
  {
    label: "Fase II",
    name: "Reprogramación del subconsciente",
    estaciones: [
      { n: "06", name: "Tapping (EFT)", desc: "Descargas la emoción y abres espacio para lo nuevo." },
      { n: "07", name: "Aformaciones", desc: "Reprogramación mental y emocional que reescribe la creencia raíz." },
      { n: "08", name: "Reprogramación híbrida", desc: "Integras mente y emoción en un mismo movimiento de cambio." },
      { n: "09", name: "Hipnosis reprogramativa", desc: "Accedes al subconsciente para consolidar la nueva programación." },
    ],
  },
  {
    label: "Fase III",
    name: "Creación de la nueva identidad",
    estaciones: [
      { n: "10", name: "Mapa de sueños neurocientífico", desc: "Diseñas tu futuro por áreas de vida, con base neurocientífica." },
      { n: "11", name: "Maestría y retroalimentación", desc: "Consolidas lo aprendido y afinas tu proceso acompañada." },
      { n: "12", name: "Sesión de refuerzo", desc: "A los 21 días: integras y sostienes tu nuevo estado en el tiempo." },
    ],
  },
];

const TECHNIQUES = [
  "Liberación emocional",
  "Tapping (EFT)",
  "Hipnosis terapéutica",
  "Respiración consciente",
  "Biodescodificación",
  "Reprogramación emocional",
];

const PROGRAMS = [
  {
    icon: Waves,
    name: "Método E-MOTION®",
    tag: "Sanación integral · 1 a 1",
    outcome:
      "Sana la herida raíz que se repite en tu vida y libera lo que cargas desde la niñez y el linaje.",
    meta: "9 sesiones · 2 por semana · 2h cada una",
    bullets: [
      "Identifica y sana tu herida predominante",
      "Libera memorias de infancia y linaje",
      "Reprograma creencias a nivel subconsciente",
      "Tareas entre sesiones + sesión de refuerzo",
    ],
    badge: "Programa insignia",
    microcopy: "Cupos limitados · proceso 100% personalizado",
    featured: true,
  },
  {
    icon: Brain,
    name: "Arquitectura Neuropsíquica",
    tag: "Avanzado · incluye diploma",
    outcome:
      "Reconecta y domina tu sistema nervioso, y despierta tu percepción sutil.",
    meta: "15 clases · 70% práctico",
    bullets: [
      "Reconexión y desintoxicación del sistema nervioso",
      "Percepción sutil: telepatía y clarividencia",
      "Sanación a distancia y psicometría",
      "Rito de maestría e integración",
    ],
    badge: "Formación avanzada",
    microcopy: "Requiere base emocional trabajada",
    featured: false,
  },
];

const ECOSYSTEM = [
  {
    icon: Sparkles,
    title: "OMI",
    tag: "24/7",
    desc: "Tu guía de IA neuroemocional, disponible en cada paso de tu proceso.",
  },
  {
    icon: AudioLines,
    title: "Deep Waves",
    tag: "Audio",
    desc: "Meditaciones, hipnosis y respiraciones para regular tu sistema nervioso.",
  },
  {
    icon: BookOpenText,
    title: "Bitácora Interior",
    tag: "Diario",
    desc: "Registra emociones, insights y tu evolución a lo largo del camino.",
  },
  {
    icon: Map,
    title: "Mapa de Visión",
    tag: "Visión",
    desc: "Diseña tu futuro por áreas de vida y sostén tus metas en el tiempo.",
  },
  {
    icon: Users,
    title: "Círculos en Vivo",
    tag: "En vivo",
    desc: "Sesiones y comunidad consciente en alta definición, en tiempo real.",
  },
  {
    icon: CalendarDays,
    title: "Agenda 1:1",
    tag: "1:1",
    desc: "Reserva tus clases uno a uno cuando tu proceso lo pida.",
  },
];

const PILLARS = [
  {
    icon: HeartHandshake,
    title: "Acompañamiento personalizado",
    desc: "No es un curso masivo. Cada proceso es 1 a 1, a tu ritmo y con escucha real.",
  },
  {
    icon: Route,
    title: "Proceso progresivo",
    desc: "Avanzas por fases, sin forzar. Cada capa se abre cuando estás listo/a.",
  },
  {
    icon: Leaf,
    title: "Respeto por los tiempos del cuerpo",
    desc: "El cuerpo marca el ritmo. Aquí se honra, no se apura.",
  },
];

/* Marco premium reutilizable (bespoke, "0 IA"):
   · línea superior sutil tipo hairline,
   · borde iluminado en hover: anillo de gradiente cyan/teal enmascarado (1px),
   · acentos de esquina tipo marco de arte que se encienden al pasar el mouse.
   Va DENTRO de una tarjeta con `group relative`. */
function CardFrame() {
  return (
    <>
      {/* Hairline superior */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-ocean-cyan/30 to-transparent opacity-50 transition-opacity duration-300 group-hover:opacity-100"
      />
      {/* Borde iluminado en hover (anillo de 1px con gradiente enmascarado) */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[3px] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          padding: "1px",
          background:
            "linear-gradient(135deg, rgba(94,234,212,0.75), rgba(34,211,238,0.28) 42%, rgba(94,234,212,0) 72%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          maskComposite: "exclude",
        }}
      />
      {/* Acentos de esquina (marco bespoke) */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 size-3.5 border-l border-t border-ocean-cyan/25 transition-colors duration-300 group-hover:border-ocean-cyan/70"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-0 size-3.5 border-b border-r border-ocean-cyan/25 transition-colors duration-300 group-hover:border-ocean-cyan/70"
      />
    </>
  );
}

/* Glifo de WhatsApp en currentColor: hereda el color del botón (sin verde
   genérico) para no romper la paleta oceánica. El botón lo escala a 16px. */
function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.71.306 1.263.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/* Etiqueta de sección (eyebrow) consistente en toda la landing. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean-cyan">
      {children}
    </p>
  );
}

export default function LandingPage() {
  return (
    <div className="relative">
      <SacredOceanBackdrop fullWidth />

      {/* Header */}
      <header className="sticky top-0 z-40 px-4 pt-3">
        <div className="glass-strong mx-auto flex w-full max-w-[1180px] items-center justify-between rounded-2xl px-5 py-3">
          <Logo showBrand={false} />
          <nav className="hidden items-center gap-7 text-sm text-foreground/70 md:flex">
            <a href="#metodo" className="transition-colors hover:text-ocean-cyan">
              El método
            </a>
            <a href="#programas" className="transition-colors hover:text-ocean-cyan">
              Programas
            </a>
            <a href="#ecosistema" className="transition-colors hover:text-ocean-cyan">
              Ecosistema
            </a>
            <a href="#etica" className="transition-colors hover:text-ocean-cyan">
              Ética
            </a>
          </nav>
          <Link
            href="/login"
            className={buttonVariants({ variant: "glass", size: "sm" })}
          >
            Ingresar
          </Link>
        </div>
      </header>

      <main>
        {/* ══════════════ HERO ══════════════ */}
        <section className="relative flex min-h-[92svh] items-center justify-center px-6 py-20 text-center">
          {/* Glow oceánico cinematográfico detrás del título */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -z-0 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[130px] [animation:pulse-glow_8s_ease-in-out_infinite] motion-reduce:animate-none"
            style={{
              background:
                "radial-gradient(circle, rgba(34,211,238,0.20) 0%, rgba(94,234,212,0.10) 42%, transparent 72%)",
            }}
          />

          <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-ocean-cyan/30 bg-ocean-cyan/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-ocean-cyan">
                <Sparkles className="size-3.5" />
                Método E-MOTION® · Valeria Rueda Caicedo
              </span>
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-7 font-display text-[2.75rem] font-bold leading-[1.03] tracking-tight text-foreground sm:text-7xl lg:text-[5rem]">
                Donde el océano
                <br />
                <span className="bg-gradient-to-r from-ocean-glow via-ocean-cyan to-[#8fd6ec] bg-clip-text text-transparent">
                  interior despierta
                </span>
              </h1>
            </Reveal>

            <Reveal delay={0.16}>
              <p className="mx-auto mt-7 max-w-xl text-lg text-foreground/75 sm:text-xl">
                Tecnología emocional para la evolución humana. Un proceso profundo
                de sanación neuroemocional, corporal y energética —
                <span className="text-foreground/90"> acompañado 1 a 1.</span>
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <Link href="/registro" className={buttonVariants({ size: "lg" })}>
                  Comenzar mi proceso <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#metodo"
                  className={buttonVariants({ variant: "glass", size: "lg" })}
                >
                  Conocer el método
                </a>
              </div>
            </Reveal>

            <Reveal delay={0.32}>
              <div className="mt-11 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-sm text-foreground/60">
                {["Inmersivo", "Consciente", "Profundo", "Transformador"].map((a) => (
                  <span key={a} className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full bg-ocean-cyan" /> {a}
                  </span>
                ))}
              </div>
            </Reveal>
          </div>

          {/* Indicador de scroll cinematográfico */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <div className="flex flex-col items-center gap-2 text-foreground/40">
              <span className="text-[0.65rem] uppercase tracking-[0.2em]">Desliza</span>
              <ChevronDown className="size-4 animate-bounce motion-reduce:animate-none" />
            </div>
          </div>
        </section>

        {/* Resto de la landing: transparente para que la geometría sagrada y las
            estrellas del backdrop fijo se vean en TODA la página (no solo el hero).
            La legibilidad la dan el velo + viñeta del backdrop y las tarjetas glass. */}
        <div className="relative">
          {/* ══════════════ ¿QUÉ RESUELVE? ══════════════ */}
          <section className={`${SHELL} py-24 sm:py-28`}>
            <Reveal className="mx-auto max-w-2xl text-center">
              <Eyebrow>¿Qué resuelve?</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-[2.6rem]">
                Cuando el cuerpo recuerda
                <br className="hidden sm:block" /> lo que la mente intenta olvidar
              </h2>
              <p className="mt-5 text-lg text-foreground/70">
                Muchas personas llegan no porque “algo esté mal”, sino porque algo
                se repite. E-MOTION® sana desde la raíz.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-5 sm:grid-cols-2">
              {PROBLEMS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <Reveal key={p.title} delay={i * 0.07}>
                    <div className={`${CARD} h-full p-7 sm:p-8`}>
                      <CardFrame />
                      <div className="relative">
                        <div className="grid size-12 place-items-center rounded-xl bg-ocean-cyan/10 text-ocean-cyan ring-1 ring-inset ring-ocean-cyan/20 transition-transform duration-300 group-hover:scale-105">
                          <Icon className="size-5" />
                        </div>
                        <h3 className="mt-5 font-display text-xl font-semibold text-foreground">
                          {p.title}
                        </h3>
                        <p className="mt-2.5 text-[0.95rem] leading-relaxed text-foreground/65">
                          {p.desc}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>

          {/* ══════════════ EL MÉTODO — 3 FASES · 12 ESTACIONES ══════════════ */}
          <section id="metodo" className={`${SHELL} scroll-mt-24 py-24 sm:py-28`}>
            <Reveal className="max-w-2xl">
              <Eyebrow>El método</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-[2.6rem]">
                Una arquitectura terapéutica, no una lista de técnicas
              </h2>
              <p className="mt-5 text-lg text-foreground/70">
                E-MOTION® se despliega en{" "}
                <span className="font-medium text-foreground">
                  3 fases y 12 estaciones
                </span>{" "}
                que trabajan el sistema nervioso, la memoria emocional y el cuerpo
                como registro del subconsciente. Cada estación abre, libera,
                reorganiza y reprograma — respetando los tiempos del cuerpo.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                {TECHNIQUES.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-card-border bg-ocean-surface/40 px-3.5 py-1.5 text-sm text-foreground/80"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </Reveal>

            {/* Las 3 fases, cada una con sus estaciones (mini-recorrido) */}
            <div className="mt-14 grid gap-5 lg:grid-cols-3">
              {FASES.map((fase, fi) => (
                <Reveal key={fase.label} delay={fi * 0.1}>
                  <div className={`${CARD} h-full p-7`}>
                    <CardFrame />
                    <div className="relative">
                      <div className="flex items-baseline justify-between">
                        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-foreground/45">
                          {fase.label}
                        </p>
                        <span className="text-[0.65rem] uppercase tracking-wide text-foreground/35">
                          {fase.estaciones.length} estaciones
                        </span>
                      </div>
                      <h3 className="mt-1.5 font-display text-lg font-semibold text-ocean-cyan">
                        {fase.name}
                      </h3>

                      <ol className="relative mt-5 space-y-5 before:absolute before:bottom-3 before:left-[15px] before:top-2 before:w-px before:bg-gradient-to-b before:from-ocean-cyan/40 before:via-ocean-cyan/15 before:to-transparent">
                        {fase.estaciones.map((e) => (
                          <li key={e.n} className="relative flex gap-3.5">
                            <span className="relative z-10 grid size-8 shrink-0 place-items-center rounded-full border border-ocean-cyan/30 bg-ocean-abyss/90 font-display text-xs font-semibold text-ocean-cyan">
                              {e.n}
                            </span>
                            <div className="pt-0.5">
                              <h4 className="font-display text-sm font-semibold text-foreground">
                                {e.name}
                              </h4>
                              <p className="mt-0.5 text-[0.82rem] leading-relaxed text-foreground/55">
                                {e.desc}
                              </p>
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </section>

          {/* ══════════════ PROGRAMAS ══════════════ */}
          <section id="programas" className={`${SHELL} scroll-mt-24 py-24 sm:py-28`}>
            <Reveal className="mx-auto max-w-2xl text-center">
              <Eyebrow>Programas</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-[2.6rem]">
                Elige tu camino de transformación
              </h2>
              <p className="mt-5 text-lg text-foreground/70">
                Procesos profundos, acompañados y personales. No compras un curso:
                inicias un camino.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-6 lg:grid-cols-2">
              {PROGRAMS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <Reveal key={p.name} delay={i * 0.1}>
                    <div
                      className={`${CARD} flex h-full flex-col p-8 ${
                        p.featured
                          ? "border-ocean-cyan/30 shadow-[0_30px_80px_-42px_rgba(34,211,238,0.6)]"
                          : ""
                      }`}
                    >
                      <CardFrame />
                      {/* Badge superior */}
                      <div className="relative flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.12em] ${
                            p.featured
                              ? "bg-ocean-cyan/15 text-ocean-cyan ring-1 ring-inset ring-ocean-cyan/30"
                              : "bg-ocean-surface/60 text-foreground/60 ring-1 ring-inset ring-card-border"
                          }`}
                        >
                          {p.featured && <Sparkles className="size-3" />}
                          {p.badge}
                        </span>
                      </div>

                      <div className="relative mt-6 flex items-center gap-3.5">
                        <div className="grid size-14 place-items-center rounded-2xl bg-ocean-cyan/12 text-ocean-cyan ring-1 ring-inset ring-ocean-cyan/20">
                          <Icon className="size-7" />
                        </div>
                        <div>
                          <h3 className="font-display text-2xl font-semibold text-foreground">
                            {p.name}
                          </h3>
                          <p className="text-sm text-foreground/55">{p.tag}</p>
                        </div>
                      </div>

                      {/* Resultado principal */}
                      <p className="relative mt-5 text-[1.05rem] leading-relaxed text-foreground/85">
                        {p.outcome}
                      </p>

                      {/* Modalidad / duración */}
                      <p className="relative mt-3 inline-flex w-fit items-center gap-1.5 rounded-lg bg-ocean-surface/40 px-2.5 py-1 text-xs text-foreground/60">
                        <CalendarDays className="size-3.5 text-ocean-cyan/70" />
                        {p.meta}
                      </p>

                      {/* Beneficios */}
                      <ul className="relative mt-6 flex-1 space-y-3">
                        {p.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex items-start gap-2.5 text-[0.95rem] text-foreground/80"
                          >
                            <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-ocean-cyan/12 text-ocean-cyan">
                              <Check className="size-3.5" />
                            </span>
                            {b}
                          </li>
                        ))}
                      </ul>

                      {/* CTA directo: agenda por WhatsApp con Valeria (sin precio a la vista) */}
                      <div className="relative mt-7 border-t border-card-border pt-6">
                        <p className="text-sm leading-relaxed text-foreground/60">
                          Escríbele a Valeria para conocer la inversión, resolver tus
                          dudas y reservar tu cupo.
                        </p>
                        <a
                          href={WHATSAPP_URL}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Hablar con tu mentora por WhatsApp sobre ${p.name}`}
                          className={buttonVariants({
                            size: "lg",
                            className: "mt-5 w-full",
                          })}
                        >
                          <WhatsappIcon /> Hablar con tu mentora
                        </a>
                        <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-foreground/45">
                          <span className="size-1.5 rounded-full bg-ocean-glow" />
                          {p.microcopy}
                        </p>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>

          {/* ══════════════ ECOSISTEMA ══════════════ */}
          <section id="ecosistema" className={`${SHELL} scroll-mt-24 py-24 sm:py-28`}>
            <Reveal className="mx-auto max-w-2xl text-center">
              <Eyebrow>El ecosistema</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-[2.6rem]">
                Un santuario digital, no una academia
              </h2>
              <p className="mt-5 text-lg text-foreground/70">
                Seis módulos de una misma experiencia viva. Todo lo que tu proceso
                necesita, en un solo lugar íntimo y seguro.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ECOSYSTEM.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Reveal key={f.title} delay={(i % 3) * 0.08}>
                    <div className={`${CARD} h-full p-7`}>
                      <CardFrame />
                      <div className="relative flex items-start justify-between">
                        <div className="grid size-12 place-items-center rounded-xl bg-ocean-cyan/10 text-ocean-cyan ring-1 ring-inset ring-ocean-cyan/20 transition-transform duration-300 group-hover:scale-105">
                          <Icon className="size-5" />
                        </div>
                        <span className="rounded-full border border-card-border bg-ocean-surface/50 px-2.5 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.1em] text-foreground/55">
                          {f.tag}
                        </span>
                      </div>
                      <h3 className="relative mt-5 font-display text-lg font-semibold text-foreground">
                        {f.title}
                      </h3>
                      <p className="relative mt-1.5 text-[0.95rem] leading-relaxed text-foreground/65">
                        {f.desc}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>

          {/* ══════════════ ÉTICA / SEGURIDAD ══════════════ */}
          <section id="etica" className={`${SHELL} scroll-mt-24 py-24 sm:py-28`}>
            <Reveal className="mx-auto max-w-2xl text-center">
              <Eyebrow>Un espacio seguro</Eyebrow>
              <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-[2.6rem]">
                Un espacio profundo, seguro y humano
              </h2>
              <p className="mt-5 text-lg text-foreground/70">
                La profundidad solo es posible cuando hay seguridad. Así cuidamos
                cada proceso.
              </p>
            </Reveal>

            <div className="mt-14 grid gap-5 sm:grid-cols-3">
              {PILLARS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <Reveal key={p.title} delay={i * 0.08}>
                    <div className={`${CARD} h-full p-7 text-center sm:text-left`}>
                      <CardFrame />
                      <div className="relative mx-auto grid size-12 place-items-center rounded-xl bg-ocean-glow/10 text-ocean-glow ring-1 ring-inset ring-ocean-glow/20 sm:mx-0">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="relative mt-5 font-display text-lg font-semibold text-foreground">
                        {p.title}
                      </h3>
                      <p className="relative mt-2 text-[0.95rem] leading-relaxed text-foreground/65">
                        {p.desc}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>

            {/* Nota ética discreta */}
            <Reveal delay={0.1}>
              <div className="mx-auto mt-8 flex max-w-3xl items-start gap-3 rounded-2xl border border-card-border bg-ocean-surface/25 px-6 py-5">
                <ShieldCheck className="mt-0.5 size-5 shrink-0 text-ocean-cyan/70" />
                <p className="text-sm leading-relaxed text-foreground/55">
                  OCEOM acompaña procesos de autoconocimiento y transformación
                  emocional. No reemplaza atención médica, psicológica o
                  psiquiátrica cuando sea necesaria.
                </p>
              </div>
            </Reveal>
          </section>

          {/* ══════════════ VALERIA — SECCIÓN EDITORIAL DE AUTORIDAD ══════════════ */}
          <section className={`${SHELL} py-24 sm:py-28`}>
            <Reveal>
              <div className="group relative overflow-hidden rounded-[3px] border border-white/10 bg-ocean-surface/40 transition-all duration-500 hover:shadow-[0_40px_100px_-50px_rgba(34,211,238,0.45)]">
                <CardFrame />
                {/* Glow ambiental hacia el contenido */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 size-72 rounded-full opacity-40 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(34,211,238,0.24), transparent 70%)",
                  }}
                />

                <div className="relative grid lg:grid-cols-[0.82fr_1fr]">
                  {/* ── IZQUIERDA: retrato protagonista (sangra al borde) ── */}
                  <div className="relative min-h-[24rem] lg:min-h-[34rem]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/valeria.jpg"
                      alt="Valeria Rueda Caicedo"
                      loading="lazy"
                      decoding="async"
                      className="absolute inset-0 h-full w-full object-cover object-[center_22%] transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                    />
                    {/* Glow cyan delicado en el borde del retrato */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 shadow-[inset_0_0_55px_-18px_rgba(94,234,212,0.35)]"
                    />
                    {/* Velo inferior (profundidad + integración en mobile) */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-ocean-abyss/65 to-transparent"
                    />
                    {/* Velo lateral (funde el retrato con el contenido, solo desktop) */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-0 right-0 hidden w-1/3 bg-gradient-to-r from-transparent to-ocean-abyss/45 lg:block"
                    />
                    {/* Hairline vertical en la costura (desktop) */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-y-8 right-0 hidden w-px bg-gradient-to-b from-transparent via-ocean-cyan/40 to-transparent lg:block"
                    />
                  </div>

                  {/* ── DERECHA: contenido editorial ── */}
                  <div className="relative flex flex-col justify-center p-8 sm:p-10 lg:py-14 lg:pl-12 lg:pr-14">
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean-cyan">
                      La creadora del método
                    </p>
                    <h2 className="mt-3 font-display text-4xl font-bold leading-[1.04] tracking-tight text-foreground sm:text-5xl">
                      Valeria Rueda Caicedo
                    </h2>
                    <p className="mt-3 text-sm text-foreground/60 sm:text-base">
                      Coach transformacional · Terapeuta en sanación integral ·
                      Creadora del método E-MOTION®
                    </p>

                    {/* Autoridad en números */}
                    <div className="mt-7 flex flex-wrap gap-x-10 gap-y-4">
                      <div>
                        <p className="font-display text-3xl font-bold text-foreground">
                          +7 <span className="text-ocean-cyan">años</span>
                        </p>
                        <p className="mt-0.5 text-xs text-foreground/50">
                          acompañando procesos
                        </p>
                      </div>
                      <div>
                        <p className="font-display text-3xl font-bold text-foreground">
                          +2.000
                        </p>
                        <p className="mt-0.5 text-xs text-foreground/50">
                          personas impactadas
                        </p>
                      </div>
                    </div>

                    {/* Autoridad + humanidad */}
                    <p className="mt-7 text-[1.02rem] leading-relaxed text-foreground/80">
                      Acompaña procesos de transformación profunda desde una
                      integración emocional, corporal, energética y terapéutica —
                      con herramientas de trabajo emocional, energético y sensorial.
                      Su enfoque no busca solo aliviar síntomas, sino guiar a cada
                      persona hacia una sanación auténtica desde la raíz.
                    </p>

                    {/* Quote destacada */}
                    <blockquote className="mt-7 border-l-2 border-ocean-cyan/50 pl-5">
                      <p className="font-display text-lg italic leading-relaxed text-foreground/90 sm:text-xl">
                        “E-MOTION® no es solo un método. Es una forma de escuchar lo
                        que el cuerpo, la emoción y el alma necesitan liberar.”
                      </p>
                    </blockquote>

                    {/* Pilares */}
                    <div className="mt-8 flex flex-wrap gap-2">
                      {["Sanación integral", "Método propio", "Acompañamiento consciente"].map(
                        (chip) => (
                          <span
                            key={chip}
                            className="rounded-full border border-ocean-cyan/20 bg-ocean-cyan/[0.06] px-3.5 py-1.5 text-sm text-foreground/80"
                          >
                            {chip}
                          </span>
                        ),
                      )}
                    </div>

                    {/* CTA secundario */}
                    <div className="mt-9">
                      <a
                        href="#metodo"
                        className={buttonVariants({ variant: "glass", size: "md" })}
                      >
                        Conocer el método <ArrowRight className="size-4" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ══════════════ CTA FINAL ══════════════ */}
          <section className={`${SHELL} max-w-4xl pb-28`}>
            <Reveal>
              <div className="group relative overflow-hidden rounded-[3px] border border-white/10 bg-ocean-surface/45 p-10 text-center transition-all duration-300 hover:shadow-[0_30px_80px_-44px_rgba(34,211,238,0.5)] sm:p-16">
                <CardFrame />
                <div
                  aria-hidden
                  className="pointer-events-none absolute left-1/2 top-0 size-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[120px] [animation:pulse-glow_8s_ease-in-out_infinite] motion-reduce:animate-none"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(34,211,238,0.32), transparent 70%)",
                  }}
                />
                <div className="relative">
                  <h2 className="font-display text-3xl font-bold leading-tight text-foreground sm:text-5xl">
                    Tu océano interior te espera
                  </h2>
                  <p className="mx-auto mt-5 max-w-xl text-lg text-foreground/70">
                    Comienza hoy un proceso de transformación profunda, acompañada y
                    a tu ritmo.
                  </p>
                  <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                    <Link
                      href="/registro"
                      className={buttonVariants({ size: "lg" })}
                    >
                      Comenzar ahora
                      <ArrowRight className="size-4" />
                    </Link>
                    <a
                      href="#programas"
                      className={buttonVariants({ variant: "glass", size: "lg" })}
                    >
                      Ver programas
                    </a>
                  </div>
                  <p className="mt-5 text-xs text-foreground/45">
                    Cupos limitados · acompañamiento personalizado
                  </p>
                </div>
              </div>
            </Reveal>
          </section>

          {/* ══════════════ FOOTER ══════════════ */}
          <footer className="relative border-t border-card-border">
            <div className="mx-auto grid w-full max-w-[1180px] gap-10 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Logo />
                <p className="mt-4 max-w-xs text-sm text-foreground/60">
                  {site.claim}
                </p>
                <p className="mt-2 max-w-xs text-sm text-foreground/40">
                  {site.tagline}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
                  Explora
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-foreground/60">
                  <li>
                    <a href="#metodo" className="transition-colors hover:text-ocean-cyan">
                      El método
                    </a>
                  </li>
                  <li>
                    <a href="#programas" className="transition-colors hover:text-ocean-cyan">
                      Programas
                    </a>
                  </li>
                  <li>
                    <a href="#ecosistema" className="transition-colors hover:text-ocean-cyan">
                      Ecosistema
                    </a>
                  </li>
                  <li>
                    <Link href="/login" className="transition-colors hover:text-ocean-cyan">
                      Ingresar
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
                  Contacto
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-foreground/60">
                  <li>
                    <a
                      href="mailto:valeriaruedacaicedo@gmail.com"
                      className="inline-flex items-center gap-2 transition-colors hover:text-ocean-cyan"
                    >
                      <Mail className="size-4" /> valeriaruedacaicedo@gmail.com
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://instagram.com/valeriaruedacaicedo"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 transition-colors hover:text-ocean-cyan"
                    >
                      <AtSign className="size-4" /> @valeriaruedacaicedo
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-foreground/45">
                  Legal
                </p>
                <ul className="mt-4 space-y-2.5 text-sm text-foreground/60">
                  <li>
                    <Link href="/terminos" className="transition-colors hover:text-ocean-cyan">
                      Términos
                    </Link>
                  </li>
                  <li>
                    <Link href="/privacidad" className="transition-colors hover:text-ocean-cyan">
                      Privacidad
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            <div className="border-t border-card-border/60">
              <div className="mx-auto flex w-full max-w-[1180px] flex-col items-center justify-between gap-2 px-6 py-6 text-center sm:flex-row sm:text-left">
                <p className="text-xs text-foreground/45">
                  © {new Date().getFullYear()} {site.brand} · {site.name}. Todos los
                  derechos reservados.
                </p>
                <p className="text-xs text-ocean-cyan/70">
                  Un santuario para tu océano interior.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
