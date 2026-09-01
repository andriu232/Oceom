import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { awardReferralCommissions } from "@/lib/referrals/queries";
import { sendOrderPaidEmail } from "@/lib/shop/notify";

/* ============================================================
   Cumplimiento de un pedido pagado.

   Lo llaman dos caminos que pueden llegar a la vez: el webhook de Bold y la
   verificación activa desde la página de resultado. Por eso todo aquí es
   idempotente y la marca `fulfilled` se pone al final: si el proceso se cae
   a la mitad, el siguiente intento vuelve a entrar.

   Entrega, por línea:
   · programa    → inscribe en el santuario
   · membresía   → extiende el acceso (× cantidad)
   · descargable → crea un permiso de descarga con enlace propio
   · físico      → descuenta inventario y queda a la espera de despacho
   ============================================================ */

export interface FulfillableOrder {
  id: string;
  buyer_id: string | null;
  product_kind: string;
  program_id: string | null;
  membership_days: number | null;
  amount_cop: number;
  reference: string;
  status: string;
  fulfilled: boolean;
  email?: string | null;
  buyer_name?: string | null;
}

interface OrderItem {
  id: string;
  product_id: string | null;
  variant_id: string | null;
  title: string;
  kind: string;
  qty: number;
  program_id: string | null;
  membership_days: number | null;
  digital_path: string | null;
  digital_name: string | null;
}

type Svc = ReturnType<typeof createServiceClient>;

/** Asegura que exista una cuenta para quien compró algo que vive dentro del
 *  santuario. Devuelve el id del perfil, o null si no hizo falta (o falló).
 *
 *  Se crea con el correo ya confirmado: la compradora acaba de demostrar que
 *  es suyo pagando con él, y pedirle que confirme un correo antes de darle lo
 *  que compró es la forma más rápida de generar un reclamo. */
async function ensureAccount(
  svc: Svc,
  email: string,
  name: string | null,
): Promise<string | null> {
  const { data: existing } = await svc
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();
  if (existing?.id) return existing.id;

  const { data: created, error } = await svc.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name: name ?? email.split("@")[0] },
  });
  if (error || !created?.user) {
    console.error("[fulfill] no se pudo crear la cuenta", error);
    return null;
  }
  return created.user.id;
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

  const { data: itemRows } = await svc
    .from("store_order_items")
    .select(
      "id, product_id, variant_id, title, kind, qty, program_id, membership_days, digital_path, digital_name",
    )
    .eq("order_id", order.id);

  const items: OrderItem[] = (itemRows ?? []) as OrderItem[];

  // Órdenes anteriores al carrito: no tienen líneas. Se sintetiza una a
  // partir del snapshot para que sigan cumpliéndose igual que antes.
  const lines: OrderItem[] =
    items.length > 0
      ? items
      : [
          {
            id: order.id,
            product_id: null,
            variant_id: null,
            title: "",
            kind: order.product_kind,
            qty: 1,
            program_id: order.program_id,
            membership_days: order.membership_days,
            digital_path: null,
            digital_name: null,
          },
        ];

  // ── ¿Hace falta cuenta? ──
  const needsAccount = lines.some(
    (l) => l.kind === "program" || l.kind === "membership" || !!l.digital_path,
  );
  let buyerId = order.buyer_id;
  if (!buyerId && needsAccount && order.email) {
    buyerId = await ensureAccount(svc, order.email, order.buyer_name ?? null);
    if (buyerId) {
      await svc.from("store_orders").update({ buyer_id: buyerId }).eq("id", order.id);
    }
  }

  // ── Entrega, línea por línea ──
  for (const line of lines) {
    try {
      // Inventario: la función SQL descuenta dentro de la transacción, así
      // dos compras simultáneas del último frasco no lo venden dos veces.
      if (line.product_id) {
        const { data: tomado } = await svc.rpc("store_take_stock", {
          p_product_id: line.product_id,
          p_variant_id: line.variant_id,
          p_qty: line.qty,
        });
        if (tomado === false) {
          // Ya se pagó: no se cancela la venta por esto. Queda anotado para
          // que Valeria lo resuelva con la clienta.
          console.error("[fulfill] sin stock al cumplir", {
            order: order.reference,
            item: line.title,
          });
          await svc
            .from("store_orders")
            .update({ meta: { stock_alert: line.title } })
            .eq("id", order.id);
        }
      }

      if (line.kind === "program" && line.program_id && buyerId) {
        await svc.from("enrollments").upsert(
          { student_id: buyerId, program_id: line.program_id, status: "active" },
          { onConflict: "student_id,program_id", ignoreDuplicates: true },
        );
      } else if (line.kind === "membership" && line.membership_days && buyerId) {
        const { data: current } = await svc
          .from("memberships")
          .select("active_until")
          .eq("student_id", buyerId)
          .maybeSingle();
        const base =
          current?.active_until && new Date(current.active_until) > new Date()
            ? new Date(current.active_until)
            : new Date();
        // Comprar dos meses de una debe dar dos meses.
        base.setDate(base.getDate() + line.membership_days * line.qty);
        await svc
          .from("memberships")
          .upsert(
            { student_id: buyerId, active_until: base.toISOString() },
            { onConflict: "student_id" },
          );
      }

      // Descargable: un permiso por línea, con su propio enlace.
      if (line.digital_path && items.length > 0) {
        const { data: yaExiste } = await svc
          .from("store_downloads")
          .select("id")
          .eq("order_item_id", line.id)
          .maybeSingle();
        if (!yaExiste) {
          await svc.from("store_downloads").insert({
            order_id: order.id,
            order_item_id: line.id,
            path: line.digital_path,
            name: line.digital_name ?? line.title,
            email: order.email ?? null,
          });
        }
      }
    } catch (e) {
      console.error("[fulfill] entrega de línea", line.title, e);
    }
  }

  // ── Comisiones de referido (una sola vez, sobre el total) ──
  if (buyerId) {
    try {
      await awardReferralCommissions({
        sourceUserId: buyerId,
        sourceType: "purchase",
        sourceRef: order.reference,
        sourceAmountCents: order.amount_cop,
      });
    } catch (e) {
      console.error("[fulfill] comisiones", e);
    }
  }

  await svc.from("store_orders").update({ fulfilled: true }).eq("id", order.id);

  // El correo va de último: si Resend falla, el pedido ya quedó cumplido.
  try {
    await sendOrderPaidEmail(order.id);
  } catch (e) {
    console.error("[fulfill] correo de confirmación", e);
  }
}
