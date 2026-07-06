import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { hasLiveCircle } from "@/lib/queries/circles";

export const dynamic = "force-dynamic";

/**
 * GET /api/circles/live-status → { live: boolean }
 * ¿Hay algún Círculo en Vivo ahora mismo visible para el usuario? Lo consulta el
 * distintivo "en vivo ahora" del menú (polling). RLS decide qué círculos ve.
 */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ live: false });
  const live = await hasLiveCircle();
  return NextResponse.json({ live });
}
