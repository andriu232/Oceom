import Link from "next/link";
import { CheckCircle2, Clock, XCircle, ArrowRight } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { getOrderByReference } from "@/lib/queries/store";
import { formatCop } from "@/config/store";
import { VerifyPayment } from "@/components/store/verify-payment";

export const dynamic = "force-dynamic";
export const metadata = { title: "Resultado de tu pago · OCEOM" };

export default async function ResultadoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const profile = await requireStudentArea();
  const sp = await searchParams;
  const reference = typeof sp["bold-order-id"] === "string" ? sp["bold-order-id"] : null;
  const txStatus = typeof sp["bold-tx-status"] === "string" ? sp["bold-tx-status"] : null;

  const order = reference ? await getOrderByReference(profile.id, reference) : null;

  // Estado efectivo: la orden en nuestra BD manda; si aún pendiente usamos el
  // parámetro de Bold como pista mientras llega el webhook.
  const paid = order?.status === "paid";
  const rejected = order?.status === "rejected" || txStatus === "rejected";
  const pending = !paid && !rejected;

  return (
    <div className="mx-auto max-w-lg py-8">
      {pending && reference && <VerifyPayment reference={reference} />}
      <div className="glass rounded-2xl p-8 text-center">
        {paid ? (
          <>
            <CheckCircle2 className="mx-auto size-14 text-success" />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
              ¡Pago confirmado!
            </h1>
            <p className="mt-2 text-sm text-muted">
              {order?.product_kind === "program"
                ? "Ya tienes acceso. Encuéntralo en Mi Ruta."
                : order?.product_kind === "membership"
                  ? "Tu membresía está activa."
                  : "Gracias por tu compra. Valeria se pondrá en contacto para coordinar."}
            </p>
          </>
        ) : rejected ? (
          <>
            <XCircle className="mx-auto size-14 text-danger" />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
              El pago no se completó
            </h1>
            <p className="mt-2 text-sm text-muted">
              No se realizó ningún cobro. Puedes intentarlo de nuevo cuando quieras.
            </p>
          </>
        ) : (
          <>
            <Clock className="mx-auto size-14 animate-pulse text-ocean-cyan" />
            <h1 className="mt-4 font-display text-2xl font-bold text-foreground">
              Estamos confirmando tu pago
            </h1>
            <p className="mt-2 text-sm text-muted">
              Esto suele tardar unos segundos. Esta página se actualiza sola.
            </p>
          </>
        )}

        {order && (
          <div className="mt-6 rounded-xl border border-card-border bg-ocean-surface/40 px-4 py-3 text-left text-sm">
            <div className="flex justify-between">
              <span className="text-muted">{order.product_title}</span>
              <span className="font-medium text-foreground">{formatCop(order.amount_cop)}</span>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Link
            href="/tienda"
            className="inline-flex items-center gap-1.5 rounded-xl border border-card-border px-4 py-2.5 text-sm text-muted transition hover:text-foreground"
          >
            Volver a la Tienda
          </Link>
          {paid && order?.product_kind === "program" && (
            <Link
              href="/mi-ruta"
              className="inline-flex items-center gap-1.5 rounded-xl bg-ocean-cyan px-4 py-2.5 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110"
            >
              Ir a Mi Ruta <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
