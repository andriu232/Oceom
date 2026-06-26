import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/lessons/heartbeat
 * Body: { lessonId, positionSeconds, durationSeconds }
 *
 * Lo llama el VimeoPlayer cada ~15s mientras reproduce + en pause/end/seek.
 * Persiste lesson_progress (RLS: el estudiante escribe su propio progreso).
 * Marca completed al 95% (spec OCEOM). Idempotente por (student_id, lesson_id).
 */
const COMPLETED_THRESHOLD = 95;

export async function POST(req: NextRequest) {
  let body: {
    lessonId?: string;
    positionSeconds?: number;
    durationSeconds?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Body inválido" }, { status: 400 });
  }

  const lessonId = body.lessonId;
  const position = Number(body.positionSeconds);
  const duration = Number(body.durationSeconds);

  if (!lessonId || typeof lessonId !== "string") {
    return NextResponse.json({ ok: false, error: "lessonId requerido" }, { status: 400 });
  }
  if (!Number.isFinite(position) || position < 0) {
    return NextResponse.json({ ok: false, error: "positionSeconds inválido" }, { status: 400 });
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    return NextResponse.json({ ok: false, error: "durationSeconds inválido" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth?.user) {
    return NextResponse.json({ ok: false, error: "UNAUTH" }, { status: 401 });
  }
  const studentId = auth.user.id;

  const pct = Math.min(100, Math.max(0, Math.round((position / duration) * 100)));
  const shouldComplete = pct >= COMPLETED_THRESHOLD;

  const { data: existing } = await supabase
    .from("lesson_progress")
    .select("completed_at, watched_seconds")
    .eq("student_id", studentId)
    .eq("lesson_id", lessonId)
    .maybeSingle();

  const wasCompleted = Boolean(existing?.completed_at);
  const nowIso = new Date().toISOString();
  const completedAt = existing?.completed_at ?? (shouldComplete ? nowIso : null);
  const watched = Math.max(existing?.watched_seconds ?? 0, Math.floor(position));

  const { error } = await supabase.from("lesson_progress").upsert(
    {
      student_id: studentId,
      lesson_id: lessonId,
      last_position_seconds: Math.floor(position),
      watched_seconds: watched,
      progress_percentage: pct,
      completed_at: completedAt,
      updated_at: nowIso,
    },
    { onConflict: "student_id,lesson_id" },
  );

  if (error) {
    return NextResponse.json(
      { ok: false, error: "upsert failed", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    percentage: pct,
    completed: shouldComplete,
    transitioned: !wasCompleted && shouldComplete,
  });
}
