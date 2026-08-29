import { requireAuth } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileSettingsForm } from "@/components/settings/profile-settings-form";
import { PasswordSettingsForm } from "@/components/settings/password-settings-form";
import { HermesSettings } from "@/components/hermes/hermes-settings";
import { hermesEnabled } from "@/lib/hermes/config";

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
          WhatsApp
        </h2>
        <HermesSettings
          enabled={hermesEnabled()}
          phone={profile.phone_e164 ?? null}
          verifiedAt={profile.phone_verified_at ?? null}
          linkedBy={profile.phone_linked_by ?? null}
          optIn={profile.hermes_opt_in ?? false}
          hour={profile.hermes_hour ?? 20}
          cadence={profile.hermes_cadence ?? "diario"}
          tz={profile.hermes_tz ?? "America/Bogota"}
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
