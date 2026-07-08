import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { isFounder } from "@/lib/community/types";
import {
  listSpaces,
  getSpaceBySlug,
  listSpacePosts,
  getWeeklyRanking,
} from "@/lib/community/queries";
import { PageHeader } from "@/components/shared/page-header";
import { SpacesSidebar } from "@/components/community/spaces-sidebar";
import { PostComposer } from "@/components/community/post-composer";
import { PostCard } from "@/components/community/post-card";
import { RealtimeRefresh } from "@/components/community/realtime-refresh";
import { Avatar } from "@/components/community/avatar";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const space = await getSpaceBySlug(slug);
  return { title: `${space?.name ?? "Comunidad"} · OCEOM` };
}

export default async function SpaceFeedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const profile = await requireAuth();
  const founder = isFounder(profile.role);

  const [space, spaces, ranking] = await Promise.all([
    getSpaceBySlug(slug),
    listSpaces(),
    getWeeklyRanking(8),
  ]);
  if (!space) notFound();
  const posts = await listSpacePosts(space.id);

  return (
    <div className="space-y-6">
      <RealtimeRefresh spaceId={space.id} />
      <PageHeader
        title={space.name}
        subtitle={space.description ?? "Conversación de la comunidad."}
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr_260px]">
        <SpacesSidebar spaces={spaces} currentSlug={space.slug} />

        <div>
          <PostComposer
            spaceId={space.id}
            authorName={profile.full_name}
            authorAvatar={profile.avatar_url}
            placeholder={`Comparte algo en ${space.name}…`}
          />
          {posts.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-sm font-medium text-foreground">
                Sin actividad aún
              </p>
              <p className="mt-1 text-sm text-muted">
                Sé la primera persona en escribir en este espacio.
              </p>
            </div>
          ) : (
            posts.map((p) => (
              <PostCard
                key={p.id}
                post={p}
                currentUserId={profile.id}
                isFounderViewer={founder}
                spaceSlug={space.slug}
              />
            ))
          )}
        </div>

        <aside className="hidden flex-col gap-4 lg:flex">
          <div className="glass rounded-2xl p-5">
            <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
              <Trophy className="size-4 text-ocean-cyan" /> Ranking semanal
            </h3>
            {ranking.length === 0 ? (
              <p className="mt-3 text-xs text-muted">
                Aún sin actividad esta semana.
              </p>
            ) : (
              <ol className="mt-4 space-y-3">
                {ranking.map((r, i) => (
                  <li key={r.user_id} className="flex items-center gap-3">
                    <span className="w-4 text-xs font-semibold text-muted">
                      {i + 1}
                    </span>
                    <Avatar
                      name={r.full_name}
                      url={r.avatar_url}
                      className="size-7 text-[0.65rem]"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm text-foreground/90">
                      {r.full_name ?? "Viajero"}
                    </span>
                    <span className="text-xs font-medium text-ocean-cyan">
                      {r.points}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-4 text-[0.65rem] leading-relaxed text-muted/60">
              +5 por post · +2 por comentario · +1 por like recibido
            </p>
          </div>

          <div className="glass rounded-2xl p-5">
            <h3 className="font-display text-sm font-semibold text-foreground">
              El pacto de la comunidad
            </h3>
            <ul className="mt-3 space-y-2 text-xs leading-relaxed text-muted">
              <li>· Habla desde tu experiencia, sin juzgar la de otros.</li>
              <li>· Lo que se comparte aquí, se queda aquí.</li>
              <li>· Cero autopromoción ni spam.</li>
              <li>· Sostén a los demás como te gustaría ser sostenido.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
