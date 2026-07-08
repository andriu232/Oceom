"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPost } from "@/lib/community/actions";
import { buttonVariants } from "@/components/ui/button";
import { Avatar } from "./avatar";

const FIELD =
  "w-full rounded-[6px] border border-card-border bg-ocean-surface/60 px-4 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-ocean-cyan focus:ring-2 focus:ring-[var(--ring)]";

export function PostComposer({
  spaceId,
  authorName,
  authorAvatar,
  placeholder = "Comparte algo con la comunidad…",
}: {
  spaceId: string;
  authorName: string | null;
  authorAvatar?: string | null;
  placeholder?: string;
}) {
  const [body, setBody] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const submit = () => {
    if (!body.trim() || pending) return;
    setError(null);
    start(async () => {
      const res = await createPost(spaceId, body);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      setBody("");
      setExpanded(false);
      router.refresh();
    });
  };

  return (
    <div className="glass mb-5 rounded-2xl p-4">
      {!expanded ? (
        <div className="flex items-center gap-3">
          <Avatar name={authorName} url={authorAvatar} />
          <input
            readOnly
            placeholder={placeholder}
            onFocus={() => setExpanded(true)}
            className={`h-11 cursor-text ${FIELD}`}
          />
        </div>
      ) : (
        <div>
          <div className="flex items-start gap-3">
            <Avatar name={authorName} url={authorAvatar} />
            <textarea
              autoFocus
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={5000}
              placeholder={placeholder}
              className={`min-h-[96px] resize-y py-2.5 ${FIELD}`}
            />
          </div>
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs tabular-nums text-muted">
              {body.length}/5000
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setExpanded(false);
                  setBody("");
                  setError(null);
                }}
                disabled={pending}
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Cancelar
              </button>
              <button
                onClick={submit}
                disabled={pending || !body.trim()}
                className={buttonVariants({ size: "sm" })}
              >
                {pending ? "Publicando…" : "Publicar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
