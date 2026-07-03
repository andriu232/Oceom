import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  GraduationCap,
  Mail,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { getSubmissionForReview } from "@/lib/queries/assignments";
import { SubmissionReview } from "@/components/admin/submission-review";

export const dynamic = "force-dynamic";
export const metadata = { title: "Revisar entrega · OCEOM" };

export default async function EntregaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireRole("mentor", "super_admin");

  const sub = await getSubmissionForReview(id);
  if (!sub) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/entregas"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ArrowLeft className="size-4" /> Volver a Entregas
      </Link>

      {/* Cabecera */}
      <section className="glass rounded-2xl p-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-ocean-glow to-ocean-violet text-lg font-bold text-[var(--ocean-abyss)]">
            {sub.studentName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-bold text-foreground">
              {sub.studentName}
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
              {sub.studentEmail && (
                <span className="inline-flex items-center gap-1">
                  <Mail className="size-3.5" /> {sub.studentEmail}
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                <GraduationCap className="size-3.5" /> {sub.lessonTitle}
              </span>
            </p>
          </div>
          {sub.status === "reviewed" && (
            <span className="rounded-full bg-success/15 px-3 py-1 text-xs font-medium text-success">
              Revisada
            </span>
          )}
        </div>
      </section>

      {/* La tarea + la entrega */}
      <section className="glass rounded-2xl p-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">Tarea</p>
        <h2 className="mt-1 font-display text-lg font-semibold text-foreground">
          {sub.assignmentTitle}
        </h2>
        {sub.instructions && (
          <p className="mt-1 text-sm text-muted">{sub.instructions}</p>
        )}

        <div className="mt-5 space-y-3 border-t border-card-border pt-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Lo que entregó
          </p>
          {sub.text ? (
            <p className="whitespace-pre-wrap rounded-xl border border-card-border bg-ocean-surface/40 p-4 text-sm leading-relaxed text-foreground/90">
              {sub.text}
            </p>
          ) : (
            !sub.hasFile && (
              <p className="text-sm text-muted">Sin contenido de texto.</p>
            )
          )}
          {sub.hasFile && (
            <a
              href={`/api/submissions/${sub.id}/download`}
              className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-ocean-surface/40 px-4 py-3 text-sm text-foreground transition-colors hover:border-ocean-cyan/40"
            >
              <div className="grid size-9 place-items-center rounded-lg bg-ocean-violet/15 text-ocean-violet">
                <FileText className="size-5" />
              </div>
              <span className="flex-1 font-medium">Descargar archivo entregado</span>
              <Download className="size-4 text-muted" />
            </a>
          )}
        </div>
      </section>

      {/* Feedback */}
      <SubmissionReview
        submissionId={sub.id}
        defaultFeedback={sub.mentorFeedback}
        alreadyReviewed={sub.status === "reviewed"}
      />
    </div>
  );
}
