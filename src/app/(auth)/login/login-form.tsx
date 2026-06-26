"use client";

import { useActionState } from "react";
import { signInAction, type AuthState } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signInAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" name="email" type="email" placeholder="tu@correo.com" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" placeholder="••••••••" required />
      </div>

      {state?.error && (
        <p className="text-sm text-danger">{state.error}</p>
      )}

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? "Entrando…" : "Entrar al santuario"}
      </Button>
    </form>
  );
}
