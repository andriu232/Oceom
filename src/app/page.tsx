import Link from "next/link";
import {
  ArrowRight,
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
} from "lucide-react";
import { getProfile, homeForRole } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { SacredOceanBackdrop } from "@/components/brand/sacred-ocean-backdrop";
import { Reveal } from "@/components/marketing/reveal";
import { Logo } from "@/components/brand/logo";
import { buttonVariants } from "@/components/ui/button";
import { site } from "@/config/site";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "OCEOM by E-MOTION® — Donde el océano interior despierta",
  description:
    "Ecosistema digital del método E-MOTION® de Valeria Rueda Caicedo. Sanación integral neuroemocional, corporal y energética.",
};

const PROBLEMS = [
  { icon: RefreshCw, title: "Bloqueos emocionales repetitivos", desc: "Tristeza, ansiedad o vacío que parecen no tener explicación. No nacen en el presente: son memorias emocionales no integradas." },
  { icon: HeartCrack, title: "Patrones en las relaciones", desc: "Miedo al abandono, dependencia, dar más de lo que recibes. El problema no es la pareja: es la herida que busca resolverse en el otro." },
  { icon: Activity, title: "Síntomas físicos sin causa", desc: "Dolores, tensión crónica, fatiga. El cuerpo habla cuando la emoción no fue escuchada. El síntoma es un mensaje, no un error." },
  { icon: Lock, title: "Autosabotaje y culpa", desc: "Postergar, sentirte insuficiente, miedo al éxito. No es falta de voluntad: es un mecanismo de protección aprendido." },
];

const TECHNIQUES = [
  "Liberación emocional", "Tapping (EFT)", "Hipnosis terapéutica",
  "Respiración consciente", "Biodecodificación emocional", "Reprogramación emocional",
];

const CIRCUITO = [
  "Heridas emocionales", "Niñez", "Linaje", "Parejas",
  "Cuerpo y chakras", "Reprogramación", "Mapa de sueños",
];

const PROGRAMS = [
  {
    icon: Waves, name: "Método E-MOTION®", tag: "Sanación integral · 1 a 1",
    price: "$2.200.000", meta: "9 sesiones · 2 por semana · 2h",
    bullets: ["Identifica y sana tu herida predominante", "Libera memorias de infancia y linaje", "Reprograma creencias a nivel subconsciente", "Tareas entre sesiones + sesión de refuerzo"],
  },
  {
    icon: Brain, name: "Arquitectura Neuropsíquica", tag: "Avanzado · incluye diploma",
    price: "$2.750.000", meta: "15 clases · 70% práctico",
    bullets: ["Reconexión y desintoxicación del sistema nervioso", "Percepción sutil: telepatía y clarividencia", "Sanación a distancia y psicometría", "Rito de maestría e integración"],
  },
];

