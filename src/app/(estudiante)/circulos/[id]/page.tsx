import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Users } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { getCircle, circleState } from "@/lib/queries/circles";
import { CircleRoom } from "@/components/circulos/circle-room";
import { formatDayLabel, formatTime } from "@/lib/scheduling/time";

export const dynamic = "force-dynamic";

export default async function CircleRoomPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireStudentArea();

  const circle = await getCircle(id);
  if (!circle) notFound();

  const state = circleState(circle);
  const whenLabel = `${formatDayLabel(circle.starts_at)} · ${formatTime(circle.starts_at)}`;

  return (
    <div className="space-y-6">
      <Link
        href="/circulos"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ArrowLeft className="size-4" /> Volver a Círculos
      </Link>

      <CircleRoom
        id={circle.id}
        state={state}
        meetingUrl={circle.meeting_url}
        recordingUrl={circle.recording_url}
        whenLabel={whenLabel}
      />

      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">{circle.title}</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-muted">
          <Users className="size-4" />
          {circle.programTitle ? `Solo ${circle.programTitle}` : "Abierto a todos"} · {whenLabel}
        </p>
        {circle.description && (
          <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-foreground/90">
            {circle.description}
          </p>
        )}
      </div>
    </div>
  );
}
