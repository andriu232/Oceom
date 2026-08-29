"use client";

import { useActionState, useEffect, useState } from "react";
import { Check, MessageCircle, ShieldCheck, TriangleAlert } from "lucide-react";
import {
  requestPhoneCodeAction,
  confirmPhoneCodeAction,
  updateHermesPrefsAction,
  unlinkPhoneAction,
  type HermesState,
} from "@/lib/actions/hermes";
import { maskPhone } from "@/lib/hermes/phone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/* ============================================================
   Vinculación de WhatsApp con HERMES, desde Ajustes.

   Tres estados posibles:
   - sin número        → formulario para pedir el código
   - código enviado    → campo de 6 dígitos
   - ya vinculado      → preferencias (hora, frecuencia) + desvincular
   ============================================================ */

export interface HermesSettingsProps {
  enabled: boolean;
  phone: string | null;
  verifiedAt: string | null;
  linkedBy: string | null;
  optIn: boolean;
  hour: number;
  cadence: string;
  tz: string;
}

const HORAS = Array.from({ length: 24 }, (_, h) => ({
  value: h,
  label: `${String(h).padStart(2, "0")}:00`,
}));

export function HermesSettings(props: HermesSettingsProps) {
  const [codeSent, setCodeSent] = useState(false);
  const [linked, setLinked] = useState(!!props.phone);

  const [reqState, requestCode, requesting] = useActionState<HermesState, FormData>(
    requestPhoneCodeAction,
    undefined,
  );
  const [confState, confirmCode, confirming] = useActionState<HermesState, FormData>(
    confirmPhoneCodeAction,
    undefined,
  );

  useEffect(() => {
    if (reqState?.sent) setCodeSent(true);
  }, [reqState?.sent]);

  useEffect(() => {
    if (confState?.ok) {
      setCodeSent(false);
      setLinked(true);
    }
  }, [confState?.ok]);

  if (!props.enabled) {
    return (
      <div className="glass rounded-2xl p-6">
        <Header />
        <p className="mt-3 flex items-start gap-2 text-sm text-muted">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
          Hermes todavía no está conectado a WhatsApp. En cuanto lo esté, aquí podrás
          vincular tu número.
        </p>
      </div>
    );
  }

  if (linked) return <LinkedPanel {...props} onUnlink={() => setLinked(false)} />;

  return (
    <div className="glass space-y-5 rounded-2xl p-6">
      <Header />

      {!codeSent ? (
        <form action={requestCode} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Tu WhatsApp</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+57 300 123 4567"
              required
            />
            <p className="text-xs text-muted/70">
              Escríbelo con el indicativo de tu país. Te enviaremos un código por WhatsApp.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={requesting}>
              {requesting ? "Enviando…" : "Enviarme el código"}
            </Button>
            {reqState?.error && (
              <span className="text-sm text-danger">{reqState.error}</span>
            )}
          </div>
        </form>
      ) : (
        <form action={confirmCode} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="code">Código de 6 dígitos</Label>
            <Input
              id="code"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              required
            />
            <p className="text-xs text-muted/70">
              Te lo acabamos de enviar por WhatsApp. Caduca en 10 minutos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={confirming}>
              {confirming ? "Confirmando…" : "Confirmar"}
            </Button>
            <button
              type="button"
              onClick={() => setCodeSent(false)}
              className="text-sm text-muted underline-offset-2 hover:underline"
            >
              Cambiar el número
            </button>
            {confState?.error && (
              <span className="text-sm text-danger">{confState.error}</span>
            )}
          </div>
        </form>
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="space-y-1.5">
      <h3 className="flex items-center gap-2 font-medium">
        <MessageCircle className="size-4 text-oceom-turquoise" />
        Hermes en tu WhatsApp
      </h3>
      <p className="text-sm text-muted">
        Hermes te recuerda escribir en tu Bitácora Interior, y lo que le cuentes por
        WhatsApp queda guardado aquí en OCEOM. Sin abrir la app.
      </p>
    </div>
  );
}

function LinkedPanel(props: HermesSettingsProps & { onUnlink: () => void }) {
  const [state, save, saving] = useActionState<HermesState, FormData>(
    updateHermesPrefsAction,
    undefined,
  );
  const [tz, setTz] = useState(props.tz);

  // La zona horaria del navegador es la fuente de verdad de "las 8 de la noche":
  // si la persona viaja o el perfil quedó con la de otro país, se corrige sola.
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) setTz(detected);
  }, []);

  return (
    <div className="glass space-y-5 rounded-2xl p-6">
      <Header />

      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-white/5 px-4 py-3">
        <ShieldCheck
          className={`size-4 ${props.verifiedAt ? "text-success" : "text-warning"}`}
        />
        <span className="text-sm">{maskPhone(props.phone)}</span>
        {props.verifiedAt ? (
          <span className="text-xs text-success">verificado</span>
        ) : (
          <span className="text-xs text-warning">
            lo vinculó tu mentora · sin verificar
          </span>
        )}
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
            Quiero que Hermes me escriba para recordarme mi bitácora.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hour">A qué hora</Label>
            <select
              id="hour"
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

          <div className="space-y-1.5">
            <Label htmlFor="cadence">Cada cuánto</Label>
            <select
              id="cadence"
              name="cadence"
              defaultValue={props.cadence}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm"
            >
              <option value="diario" className="bg-[#0b1220]">Todos los días</option>
              <option value="semanal" className="bg-[#0b1220]">Una vez por semana</option>
              <option value="nunca" className="bg-[#0b1220]">No me recuerdes</option>
            </select>
          </div>
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

      <form
        action={async () => {
          await unlinkPhoneAction();
          props.onUnlink();
        }}
      >
        <button
          type="submit"
          className="text-sm text-muted underline-offset-2 hover:text-danger hover:underline"
        >
          Desvincular mi WhatsApp
        </button>
      </form>
    </div>
  );
}
