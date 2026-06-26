import { requireRole } from "@/lib/auth";
import { AuraChat } from "@/components/aura/aura-chat";

export const dynamic = "force-dynamic";
export const metadata = { title: "AURA · OCEOM" };

export default async function AuraPage() {
  const profile = await requireRole("student");
  const firstName = (profile.full_name ?? "Viajero").split(" ")[0];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="flex items-center gap-2 font-display text-3xl font-bold tracking-tight text-foreground">
          AURA
        </h1>
        <p className="mt-1 text-muted">
          Tu guía neuroemocional y energética dentro de OCEOM.
        </p>
      </div>
      <AuraChat firstName={firstName} />
    </div>
  );
}
