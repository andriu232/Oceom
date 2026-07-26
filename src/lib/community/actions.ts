"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { notifyAllStudents, APP_URL } from "@/lib/notifications/create";
import { analyzeWeeklyAnswers } from "@/lib/omi/analyze";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return null;
  return { supabase, userId: data.user.id };
}

type Ctx = NonNullable<Awaited<ReturnType<typeof requireUser>>>;

function emailHtml(title: string, text: string, url: string): string {
  return `<div style="font-family:'Segoe UI',Helvetica,Arial,sans-serif;background:#0a1124;padding:28px 0">
    <div style="max-width:520px;margin:0 auto;background:#0f1a36;border:1px solid rgba(94,234,212,0.18);border-radius:16px;overflow:hidden">
      <div style="padding:20px 26px;border-bottom:1px solid rgba(255,255,255,0.06)">
        <span style="font-size:18px;font-weight:700;letter-spacing:2px;color:#e8eefb">OCE<span style="color:#5eead4">OM</span></span>
      </div>
      <div style="padding:24px 26px">
        <h1 style="margin:0 0 12px;font-size:18px;color:#e8eefb">${title}</h1>
        <p style="margin:0 0 18px;color:#aab8d4;font-size:14px;line-height:1.55;white-space:pre-line">${text}</p>
        <a href="${url}" style="display:inline-block;background:#0ea5b7;color:#04121a;text-decoration:none;font-weight:600;font-size:14px;padding:11px 20px;border-radius:12px">Ir a la Comunidad</a>
      </div>
    </div>
  </div>`;
}

/** Si el autor es fundador (mentora/super admin), avisa a todos los estudiantes.
 *  La "pregunta semanal" usa un aviso destacado + correo. */
async function maybeNotifyFounderPost(
  ctx: Ctx,
  spaceId: string,
  postId: string,
  body: string,
  kind: "post" | "pregunta_semanal",
): Promise<void> {
  const { data: prof } = await ctx.supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", ctx.userId)
    .maybeSingle();
  const role = (prof as { role?: string } | null)?.role;
  if (role !== "mentor" && role !== "super_admin") return;

  const name = (prof as { full_name?: string } | null)?.full_name || "La mentora";
  const { data: space } = await ctx.supabase
    .from("community_spaces")
    .select("slug")
    .eq("id", spaceId)
    .maybeSingle();
  const slug = (space as { slug?: string } | null)?.slug ?? "comunidad";
  const preview = body.length > 160 ? body.slice(0, 157) + "…" : body;
  const link = `/comunidad/${slug}/${postId}`;

  if (kind === "pregunta_semanal") {
    await notifyAllStudents(
      {
        kind: "pregunta_semanal",
        title: "Nueva pregunta semanal 🌊",
        body: preview,
        link,
        email: {
          subject: `${name} lanzó la pregunta de la semana`,
          html: emailHtml("La pregunta de la semana", preview, `${APP_URL}${link}`),
        },
      },
      { excludeUserId: ctx.userId },
    );
  } else {
    await notifyAllStudents(
      {
        kind: "comunidad",
        title: `${name} publicó en la Comunidad`,
        body: preview,
        link,
      },
      { excludeUserId: ctx.userId },
    );
  }
}

/* ---------- Posts ---------- */
export async function createPost(
  spaceId: string,
  body: string,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false, message: "Inicia sesión para publicar." };
  const trimmed = body.trim();
  if (!trimmed) return { ok: false, message: "El post no puede estar vacío." };
  if (trimmed.length > 5000)
    return { ok: false, message: "El post excede 5000 caracteres." };

  const { data, error } = await ctx.supabase
    .from("community_posts")
    .insert({ space_id: spaceId, author_id: ctx.userId, body: trimmed })
    .select("id")
    .single();
  if (error) return { ok: false, message: "No se pudo publicar. Inténtalo de nuevo." };

  // Aviso a la comunidad si publica la mentora.
  await maybeNotifyFounderPost(ctx, spaceId, data.id as string, trimmed, "post");

  revalidatePath("/comunidad");
  return { ok: true, data: { id: data.id as string } };
}

/** Pregunta semanal (solo la mentora): post destacado + fija + avisa a todos. */
export async function createWeeklyQuestion(
  spaceId: string,
  body: string,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false, message: "Inicia sesión." };

  const { data: prof } = await ctx.supabase
    .from("profiles")
    .select("role")
    .eq("id", ctx.userId)
    .maybeSingle();
  const role = (prof as { role?: string } | null)?.role;
  if (role !== "mentor" && role !== "super_admin")
    return { ok: false, message: "Solo la mentora puede lanzar la pregunta semanal." };

  const trimmed = body.trim();
  if (!trimmed) return { ok: false, message: "La pregunta no puede estar vacía." };
  if (trimmed.length > 5000)
    return { ok: false, message: "La pregunta excede 5000 caracteres." };

  const { data, error } = await ctx.supabase
    .from("community_posts")
    .insert({
      space_id: spaceId,
      author_id: ctx.userId,
      body: trimmed,
      kind: "pregunta_semanal",
      is_pinned: true,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: "No se pudo publicar la pregunta." };

  await maybeNotifyFounderPost(ctx, spaceId, data.id as string, trimmed, "pregunta_semanal");

  revalidatePath("/comunidad");
  return { ok: true, data: { id: data.id as string } };
}

