"use client";

import { useState } from "react";
import { Package, Receipt, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

/* Las tres cosas que se hacen en la tienda, separadas para no mezclarlas:
   cargar producto, despachar pedidos, ajustar tarifas. */

export function ShopTabs({
  productos,
  pedidos,
  envios,
  porDespachar,
}: {
  productos: React.ReactNode;
  pedidos: React.ReactNode;
  envios: React.ReactNode;
  porDespachar: number;
}) {
  // Si hay algo esperando salir, esa es la pestaña que importa al entrar.
  const [tab, setTab] = useState<"productos" | "pedidos" | "envios">(
    porDespachar > 0 ? "pedidos" : "productos",
  );

  const tabs = [
    { key: "productos" as const, label: "Productos", icon: Package },
    { key: "pedidos" as const, label: "Pedidos", icon: Receipt, badge: porDespachar },
    { key: "envios" as const, label: "Envíos", icon: Truck },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 border-b border-card-border/60 pb-3">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-colors",
              tab === t.key
                ? "bg-ocean-cyan/12 text-ocean-cyan"
                : "text-muted hover:text-foreground",
            )}
          >
            <t.icon className="size-4" />
            {t.label}
            {!!t.badge && t.badge > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-oceom-gold text-[0.65rem] font-bold text-[var(--ocean-abyss)]">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "productos" && productos}
      {tab === "pedidos" && pedidos}
      {tab === "envios" && envios}
    </div>
  );
}
