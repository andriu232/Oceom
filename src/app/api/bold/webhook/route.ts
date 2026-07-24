import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { verifyBoldWebhook, type BoldWebhookEvent } from "@/lib/bold";
import { awardReferralCommissions } from "@/lib/referrals/queries";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/bold/webhook — notificaciones de Bold.
 * Al aprobarse una venta (SALE_APPROVED) marca la orden como pagada, cumple
 * la entrega (inscripción a programa / membresía) y dispara las comisiones de
 * referido. Idempotente y verificado por firma (x-bold-signature).
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-bold-signature");

  if (!verifyBoldWebhook(raw, signature)) {
    return NextResponse.json({ error: "firma inválida" }, { status: 401 });
  }

  let event: BoldWebhookEvent;
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "json inválido" }, { status: 400 });
  }

  const reference = event.data?.metadata?.reference;
  const type = event.type;
  // Siempre 200 para que Bold no reintente eventos que no manejamos.
  if (!reference) return NextResponse.json({ ok: true, skipped: "sin referencia" });

  const svc = createServiceClient();
  const { data: order } = await svc
    .from("store_orders")
    .select("id, buyer_id, product_kind, program_id, membership_days, amount_cop, status, fulfilled, reference")
    .eq("reference", reference)
    .maybeSingle();

  if (!order) return NextResponse.json({ ok: true, skipped: "orden no encontrada" });

  // Venta rechazada / anulada → marcar (sin cumplir).
  if (type === "SALE_REJECTED" || type === "VOID_APPROVED") {
    if (order.status === "pending") {
      await svc.from("store_orders").update({ status: "rejected" }).eq("id", order.id);
    }
    return NextResponse.json({ ok: true });
  }

  if (type !== "SALE_APPROVED") {
    return NextResponse.json({ ok: true, skipped: `tipo ${type}` });
  }

  // Verificación de monto (defensa: el monto notificado debe coincidir).
  const total = event.data?.amount?.total;
  if (typeof total === "number" && total !== order.amount_cop) {
    console.error("[bold webhook] monto no coincide", { reference, total, order: order.amount_cop });
    return NextResponse.json({ ok: true, skipped: "monto no coincide" });
  }

  // Idempotencia: si ya se cumplió, no repetir.
  if (order.fulfilled) return NextResponse.json({ ok: true, already: true });

  await svc
    .from("store_orders")
    .update({
      status: "paid",
      paid_at: new Date().toISOString(),
      bold_payment_id: event.data?.payment_id ?? null,
    })
    .eq("id", order.id);

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
    console.error("[bold webhook] entrega", e);
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
    console.error("[bold webhook] comisiones", e);
  }

  await svc.from("store_orders").update({ fulfilled: true }).eq("id", order.id);
  return NextResponse.json({ ok: true });
}
