import Link from "next/link";
import {
  ClipboardCheck,
  ChevronRight,
  Paperclip,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listSubmissionsForReview, type ReviewRow } from "@/lib/queries/assignments";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const dynamic = "force-dynamic";
export const metadata = { title: "Entregas · OCEOM" };

function relative(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`;
  const hours = Math.floor(diff / 3600000);
  if (hours > 0) return `hace ${hours} h`;
  const mins = Math.floor(diff / 60000);
  return mins > 1 ? `hace ${mins} min` : "ahora mismo";
}

export default async function EntregasPage() {
  await requireRole("mentor", "super_admin");
  const { pending, reviewed } = await listSubmissionsForReview();

  if (pending.length === 0 && reviewed.length === 0) {
    return (
      <div>
        <PageHeader
          title="Entregas"
          subtitle="Revisa las integraciones de tus estudiantes y da feedback."
        />
        <EmptyState
          icon={ClipboardCheck}
          title="Aún no hay entregas"
          description="Cuando tus estudiantes entreguen sus tareas, aparecerán aquí para revisarlas."
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Entregas"
        subtitle="Revisa las integraciones de tus estudiantes y da feedback."
        action={
          pending.length > 0 ? (
            <span className="rounded-full bg-ocean-cyan/15 px-4 py-2 text-sm font-medium text-ocean-cyan">
              {pending.length} por revisar
            </span>
          ) : (
            <span className="rounded-full border border-card-border bg-ocean-surface/50 px-4 py-2 text-sm text-muted">
              Todo al día ✓
            </span>
          )
        }
      />

      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <Clock className="size-4 text-ocean-cyan" /> Por revisar
        </h2>
        {pending.length > 0 ? (
          <div className="space-y-2">
            {pending.map((s) => (
              <Row key={s.id} s={s} />
            ))}
          </div>
        ) : (
          <p className="glass rounded-xl p-4 text-sm text-muted">
            No tienes entregas pendientes. ✨
          </p>
        )}
      </section>

      {reviewed.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <CheckCircle2 className="size-4 text-success" /> Revisadas
          </h2>
          <div className="space-y-2 opacity-80">
            {reviewed.map((s) => (
              <Row key={s.id} s={s} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Row({ s }: { s: ReviewRow }) {
  return (
    <Link
      href={`/entregas/${s.id}`}
      className="glass group flex items-center gap-4 rounded-xl p-4 transition-colors hover:border-ocean-cyan/40"
    >
      <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-ocean-cyan/12 text-ocean-cyan">
        <ClipboardCheck className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-foreground">{s.studentName}</p>
          {s.hasFile && <Paperclip className="size-3.5 shrink-0 text-muted" />}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted">
          {s.assignmentTitle}
          {s.lessonTitle && ` · ${s.lessonTitle}`}
          {s.submittedAt && ` · ${relative(s.submittedAt)}`}
        </p>
        {s.textPreview && (
          <p className="mt-1 truncate text-xs text-foreground/70">“{s.textPreview}”</p>
        )}
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted transition-colors group-hover:text-ocean-cyan" />
    </Link>
  );
}
