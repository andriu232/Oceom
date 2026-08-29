"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, Mail } from "lucide-react";
import {
  updateMailPrefsAction,
  type MailPrefsState,
} from "@/lib/actions/mail-prefs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

/* Los correos de OCEOM, desde el lado de la persona. Hermano de
   HermesSettings, pero sin vinculación: el correo ya lo tenemos desde la
   inscripción. Aquí solo se decide si los quiere y a qué hora; QUÉ correos
   existen lo decide la mentora en /correos-admin. */

const HORAS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: `${String(h).padStart(2, "0")}:00`,
}));

export interface MailSettingsProps {
  email: string;
  optIn: boolean;
  hour: number;
  tz: string;
}

export function MailSettings(props: MailSettingsProps) {
  const [state, save, saving] = useActionState<MailPrefsState, FormData>(
    updateMailPrefsAction,
    undefined,
  );
  const [tz, setTz] = useState(props.tz);

  // La zona horaria del navegador es la fuente de verdad de "las 8 de la
  // noche": si la persona viaja, se corrige sola al entrar a Ajustes.
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // La zona horaria solo existe en el navegador: leerla durante el render
    // rompería la hidratación. Mismo patrón que hermes-settings.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (detected) setTz(detected);
  }, []);

  return (
    <div className="glass space-y-5 rounded-2xl p-6">
      <div className="space-y-1.5">
        <h3 className="flex items-center gap-2 font-medium">
          <Mail className="size-4 text-oceom-turquoise" />
          Correos de OCEOM
        </h3>
        <p className="text-sm text-muted">
          Recordatorios de tu bitácora y algún poema o idea corta, a{" "}
          {props.email || "tu correo"}. El recordatorio no te llega los días en que ya
          escribiste.
        </p>
      </div>

      <form action={save} className="space-y-4">
        <input type="hidden" name="tz" value={tz} />

        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            name="opt_in"
            defaultChecked={props.optIn}
            className="mt-1 size-4 accent-oceom-turquoise"
          />
          <span className="text-sm">
            Quiero recibir los correos de OCEOM.
          </span>
        </label>

        <div className="space-y-1.5 sm:max-w-[220px]">
          <Label htmlFor="mail_hour">A qué hora</Label>
          <select
            id="mail_hour"
            name="hour"
            defaultValue={props.hour}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
          >
            {HORAS.map((h) => (
              <option key={h.value} value={h.value} className="bg-[#0b1220]">
                {h.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-muted/70">Tu hora local ({tz}).</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando…" : "Guardar"}
          </Button>
          {state?.ok && (
            <span className="inline-flex items-center gap-1 text-sm text-success">
              <Check className="size-4" /> Guardado
            </span>
          )}
          {state?.error && <span className="text-sm text-danger">{state.error}</span>}
        </div>
      </form>
    </div>
  );
}
