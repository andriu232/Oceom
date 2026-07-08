"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Pin, PinOff } from "lucide-react";
import { deletePost, togglePinPost } from "@/lib/community/actions";

export function DeletePostButton({ postId }: { postId: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      title="Borrar post"
      disabled={pending}
      onClick={() => {
        if (!confirm("¿Borrar este post?")) return;
        start(async () => {
          await deletePost(postId);
          router.refresh();
        });
      }}
      className="text-muted/60 transition-colors hover:text-danger disabled:opacity-50"
    >
      <Trash2 className="size-4" />
    </button>
  );
}

export function PinButton({
  postId,
  isPinned,
}: {
  postId: string;
  isPinned: boolean;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <button
      title={isPinned ? "Desanclar" : "Anclar"}
      disabled={pending}
      onClick={() =>
        start(async () => {
          await togglePinPost(postId);
          router.refresh();
        })
      }
      className={`transition-colors disabled:opacity-50 ${
        isPinned ? "text-ocean-cyan" : "text-muted/60 hover:text-foreground"
      }`}
    >
      {isPinned ? <PinOff className="size-4" /> : <Pin className="size-4" />}
    </button>
  );
}
