import {
  Sparkles,
  Brain,
  Heart,
  Gem,
  Activity,
  Check,
  Infinity as InfinityIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mapa de Visión · OCEOM" };

type ColorKey = "violet" | "blue" | "magenta" | "gold" | "turquoise";

const COLOR: Record<ColorKey, { text: string; bg: string; ring: string; bar: string }> = {
  violet: { text: "text-ocean-violet", bg: "bg-ocean-violet/12", ring: "ring-ocean-violet/30", bar: "from-ocean-violet" },
  blue: { text: "text-oceom-blue", bg: "bg-oceom-blue/12", ring: "ring-oceom-blue/30", bar: "from-oceom-blue" },
  magenta: { text: "text-oceom-magenta", bg: "bg-oceom-magenta/12", ring: "ring-oceom-magenta/30", bar: "from-oceom-magenta" },
  gold: { text: "text-oceom-gold", bg: "bg-oceom-gold/12", ring: "ring-oceom-gold/30", bar: "from-oceom-gold" },
  turquoise: { text: "text-oceom-turquoise", bg: "bg-oceom-turquoise/12", ring: "ring-oceom-turquoise/30", bar: "from-oceom-turquoise" },
};

interface Meta {
  label: string;
  icon: LucideIcon;
  color: ColorKey;
  desc: string;
  results: string[];
  outcome: string;
}

const METAS: Meta[] = [
  {
    label: "Meta Espiritual", icon: Sparkles, color: "violet",
    desc: "Reconectar con tu esencia y expandir tu consciencia para vivir desde tu propósito y verdad.",
    results: ["Meditaciones profundas diarias", "Conexión con tu propósito de vida", "Mayor intuición y claridad espiritual", "Sensación de paz y alineación interior"],
    outcome: "Más conexión, sentido y expansión.",
  },
  {
    label: "Meta Mental", icon: Brain, color: "blue",
    desc: "Expandir tu mente, potenciar tu aprendizaje y desarrollar una mentalidad consciente y creativa.",
    results: ["3+ cursos o mentorías completadas", "Mayor enfoque, claridad y productividad", "Nuevos hábitos mentales positivos", "Pensamiento más creativo y estratégico"],
    outcome: "Más conocimiento, enfoque y expansión mental.",
  },
  {
    label: "Meta Emocional", icon: Heart, color: "magenta",
    desc: "Comprender, gestionar y transformar tus emociones para vivir con equilibrio, amor y compasión.",
    results: ["Identificación de patrones emocionales", "Regulación emocional más efectiva", "Relaciones más sanas y conscientes", "Mayor amor propio y aceptación"],
    outcome: "Más equilibrio, amor propio y bienestar emocional.",
  },
  {
    label: "Meta Financiera", icon: Gem, color: "gold",
    desc: "Crear abundancia y libertad financiera alineada a tu propósito, generando valor e impacto consciente.",
    results: ["Claridad en tus metas financieras", "Mejores decisiones con tu dinero", "Nuevas oportunidades de ingreso", "Mentalidad de abundancia y confianza"],
    outcome: "Más estabilidad, crecimiento y abundancia.",
  },
  {
    label: "Meta Física", icon: Activity, color: "turquoise",
    desc: "Fortalecer tu cuerpo, tu energía y tus hábitos para vivir con vitalidad, salud y bienestar integral.",
    results: ["Rutinas de movimiento constantes", "Alimentación más consciente y equilibrada", "Más energía y vitalidad diaria", "Mejores hábitos de sueño y recuperación"],
    outcome: "Más energía, salud y bienestar integral.",
  },
];

export default async function MapaVisionPage() {
  await requireStudentArea();

  return (
    <div className="space-y-10">
      <PageHeader
        title="Mapa de Visión"
        subtitle="Cinco dimensiones que integran tu evolución y transforman tu vida."
      />

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {METAS.map((m) => {
          const c = COLOR[m.color];
          const Icon = m.icon;
          return (
            <div key={m.label} className="glass flex flex-col rounded-2xl p-6">
              <div className={cn("grid size-12 place-items-center rounded-2xl ring-1 ring-inset", c.bg, c.ring, c.text)}>
                <Icon className="size-6" />
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-foreground">{m.label}</h3>
              <p className="mt-2 text-sm text-muted">{m.desc}</p>

              <span className={cn("mt-4 w-fit rounded-full px-3 py-1 text-xs font-medium", c.bg, c.text)}>
                Proyección 3 meses
              </span>

              <ul className="mt-4 flex-1 space-y-2">
                {m.results.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-foreground/85">
                    <Check className={cn("mt-0.5 size-4 shrink-0", c.text)} /> {r}
                  </li>
                ))}
              </ul>

              <div className="mt-5 border-t border-card-border pt-4">
                <p className="text-sm">
                  <span className={cn("font-medium", c.text)}>Resultado:</span>{" "}
                  <span className="text-muted">{m.outcome}</span>
                </p>
              </div>
            </div>
          );
        })}

        {/* Tarjeta de cierre */}
        <div className="glass-strong relative flex flex-col items-center justify-center overflow-hidden rounded-2xl p-6 text-center">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ background: "radial-gradient(circle at 50% 40%, rgba(34,211,238,0.18), transparent 70%)" }}
          />
          <div className="relative">
            <InfinityIcon className="mx-auto size-8 text-ocean-cyan" />
            <p className="mt-4 font-display text-lg font-semibold text-foreground">
              Una vida alineada con tu propósito
            </p>
            <p className="mt-2 text-sm text-muted">
              OCEOM te acompaña en cada paso para que te conviertas en tu mejor versión.
            </p>
            <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-ocean-cyan">
              Explora · Transforma · Evoluciona
            </p>
          </div>
        </div>
      </section>

      <p className="text-center text-sm text-muted/70">
        Pronto podrás definir tu visión, afirmaciones y acciones por cada meta.
      </p>
    </div>
  );
}
