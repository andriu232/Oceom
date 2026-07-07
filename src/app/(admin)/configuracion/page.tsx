import type { LucideIcon } from "lucide-react";
import {
  CheckCircle2,
  Clock,
  Database,
  Mail,
  Video,
  CalendarCheck,
  CreditCard,
} from "lucide-react";
import { requireRole } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/env";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PasswordSettingsForm } from "@/components/settings/password-settings-form";
import { site } from "@/config/site";

export const dynamic = "force-dynamic";
export const metadata = { title: "Configuración · OCEOM" };

const ROLE_LABEL: Record<string, string> = {
  super_admin: "Super admin",
  mentor: "Mentora",
  student: "Estudiante",
};

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-semibold text-foreground">
          {title}
        </h2>
        {desc && <p className="text-sm text-muted">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.7rem] font-medium uppercase tracking-wide text-muted/70">
        {label}
      </p>
      <p className="mt-1 truncate text-sm font-medium text-foreground">
        {value}
      </p>
    </div>
  );
}

function IntegrationCard({
  icon: Icon,
  name,
  detail,
  ok,
}: {
  icon: LucideIcon;
  name: string;
  detail: string;
  ok: boolean;
}) {
  return (
    <div className="glass flex items-center gap-3 rounded-2xl p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ocean-cyan/10 text-ocean-cyan">
        <Icon className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{name}</p>
        <p className="truncate text-xs text-muted">{detail}</p>
      </div>
      {ok ? (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/12 px-2.5 py-1 text-xs font-medium text-success">
          <CheckCircle2 className="size-3.5" /> Conectado
        </span>
      ) : (
        <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs font-medium text-muted">
          <Clock className="size-3.5" /> Pendiente
        </span>
      )}
    </div>
  );
}

export default async function ConfiguracionPage() {
  const profile = await requireRole("mentor", "super_admin");

  const integrations: {
    icon: LucideIcon;
    name: string;
    detail: string;
    ok: boolean;
  }[] = [
    {
      icon: Database,
      name: "Base de datos",
      detail: "Supabase · Postgres, Auth y almacenamiento",
      ok: hasSupabaseEnv(),
    },
    {
      icon: Mail,
      name: "Correos",
      detail: "Resend · inscripciones y autenticación",
      ok: !!process.env.RESEND_API_KEY,
    },
    {
      icon: Video,
      name: "Video 1:1",
      detail: "LiveKit · círculos en vivo en HD",
      ok: !!process.env.LIVEKIT_API_KEY && !!process.env.LIVEKIT_API_SECRET,
    },
    {
      icon: CalendarCheck,
      name: "Agenda",
      detail: "Google Calendar · sincronización de clases",
      ok: !!process.env.GOOGLE_SA_CLIENT_EMAIL && !!process.env.GOOGLE_CALENDAR_ID,
    },
    {
      icon: CreditCard,
      name: "Pagos",
      detail: "Bold · checkout y cobros (Colombia)",
      ok: !!process.env.BOLD_API_KEY,
    },
  ];

  const memberSince = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
      })
    : "—";

  return (
    <div className="space-y-8">
      <PageHeader
        title="Configuración"
        subtitle="Tu cuenta, integraciones y preferencias de OCEOM."
      />

      <Section title="Mi perfil" desc="Cómo apareces en la plataforma y en los correos.">
        <ProfileSettingsForm
          fullName={profile.full_name ?? ""}
          email={profile.email ?? ""}
          avatarUrl={profile.avatar_url ?? ""}
        />
      </Section>

      <Section title="Seguridad" desc="Actualiza tu contraseña de acceso.">
        <PasswordSettingsForm />
      </Section>

      <Section title="Cuenta">
        <div className="glass grid gap-4 rounded-2xl p-6 sm:grid-cols-3">
          <Field label="Rol" value={ROLE_LABEL[profile.role] ?? profile.role} />
          <Field label="Correo" value={profile.email ?? "—"} />
          <Field label="Miembro desde" value={memberSince} />
        </div>
      </Section>

      <Section
        title="Integraciones"
        desc="Servicios conectados a tu plataforma."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {integrations.map((i) => (
            <IntegrationCard key={i.name} {...i} />
          ))}
        </div>
      </Section>

      <Section title="Plataforma">
        <div className="glass grid gap-4 rounded-2xl p-6 sm:grid-cols-3">
          <Field label="Nombre" value={`${site.name} · ${site.brand}`} />
          <Field label="Dominio" value="oceom.33vertebras.com" />
          <Field label="Creadora" value={site.creator} />
        </div>
      </Section>
    </div>
  );
}
