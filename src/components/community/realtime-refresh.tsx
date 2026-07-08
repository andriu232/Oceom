"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/** Suscripción a Supabase Realtime: ante cambios en posts/comentarios/likes,
 *  refresca el RSC (no muta estado local). Si Realtime no está habilitado, no
 *  hace nada — degrada con gracia. */
export function RealtimeRefresh({ spaceId }: { spaceId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    const refresh = () => router.refresh();
    // No encadenar .on().on().subscribe() → falla en React 19 strict mode.
    const channel = supabase.channel(
      `community:${spaceId}:${Math.floor(Date.now() / 1000)}`,
    );
    channel.on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "community_posts",
        filter: `space_id=eq.${spaceId}`,
      },
      refresh,
    );
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "community_comments" },
      refresh,
    );
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "community_likes" },
      refresh,
    );
    channel.subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [spaceId, router]);
  return null;
}
