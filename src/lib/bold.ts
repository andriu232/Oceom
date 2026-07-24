import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

/* ============================================================
   Integración con Bold (pasarela de pago, Colombia).
   · Botón de pagos: firma de integridad = SHA256({orderId}{monto}{divisa}{secret}).
   · Webhook: firma x-bold-signature = HMAC-SHA256(secret, base64(body)).hex().
   La LLAVE SECRETA vive solo en el servidor (BOLD_SECRET_KEY).
   ============================================================ */

/** Llave de IDENTIDAD (pública, va en el botón del frontend). */
export function boldApiKey(): string {
  return process.env.BOLD_API_KEY ?? "";
}

function boldSecretKey(): string {
  const k = process.env.BOLD_SECRET_KEY;
  if (!k) throw new Error("BOLD_SECRET_KEY no configurada");
  return k;
}

/** Firma de integridad del botón: SHA256 hex de {orderId}{monto}{divisa}{secret}. */
export function boldIntegritySignature(
  orderId: string,
  amount: number,
  currency: string,
): string {
  const chain = `${orderId}${amount}${currency}${boldSecretKey()}`;
  return createHash("sha256").update(chain, "utf8").digest("hex");
}

/** Verifica la firma del webhook (x-bold-signature). Devuelve true si es de Bold. */
export function verifyBoldWebhook(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;
  let secret: string;
  try {
    secret = process.env.BOLD_WEBHOOK_SECRET || boldSecretKey();
  } catch {
    return false;
  }
  // Bold: hashed = HMAC_SHA256(secret, base64(body)).hexdigest()
  const encoded = Buffer.from(rawBody, "utf8").toString("base64");
  const expected = createHmac("sha256", secret).update(encoded).digest("hex");
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signatureHeader, "utf8");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

/** Consulta ACTIVA del estado de un pago en Bold por referencia (data-order-id).
 *  Devuelve payment_status: APPROVED | REJECTED | FAILED | VOIDED | PENDING |
 *  PROCESSING | NO_TRANSACTION_FOUND, o null si falla la consulta. */
export async function getBoldPaymentStatus(
  reference: string,
): Promise<{ status: string; transactionId?: string } | null> {
  const apiKey = boldApiKey();
  if (!apiKey) return null;
  try {
    const r = await fetch(
      `https://payments.api.bold.co/v2/payment-voucher/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `x-api-key ${apiKey}` }, cache: "no-store" },
    );
    if (!r.ok) return null;
    const j = (await r.json()) as { payment_status?: string; transaction_id?: string };
    if (!j.payment_status) return null;
    return { status: j.payment_status, transactionId: j.transaction_id };
  } catch {
    return null;
  }
}

/** Referencia única para una orden (data-order-id de Bold, ≤ 60 chars). */
export function newOrderReference(slug: string): string {
  const clean = slug.replace(/[^a-zA-Z0-9]/g, "").slice(0, 16) || "prod";
  const rand = Math.random().toString(36).slice(2, 8);
  return `OCEOM-${clean}-${Date.now()}-${rand}`.slice(0, 60);
}

/** Estructura del evento del webhook de Bold que nos interesa. */
export interface BoldWebhookEvent {
  id?: string;
  type?: string; // SALE_APPROVED | SALE_REJECTED | VOID_APPROVED | VOID_REJECTED
  data?: {
    payment_id?: string;
    amount?: { total?: number; currency?: string };
    metadata?: { reference?: string | null };
  };
}
