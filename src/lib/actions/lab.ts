"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { LAB_PLAYABLE, travelerForXp } from "@/config/lab";

/* ============================================================
   OCEOM LAB: registrar una sesión de entrenamiento y otorgar las
   recompensas. El XP se calcula y ACOTA en el servidor a partir de
   métricas simples (nunca se penaliza; siempre se premia el progreso).
   ============================================================ */

export interface LabReward {
  ok?: boolean;
  error?: string;
  xpEarned?: number;
  crystalsEarned?: number;
  pearlsEarned?: number;
  totalXp?: number;
  levelName?: string;
  levelUp?: boolean;
  pct?: number;
  nextLevel?: string | null;
}

const clamp = (v: unknown, min: number, max: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : min;
};

/** Recompensas por juego (server-side, con topes). */
function rewardFor(gameKey: string, metrics: Record<string, unknown>) {
  switch (gameKey) {
    case "observador": {
      const aciertos = clamp(metrics.aciertos, 0, 3);
      return { xp: 20 + aciertos * 15, crystals: aciertos, pearls: aciertos === 3 ? 1 : 0 };
    }
    case "secuencias": {
      const ronda = clamp(metrics.ronda, 1, 12);
      return { xp: 10 + ronda * 10, crystals: Math.max(0, ronda - 2), pearls: ronda >= 7 ? 1 : 0 };
    }
    case "respiracion": {
      const ciclos = clamp(metrics.ciclos, 1, 10);
      return { xp: ciclos * 8, crystals: 1, pearls: 1 };
    }
    case "ola-intuitiva":
      return { xp: 40, crystals: 2, pearls: 0 };
    case "simbologia":
      return { xp: 35, crystals: 2, pearls: 0 };
    case "caja": {
      const coincidencias = clamp(metrics.coincidencias, 0, 3);
      return { xp: 30 + coincidencias * 5, crystals: 1 + coincidencias, pearls: 0 };
    }
    case "punto-fijo": {
      const detectados = clamp(metrics.detectados, 0, 8);
      return { xp: 10 + detectados * 8, crystals: detectados >= 6 ? 2 : 1, pearls: detectados === 8 ? 1 : 0 };
    }
    case "remota": {
      const coincidencias = clamp(metrics.coincidencias, 0, 4);
      return { xp: 30 + coincidencias * 5, crystals: coincidencias, pearls: 0 };
    }
    default:
      return null;
  }
}

export async function completeLabSessionAction(
  gameKey: string,
  metrics: Record<string, unknown>,
): Promise<LabReward> {
  const game = LAB_PLAYABLE[gameKey];
  const reward = game ? rewardFor(gameKey, metrics ?? {}) : null;
  if (!game || !reward) return { error: "Entrenamiento no válido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu sesión expiró. Inicia sesión de nuevo." };

  // Bitácora de la sesión.
  const { error: sesErr } = await supabase.from("lab_sessions").insert({
    user_id: user.id,
    game_key: gameKey,
    world: game.world,
    xp: reward.xp,
    crystals: reward.crystals,
    pearls: reward.pearls,
    metrics,
  });
  if (sesErr) return { error: "No se pudo guardar tu entrenamiento." };

  // Progreso acumulado (upsert manual: leer → sumar → escribir).
  const { data: prev } = await supabase
    .from("lab_progress")
    .select("xp, crystals, pearls, sessions_count")
    .eq("user_id", user.id)
    .maybeSingle();

  const before = prev?.xp ?? 0;
  const totals = {
    xp: before + reward.xp,
    crystals: (prev?.crystals ?? 0) + reward.crystals,
    pearls: (prev?.pearls ?? 0) + reward.pearls,
    sessions_count: (prev?.sessions_count ?? 0) + 1,
    last_session_at: new Date().toISOString(),
  };
  const { error: upErr } = await supabase
    .from("lab_progress")
    .upsert({ user_id: user.id, ...totals }, { onConflict: "user_id" });
  if (upErr) return { error: "No se pudo actualizar tu progreso." };

  const was = travelerForXp(before);
  const now = travelerForXp(totals.xp);

  revalidatePath("/lab");
  return {
    ok: true,
    xpEarned: reward.xp,
    crystalsEarned: reward.crystals,
    pearlsEarned: reward.pearls,
    totalXp: totals.xp,
    levelName: now.level.name,
    levelUp: now.level.n > was.level.n,
    pct: now.pct,
    nextLevel: now.next?.name ?? null,
  };
}
