import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import {
  listNotifications,
  unreadNotificationsCount,
} from "@/lib/notifications/queries";

export const dynamic = "force-dynamic";

/** GET /api/notifications → { items, unread } — lo consulta la campana. */
export async function GET() {
  const user = await getUser();
  if (!user) return NextResponse.json({ items: [], unread: 0 });
  const [items, unread] = await Promise.all([
    listNotifications(20),
    unreadNotificationsCount(),
  ]);
  return NextResponse.json({ items, unread });
}
