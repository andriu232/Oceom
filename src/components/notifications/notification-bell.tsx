"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/notifications/actions";

interface Notif {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
}

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "ahora";
  const m = Math.floor(s / 60);
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ayer" : `hace ${d} días`;
}

/** Campana de notificaciones in-app: contador de no leídas + panel.
 *  Consulta /api/notifications al montar y cada 30 s. */
export function NotificationBell() {
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    try {
      const r = await fetch("/api/notifications", { cache: "no-store" });
      const d = (await r.json()) as { items?: Notif[]; unread?: number };
      setItems(d.items ?? []);
      setUnread(d.unread ?? 0);
    } catch {
      /* silencioso */
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const openItem = (n: Notif) => {
    if (!n.read_at) {
      markNotificationRead(n.id).catch(() => {});
      setItems((prev) =>
        prev.map((x) =>
          x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x,
        ),
      );
      setUnread((u) => Math.max(0, u - 1));
    }
    setOpen(false);
  };

  const markAll = async () => {
    setItems((prev) =>
      prev.map((x) => ({ ...x, read_at: x.read_at ?? new Date().toISOString() })),
    );
    setUnread(0);
    await markAllNotificationsRead().catch(() => {});
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificaciones"
        className="relative grid size-10 place-items-center rounded-xl text-muted transition-colors hover:bg-white/5 hover:text-foreground"
      >
        <Bell className="size-5" />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[17px] place-items-center rounded-full bg-danger px-1 text-[0.6rem] font-bold leading-none text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute left-0 top-12 z-50 w-80 max-w-[85vw] overflow-hidden rounded-2xl border border-card-border bg-ocean-surface/95 shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between border-b border-card-border px-4 py-3">
            <span className="text-sm font-semibold text-foreground">
              Notificaciones
            </span>
            {unread > 0 && (
              <button
                onClick={markAll}
                className="inline-flex items-center gap-1 text-xs text-ocean-cyan hover:underline"
              >
                <Check className="size-3.5" /> Marcar leídas
              </button>
            )}
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted">
                Sin notificaciones por ahora.
              </p>
            ) : (
              items.map((n) => {
                const inner = (
                  <div
                    className={cn(
                      "flex gap-3 px-4 py-3 transition-colors hover:bg-white/5",
                      !n.read_at && "bg-ocean-cyan/5",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 size-2 shrink-0 rounded-full",
                        n.read_at ? "bg-transparent" : "bg-ocean-cyan",
                      )}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {n.title}
                      </p>
                      {n.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted">
                          {n.body}
                        </p>
                      )}
                      <p className="mt-1 text-[0.65rem] text-muted/60">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                  </div>
                );
                return n.link ? (
                  <Link key={n.id} href={n.link} onClick={() => openItem(n)}>
                    {inner}
                  </Link>
                ) : (
                  <button
                    key={n.id}
                    onClick={() => openItem(n)}
                    className="block w-full text-left"
                  >
                    {inner}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
