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
import { getProfile, homeForRole } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { SacredOceanBackdrop } from "@/components/brand/sacred-ocean-backdrop";
import { Reveal } from "@/components/marketing/reveal";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";
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

const FASES = [
  { label: "Fase I", name: "Despertar y reconocimiento" },
  { label: "Fase II", name: "Reprogramación del subconsciente" },
  { label: "Fase III", name: "Integración y maestría" },
];

const CIRCUITO = [
  {
    n: "01",
    name: "Heridas emocionales",
    desc: "Diagnóstico del Ser: identificamos tu herida predominante y el patrón que se repite.",
  },
  {
    n: "02",
    name: "Niñez",
    desc: "Sanación de la niñez: liberamos las memorias que se grabaron antes de las palabras.",
  },
  {
    n: "03",
    name: "Linaje",
    desc: "Árbol transgeneracional y biodescodificación: sanas lo heredado, lo que no empezó en ti.",
  },
  {
    n: "04",
    name: "Parejas y vínculos",
    desc: "Cierras lazos y patrones que intentabas resolver en el otro.",
  },
  {
    n: "05",
    name: "Cuerpo y chakras",
    desc: "El cuerpo como registro: liberas la emoción guardada como tensión y síntoma.",
  },
  {
    n: "06",
    name: "Reprogramación",
    desc: "Subconsciente: tapping, aformaciones e hipnosis para reescribir la creencia raíz.",
  },
  {
    n: "07",
    name: "Mapa de sueños",
    desc: "Integración: consolidas lo sanado y diseñas tu vida desde tu nuevo estado.",
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
    price: "$2.200.000",
    priceNote: "Acompañamiento 1:1 · pago único o en cuotas",
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
    price: "$2.750.000",
    priceNote: "Incluye diploma de maestría",
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

/* Etiqueta de sección (eyebrow) consistente en toda la landing. */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-ocean-cyan">
      {children}
    </p>
  );
}

