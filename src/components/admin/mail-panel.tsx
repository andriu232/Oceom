"use client";

import { useActionState, useState } from "react";
import {
  Check,
  ChevronDown,
  Mail,
  Send,
  Users,
  CircleSlash,
} from "lucide-react";
import {
  updateCampaignAction,
  setRecipientsAction,
  sendTestAction,
  resubscribeAction,
  type CorreosState,
} from "@/lib/actions/correos";
import type {
  CampaignRow,
  RecipientRow,
  SendRow,
} from "@/lib/queries/correos";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/* ============================================================
   El centro de correos de Valeria.

   Una tarjeta por campaña. La plantilla no se edita aquí a propósito: el
   texto vive en el código y se revisa antes de salir. Lo que sí decide ella
   es lo que importa a diario — si está encendida, cada cuánto, a qué hora y
   a quién.
   ============================================================ */

const DIAS = [
  { value: 0, label: "domingo" },
  { value: 1, label: "lunes" },
  { value: 2, label: "martes" },
  { value: 3, label: "miércoles" },
  { value: 4, label: "jueves" },
  { value: 5, label: "viernes" },
  { value: 6, label: "sábado" },
];

const HORAS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: `${String(h).padStart(2, "0")}:00`,
}));

const select =
  "w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm";
const option = "bg-[#0b1220]";

function cadenceLabel(c: CampaignRow): string {
  const hora =
    c.hour === null ? "a la hora de cada quien" : `a las ${String(c.hour).padStart(2, "0")}:00`;
  switch (c.cadence) {
    case "diaria":
      return `Todos los días, ${hora}`;
    case "semanal":
      return `Cada ${DIAS.find((d) => d.value === c.weekday)?.label ?? "semana"}, ${hora}`;
    case "quincenal":
      return `Cada dos semanas, ${hora}`;
    default:
      return `Una vez al mes, ${hora}`;
  }
}

function audienceLabel(c: CampaignRow, total: number): string {
  if (c.audience === "elegidos") return `${c.chosen.length} persona(s) elegidas`;
  if (c.audience === "activos") return "Con programa activo";
  return `Todo el grupo (${total})`;
}

