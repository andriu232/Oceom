import "server-only";
import { createClient } from "@/lib/supabase/server";
import type {
  CommunitySpace,
  CommunityAuthor,
  CommunityPost,
  CommunityComment,
  CommunityRole,
  RankingEntry,
} from "./types";

/* ============================================================
   Comunidad — capa de lectura. Sin JOINs de PostgREST: queries
   separadas + agregación en memoria (RLS hace el gating real).
   Los espacios son abiertos; los autores salen de `profiles`.
   ============================================================ */

type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: CommunityRole;
};

function authorFrom(p: ProfileRow | undefined, id: string): CommunityAuthor {
  return {
    id,
    full_name: p?.full_name ?? null,
    avatar_url: p?.avatar_url ?? null,
    role: p?.role ?? "student",
  };
}

export async function listSpaces(): Promise<CommunitySpace[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_spaces")
    .select("id, slug, name, description, color_hex, sort_order, is_active")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []) as CommunitySpace[];
}

export async function getSpaceBySlug(
  slug: string,
): Promise<CommunitySpace | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("community_spaces")
    .select("id, slug, name, description, color_hex, sort_order, is_active")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as CommunitySpace) ?? null;
}

type PostRow = {
  id: string;
  space_id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  is_pinned: boolean;
  kind: string;
  created_at: string;
};

async function hydratePosts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  posts: PostRow[],
  me: string | null,
): Promise<CommunityPost[]> {
  if (posts.length === 0) return [];
  const postIds = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];

  const [likesRes, commentsRes, myLikesRes, profilesRes] = await Promise.all([
    supabase.from("community_likes").select("post_id").in("post_id", postIds),
    supabase
      .from("community_comments")
      .select("post_id")
      .in("post_id", postIds)
      .eq("is_deleted", false),
    me
      ? supabase
          .from("community_likes")
          .select("post_id")
          .in("post_id", postIds)
          .eq("user_id", me)
      : Promise.resolve({ data: [] }),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .in("id", authorIds),
  ]);

  const likeCount = new Map<string, number>();
  for (const l of (likesRes.data ?? []) as { post_id: string | null }[]) {
    if (l.post_id) likeCount.set(l.post_id, (likeCount.get(l.post_id) ?? 0) + 1);
  }
  const commentCount = new Map<string, number>();
  for (const c of (commentsRes.data ?? []) as { post_id: string }[]) {
    commentCount.set(c.post_id, (commentCount.get(c.post_id) ?? 0) + 1);
  }
  const myLikes = new Set(
    ((myLikesRes.data ?? []) as { post_id: string | null }[])
      .map((l) => l.post_id)
      .filter(Boolean) as string[],
  );
  const profMap = new Map(
    ((profilesRes.data ?? []) as ProfileRow[]).map((p) => [p.id, p]),
  );

  return posts.map((p) => ({
    id: p.id,
    space_id: p.space_id,
    author_id: p.author_id,
    body: p.body,
    image_url: p.image_url,
    is_pinned: p.is_pinned,
    kind: p.kind,
    created_at: p.created_at,
    author: authorFrom(profMap.get(p.author_id), p.author_id),
    likes_count: likeCount.get(p.id) ?? 0,
    comments_count: commentCount.get(p.id) ?? 0,
    liked_by_me: myLikes.has(p.id),
  }));
}

export async function listSpacePosts(
  spaceId: string,
  opts: { limit?: number } = {},
): Promise<CommunityPost[]> {
  const supabase = await createClient();
  const me = (await supabase.auth.getUser()).data.user?.id ?? null;
  const { data: posts } = await supabase
    .from("community_posts")
    .select("id, space_id, author_id, body, image_url, is_pinned, kind, created_at")
    .eq("space_id", spaceId)
    .eq("is_deleted", false)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 40);
  return hydratePosts(supabase, (posts ?? []) as PostRow[], me);
}

