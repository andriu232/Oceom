"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { setLessonComplete } from "@/lib/actions/progress";
import { Button } from "@/components/ui/button";

/** Botón para marcar/desmarcar una experiencia como completada. */
export function CompleteToggle({
  lessonId,
  initialCompleted,
}: {
  lessonId: string;
  initialCompleted: boolean;
}) {
  const [completed, setCompleted] = useState(initialCompleted);
  const [pending, start] = useTransition();
  const router = useRouter();

  function toggle() {
    const next = !completed;
    setCompleted(next);
    start(async () => {
      await setLessonComplete(lessonId, next);
      router.refresh();
    });
  }

  return (
    <Button
      variant={completed ? "glass" : "primary"}
      onClick={toggle}
      disabled={pending}
    >
      <CheckCircle2 className="size-4" />
      {completed ? "Completada" : "Marcar como completada"}
    </Button>
  );
}