const ECOSYSTEM = [
  { icon: Sparkles, title: "AURA", desc: "Tu guía de IA neuroemocional, contigo 24/7." },
  { icon: AudioLines, title: "Deep Waves", desc: "Meditaciones, hipnosis y respiraciones." },
  { icon: BookOpenText, title: "Bitácora Interior", desc: "Tu diario emocional y de insights." },
  { icon: Map, title: "Mapa de Visión", desc: "Diseña tu futuro por áreas de vida." },
  { icon: Users, title: "Círculos en Vivo", desc: "Sesiones y comunidad consciente." },
  { icon: CalendarDays, title: "Agenda 1:1", desc: "Reserva tus clases cuando quieras." },
];

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
      <header className="sticky top-0 z-40">
        <div className="glass-strong mx-auto flex max-w-6xl items-center justify-between rounded-b-2xl px-5 py-3">
          <Logo showBrand={false} />
          <nav className="hidden items-center gap-6 text-sm text-muted md:flex">
            <a href="#metodo" className="transition-colors hover:text-foreground">El método</a>
            <a href="#programas" className="transition-colors hover:text-foreground">Programas</a>
            <a href="#ecosistema" className="transition-colors hover:text-foreground">Ecosistema</a>
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
        {/* HERO */}
        <section className="relative mx-auto flex min-h-[88vh] max-w-5xl flex-col items-center justify-center px-6 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-ocean-cyan/30 bg-ocean-cyan/10 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-ocean-cyan">
              Método E-MOTION® · Valeria Rueda Caicedo
            </span>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-foreground sm:text-7xl">
              Donde el océano<br />
              <span className="bg-gradient-to-r from-ocean-glow via-ocean-cyan to-ocean-violet bg-clip-text text-transparent">
                interior despierta
              </span>
            </h1>
          </Reveal>
          <Reveal delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
              Tecnología emocional para la evolución humana. Un proceso profundo de
              sanación integral neuroemocional, corporal y energética.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              {authedHref ? (
                <Link href={authedHref} className={buttonVariants({ size: "lg" })}>
                  Entrar a mi cuenta <ArrowRight className="size-4" />
                </Link>
              ) : (
                <>
                  <Link href="/registro" className={buttonVariants({ size: "lg" })}>
                    Comenzar mi proceso <ArrowRight className="size-4" />
                  </Link>
                  <Link href="/login" className={buttonVariants({ variant: "glass", size: "lg" })}>
                    Ya tengo cuenta
                  </Link>
                </>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.4}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted/80">
              {["Inmersivo", "Consciente", "Profundo", "Transformador"].map((a) => (
                <span key={a} className="flex items-center gap-1.5">
                  <span className="size-1.5 rounded-full bg-ocean-cyan" /> {a}
                </span>
              ))}
            </div>
          </Reveal>
        </section>

        {/* Resto sobre fondo sólido para legibilidad */}
        <div className="relative bg-[#03060e]">
          {/* ¿QUÉ RESUELVE? */}
          <section className="mx-auto max-w-6xl px-6 py-24">
            <Reveal className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-ocean-cyan">¿Qué resuelve?</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                Cuando el cuerpo recuerda<br />lo que la mente intenta olvidar
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted">
                Muchas personas llegan no porque “algo esté mal”, sino porque algo se
                repite. E-MOTION® sana desde la raíz.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2">
              {PROBLEMS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <Reveal key={p.title} delay={i * 0.08}>
                    <div className="glass h-full rounded-2xl p-6">
                      <div className="grid size-11 place-items-center rounded-xl bg-ocean-violet/15 text-ocean-violet">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{p.title}</h3>
                      <p className="mt-2 text-sm text-muted">{p.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>

          {/* EL MÉTODO */}
          <section id="metodo" className="mx-auto max-w-6xl px-6 py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <Reveal>
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-ocean-cyan">El método</p>
                <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                  Una arquitectura terapéutica, no una lista de técnicas
                </h2>
                <p className="mt-4 text-muted">
                  E-MOTION® trabaja el sistema nervioso, la memoria emocional y el
                  cuerpo como registro del subconsciente. Cada fase abre, libera,
                  reorganiza y reprograma, respetando los tiempos del cuerpo.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {TECHNIQUES.map((t) => (
                    <span key={t} className="rounded-full border border-card-border bg-ocean-surface/40 px-3 py-1.5 text-sm text-foreground/80">
                      {t}
                    </span>
                  ))}
                </div>
              </Reveal>
              <Reveal delay={0.15}>
                <div className="glass rounded-2xl p-7">
                  <p className="text-sm font-medium text-ocean-cyan">El Circuito E-MOTION®</p>
                  <ol className="mt-4 space-y-3">
                    {CIRCUITO.map((step, i) => (
                      <li key={step} className="flex items-center gap-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-ocean-cyan/12 text-xs font-semibold text-ocean-cyan">
                          {i + 1}
                        </span>
                        <span className="text-foreground/90">{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </Reveal>
            </div>
          </section>

          {/* PROGRAMAS */}
          <section id="programas" className="mx-auto max-w-6xl px-6 py-24">
            <Reveal className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-ocean-cyan">Programas</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                Elige tu camino de transformación
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-6 lg:grid-cols-2">
              {PROGRAMS.map((p, i) => {
                const Icon = p.icon;
                return (
                  <Reveal key={p.name} delay={i * 0.1}>
                    <div className="glass flex h-full flex-col rounded-2xl p-7">
                      <div className="flex items-center gap-3">
                        <div className="grid size-12 place-items-center rounded-2xl bg-ocean-cyan/12 text-ocean-cyan ring-1 ring-inset ring-ocean-cyan/20">
                          <Icon className="size-6" />
                        </div>
                        <div>
                          <h3 className="font-display text-xl font-semibold text-foreground">{p.name}</h3>
                          <p className="text-sm text-muted">{p.tag}</p>
                        </div>
                      </div>
                      <ul className="mt-6 flex-1 space-y-2.5">
                        {p.bullets.map((b) => (
                          <li key={b} className="flex items-start gap-2 text-sm text-foreground/85">
                            <Check className="mt-0.5 size-4 shrink-0 text-ocean-cyan/70" /> {b}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-6 flex items-end justify-between border-t border-card-border pt-5">
                        <div>
                          <p className="font-display text-2xl font-bold text-foreground">{p.price}</p>
                          <p className="text-xs text-muted">{p.meta}</p>
                        </div>
                        <Link href="/registro" className={buttonVariants({})}>
                          Empezar
                        </Link>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>

          {/* ECOSISTEMA */}
          <section id="ecosistema" className="mx-auto max-w-6xl px-6 py-24">
            <Reveal className="text-center">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-ocean-cyan">El ecosistema</p>
              <h2 className="mt-3 font-display text-3xl font-bold text-foreground sm:text-4xl">
                Un santuario digital, no una academia
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-muted">
                Todo lo que necesitas para tu proceso, en una experiencia inmersiva y
                viva.
              </p>
            </Reveal>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {ECOSYSTEM.map((f, i) => {
                const Icon = f.icon;
                return (
                  <Reveal key={f.title} delay={(i % 3) * 0.08}>
                    <div className="glass h-full rounded-2xl p-6 transition-colors hover:border-ocean-cyan/40">
                      <div className="grid size-11 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
                        <Icon className="size-5" />
                      </div>
                      <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{f.title}</h3>
                      <p className="mt-1 text-sm text-muted">{f.desc}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>

          {/* CREADORA */}
          <section className="mx-auto max-w-4xl px-6 py-24">
            <Reveal className="glass-strong rounded-3xl p-8 text-center sm:p-12">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet text-2xl font-bold text-[var(--ocean-abyss)]">
                V
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold text-foreground">Valeria Rueda Caicedo</h2>
              <p className="mt-1 text-sm text-ocean-cyan">Coach transformacional · Terapeuta en sanación integral</p>
              <p className="mx-auto mt-5 max-w-2xl text-muted">
                “E-MOTION® no es solo un método. Es la síntesis de un camino, una
                escucha profunda y un compromiso real con la sanación auténtica.”
              </p>
            </Reveal>
          </section>

          {/* CTA FINAL */}
          <section className="mx-auto max-w-4xl px-6 pb-24">
            <Reveal className="glass relative overflow-hidden rounded-3xl p-10 text-center sm:p-16">
              <div
                aria-hidden
                className="pointer-events-none absolute left-1/2 top-0 size-96 -translate-x-1/2 -translate-y-1/2 rounded-full blur-[110px]"
                style={{ background: "radial-gradient(circle, rgba(34,211,238,0.3), transparent 70%)" }}
              />
              <div className="relative">
                <h2 className="font-display text-3xl font-bold text-foreground sm:text-5xl">
                  Tu océano interior te espera
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-muted">
                  Comienza tu proceso de transformación profunda hoy.
                </p>
                <Link
                  href={authedHref ?? "/registro"}
                  className={buttonVariants({ size: "lg", className: "mt-8" })}
                >
                  {authedHref ? "Entrar a mi cuenta" : "Comenzar ahora"} <ArrowRight className="size-4" />
                </Link>
              </div>
            </Reveal>
          </section>

          {/* FOOTER */}
          <footer className="border-t border-card-border">
            <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 py-12 text-center sm:flex-row sm:justify-between sm:text-left">
              <div>
                <Logo />
                <p className="mt-3 text-sm text-muted">{site.claim}</p>
              </div>
              <div className="text-sm text-muted">
                <p>valeriaruedacaicedo@gmail.com</p>
                <p className="mt-1">@valeriaruedacaicedo</p>
                <p className="mt-3 text-xs text-muted/60">© {site.brand} · {site.name}</p>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
