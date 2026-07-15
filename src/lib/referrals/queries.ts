import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

export interface ReferralSettings {
  id: number;
  level_1_pct: number;
  level_2_pct: number;
  level_3_pct: number;
  max_levels: number;
  payout_currency: string;
  min_payout_cents: number;
  auto_approve: boolean;
}

export interface ReferralRow {
  user_id: string;
  referrer_id: string | null;
  code: string;
  signup_at: string;
}

export interface CommissionEvent {
  id: string;
  beneficiary_user_id: string;
  source_user_id: string;
  level: number;
  source_type: string;
  source_ref: string | null;
  source_amount_cents: number;
  commission_amount_cents: number;
  applied_pct: number;
  status: "pending" | "approved" | "paid" | "canceled";
  paid_at: string | null;
  created_at: string;
}

/** Singleton de settings. Si no existe (improbable post-migración) devuelve defaults. */
export async function getReferralSettings(): Promise<ReferralSettings> {
  const admin = createServiceClient();
  const { data } = await admin.from("referral_settings").select("*").eq("id", 1).maybeSingle();
  return (
    (data as ReferralSettings | null) ?? {
      id: 1,
      level_1_pct: 15,
      level_2_pct: 5,
      level_3_pct: 2,
      max_levels: 3,
      payout_currency: "USDT",
      min_payout_cents: 1000,
      auto_approve: false,
    }
  );
}

/**
 * Resuelve o crea el código de referido de un user (idempotente).
 * Si ya existe en `referrals`, devuelve su code. Si no, crea fila con un
 * código auto-generado y opcional referrer_id.
 */
export async function ensureReferralRow(
  userId: string,
  referrerId?: string | null,
): Promise<ReferralRow> {
  const admin = createServiceClient();
  // 1. Buscar existente
  const { data: existing } = await admin
    .from("referrals")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return existing as ReferralRow;

  // 2. Generar code via RPC
  const { data: codeRow } = await admin.rpc("generate_referral_code");
  const code = (codeRow as string) ?? Math.random().toString(36).slice(2, 10);

  // 3. Insertar. Si referrerId === userId lo ignoramos por el CHECK del schema.
  const safeReferrer = referrerId && referrerId !== userId ? referrerId : null;
  const { data: inserted, error } = await admin
    .from("referrals")
    .insert({ user_id: userId, referrer_id: safeReferrer, code })
    .select("*")
    .single();
  if (error) {
    console.error("[ensureReferralRow] insert error", error);
    // Fallback: si el insert falló por race condition, releemos
    const { data: again } = await admin
      .from("referrals")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();
    if (again) return again as ReferralRow;
    throw error;
  }
  return inserted as ReferralRow;
}

/** Lookup por code → user_id (usado al registrar con ?ref=XXX). NULL si no existe. */
export async function resolveReferrerByCode(code: string): Promise<string | null> {
  if (!code || code.length < 4 || code.length > 32) return null;
  const admin = createServiceClient();
  const { data } = await admin
    .from("referrals")
    .select("user_id")
    .eq("code", code.toLowerCase().trim())
    .maybeSingle();
  return (data as { user_id: string } | null)?.user_id ?? null;
}

/** Lista los referidos DIRECTOS de un user (nivel 1) con info básica. */
export async function listDirectReferrals(userId: string): Promise<
  Array<{
    user_id: string;
    full_name: string | null;
    signup_at: string;
    commission_earned_cents: number;
  }>
> {
  const admin = createServiceClient();
  const { data: refs } = await admin
    .from("referrals")
    .select("user_id, signup_at")
    .eq("referrer_id", userId)
    .order("signup_at", { ascending: false });

  const list = (refs ?? []) as Array<{ user_id: string; signup_at: string }>;
  if (list.length === 0) return [];

  const ids = list.map((r) => r.user_id);
  const [profilesR, commissionsR] = await Promise.all([
    admin.from("profiles").select("id, full_name").in("id", ids),
    admin
      .from("commission_events")
      .select("source_user_id, commission_amount_cents, status")
      .eq("beneficiary_user_id", userId)
      .in("source_user_id", ids),
  ]);

  const nameMap = new Map(
    (profilesR.data ?? []).map((p: { id: string; full_name: string | null }) => [
      p.id,
      p.full_name ?? null,
    ]),
  );
  const earnedMap = new Map<string, number>();
  (commissionsR.data ?? []).forEach(
    (c: { source_user_id: string; commission_amount_cents: number | null; status: string }) => {
      if (c.status === "canceled") return;
      earnedMap.set(
        c.source_user_id,
        (earnedMap.get(c.source_user_id) ?? 0) + (c.commission_amount_cents ?? 0),
      );
    },
  );

  return list.map((r) => ({
    user_id: r.user_id,
    full_name: nameMap.get(r.user_id) ?? null,
    signup_at: r.signup_at,
    commission_earned_cents: earnedMap.get(r.user_id) ?? 0,
  }));
}

