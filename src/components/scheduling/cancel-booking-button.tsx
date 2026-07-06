"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { cancelBookingAction } from "@/lib/actions/scheduling";
import { Button } from "@/components/ui/button";

/** Botón ✕ que abre un modal exigiendo el motivo antes de permitir cancelar. */
export function CancelBookingButton({
  slotId,
  dayLabel,
}: {
  slotId: string;
  dayLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const canSubmit = reason.trim().length >= 3;

  function submit() {
    if (!canSubmit) {
      setError("Escribe el motivo para poder cancelar.");
      return;
    }
    setError(null);
    start(async () => {
      const r = await cancelBookingAction(slotId, reason.trim());
      if (r?.error) setError(r.error);
      else {
        setOpen(false);
        setReason("");
        router.refresh();
      }
    });
  }

  function close() {
    if (pending) return;
    setOpen(false);
    setReason("");
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        title="Cancelar reserva"
        onClick={() => setOpen(true)}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-danger"
      >
        <X className="size-4" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="glass-strong w-full max-w-md rounded-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-foreground">
              Cancelar clase
            </h3>
            <p className="mt-1 text-sm text-muted">
              {dayLabel}. Cuéntanos el motivo para confirmar la cancelación.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="Motivo de la cancelación (obligatorio)"
              className="mt-3 w-full rounded-xl border border-card-border bg-ocean-surface/60 px-4 py-3 text-sm text-foreground outline-none focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]"
            />
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <div className="mt-4 flex gap-2">
              <Button
                variant="danger"
                onClick={submit}
                disabled={pending || !canSubmit}
              >
                {pending ? "Cancelando…" : "Confirmar cancelación"}
              </Button>
              <button
                type="button"
                onClick={close}
                disabled={pending}
                className="rounded-xl px-4 py-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
