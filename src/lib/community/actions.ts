"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

async function requireUser() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data?.user) return null;
  return { supabase, userId: data.user.id };
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

  revalidatePath("/comunidad");
  return { ok: true, data: { id: data.id as string } };
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