/** Stats agregadas del user para el panel /referidos. */
export async function getReferralStats(userId: string): Promise<{
  total_invited: number;
  total_earned_cents: number;
  pending_cents: number;
  paid_cents: number;
}> {
  const admin = createServiceClient();
  const [refsR, commR] = await Promise.all([
    admin.from("referrals").select("user_id", { count: "exact", head: true }).eq("referrer_id", userId),
    admin
      .from("commission_events")
      .select("commission_amount_cents, status")
      .eq("beneficiary_user_id", userId),
  ]);
  const total_invited = refsR.count ?? 0;
  let total_earned_cents = 0;
  let pending_cents = 0;
  let paid_cents = 0;
  (commR.data ?? []).forEach((c: { commission_amount_cents: number | null; status: string }) => {
    const amt = c.commission_amount_cents ?? 0;
    if (c.status === "canceled") return;
    total_earned_cents += amt;
    if (c.status === "paid") paid_cents += amt;
    else pending_cents += amt;
  });
  return { total_invited, total_earned_cents, pending_cents, paid_cents };
}

/**
 * Helper para enganchar en el flujo de compra (cuando exista la pasarela).
 * Recibe el user que pagó + monto base y crea commission_events para sus
 * referrers en cascada hasta max_levels. Idempotente vía UNIQUE constraint.
 *
 * Uso:
 *   import { awardReferralCommissions } from '@/lib/referrals/queries'
 *   await awardReferralCommissions({
 *     sourceUserId: user.id,
 *     sourceType: 'subscription',
 *     sourceRef: orderId,
 *     sourceAmountCents: 4900,
 *   })
 */
export async function awardReferralCommissions(opts: {
  sourceUserId: string;
  sourceType: string;
  sourceRef: string;
  sourceAmountCents: number;
}): Promise<{ created: number; events: CommissionEvent[] }> {
  const admin = createServiceClient();
  const settings = await getReferralSettings();
  const pcts = [settings.level_1_pct, settings.level_2_pct, settings.level_3_pct];

  const events: CommissionEvent[] = [];
  let currentUser = opts.sourceUserId;

  for (let lvl = 1; lvl <= settings.max_levels && lvl <= 3; lvl++) {
    const { data: row } = await admin
      .from("referrals")
      .select("referrer_id")
      .eq("user_id", currentUser)
      .maybeSingle();
    const referrer = (row as { referrer_id: string | null } | null)?.referrer_id;
    if (!referrer) break;

    const pct = pcts[lvl - 1] ?? 0;
    if (pct <= 0) {
      currentUser = referrer;
      continue;
    }
    const commission = Math.floor((opts.sourceAmountCents * Number(pct)) / 100);
    if (commission <= 0) {
      currentUser = referrer;
      continue;
    }

    const { data: inserted, error } = await admin
      .from("commission_events")
      .insert({
        beneficiary_user_id: referrer,
        source_user_id: opts.sourceUserId,
        level: lvl,
        source_type: opts.sourceType,
        source_ref: opts.sourceRef,
        source_amount_cents: opts.sourceAmountCents,
        commission_amount_cents: commission,
        applied_pct: pct,
        status: settings.auto_approve ? "approved" : "pending",
      })
      .select("*")
      .single();
    // Ignorar duplicados (23505) — la idempotencia es por unique index
    if (error && error.code !== "23505") {
      console.error("[awardReferralCommissions]", error);
    } else if (inserted) {
      events.push(inserted as CommissionEvent);
    }

    currentUser = referrer;
  }
  return { created: events.length, events };
}
