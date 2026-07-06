import { CalendarCheck, Clock } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { listOpenSlots, listMyBookings } from "@/lib/queries/scheduling";
import { getActiveEnrollment } from "@/lib/queries/route";
import { groupByDay, formatDayLabel, formatTime } from "@/lib/scheduling/time";
import { PageHeader } from "@/components/shared/page-header";
import { BookingCalendar } from "@/components/scheduling/booking-calendar";
import { CancelBookingButton } from "@/components/scheduling/cancel-booking-button";
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
                <CancelBookingButton slotId={b.id} dayLabel={formatDayLabel(b.startsAt)} />
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
