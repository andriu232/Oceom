import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Feather, BookOpenText, Download } from "lucide-react";
import { requireStudentArea } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Lectura · OCEOM" };

/** Página de lectura de un texto/poema de la Biblioteca. Los archivos van
 *  directo a la descarga firmada, así que aquí solo llegan texto y poema. */
export default async function LecturaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireStudentArea();
  const supabase = await createClient();
  const { data: item } = await supabase
    .from("library_items")
    .select("id,title,description,kind,content,file_name,created_at")
    .eq("id", id)
    .maybeSingle();

  if (!item) notFound();
  if (item.kind === "archivo") {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <BackLink />
        <div className="glass rounded-2xl p-10 text-center">
          <p className="font-display text-xl font-semibold text-foreground">{item.title}</p>
          <a
            href={`/api/biblioteca/${item.id}/download`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-ocean-cyan px-5 py-2.5 text-sm font-semibold text-[var(--ocean-abyss)] transition hover:brightness-110"
          >
            <Download className="size-4" /> Abrir {item.file_name ?? "archivo"}
          </a>
        </div>
      </div>
    );
  }

  const isPoem = item.kind === "poema";
  const Icon = isPoem ? Feather : BookOpenText;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <BackLink />

      <article className="glass rounded-2xl p-7 sm:p-10">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
              isPoem ? "bg-ocean-violet/12 text-ocean-violet" : "bg-ocean-cyan/12 text-ocean-cyan"
            }`}
          >
            <Icon className="size-3.5" /> {isPoem ? "Poema" : "Texto"}
          </span>
          <span className="text-xs text-muted/70">
            {new Date(item.created_at).toLocaleDateString("es-CO", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        <h1 className="mt-5 font-display text-3xl font-bold leading-tight text-foreground">
          {item.title}
        </h1>
        {item.description && (
          <p className="mt-2 text-sm italic text-muted">{item.description}</p>
        )}

        <div
          className={`mt-8 whitespace-pre-wrap leading-relaxed text-foreground/90 ${
            isPoem ? "text-center font-display text-lg leading-loose" : "text-[1.02rem]"
          }`}
        >
          {item.content}
        </div>
      </article>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/biblioteca"
      className="inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-ocean-cyan"
    >
      <ArrowLeft className="size-4" /> Biblioteca
    </Link>
  );
}
