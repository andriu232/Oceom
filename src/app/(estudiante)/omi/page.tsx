import {
  Heart,
  Brain,
  Sparkles,
  ShieldCheck,
  UserRound,
  Lightbulb,
  Compass,
  Wrench,
  Route,
  BarChart3,
  Users,
  Ear,
  Eye,
  MessageCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { OmiChat } from "@/components/omi/omi-chat";
import { OmiHeroAvatar } from "@/components/omi/omi-hero-avatar";

export const dynamic = "force-dynamic";
export const metadata = { title: "OMI · OCEOM" };

const ATTRIBUTES: { icon: LucideIcon; label: string }[] = [
  { icon: Heart, label: "Empática" },
  { icon: Brain, label: "Inteligente" },
  { icon: Sparkles, label: "Consciente" },
  { icon: ShieldCheck, label: "Discreta y segura" },
  { icon: UserRound, label: "Personalizada" },
  { icon: Lightbulb, label: "Inspiradora" },
];

const SERVICES: { icon: LucideIcon; title: string; desc: string }[] = [
  { icon: Heart, title: "Acompañamiento emocional", desc: "Te escucha y te ayuda a comprender lo que sientes." },
  { icon: Eye, title: "Decodificación de sucesos", desc: "Entiende patrones, causas y mensajes detrás de lo que vives." },
  { icon: Compass, title: "Orientación y guía", desc: "Claridad para tomar decisiones conscientes y alineadas." },
  { icon: Wrench, title: "Herramientas y ejercicios", desc: "Prácticas, meditaciones y recursos para tu transformación." },
  { icon: Route, title: "Rutas personalizadas", desc: "Caminos a tu medida según tus objetivos y emociones." },
  { icon: BarChart3, title: "Seguimiento inteligente", desc: "Monitorea tu progreso y las áreas que necesitan atención." },
  { icon: Users, title: "Conexión humana", desc: "Te conecta con mentorías, comunidad y experiencias." },
];

const FLOW: { icon: LucideIcon; step: string; desc: string }[] = [
  { icon: Ear, step: "Escucha", desc: "Comprende lo que compartes con total atención." },
  { icon: Brain, step: "Analiza", desc: "Identifica patrones, emociones y creencias." },
  { icon: Eye, step: "Decodifica", desc: "Te muestra nuevas perspectivas y significados." },
  { icon: Compass, step: "Propone", desc: "Te brinda herramientas, ejercicios y acciones." },
  { icon: Heart, step: "Acompaña", desc: "Camina contigo y celebra tus avances." },
];

export default async function OmiPage() {
  const profile = await requireStudentArea();
  const firstName = (profile.full_name ?? "Viajero").split(" ")[0];

  return (
    <div className="mx-auto max-w-[960px] space-y-6">
      {/* Identidad de OMI */}
      <section className="glass relative overflow-hidden rounded-2xl p-5 sm:p-6">
        <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
          <OmiHeroAvatar className="w-28 shrink-0 sm:w-36 lg:w-40" />
          <div className="text-center sm:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
              <span className="size-1.5 rounded-full bg-success" /> Online 24/7
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">OMI</h1>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-ocean-cyan">
              Acompañamiento Consciente Inteligente
            </p>
            <p className="mt-3 max-w-xl text-muted">
              “Estoy aquí para escucharte, comprenderte y acompañarte en tu evolución.”
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2 sm:justify-start">
              {ATTRIBUTES.map((a) => {
                const Icon = a.icon;
                return (
                  <span key={a.label} className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-ocean-surface/40 px-3 py-1 text-xs text-foreground/80">
                    <Icon className="size-3 text-ocean-cyan" /> {a.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Chat */}
      <OmiChat firstName={firstName} />

      {/* Cómo te guía OMI */}
      <section>
        <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <MessageCircle className="size-5 text-ocean-cyan" /> Cómo te guía OMI
        </h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {FLOW.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.step} className="glass rounded-2xl p-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-7 place-items-center rounded-full bg-ocean-cyan/12 text-xs font-semibold text-ocean-cyan">
                    {i + 1}
                  </span>
                  <Icon className="size-4 text-ocean-cyan" />
                </div>
                <p className="mt-3 font-medium text-foreground">{f.step}</p>
                <p className="mt-1 text-xs text-muted">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Servicios de OMI */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">Servicios de OMI</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.title} className="glass rounded-2xl p-5">
                <div className="grid size-10 place-items-center rounded-xl bg-ocean-violet/15 text-ocean-violet">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-3 font-medium text-foreground">{s.title}</h3>
                <p className="mt-1 text-sm text-muted">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
