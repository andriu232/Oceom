import { redirect } from "next/navigation";
import { listSpaces } from "@/lib/community/queries";

export const dynamic = "force-dynamic";
export const metadata = { title: "Comunidad · OCEOM" };

export default async function ComunidadHomePage() {
  const spaces = await listSpaces();
  if (spaces.length > 0) redirect(`/comunidad/${spaces[0].slug}`);

  return (
    <div className="glass mx-auto max-w-lg rounded-2xl p-10 text-center">
      <h1 className="font-display text-2xl font-bold text-foreground">
        Comunidad
      </h1>
      <p className="mt-2 text-sm text-muted">
        Aún no hay espacios configurados. Vuelve pronto.
      </p>
    </div>
  );
}
