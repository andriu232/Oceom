"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CornerDownRight, Trash2 } from "lucide-react";
import type { CommunityComment } from "@/lib/community/types";
import { isFounder } from "@/lib/community/types";
import { createComment, deleteComment } from "@/lib/community/actions";
import { buttonVariants } from "@/components/ui/button";
import { LikeButton } from "./like-button";
import { TimeAgo } from "./time-ago";
import { Avatar } from "./avatar";

const FIELD =
  "w-full resize-y rounded-[6px] border border-card-border bg-ocean-surface/60 px-3.5 py-2.5 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]";

export function CommentThread({
  postId,
  comments,
  currentUserId,
  isFounderViewer,
}: {
  postId: string;
  comments: CommunityComment[];
  currentUserId: string | null;
  isFounderViewer: boolean;
}) {
  return (
    <div className="mt-4 border-t border-card-border pt-4">
      {currentUserId && <CommentBox postId={postId} />}
      <div className={comments.length ? "mt-5 space-y-5" : ""}>
        {comments.map((c) => (
          <CommentNode
            key={c.id}
            postId={postId}
            comment={c}
            currentUserId={currentUserId}
            isFounderViewer={isFounderViewer}
            level={0}
          />
        ))}
      </div>
    </div>
  );
}

function CommentNode({
  postId,
  comment,
  currentUserId,
  isFounderViewer,
  level,
}: {
  postId: string;
  comment: CommunityComment;
  currentUserId: string | null;
  isFounderViewer: boolean;
  level: number;
}) {
  const [replying, setReplying] = useState(false);
  const canDelete = currentUserId === comment.author_id || isFounderViewer;
  const authorIsFounder = isFounder(comment.author.role);

  return (
    <div style={{ marginLeft: level > 0 ? 34 : 0 }}>
      <div className="flex items-start gap-2.5">
        <Avatar
          name={comment.author.full_name}
          url={comment.author.avatar_url}
          className="size-8 text-xs"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-foreground">
              {comment.author.full_name ?? "Viajero"}
            </span>
            {authorIsFounder && (
              <span className="rounded-full bg-ocean-cyan/12 px-1.5 py-0.5 text-[0.6rem] font-medium text-ocean-cyan">
                Fundadora
              </span>
            )}
            <TimeAgo iso={comment.created_at} />
          </div>
          <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
            {comment.body}
          </p>
          <div className="mt-2 flex items-center gap-4">
            <LikeButton
              target="comment"
              targetId={comment.id}
              initialLiked={comment.liked_by_me}
              initialCount={comment.likes_count}
            />
            {level === 0 && currentUserId && (
              <button
                onClick={() => setReplying((v) => !v)}
                className="inline-flex items-center gap-1 text-xs text-muted transition-colors hover:text-foreground"
              >
                <CornerDownRight className="size-3.5" /> Responder
              </button>
            )}
            {canDelete && <DeleteComment commentId={comment.id} />}
          </div>
          {replying && (
            <div className="mt-3">
              <CommentBox
                postId={postId}
                parentId={comment.id}
                onDone={() => setReplying(false)}
                autoFocus
              />
            </div>
          )}
        </div>
      </div>
      {comment.replies.length > 0 && (
        <div className="mt-4 space-y-4">
          {comment.replies.map((r) => (
            <CommentNode
              key={r.id}
              postId={postId}
              comment={r}
              currentUserId={currentUserId}
              isFounderViewer={isFounderViewer}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CommentBox({
  postId,
  parentId,
  onDone,
  autoFocus,
}: {
  postId: string;
  parentId?: string;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = () => {
    if (!body.trim() || pending) return;
    setError(null);
    start(async () => {
      const res = await createComment(postId, body, parentId);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setBody("");
      onDone?.();
      router.refresh();
    });
  };

  return (
    <div>
      <textarea
        autoFocus={autoFocus}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={parentId ? 2 : 3}
        maxLength={2000}
        placeholder={parentId ? "Escribe una respuesta…" : "Escribe un comentario…"}
        className={FIELD}
      />
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        {onDone && (
          <button
            onClick={onDone}
            disabled={pending}
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            Cancelar
          </button>
        )}
        <button
          onClick={submit}
          disabled={pending || !body.trim()}
          className={buttonVariants({ size: "sm" })}
        >
          {pending ? "Enviando…" : parentId ? "Responder" : "Comentar"}
        </button>
      </div>
    </div>
  );
}

function DeleteComment({ commentId }: { commentId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      title="Borrar comentario"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Borrar este comentario?")) return;
        start(async () => {
          await deleteComment(commentId);
          router.refresh();
        });
      }}
      className="text-muted/60 transition-colors hover:text-danger disabled:opacity-50"
    >
      <Trash2 className="size-3.5" />
    </button>
  );
}
