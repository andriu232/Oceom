import { CalendarDays, Trash2, User } from "lucide-react";
import { requireRole } from "@/lib/auth";
import { listMentorSlots } from "@/lib/queries/scheduling";
import { deleteSlotAction } from "@/lib/actions/scheduling";
import { groupByDay, formatTime, todayInBogota } from "@/lib/scheduling/time";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { SlotScheduler } from "@/components/admin/slot-scheduler";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agenda · OCEOM" };

export default async function AgendaPage() {
  await requireRole("mentor", "super_admin");
  const slots = await listMentorSlots();
  const today = todayInBogota();
  const days = groupByDay(slots, (s) => s.startsAt);

  const booked = slots.filter((s) => s.status === "booked").length;
  const open = slots.filter((s) => s.status === "available").length;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agenda"
        subtitle="Abre tu disponibilidad y revisa las clases que tus estudiantes reservan."
        action={
          <div className="flex gap-2 text-sm">
            <span className="rounded-full bg-success/15 px-3 py-1 text-success">{booked} reservadas</span>
            <span className="rounded-full bg-ocean-cyan/12 px-3 py-1 text-ocean-cyan">{open} libres</span>
          </div>
        }
      />

      <SlotScheduler today={today} />

      {days.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          title="Aún no has abierto disponibilidad"
          description="Añade fechas y horas arriba. Tus estudiantes verán esos espacios para agendar su clase."
        />
      ) : (
        <div className="space-y-5">
          {days.map((day) => (
            <div key={day.key} className="glass rounded-2xl p-5">
              <h3 className="font-display text-base font-semibold text-foreground">
                {day.label}
              </h3>
              <ul className="mt-3 space-y-2">
                {day.items.map((slot) => (
                  <li
                    key={slot.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-card-border bg-ocean-surface/30 px-4 py-3"
                  >
                    <span className="font-medium text-foreground">
                      {formatTime(slot.startsAt)}
                    </span>
                    <span className="text-xs text-muted">{slot.durationMinutes} min</span>

                    {slot.status === "booked" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2.5 py-0.5 text-xs text-success">
                        <User className="size-3" /> {slot.studentName}
                      </span>
                    ) : (
                      <span className="rounded-full bg-ocean-cyan/12 px-2.5 py-0.5 text-xs text-ocean-cyan">
                        Disponible
                      </span>
                    )}

                    {slot.note && (
                      <span className="w-full text-xs text-muted sm:w-auto sm:flex-1 sm:truncate">
                        “{slot.note}”
                      </span>
                    )}

                    <form action={deleteSlotAction.bind(null, slot.id)} className="ml-auto">
                      <button
                        title="Eliminar"
                        className="grid size-8 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-danger"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
