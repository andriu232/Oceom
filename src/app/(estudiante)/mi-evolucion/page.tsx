import Link from "next/link";
import { TrendingUp, CheckCircle2, BookOpenText, Heart, Compass } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getStudentRoute } from "@/lib/queries/route";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Card } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi Evolución · OCEOM" };

export default async function MiEvolucionPage() {
  const profile = await requireRole("student");
  const supabase = await createClient();

  const [route, checkinsRes, journalRes] = await Promise.all([
    getStudentRoute(profile.id),
    supabase
      .from("emotional_checkins")
      .select("id", { count: "exact", head: true })
      .eq("student_id", profile.id),
    supabase
      .from("journal_entries")
      .select("id", { count: "exact", head: true })
      .eq("student_id", profile.id),
  ]);

  if (!route) {
    return (
      <div>
        <PageHeader title="Mi Evolución" subtitle="El mapa de tu transformación." />
        <EmptyState
          icon={Compass}
          title="Tu evolución comienza con tu primera experiencia"
          description="Cuando tengas un programa activo, aquí verás tu progreso y tu camino."
        >
          <Link href="/academia" className={buttonVariants({})}>
            Explorar programas
          </Link>
        </EmptyState>
      </div>
    );
  }

  const metrics = [
    { label: "Experiencias completadas", value: `${route.completedLessons}/${route.totalLessons}`, icon: CheckCircle2 },
    { label: "Progreso del programa", value: `${route.progressPct}%`, icon: TrendingUp },
    { label: "Check-ins emocionales", value: String(checkinsRes.count ?? 0), icon: Heart },
    { label: "Entradas de bitácora", value: String(journalRes.count ?? 0), icon: BookOpenText },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Mi Evolución"
        subtitle={`Tu camino en ${route.program.title}.`}
      />

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.label}>
              <div className="grid size-10 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
                <Icon className="size-5" />
              </div>
              <p className="mt-4 font-display text-3xl font-bold text-foreground">
                {m.value}
              </p>
              <p className="text-sm text-muted">{m.label}</p>
            </Card>
          );
        })}
      </section>

      {/* Progreso por fase */}
      <section>
        <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
          Progreso por fase
        </h2>
        <div className="space-y-4">
          {route.phases.map((phase, i) => {
            const lessons = phase.modules.flatMap((m) => m.lessons);
            const done = lessons.filter((l) => l.completed).length;
            const pct = lessons.length ? Math.round((done / lessons.length) * 100) : 0;
            return (
              <Card key={phase.id}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">
                    Fase {i + 1} · {phase.title}
                  </span>
                  <span className="text-muted">{done}/{lessons.length}</span>
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-ocean-glow to-ocean-cyan"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