function CampaignCard({
  campaign,
  people,
}: {
  campaign: CampaignRow;
  people: RecipientRow[];
}) {
  const [abierta, setAbierta] = useState(false);
  const [cadence, setCadence] = useState(campaign.cadence);
  const [audience, setAudience] = useState(campaign.audience);

  const [saveState, save, saving] = useActionState<CorreosState, FormData>(
    updateCampaignAction,
    undefined,
  );
  const [recState, saveRecipients, savingRec] = useActionState<CorreosState, FormData>(
    setRecipientsAction,
    undefined,
  );
  const [testState, sendTest, testing] = useActionState<CorreosState, FormData>(
    sendTestAction,
    undefined,
  );

  const activos = people.filter((p) => p.mail_opt_in).length;

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-1.5">
          <h3 className="flex items-center gap-2 font-medium">
            <Mail className="size-4 text-oceom-turquoise" />
            {campaign.name}
            {campaign.enabled ? (
              <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] text-success">
                encendida
              </span>
            ) : (
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-muted">
                apagada
              </span>
            )}
          </h3>
          {campaign.description && (
            <p className="max-w-prose text-sm text-muted">{campaign.description}</p>
          )}
          <p className="text-xs text-muted/70">
            {cadenceLabel(campaign)} · {audienceLabel(campaign, activos)} ·{" "}
            {campaign.sent30d} enviados en 30 días
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <form action={sendTest}>
            <input type="hidden" name="slug" value={campaign.slug} />
            <input type="hidden" name="id" value={campaign.id} />
            <Button type="submit" variant="glass" disabled={testing}>
              <Send className="size-4" />
              {testing ? "Enviando…" : "Probar en mi correo"}
            </Button>
          </form>
          <Button
            type="button"
            variant="glass"
            onClick={() => setAbierta((v) => !v)}
            aria-expanded={abierta}
          >
            <ChevronDown
              className={`size-4 transition-transform ${abierta ? "rotate-180" : ""}`}
            />
            {abierta ? "Cerrar" : "Configurar"}
          </Button>
        </div>
      </div>

      {(testState?.info || testState?.error) && (
        <p
          className={`mt-3 text-sm ${testState.error ? "text-danger" : "text-success"}`}
        >
          {testState.error ?? testState.info}
        </p>
      )}

      {abierta && (
        <div className="mt-6 space-y-6 border-t border-white/10 pt-6">
          <form action={save} className="space-y-4">
            <input type="hidden" name="id" value={campaign.id} />

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={campaign.enabled}
                className="mt-1 size-4 accent-oceom-turquoise"
              />
              <span className="text-sm">
                Encendida — el barrido de cada hora la tiene en cuenta.
              </span>
            </label>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-1.5">
                <Label htmlFor={`cad-${campaign.id}`}>Cada cuánto</Label>
                <select
                  id={`cad-${campaign.id}`}
                  name="cadence"
                  value={cadence}
                  onChange={(e) => setCadence(e.target.value)}
                  className={select}
                >
                  <option value="diaria" className={option}>Todos los días</option>
                  <option value="semanal" className={option}>Una vez por semana</option>
                  <option value="quincenal" className={option}>Cada dos semanas</option>
                  <option value="mensual" className={option}>Una vez al mes</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`dia-${campaign.id}`}>Qué día</Label>
                <select
                  id={`dia-${campaign.id}`}
                  name="weekday"
                  defaultValue={campaign.weekday ?? 1}
                  disabled={cadence !== "semanal"}
                  className={`${select} disabled:opacity-40`}
                >
                  {DIAS.map((d) => (
                    <option key={d.value} value={d.value} className={option}>
                      {d.label}
                    </option>
                  ))}
                </select>
                {cadence !== "semanal" && (
                  <p className="text-xs text-muted/70">Solo aplica a la semanal.</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`hora-${campaign.id}`}>A qué hora</Label>
                <select
                  id={`hora-${campaign.id}`}
                  name="hour"
                  defaultValue={campaign.hour ?? ""}
                  className={select}
                >
                  <option value="" className={option}>
                    La que eligió cada persona
                  </option>
                  {HORAS.map((h) => (
                    <option key={h.value} value={h.value} className={option}>
                      {h.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted/70">Siempre hora local de cada quien.</p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`aud-${campaign.id}`}>A quién</Label>
                <select
                  id={`aud-${campaign.id}`}
                  name="audience"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className={select}
                >
                  <option value="todos" className={option}>Todo el grupo</option>
                  <option value="activos" className={option}>Con programa activo</option>
                  <option value="elegidos" className={option}>Solo quienes yo elija</option>
                </select>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Button>
              {saveState?.ok && (
                <span className="inline-flex items-center gap-1 text-sm text-success">
                  <Check className="size-4" /> Guardado
                </span>
              )}
              {saveState?.error && (
                <span className="text-sm text-danger">{saveState.error}</span>
              )}
            </div>
          </form>

          {audience === "elegidos" && (
            <form action={saveRecipients} className="space-y-3">
              <input type="hidden" name="id" value={campaign.id} />
              <h4 className="flex items-center gap-2 text-sm font-medium">
                <Users className="size-4 text-oceom-turquoise" />
                Quiénes reciben esta
              </h4>
              <div className="grid max-h-64 gap-1 overflow-y-auto rounded-xl bg-white/5 p-3 sm:grid-cols-2">
                {people.map((p) => (
                  <label
                    key={p.id}
                    className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                      p.mail_opt_in ? "" : "opacity-40"
                    }`}
                  >
                    <input
                      type="checkbox"
                      name="user"
                      value={p.id}
                      defaultChecked={campaign.chosen.includes(p.id)}
                      disabled={!p.mail_opt_in}
                      className="size-4 accent-oceom-turquoise"
                    />
                    <span className="truncate">{p.full_name ?? p.email}</span>
                    {!p.mail_opt_in && (
                      <span className="text-[11px] text-muted">dada de baja</span>
                    )}
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="submit" variant="glass" disabled={savingRec}>
                  {savingRec ? "Guardando…" : "Guardar la lista"}
                </Button>
                {recState?.info && (
                  <span className="text-sm text-success">{recState.info}</span>
                )}
                {recState?.error && (
                  <span className="text-sm text-danger">{recState.error}</span>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

function Bajas({ people }: { people: RecipientRow[] }) {
  const [state, resubscribe, pending] = useActionState<CorreosState, FormData>(
    resubscribeAction,
    undefined,
  );
  const bajas = people.filter((p) => !p.mail_opt_in);
  if (bajas.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-6">
      <h3 className="flex items-center gap-2 font-medium">
        <CircleSlash className="size-4 text-warning" />
        Se dieron de baja ({bajas.length})
      </h3>
      <p className="mt-1.5 text-sm text-muted">
        No reciben ningún correo. Solo vuelve a activarlas si te lo pidieron: dar de
        baja a alguien y volver a escribirle es la vía rápida a que te marquen como
        spam.
      </p>
      <ul className="mt-4 space-y-2">
        {bajas.map((p) => (
          <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate">{p.full_name ?? p.email}</span>
            <form action={resubscribe}>
              <input type="hidden" name="user" value={p.id} />
              <Button type="submit" variant="glass" size="sm" disabled={pending}>
                Reactivar
              </Button>
            </form>
          </li>
        ))}
      </ul>
      {state?.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}
    </div>
  );
}

function Historial({ sends }: { sends: SendRow[] }) {
  if (sends.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-sm text-muted">
        Todavía no ha salido ningún correo. Cuando salgan, los últimos aparecen aquí.
      </div>
    );
  }
  return (
    <div className="glass overflow-hidden rounded-2xl">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-muted/70">
          <tr>
            <th className="px-5 py-3 font-medium">Cuándo</th>
            <th className="px-5 py-3 font-medium">Campaña</th>
            <th className="px-5 py-3 font-medium">A quién</th>
            <th className="px-5 py-3 font-medium">Asunto</th>
          </tr>
        </thead>
        <tbody>
          {sends.map((s) => (
            <tr key={s.id} className="border-b border-white/5 last:border-0">
              <td className="whitespace-nowrap px-5 py-3 text-muted">
                {new Date(s.sent_at).toLocaleString("es-CO", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </td>
              <td className="px-5 py-3">
                {s.campaign_name ?? "—"}
                {s.is_test && (
                  <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-muted">
                    prueba
                  </span>
                )}
              </td>
              <td className="px-5 py-3">{s.full_name ?? "—"}</td>
              <td className="max-w-[280px] truncate px-5 py-3 text-muted">
                {s.ok ? (
                  s.subject
                ) : (
                  // El motivo viene de Resend tal cual ("domain is not
                  // verified"…): es lo único que explica por qué no llegó.
                  <span className="text-danger" title={s.error ?? undefined}>
                    falló{s.error ? `: ${s.error}` : ""}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function MailAdminPanel({
  campaigns,
  people,
  recent,
}: {
  campaigns: CampaignRow[];
  people: RecipientRow[];
  recent: SendRow[];
}) {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted/70">
          Campañas
        </h2>
        {campaigns.map((c) => (
          <CampaignCard key={c.id} campaign={c} people={people} />
        ))}
      </section>

      <Bajas people={people} />

      <section className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted/70">
          Últimos envíos
        </h2>
        <Historial sends={recent} />
      </section>
    </div>
  );
}
