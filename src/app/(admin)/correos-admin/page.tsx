import { requireRole } from "@/lib/auth";
import { getCorreosOverview } from "@/lib/queries/correos";
import type { ResendHealth } from "@/lib/email/health";
import { PageHeader } from "@/components/shared/page-header";
import { MailAdminPanel } from "@/components/admin/mail-panel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Correos · OCEOM" };

/* El diagnóstico de Resend. Cuando un correo no llega, la causa casi nunca
   está en el código: es la key, el dominio del remitente, o que se está
   saliendo por el dominio de pruebas — que solo entrega al dueño de la
   cuenta. Mejor decirlo aquí que dejar que Valeria lo descubra por el
   silencio de su grupo. */
function ResendEstado({ salud }: { salud: ResendHealth }) {
  if (!salud.keyPresent) {
    return (
      <div className="glass rounded-2xl border border-warning/30 p-5 text-sm">
        <p className="font-medium text-warning">No hay conexión con Resend.</p>
        <p className="mt-1 text-muted">
          Falta <code className="rounded bg-white/10 px-1.5 py-0.5">RESEND_API_KEY</code> en
          este entorno. Puedes configurarlo todo, pero no saldrá ningún correo.
        </p>
      </div>
    );
  }

  if (salud.usingTestDomain) {
    return (
      <div className="glass rounded-2xl border border-danger/30 p-5 text-sm">
        <p className="font-medium text-danger">
          Los correos saldrían por el dominio de pruebas de Resend.
        </p>
        <p className="mt-1 text-muted">
          Falta <code className="rounded bg-white/10 px-1.5 py-0.5">EMAIL_FROM</code>, así
          que el remitente sería <code className="rounded bg-white/10 px-1.5 py-0.5">
          onboarding@resend.dev</code>. Ese dominio <strong>solo entrega al dueño de la
          cuenta de Resend</strong>: los envíos dirían que salieron bien y nadie más los
          recibiría.
        </p>
      </div>
    );
  }

  if (salud.domains && !salud.fromVerified) {
    return (
      <div className="glass rounded-2xl border border-danger/30 p-5 text-sm">
        <p className="font-medium text-danger">
          El dominio del remitente no está verificado.
        </p>
        <p className="mt-1 text-muted">
          Se enviaría desde <strong>{salud.from}</strong>, pero{" "}
          <code className="rounded bg-white/10 px-1.5 py-0.5">{salud.fromDomain}</code> no
          aparece verificado en Resend
          {salud.domains.length > 0 && (
            <> (verificados: {salud.domains.map((d) => d.name).join(", ")})</>
          )}
          . Resend rechazará los envíos.
        </p>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl border border-success/30 p-5 text-sm">
      <p className="font-medium text-success">Resend conectado.</p>
      <p className="mt-1 text-muted">
        Los correos salen como <strong>{salud.from}</strong>
        {salud.fromVerified && " · dominio verificado"}
        {salud.error && ` · ${salud.error}`}
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="font-display text-3xl font-bold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-muted">{label}</p>
    </div>
  );
}

export default async function CorreosAdminPage() {
  await requireRole("mentor", "super_admin");
  const { campaigns, people, recent, stats, migrationPending, resend } =
    await getCorreosOverview();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Correos"
        subtitle="Qué se le manda a quién, cada cuánto y a qué hora. Todo sale a la hora local de cada persona."
      />

      {migrationPending && (
        <div className="glass rounded-2xl border border-danger/30 p-5 text-sm">
          <p className="font-medium text-danger">Falta aplicar la migración 0029.</p>
          <p className="mt-1 text-muted">
            Las tablas de correos todavía no existen en esta base de datos. Corre
            <code className="mx-1 rounded bg-white/10 px-1.5 py-0.5">
              supabase/migrations/0029_correos.sql
            </code>
            en el SQL Editor de Supabase y recarga esta página.
          </p>
        </div>
      )}

      <ResendEstado salud={resend} />

      {!migrationPending && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Campañas encendidas" value={stats.activas} />
            <Stat label="Personas que reciben" value={stats.personas} />
            <Stat label="Dadas de baja" value={stats.bajas} />
            <Stat label="Enviados (30 días)" value={stats.enviados30d} />
          </div>

          <MailAdminPanel campaigns={campaigns} people={people} recent={recent} />
        </>
      )}
    </div>
  );
}
