import "server-only";
import { cookies } from "next/headers";
import { REF_COOKIE } from "@/lib/referrals/ref-cookie";
import { resolveReferrerByCode, ensureReferralRow } from "@/lib/referrals/queries";

/**
 * Asocia (una sola vez) el referido pendiente en la cookie `oceom_ref` al
 * usuario recién registrado. "First-write-wins" e idempotente:
 *  - Crea/asegura la fila `referrals` del usuario con su referrer.
 *  - Si el código no existe, es del propio user, o el user ya tenía referrer,
 *    no hace nada.
 *  - Siempre limpia la cookie para no reintentar.
 *
 * Se llama justo después del signUp (email o Google). Nunca lanza: cualquier
 * fallo se traga en silencio para no romper el alta del usuario.
 */
export async function attachPendingReferral(newUserId: string): Promise<void> {
  try {
    const store = await cookies();
    const code = store.get(REF_COOKIE)?.value?.toLowerCase().trim();
    if (!code) return;

    // Limpiar la cookie pase lo que pase (ya la consumimos).
    store.delete(REF_COOKIE);

    const referrerId = await resolveReferrerByCode(code);
    if (!referrerId || referrerId === newUserId) return;

    // ensureReferralRow respeta un referrer ya existente (no lo pisa) y crea la
    // fila con el referrer si aún no existe.
    await ensureReferralRow(newUserId, referrerId);
  } catch (e) {
    console.error("[attachPendingReferral]", e);
  }
}
