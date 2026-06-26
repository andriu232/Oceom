import Link from "next/link";
import {
  Users,
  Library,
  ClipboardCheck,
  Activity,
  ArrowRight,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { Card, CardTitle } from "@/components/ui/card";
import { GlowOrb } from "@/components/brand/glow-orb";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel · OCEOM" };

const metrics = [
  { label: "Estudiantes activos", value: "—", icon: Users, href: "/estudiantes" },
  { label: "Programas activos", value: "2", icon: Library, href: "/programas" },
  { label: "Entregas por revisar", value: "—", icon: ClipboardCheck, href: "/entregas" },
  { label: "Progreso promedio", value: "—", icon: Activity, href: "/metricas" },
];

export default async function PanelPage() {
  const profile = await requireRole("mentor", "super_admin");
  const firstName = (profile.full_name ?? "Mentora").split(" ")[0];

  return (
    <div className="space-y-8">
      <section className="glass relative overflow-hidden rounded-2xl p-8">
        <GlowOrb className="absolute -right-16 -top-10 size-64" />
        <div className="relative">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-ocean-cyan">
            Panel de mentoría
          </p>
          <h1 className="mt-3 font-display text-4xl font-bold text-foreground">
            Hola, {firstName}
          </h1>
          <p className="mt-3 max-w-xl text-muted">
            Desde aquí guías el océano interior de cada estudiante: contenido,
            procesos, sesiones y acompañamiento.
          </p>
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Link key={m.label} href={m.href}>
              <Card className="transition hover:border-ocean-cyan/40">
                <div className="flex items-center justify-between">
                  <div className="grid size-10 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
                    <Icon className="size-5" />
                  </div>
                  <ArrowRight className="size-4 text-muted" />
                </div>
                <p className="mt-4 font-display text-3xl font-bold text-foreground">
                  {m.value}
                </p>
                <p className="text-sm text-muted">{m.label}</p>
              </Card>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardTitle>Próximos pasos</CardTitle>
          <ul className="mt-4 space-y-3 text-sm text-muted">
            <li>· Crea y publica las experiencias de cada programa (Sprint 2–3).</li>
            <li>· Inscribe a tus estudiantes y abre sus accesos (Sprint 6).</li>
            <li>· Programa tus Círculos en Vivo (Sprint 7).</li>
            <li>· Alimenta a AURA con tus fuentes autorizadas (Sprint 9).</li>
          </ul>
        </Card>
        <Card>
          <CardTitle>Programas base</CardTitle>
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-card-border bg-ocean-surface/40 p-4">
              <p className="font-medium text-foreground">Método E-MOTION®</p>
              <p className="text-sm text-muted">9 experiencias · 3 fases</p>
            </div>
            <div className="rounded-xl border border-card-border bg-ocean-surface/40 p-4">
              <p className="font-medium text-foreground">Arquitectura Neuropsíquica</p>
              <p className="text-sm text-muted">15 experiencias · 3 etapas</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
