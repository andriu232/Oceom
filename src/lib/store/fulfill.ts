import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { awardReferralCommissions } from "@/lib/referrals/queries";

/* ============================================================
   Cumplimiento de una orden pagada (compartido por el webhook de Bold y la
   verificación activa). Idempotente: si ya está `fulfilled`, no repite.
   Programa → inscripción; membresía → extiende acceso; siempre dispara la
   comisión de referido.
   ============================================================ */

export interface FulfillableOrder {
  id: string;
  buyer_id: string;
  product_kind: string;
  program_id: string | null;
  membership_days: number | null;
  amount_cop: number;
  reference: string;
  status: string;
  fulfilled: boolean;
}

export async function markOrderPaidAndFulfill(
  order: FulfillableOrder,
  boldPaymentId?: string | null,
): Promise<void> {
  const svc = createServiceClient();

  if (order.status !== "paid") {
    await svc
      .from("store_orders")
      .update({
        status: "paid",
        paid_at: new Date().toISOString(),
        bold_payment_id: boldPaymentId ?? null,
      })
      .eq("id", order.id);
  }

  if (order.fulfilled) return;

  // ── Entrega según el tipo de producto ──
  try {
    if (order.product_kind === "program" && order.program_id) {
      await svc
        .from("enrollments")
        .upsert(
          { student_id: order.buyer_id, program_id: order.program_id, status: "active" },
          { onConflict: "student_id,program_id", ignoreDuplicates: true },
        );
    } else if (order.product_kind === "membership" && order.membership_days) {
      const { data: current } = await svc
        .from("memberships")
        .select("active_until")
        .eq("student_id", order.buyer_id)
        .maybeSingle();
      const base =
        current?.active_until && new Date(current.active_until) > new Date()
          ? new Date(current.active_until)
          : new Date();
      base.setDate(base.getDate() + order.membership_days);
      await svc
        .from("memberships")
        .upsert(
          { student_id: order.buyer_id, active_until: base.toISOString() },
          { onConflict: "student_id" },
        );
    }
    // sesiones / packs: sin entrega automática (la mentora coordina).
  } catch (e) {
    console.error("[fulfill] entrega", e);
  }

  // ── Comisiones de referido ──
  try {
    await awardReferralCommissions({
      sourceUserId: order.buyer_id,
      sourceType: "purchase",
      sourceRef: order.reference,
      sourceAmountCents: order.amount_cop,
    });
  } catch (e) {
    console.error("[fulfill] comisiones", e);
  }

  await svc.from("store_orders").update({ fulfilled: true }).eq("id", order.id);
}
