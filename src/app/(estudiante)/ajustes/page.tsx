import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PasswordSettingsForm } from "@/components/settings/password-settings-form";

export const metadata = { title: "Ajustes · OCEOM" };

export default async function AjustesPage() {
  const profile = await requireAuth();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Ajustes"
        subtitle="Administra los datos de tu cuenta y tu acceso."
      />

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted/70">
          Perfil
        </h2>
        <ProfileSettingsForm
          fullName={profile.full_name ?? ""}
          email={profile.email ?? ""}
          avatarUrl={profile.avatar_url ?? ""}
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted/70">
          Seguridad
        </h2>
        <PasswordSettingsForm />
      </section>
    </div>
  );
}
