import Link from "next/link";
import { Waves, Brain, Check, ArrowRight, Lock } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listCatalog } from "@/lib/queries/catalog";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Academia · OCEOM" };

export default async function AcademiaPage() {
  const profile = await requireRole("student");
  const programs = await listCatalog(profile.id);

  return (
    <div>
      <PageHeader
        title="Academia"
        subtitle="Todos los programas y rutas del ecosistema OCEOM."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {programs.map((p) => {
          const Icon = p.type === "neuropsychic" ? Brain : Waves;
          return (
            <Card key={p.id} className="flex flex-col">
              <div className="flex items-start gap-4">
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ocean-cyan/12 text-ocean-cyan ring-1 ring-inset ring-ocean-cyan/20">
                  <Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-lg font-semibold text-foreground">
                      {p.title}
                    </h3>
                    {p.enrolled && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-[0.65rem] font-medium text-success">
                        <Check className="size-3" /> Inscrito
                      </span>
                    )}
                  </div>
                  {p.subtitle && (
                    <p className="mt-1 text-sm text-muted">{p.subtitle}</p>
                  )}
                </div>
              </div>

              {p.description && (
                <p className="mt-4 text-sm text-muted">{p.description}</p>
              )}

              {p.benefits.length > 0 && (
                <ul className="mt-4 space-y-1.5">
                  {p.benefits.slice(0, 4).map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check className="mt-0.5 size-4 shrink-0 text-ocean-cyan/70" />
                      {b}
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3 text-xs text-muted">
                <span className="rounded-full bg-white/5 px-2.5 py-1">{p.lessons} experiencias</span>
                {p.level && <span className="rounded-full bg-white/5 px-2.5 py-1">{p.level}</span>}
                {p.duration_label && (
                  <span className="rounded-full bg-white/5 px-2.5 py-1">{p.duration_label}</span>
                )}
              </div>

              <div className="mt-6 border-t border-card-border pt-5">
                {p.enrolled ? (
                  <Link
                    href="/mi-ruta"
                    className="inline-flex items-center gap-2 text-sm font-medium text-ocean-cyan hover:underline"
                  >
                    Ir a mi ruta <ArrowRight className="size-4" />
                  </Link>
                ) : (
                  <p className="inline-flex items-center gap-2 text-sm text-muted">
                    <Lock className="size-4" /> Habla con tu mentora para abrir tu acceso
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
