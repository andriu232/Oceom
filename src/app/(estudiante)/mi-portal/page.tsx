import Link from "next/link";
import {
  Settings,
  Target,
  BookOpenText,
  Sparkles,
  Gift,
  ArrowRight,
  Waves,
  Compass,
  Map as MapIcon,
} from "lucide-react";
import { requireStudentArea, isMentor } from "@/lib/auth";
import { buttonVariants } from "@/components/ui/button";
import { getBitacora } from "@/lib/queries/bitacora";
import { getVisionBoard } from "@/lib/queries/vision";
import { getReferralStats } from "@/lib/referrals/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mi Portal · OCEOM" };

function memberSince(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { month: "long", year: "numeric" });
}

export default async function MiPortalPage() {
  const profile = await requireStudentArea();

  const [bitacora, vision, referrals] = await Promise.all([
    getBitacora(profile.id, 1),
    getVisionBoard(profile.id),
    getReferralStats(profile.id),
  ]);

  const name = profile.full_name ?? "Viajero";
  const initial = name.charAt(0).toUpperCase();
  const roleLabel = isMentor(profile.role) ? "Mentora" : "Estudiante";

  const stats = [
    {
      icon: Target,
      label: "Metas cumplidas",
      value: `${vision.doneGoals}/${vision.totalGoals}`,
      href: "/mapa-vision",
      accent: "text-oceom-turquoise",
      bg: "bg-oceom-turquoise/12",
    },
    {
      icon: BookOpenText,
      label: "Entradas de bitácora",
      value: String(bitacora.stats.total),
      href: "/bitacora",
      accent: "text-oceom-blue",
      bg: "bg-oceom-blue/12",
    },
    {
      icon: Sparkles,
      label: "Insights",
      value: String(bitacora.stats.insights),
      href: "/bitacora",
      accent: "text-oceom-gold",
      bg: "bg-oceom-gold/12",
    },
    {
      icon: Gift,
      label: "Invitados",
      value: String(referrals.total_invited),
      href: "/referidos",
      accent: "text-oceom-magenta",
      bg: "bg-oceom-magenta/12",
    },
  ];

  const links = [
    { icon: Waves, label: "Santuario", desc: "Tu inicio", href: "/santuario" },
    { icon: Compass, label: "Mi Ruta", desc: "Tu camino de evolución", href: "/mi-ruta" },
    { icon: MapIcon, label: "Mapa de Visión", desc: "Tu visión y tus metas", href: "/mapa-vision" },
    { icon: BookOpenText, label: "Bitácora Interior", desc: "Tu escritura y emociones", href: "/bitacora" },
    { icon: Gift, label: "Referidos", desc: "Invita y crece", href: "/referidos" },
    { icon: Settings, label: "Ajustes", desc: "Cuenta y seguridad", href: "/ajustes" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero de perfil */}
      <section className="glass-strong relative overflow-hidden rounded-[26px] p-8 sm:p-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 15% 0%, rgba(34,211,238,0.16), transparent 55%)",
          }}
        />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="relative shrink-0">
            <span className="absolute -inset-0.5 rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet opacity-50 blur-[6px]" />
            {profile.avatar_url ? (
              // Avatar de URL arbitraria pegada por el usuario → <img> plano
              // (next/image exige whitelistear dominios, inviable aquí).
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={name}
                className="relative size-20 rounded-full object-cover"
              />
            ) : (
              <div className="relative grid size-20 place-items-center rounded-full bg-gradient-to-br from-ocean-glow to-ocean-violet text-3xl font-semibold text-[var(--ocean-abyss)]">
                {initial}
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <span className="inline-block rounded-full bg-ocean-cyan/12 px-2.5 py-0.5 text-[0.65rem] font-medium uppercase tracking-wide text-ocean-cyan">
              {roleLabel}
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground">
              {name}
            </h1>
            <p className="mt-1 text-sm text-muted">
              {profile.email}
              {profile.created_at && (
                <> · Miembro desde {memberSince(profile.created_at)}</>
              )}
            </p>
          </div>

          <Link
            href="/ajustes"
            className={cn(buttonVariants({ variant: "glass" }), "shrink-0")}
          >
            <Settings className="size-4" /> Editar perfil
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className="glass group rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className={cn("grid size-10 place-items-center rounded-xl", s.bg, s.accent)}>
                <Icon className="size-5" />
              </div>
              <p className="mt-4 font-display text-3xl font-bold tabular-nums text-foreground">
                {s.value}
              </p>
              <p className="text-sm text-muted">{s.label}</p>
            </Link>
          );
        })}
      </section>

      {/* Accesos */}
      <section className="space-y-3">
        <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
          Explora tu portal
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="glass group flex items-center gap-4 rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-ocean-cyan/10 text-ocean-cyan">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-semibold text-foreground">{l.label}</p>
                  <p className="truncate text-sm text-muted">{l.desc}</p>
                </div>
                <ArrowRight className="size-4 shrink-0 text-muted/50 transition-all group-hover:translate-x-0.5 group-hover:text-ocean-cyan" />
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
