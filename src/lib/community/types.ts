export type CommunityRole = "super_admin" | "mentor" | "student";

export interface CommunitySpace {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  color_hex: string | null;
  sort_order: number;
  is_active: boolean;
}

export interface CommunityAuthor {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: CommunityRole;
}

export interface CommunityPost {
  id: string;
  space_id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  is_pinned: boolean;
  /** 'post' normal | 'pregunta_semanal' (la publica la mentora). */
  kind: string;
  created_at: string;
  author: CommunityAuthor;
  likes_count: number;
  comments_count: number;
  liked_by_me: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  body: string;
  created_at: string;
  author: CommunityAuthor;
  likes_count: number;
  liked_by_me: boolean;
  replies: CommunityComment[];
}

export interface RankingEntry {
  user_id: string;
  points: number;
  full_name: string | null;
  avatar_url: string | null;
}

/** ¿El rol es "Fundador"/moderador? (mentora o super admin) */
export function isFounder(role: CommunityRole | null | undefined): boolean {
  return role === "mentor" || role === "super_admin";
}
