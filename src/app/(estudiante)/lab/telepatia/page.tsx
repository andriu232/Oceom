import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { TelepatiaGame } from "@/components/lab/telepatia-game";

export const dynamic = "force-dynamic";
export const metadata = { title: "Cartas de Telepatía · OCEOM LAB" };

export default async function Page() {
  await requireStudentArea();
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/lab"
        className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-violet"
      >
        <ArrowLeft className="size-4" /> Volver al LAB
      </Link>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-ocean-violet">
          Mundo 2 · Intuición y Percepción
        </p>
        <h1 className="mt-1 font-display text-2xl font-bold text-foreground">
          Cartas de Telepatía
        </h1>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          No pienses la respuesta: percíbela. Concéntrate en la carta oculta y deja
          que la primera figura que sientas sea tu elección.
        </p>
      </div>

      <div className="glass rounded-3xl p-6 sm:p-8">
        <TelepatiaGame />
      </div>
    </div>
  );
}