export default async function LandingPage() {
  let authedHref: string | null = null;
  if (hasSupabaseEnv()) {
    const profile = await getProfile();
    if (profile) authedHref = homeForRole(profile.role);
  }

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
            href={authedHref ?? "/login"}
            className={buttonVariants({ variant: "glass", size: "sm" })}
          >
            {authedHref ? "Mi cuenta" : "Ingresar"}
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
                {authedHref ? (
                  <Link href={authedHref} className={buttonVariants({ size: "lg" })}>
                    Entrar a mi cuenta <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <>
                    <Link href="/registro" className={buttonVariants({ size: "lg" })}>
                      Comenzar mi proceso <ArrowRight className="size-4" />
                    </Link>
                    <a
                      href="#metodo"
                      className={buttonVariants({ variant: "glass", size: "lg" })}
                    >
                      Conocer el método
                    </a>
                  </>
                )}
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

          {/* ══════════════ EL MÉTODO — RUTA TERAPÉUTICA ══════════════ */}
          <section id="metodo" className={`${SHELL} scroll-mt-24 py-24 sm:py-28`}>
            <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-start lg:gap-16">
              {/* Columna izquierda: narrativa + arco de fases + técnicas */}
              <Reveal>
                <Eyebrow>El método</Eyebrow>
                <h2 className="mt-4 font-display text-3xl font-bold leading-tight text-foreground sm:text-[2.6rem]">
                  Una arquitectura terapéutica, no una lista de técnicas
                </h2>
                <p className="mt-5 text-lg text-foreground/70">
                  E-MOTION® trabaja el sistema nervioso, la memoria emocional y el
                  cuerpo como registro del subconsciente. Cada fase abre, libera,
                  reorganiza y reprograma — respetando los tiempos del cuerpo.
                </p>

                {/* Arco de las 3 fases */}
                <div className="mt-8 space-y-2.5">
                  {FASES.map((f, i) => (
                    <div key={f.label} className="flex items-center gap-3.5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl border border-ocean-cyan/25 bg-ocean-cyan/5 text-sm font-semibold text-ocean-cyan">
                        {i + 1}
                      </span>
                      <div>
                        <span className="text-[0.7rem] font-medium uppercase tracking-[0.14em] text-foreground/45">
                          {f.label}
                        </span>
                        <p className="text-[0.95rem] font-medium text-foreground/90">
                          {f.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Técnicas como toolkit */}
                <div className="mt-8 flex flex-wrap gap-2">
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

              {/* Columna derecha: la ruta de 7 pasos (timeline con espina luminosa) */}
              <Reveal delay={0.12}>
                <div className="group relative rounded-[3px] border border-white/10 bg-ocean-surface/45 p-6 transition-all duration-300 hover:shadow-[0_28px_70px_-42px_rgba(34,211,238,0.4)] sm:p-8">
                  <CardFrame />
                  <div className="relative flex items-center justify-between">
                    <p className="text-sm font-semibold text-ocean-cyan">
                      El Circuito E-MOTION®
                    </p>
                    <span className="text-xs text-foreground/40">7 estaciones</span>
                  </div>

                  <ol className="relative mt-6 space-y-6 before:absolute before:bottom-3 before:left-[19px] before:top-3 before:w-px before:bg-gradient-to-b before:from-ocean-cyan/50 before:via-ocean-cyan/20 before:to-transparent">
                    {CIRCUITO.map((step) => (
                      <li key={step.n} className="relative flex gap-4">
                        <span className="relative z-10 grid size-10 shrink-0 place-items-center rounded-full border border-ocean-cyan/30 bg-ocean-abyss/90 font-display text-sm font-semibold text-ocean-cyan shadow-[0_0_18px_-4px_rgba(34,211,238,0.6)]">
                          {step.n}
                        </span>
                        <div className="pt-0.5">
                          <h4 className="font-display text-base font-semibold text-foreground">
                            {step.name}
                          </h4>
                          <p className="mt-1 text-sm leading-relaxed text-foreground/60">
                            {step.desc}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </Reveal>
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

                      {/* Precio + CTA */}
                      <div className="relative mt-7 border-t border-card-border pt-6">
                        <p className="text-[0.68rem] font-medium uppercase tracking-[0.16em] text-foreground/45">
                          Inversión
                        </p>
                        <div className="mt-1.5 flex items-baseline gap-2">
                          <span className="font-display text-4xl font-bold text-foreground">
                            {p.price}
                          </span>
                          <span className="text-sm font-medium text-ocean-cyan">
                            COP
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-foreground/50">{p.priceNote}</p>

                        <Link
                          href="/registro"
                          className={buttonVariants({
                            size: "lg",
                            className: "mt-6 w-full",
                          })}
                        >
                          Comenzar mi proceso <ArrowRight className="size-4" />
                        </Link>
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

          {/* ══════════════ VALERIA — FIRMA DE LA GUÍA ══════════════ */}
          <section className={`${SHELL} max-w-3xl py-24 sm:py-28`}>
            <Reveal>
              <div className="group relative overflow-hidden rounded-[3px] border border-white/10 bg-ocean-surface/45 p-8 transition-all duration-300 hover:shadow-[0_34px_90px_-46px_rgba(34,211,238,0.45)] sm:p-12">
                <CardFrame />
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-20 -top-20 size-64 rounded-full opacity-50 blur-3xl"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(34,211,238,0.26), transparent 70%)",
                  }}
                />
                <div className="relative flex flex-col items-center text-center">
                  {/* Foto clara y central, enmarcada tipo retrato */}
                  <div className="relative">
                    <span
                      aria-hidden
                      className="absolute -inset-3 rounded-[8px] opacity-70 blur-2xl"
                      style={{
                        background:
                          "radial-gradient(circle, rgba(94,234,212,0.30), transparent 70%)",
                      }}
                    />
                    <div className="relative h-60 w-48 overflow-hidden rounded-[4px] border border-ocean-cyan/25 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.7)] sm:h-72 sm:w-56">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src="/valeria.jpg"
                        alt="Valeria Rueda Caicedo"
                        className="h-full w-full object-cover object-[center_28%]"
                      />
                      {/* Velo inferior para fundir el retrato con el santuario */}
                      <span
                        aria-hidden
                        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-ocean-abyss/70 to-transparent"
                      />
                    </div>
                    {/* Acentos de esquina sobre la foto */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -left-1.5 -top-1.5 size-5 border-l-2 border-t-2 border-ocean-cyan/50"
                    />
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -bottom-1.5 -right-1.5 size-5 border-b-2 border-r-2 border-ocean-cyan/50"
                    />
                  </div>

                  <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-ocean-cyan">
                    Tu guía
                  </p>
                  <h2 className="mt-2 font-display text-2xl font-bold text-foreground sm:text-3xl">
                    Valeria Rueda Caicedo
                  </h2>
                  <p className="mt-1.5 text-sm text-foreground/60">
                    Coach transformacional · Terapeuta en sanación integral ·
                    Creadora del método E-MOTION®
                  </p>
                  <p className="mx-auto mt-6 max-w-2xl text-lg italic leading-relaxed text-foreground/85">
                    “E-MOTION® no es solo un método. Es la síntesis de un camino,
                    una escucha profunda y un compromiso real con la sanación
                    auténtica.”
                  </p>
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
                      href={authedHref ?? "/registro"}
                      className={buttonVariants({ size: "lg" })}
                    >
                      {authedHref ? "Entrar a mi cuenta" : "Comenzar ahora"}
                      <ArrowRight className="size-4" />
                    </Link>
                    {!authedHref && (
                      <a
                        href="#programas"
                        className={buttonVariants({ variant: "glass", size: "lg" })}
                      >
                        Ver programas
                      </a>
                    )}
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
