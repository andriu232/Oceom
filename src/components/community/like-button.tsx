"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { togglePostLike, toggleCommentLike } from "@/lib/community/actions";

export function LikeButton({
  target,
  targetId,
  initialLiked,
  initialCount,
}: {
  target: "post" | "comment";
  targetId: string;
  initialLiked: boolean;
  initialCount: number;
}) {
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [pending, start] = useTransition();

  const onClick = () => {
    const next = !liked;
    setLiked(next);
    setCount((c) => c + (next ? 1 : -1));
    start(async () => {
      const res =
        target === "post"
          ? await togglePostLike(targetId)
          : await toggleCommentLike(targetId);
      if (!res.ok) {
        // rollback
        setLiked(!next);
        setCount((c) => c + (next ? -1 : 1));
        return;
      }
      setLiked(res.data.liked);
      setCount(res.data.count);
    });
  };

  return (
    <button
      onClick={onClick}
      disabled={pending}
      aria-pressed={liked}
      aria-label={liked ? "Quitar me gusta" : "Me gusta"}
      className={`inline-flex items-center gap-1.5 text-sm transition-colors ${
        liked ? "text-ocean-glow" : "text-muted hover:text-foreground"
      }`}
    >
      <Heart className={`size-4 ${liked ? "fill-current" : ""}`} />
      {count}
    </button>
  );
}
