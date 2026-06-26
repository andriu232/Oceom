import { CalendarCheck, Clock, X } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { listOpenSlots, listMyBookings } from "@/lib/queries/scheduling";
import { getActiveEnrollment } from "@/lib/queries/route";
import { cancelBookingAction } from "@/lib/actions/scheduling";
import { groupByDay, formatDayLabel, formatTime } from "@/lib/scheduling/time";
import { PageHeader } from "@/components/shared/page-header";
import { BookingCalendar } from "@/components/scheduling/booking-calendar";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";
export const metadata = { title: "Agendar Clase · OCEOM" };

export default async function AgendarPage() {
  const profile = await requireStudentArea();
  const [open, bookings, enrollment] = await Promise.all([
    listOpenSlots(),
    listMyBookings(profile.id),
    getActiveEnrollment(profile.id),
  ]);

  const days = groupByDay(open, (s) => s.startsAt);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Agendar Clase"
        subtitle="Elige un día y una hora disponibles para tu sesión con Valeria."
      />

      {/* Mis clases agendadas */}
      {bookings.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-foreground">
            <CalendarCheck className="size-5 text-ocean-cyan" /> Mis clases agendadas
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {bookings.map((b) => (
              <Card key={b.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{formatDayLabel(b.startsAt)}</p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-sm text-ocean-cyan">
                    <Clock className="size-3.5" /> {formatTime(b.startsAt)} · {b.durationMinutes} min
                  </p>
                  {b.note && <p className="mt-2 text-xs text-muted">“{b.note}”</p>}
                </div>
                <form action={cancelBookingAction.bind(null, b.id)}>
                  <button
                    title="Cancelar reserva"
                    className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-danger"
                  >
                    <X className="size-4" />
                  </button>
                </form>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Horarios disponibles */}
      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-foreground">
          Horarios disponibles
        </h2>
        <BookingCalendar days={days} programId={enrollment?.programId ?? null} />
      </section>
    </div>
  );
}
