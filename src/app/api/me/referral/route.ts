import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  ensureReferralRow,
  getReferralStats,
  listDirectReferrals,
} from "@/lib/referrals/queries";

export const dynamic = "force-dynamic";

/**
 * GET /api/me/referral
 * Código + KPIs + lista de referidos directos del usuario actual. El frontend
 * arma el link absoluto con location.origin (no hardcodeamos dominio).
 */
export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });

  try {
    const ref = await ensureReferralRow(auth.user.id);
    const [stats, directs] = await Promise.all([
      getReferralStats(auth.user.id),
      listDirectReferrals(auth.user.id),
    ]);
    return NextResponse.json({ ok: true, code: ref.code, stats, directs });
  } catch (e) {
    console.error("[GET /api/me/referral]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
