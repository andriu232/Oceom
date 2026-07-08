import Link from "next/link";
import { MessageCircle, Pin } from "lucide-react";
import type { CommunityPost } from "@/lib/community/types";
import { isFounder } from "@/lib/community/types";
import { Avatar } from "./avatar";
import { TimeAgo } from "./time-ago";
import { LikeButton } from "./like-button";
import { DeletePostButton, PinButton } from "./post-actions";

export function PostCard({
  post,
  currentUserId,
  isFounderViewer,
  spaceSlug,
  showOpenLink = true,
}: {
  post: CommunityPost;
  currentUserId: string | null;
  isFounderViewer: boolean;
  spaceSlug: string;
  showOpenLink?: boolean;
}) {
  const isMine = currentUserId === post.author_id;
  const canDelete = isMine || isFounderViewer;
  const authorIsFounder = isFounder(post.author.role);

  return (
    <article className="glass mb-4 rounded-2xl p-5">
      <div className="flex items-center gap-3">
        <Avatar
          name={post.author.full_name}
          url={post.author.avatar_url}
          className="size-10 text-sm"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">
            {post.author.full_name ?? "Viajero"}
          </p>
          <p className="text-xs text-muted">
            {authorIsFounder && (
              <span className="text-ocean-cyan">Fundadora · </span>
            )}
            <TimeAgo iso={post.created_at} />
          </p>
        </div>
        {post.is_pinned && (
          <span className="inline-flex items-center gap-1 rounded-full bg-ocean-cyan/12 px-2 py-0.5 text-[0.65rem] font-medium text-ocean-cyan">
            <Pin className="size-3" /> Anclado
          </span>
        )}
        {isFounderViewer && (
          <PinButton postId={post.id} isPinned={post.is_pinned} />
        )}
        {canDelete && <DeletePostButton postId={post.id} />}
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
        {post.body}
      </p>

      {post.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.image_url}
          alt=""
          className="mt-3 w-full rounded-[6px] border border-card-border"
        />
      )}

      <div className="mt-4 flex items-center gap-5">
        <LikeButton
          target="post"
          targetId={post.id}
          initialLiked={post.liked_by_me}
          initialCount={post.likes_count}
        />
        {showOpenLink ? (
          <Link
            href={`/comunidad/${spaceSlug}/${post.id}`}
            className="inline-flex items-center gap-1.5 text-sm text-muted transition-colors hover:text-foreground"
          >
            <MessageCircle className="size-4" /> {post.comments_count}
          </Link>
        ) : (
          <span className="inline-flex items-center gap-1.5 text-sm text-muted">
            <MessageCircle className="size-4" /> {post.comments_count}
          </span>
        )}
      </div>
    </article>
  );
}