export async function getPostById(
  postId: string,
): Promise<CommunityPost | null> {
  const supabase = await createClient();
  const me = (await supabase.auth.getUser()).data.user?.id ?? null;
  const { data: post } = await supabase
    .from("community_posts")
    .select("id, space_id, author_id, body, image_url, is_pinned, kind, created_at")
    .eq("id", postId)
    .eq("is_deleted", false)
    .maybeSingle();
  if (!post) return null;
  const [hydrated] = await hydratePosts(supabase, [post as PostRow], me);
  return hydrated ?? null;
}

export async function listPostComments(
  postId: string,
): Promise<CommunityComment[]> {
  const supabase = await createClient();
  const me = (await supabase.auth.getUser()).data.user?.id ?? null;

  const { data: rows } = await supabase
    .from("community_comments")
    .select("id, post_id, parent_id, author_id, body, created_at")
    .eq("post_id", postId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });
  const comments = (rows ?? []) as {
    id: string;
    post_id: string;
    parent_id: string | null;
    author_id: string;
    body: string;
    created_at: string;
  }[];
  if (comments.length === 0) return [];

  const commentIds = comments.map((c) => c.id);
  const authorIds = [...new Set(comments.map((c) => c.author_id))];
  const [likesRes, myLikesRes, profilesRes] = await Promise.all([
    supabase.from("community_likes").select("comment_id").in("comment_id", commentIds),
    me
      ? supabase
          .from("community_likes")
          .select("comment_id")
          .in("comment_id", commentIds)
          .eq("user_id", me)
      : Promise.resolve({ data: [] }),
    supabase
      .from("profiles")
      .select("id, full_name, avatar_url, role")
      .in("id", authorIds),
  ]);

  const likeCount = new Map<string, number>();
  for (const l of (likesRes.data ?? []) as { comment_id: string | null }[]) {
    if (l.comment_id)
      likeCount.set(l.comment_id, (likeCount.get(l.comment_id) ?? 0) + 1);
  }
  const myLikes = new Set(
    ((myLikesRes.data ?? []) as { comment_id: string | null }[])
      .map((l) => l.comment_id)
      .filter(Boolean) as string[],
  );
  const profMap = new Map(
    ((profilesRes.data ?? []) as ProfileRow[]).map((p) => [p.id, p]),
  );

  const byId = new Map<string, CommunityComment>();
  for (const c of comments) {
    byId.set(c.id, {
      id: c.id,
      post_id: c.post_id,
      parent_id: c.parent_id,
      author_id: c.author_id,
      body: c.body,
      created_at: c.created_at,
      author: authorFrom(profMap.get(c.author_id), c.author_id),
      likes_count: likeCount.get(c.id) ?? 0,
      liked_by_me: myLikes.has(c.id),
      replies: [],
    });
  }
  const roots: CommunityComment[] = [];
  for (const c of comments) {
    const node = byId.get(c.id)!;
    const parent = c.parent_id ? byId.get(c.parent_id) : undefined;
    if (parent) parent.replies.push(node);
    else roots.push(node);
  }
  return roots;
}

export async function getWeeklyRanking(limit = 8): Promise<RankingEntry[]> {
  const supabase = await createClient();
  const { data: ranking } = await supabase
    .from("community_weekly_ranking")
    .select("user_id, points")
    .order("points", { ascending: false })
    .limit(limit);
  const rows = (ranking ?? []) as { user_id: string; points: number }[];
  if (rows.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in(
      "id",
      rows.map((r) => r.user_id),
    );
  const pm = new Map(
    ((profiles ?? []) as { id: string; full_name: string | null; avatar_url: string | null }[]).map(
      (p) => [p.id, p],
    ),
  );
  return rows.map((r) => ({
    user_id: r.user_id,
    points: r.points,
    full_name: pm.get(r.user_id)?.full_name ?? null,
    avatar_url: pm.get(r.user_id)?.avatar_url ?? null,
  }));
}