/** Informe de OMI sobre las respuestas (comentarios) a una pregunta semanal.
 *  Solo la mentora. No persiste: se genera bajo demanda. */
export async function analyzeWeeklyQuestion(
  postId: string,
): Promise<{ ok: boolean; report?: string; message?: string }> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false, message: "No autorizado." };

  const { data: prof } = await ctx.supabase
    .from("profiles")
    .select("role")
    .eq("id", ctx.userId)
    .maybeSingle();
  const role = (prof as { role?: string } | null)?.role;
  if (role !== "mentor" && role !== "super_admin")
    return { ok: false, message: "Solo la mentora puede pedir el informe." };

  const { data: post } = await ctx.supabase
    .from("community_posts")
    .select("body")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { ok: false, message: "Pregunta no encontrada." };

  const { data: comments } = await ctx.supabase
    .from("community_comments")
    .select("body")
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  const answers = ((comments ?? []) as { body: string }[])
    .map((c) => c.body)
    .filter(Boolean);

  return analyzeWeeklyAnswers((post as { body: string }).body, answers);
}

export async function deletePost(postId: string): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false, message: "No autorizado." };
  const { error } = await ctx.supabase
    .from("community_posts")
    .update({ is_deleted: true })
    .eq("id", postId);
  if (error) return { ok: false, message: "No se pudo borrar el post." };
  revalidatePath("/comunidad");
  return { ok: true, data: undefined };
}

/** Anclar/desanclar (solo mentora — la RLS lo gatea). */
export async function togglePinPost(postId: string): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false, message: "No autorizado." };
  const { data: post } = await ctx.supabase
    .from("community_posts")
    .select("is_pinned")
    .eq("id", postId)
    .maybeSingle();
  if (!post) return { ok: false, message: "Post no encontrado." };
  const { error } = await ctx.supabase
    .from("community_posts")
    .update({ is_pinned: !post.is_pinned })
    .eq("id", postId);
  if (error) return { ok: false, message: "No se pudo anclar." };
  revalidatePath("/comunidad");
  return { ok: true, data: undefined };
}

/* ---------- Comentarios ---------- */
export async function createComment(
  postId: string,
  body: string,
  parentId?: string,
): Promise<ActionResult<{ id: string }>> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false, message: "Inicia sesión para comentar." };
  const trimmed = body.trim();
  if (!trimmed)
    return { ok: false, message: "El comentario no puede estar vacío." };
  if (trimmed.length > 2000)
    return { ok: false, message: "El comentario excede 2000 caracteres." };

  const { data, error } = await ctx.supabase
    .from("community_comments")
    .insert({
      post_id: postId,
      author_id: ctx.userId,
      body: trimmed,
      parent_id: parentId ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: "No se pudo comentar." };

  revalidatePath("/comunidad");
  return { ok: true, data: { id: data.id as string } };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false, message: "No autorizado." };
  const { error } = await ctx.supabase
    .from("community_comments")
    .update({ is_deleted: true })
    .eq("id", commentId);
  if (error) return { ok: false, message: "No se pudo borrar el comentario." };
  revalidatePath("/comunidad");
  return { ok: true, data: undefined };
}

/* ---------- Likes (toggle) ---------- */
async function toggleLike(
  column: "post_id" | "comment_id",
  targetId: string,
): Promise<ActionResult<{ liked: boolean; count: number }>> {
  const ctx = await requireUser();
  if (!ctx) return { ok: false, message: "Inicia sesión." };

  const { data: existing } = await ctx.supabase
    .from("community_likes")
    .select("id")
    .eq(column, targetId)
    .eq("user_id", ctx.userId)
    .maybeSingle();

  if (existing) {
    await ctx.supabase.from("community_likes").delete().eq("id", existing.id);
  } else {
    const { error } = await ctx.supabase
      .from("community_likes")
      .insert({ [column]: targetId, user_id: ctx.userId });
    if (error) return { ok: false, message: "No se pudo dar like." };
  }

  const { count } = await ctx.supabase
    .from("community_likes")
    .select("id", { count: "exact", head: true })
    .eq(column, targetId);

  revalidatePath("/comunidad");
  return { ok: true, data: { liked: !existing, count: count ?? 0 } };
}

export async function togglePostLike(postId: string) {
  return toggleLike("post_id", postId);
}

export async function toggleCommentLike(commentId: string) {
  return toggleLike("comment_id", commentId);
}
