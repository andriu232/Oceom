import { requireRole } from "@/lib/auth";
import { getHermesOverview } from "@/lib/queries/hermes";
import { hermesEnabled } from "@/lib/hermes/config";
import { PageHeader } from "@/components/shared/page-header";
import { HermesAdminPanel } from "@/components/admin/hermes-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Hermes · OCEOM" };

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="font-display text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

export default async function HermesAdminPage() {
  await requireRole("mentor", "super_admin");
  const { students, alerts, stats, migrationPending } = await getHermesOverview();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Hermes"
        subtitle="El mensajero de OCEOM en WhatsApp: recuerda la bitácora y guarda lo que te cuentan."
      />

      {migrationPending && (
        <div className="glass rounded-2xl border border-danger/30 p-5 text-sm">
          <p className="font-medium text-danger">Falta aplicar la migración 0025.</p>
          <p className="mt-1 text-muted">
            Las tablas de Hermes todavía no existen en esta base de datos. Corre
            <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5">supabase/migrations/0025_hermes.sql</code>
            en el SQL Editor de Supabase y recarga esta página.
          </p>
        </div>
      )}

      {!migrationPending && !hermesEnabled() && (
        <div className="glass rounded-2xl border border-warning/30 p-5 text-sm">
          <p className="font-medium text-warning">Hermes aún no está conectado a WhatsApp.</p>
          <p className="mt-1 text-muted">
            Faltan las credenciales de Meta en Vercel. Mientras tanto no se envía ni se
            recibe nada, pero ya puedes ir vinculando los números.
          </p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Números vinculados" value={stats.linked} />
        <Stat label="Verificados por la persona" value={stats.verified} />
        <Stat label="Entradas desde WhatsApp" value={stats.entriesFromWhatsapp} />
        <Stat label="Recordatorios (7 días)" value={stats.remindersLast7d} />
      </div>

      <HermesAdminPanel students={students} alerts={alerts} />
    </div>
  );
}
