"use client";

import { useActionState } from "react";
import { Check } from "lucide-react";
import {
  updateProfileAction,
  type ProfileFormState,
} from "@/lib/actions/profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileSettingsForm({
  fullName,
  email,
  avatarUrl,
}: {
  fullName: string;
  email: string;
  avatarUrl: string;
}) {
  const [state, action, pending] = useActionState<ProfileFormState, FormData>(
    updateProfileAction,
    undefined,
  );

  return (
    <form action={action} className="glass space-y-5 rounded-2xl p-6">
      <div className="space-y-1.5">
        <Label htmlFor="full_name">Nombre</Label>
        <Input id="full_name" name="full_name" defaultValue={fullName} required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input id="email" defaultValue={email} disabled />
        <p className="text-xs text-muted">
          El correo no se puede cambiar por ahora.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="avatar_url">Foto de perfil (URL)</Label>
        <Input
          id="avatar_url"
          name="avatar_url"
          type="url"
          defaultValue={avatarUrl}
          placeholder="https://…"
        />
        <p className="text-xs text-muted">
          Pega el enlace de una imagen. Si lo dejas vacío, usamos tus iniciales.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
        {state?.ok && (
          <span className="inline-flex items-center gap-1 text-sm text-success">
            <Check className="size-4" /> Guardado
          </span>
        )}
        {state?.error && <span className="text-sm text-danger">{state.error}</span>}
      </div>
    </form>
  );
}
