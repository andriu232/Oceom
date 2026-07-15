import Link from "next/link";
import { BookOpenText, Feather, FileText, Download, ArrowRight } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";

export const dynamic = "force-dynamic";
export const metadata = { title: "Biblioteca · OCEOM" };

interface Item {
  id: string;
  title: string;
  description: string | null;
  kind: "texto" | "poema" | "archivo";
  file_name: string | null;
  created_at: string;
}

const KIND_META = {
  texto: { label: "Texto", icon: BookOpenText, chip: "bg-ocean-cyan/12 text-ocean-cyan" },
  poema: { label: "Poema", icon: Feather, chip: "bg-ocean-violet/12 text-ocean-violet" },
  archivo: { label: "Lectura", icon: FileText, chip: "bg-oceom-turquoise/12 text-oceom-turquoise" },
} as const;

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BibliotecaPage() {
  await requireStudentArea();
  const supabase = await createClient();
  const { data } = await supabase
    .from("library_items")
    .select("id,title,description,kind,file_name,created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  const items = (data ?? []) as Item[];

  return (
    <div className="space-y-8">
      <PageHeader
        title="Biblioteca"
        subtitle="Textos, poemas y lecturas elegidas por tu mentora para acompañar tu proceso."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={BookOpenText}
          title="La Biblioteca aún está vacía"
          description="Tu mentora está preparando lecturas para ti. Vuelve pronto."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const meta = KIND_META[it.kind] ?? KIND_META.texto;
            const Icon = meta.icon;
            const inner = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div className="grid size-11 place-items-center rounded-xl bg-ocean-surface/60 text-ocean-cyan ring-1 ring-inset ring-card-border">
                    <Icon className="size-5" />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-wide ${meta.chip}`}
                  >
                    {meta.label}
                  </span>
                </div>
                <h2 className="mt-4 font-display text-lg font-semibold leading-snug text-foreground">
                  {it.title}
                </h2>
                {it.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-muted">{it.description}</p>
                )}
                <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-ocean-cyan">
                  {it.kind === "archivo" ? (
                    <>
                      <Download className="size-3.5" /> Abrir lectura
                    </>
                  ) : (
                    <>
                      Leer <ArrowRight className="size-3.5" />
                    </>
                  )}
                  <span className="ml-auto font-normal text-muted/60">{fmtDate(it.created_at)}</span>
                </p>
              </>
            );
            const cls =
              "glass block h-full rounded-2xl p-5 transition-all hover:-translate-y-0.5 hover:border-ocean-cyan/30 motion-reduce:transition-none";
            return it.kind === "archivo" ? (
              <a key={it.id} href={`/api/biblioteca/${it.id}/download`} className={cls}>
                {inner}
              </a>
            ) : (
              <Link key={it.id} href={`/biblioteca/${it.id}`} className={cls}>
                {inner}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
