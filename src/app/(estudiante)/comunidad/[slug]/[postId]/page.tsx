import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireAuth } from "@/lib/auth";
import { isFounder } from "@/lib/community/types";
import {
  getSpaceBySlug,
  getPostById,
  listPostComments,
  listSpaces,
} from "@/lib/community/queries";
import { SpacesSidebar } from "@/components/community/spaces-sidebar";
import { PostCard } from "@/components/community/post-card";
import { CommentThread } from "@/components/community/comment-thread";

export const dynamic = "force-dynamic";
export const metadata = { title: "Conversación · OCEOM" };

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const profile = await requireAuth();
  const founder = isFounder(profile.role);

  const [space, post, comments, spaces] = await Promise.all([
    getSpaceBySlug(slug),
    getPostById(postId),
    listPostComments(postId),
    listSpaces(),
  ]);
  if (!space || !post) notFound();

  return (
    <div className="space-y-6">
      <Link
        href={`/comunidad/${space.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-ocean-cyan"
      >
        <ChevronLeft className="size-4" /> {space.name}
      </Link>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="hidden lg:block">
          <SpacesSidebar spaces={spaces} currentSlug={space.slug} />
        </div>

        <div>
          <PostCard
            post={post}
            currentUserId={profile.id}
            isFounderViewer={founder}
            spaceSlug={space.slug}
            showOpenLink={false}
          />
          <div className="glass rounded-2xl p-5">
            <h2 className="text-sm font-semibold text-foreground">
              {post.comments_count}{" "}
              {post.comments_count === 1 ? "comentario" : "comentarios"}
            </h2>
            <CommentThread
              postId={post.id}
              comments={comments}
              currentUserId={profile.id}
              isFounderViewer={founder}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
