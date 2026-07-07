import { Users, Wallet, Clock, CheckCircle2 } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ReferralLinkBox } from "@/components/referrals/referral-link-box";
import {
  ensureReferralRow,
  getReferralStats,
  listDirectReferrals,
  getReferralSettings,
} from "@/lib/referrals/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Referidos · OCEOM" };

const eyebrow = "font-mono text-[10px] uppercase tracking-[0.16em] text-muted";

function fmtUsd(cents: number): string {
  return `$${(cents / 100).toLocaleString("es-CO", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function fmtRel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86400000);
  if (d < 1) return "hoy";
  if (d === 1) return "ayer";
  if (d < 30) return `hace ${d} días`;
  if (d < 365) return `hace ${Math.floor(d / 30)} meses`;
  return `hace ${Math.floor(d / 365)} años`;
}

export default async function ReferidosPage() {
  const profile = await requireAuth();

  const [ref, stats, directs, settings] = await Promise.all([
    ensureReferralRow(profile.id),
    getReferralStats(profile.id),
    listDirectReferrals(profile.id),
    getReferralSettings(),
  ]);

  const eligibleForPayout = stats.pending_cents >= settings.min_payout_cents;

  const kpis = [
    {
      icon: Users,
      label: "Invitados",
      value: String(stats.total_invited),
      hint: "Directos (nivel 1)",
    },
    {
      icon: Wallet,
      label: "Total ganado",
      value: fmtUsd(stats.total_earned_cents),
      hint: "Histórico",
    },
    {
      icon: Clock,
      label: "Pendiente",
      value: fmtUsd(stats.pending_cents),
      hint: eligibleForPayout
        ? "Listo para retirar"
        : `Mín. ${fmtUsd(settings.min_payout_cents)} para retirar`,
      highlight: eligibleForPayout,
    },
    {
      icon: CheckCircle2,
      label: "Pagado",
      value: fmtUsd(stats.paid_cents),
      hint: "Ya transferido",
    },
  ];

  const levels = [
    { lvl: 1, pct: settings.level_1_pct, label: "Tus invitados directos" },
    { lvl: 2, pct: settings.level_2_pct, label: "Invitados de tus invitados" },
    { lvl: 3, pct: settings.level_3_pct, label: "Nivel 3 (tercer nivel)" },
  ].slice(0, settings.max_levels);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Invita y crece"
        subtitle={`Comparte OCEOM y gana ${settings.level_1_pct}% de cada membresía que se active con tu enlace. Tus invitados también suman a tu red.`}
      />

      {/* Enlace de referido (client component para copiar/compartir) */}
      <ReferralLinkBox code={ref.code} />

      {/* KPIs reales */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="glass rounded-2xl p-5">
              <div className="flex items-center gap-2">
                <Icon className="size-4 shrink-0 text-muted" strokeWidth={2} />
                <p className={eyebrow}>{k.label}</p>
              </div>
              <p
                className={`mt-2.5 font-display text-3xl font-bold tracking-tight tabular-nums ${
                  k.highlight ? "text-ocean-cyan" : "text-foreground"
                }`}
              >
                {k.value}
              </p>
              <p className="mt-1.5 text-xs text-muted">{k.hint}</p>
            </div>
          );
        })}
      </section>

      {/* Cómo funcionan los % */}
      <section className="glass rounded-2xl p-5">
        <p className={eyebrow}>Cómo funciona</p>
        <div className="mt-3 grid grid-cols-3 gap-4">
          {levels.map((row) => (
            <div key={row.lvl} className="flex flex-col">
              <span className="font-mono text-[10.5px] uppercase tracking-[.14em] text-muted">
                Nivel {row.lvl}
              </span>
              <span className="mt-1 text-2xl font-bold text-ocean-cyan tabular-nums">
                {row.pct}%
              </span>
              <span className="mt-1 text-xs leading-snug text-muted">{row.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Lista de referidos directos */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
          Tus invitados
        </h2>
        {directs.length === 0 ? (
          <div className="glass rounded-2xl border-dashed px-8 py-12 text-center text-sm text-muted">
            Aún no tienes invitados. Comparte tu enlace arriba — cada persona que se registre
            con él queda asociada a tu red.
          </div>
        ) : (
          <div className="glass overflow-hidden rounded-2xl p-0">
            {directs.map((d, i) => (
              <div
                key={d.user_id}
                className={`flex items-center gap-3 px-5 py-3.5 ${
                  i > 0 ? "border-t border-card-border" : ""
                }`}
              >
                <div className="grid size-9 shrink-0 place-items-center rounded-full bg-ocean-cyan/15 text-sm font-semibold text-ocean-cyan">
                  {(d.full_name?.[0] ?? "?").toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {d.full_name ?? <em className="text-muted">Sin nombre</em>}
                  </p>
                  <p className="text-xs text-muted">Se unió {fmtRel(d.signup_at)}</p>
                </div>
                <span className="shrink-0 font-mono text-xs tabular-nums text-ocean-cyan">
                  {d.commission_earned_cents > 0 ? (
                    `+ ${fmtUsd(d.commission_earned_cents)}`
                  ) : (
                    <span className="text-muted">Sin compras aún</span>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
