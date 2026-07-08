"use client";

import { useActionState, useState } from "react";
import { Check } from "lucide-react";
import {
  updateProfileAction,
  type ProfileFormState,
} from "@/lib/actions/profile";
import { AvatarUploader } from "@/components/settings/avatar-uploader";
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
  // El avatar se sube aparte (updateAvatarAction). Guardamos su URL en este
  // estado + campo oculto para que al guardar el nombre no se borre.
  const [avatar, setAvatar] = useState(avatarUrl);

  return (
    <form action={action} className="glass space-y-5 rounded-2xl p-6">
      <div className="space-y-2">
        <Label>Foto de perfil</Label>
        <AvatarUploader
          name={fullName}
          initialUrl={avatarUrl}
          onChange={setAvatar}
        />
      </div>
      <input type="hidden" name="avatar_url" value={avatar} />

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
