"use client";

import { useActionState, useEffect, useRef } from "react";
import { Check } from "lucide-react";
import {
  updatePasswordAction,
  type ProfileFormState,
} from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PasswordSettingsForm() {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    updatePasswordAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state?.ok]);

  return (
    <form ref={formRef} action={action} className="glass space-y-5 rounded-2xl p-6">
      <div className="space-y-1.5">
        <Label htmlFor="password">Nueva contraseña</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirm">Confirmar contraseña</Label>
        <Input
          id="confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          required
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Actualizando…" : "Cambiar contraseña"}
        </Button>
        {state?.ok && (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <Check className="size-4" /> Contraseña actualizada
          </span>
        )}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
