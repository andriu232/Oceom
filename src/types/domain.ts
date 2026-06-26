/** Tipos de dominio OCEOM. El esquema completo de DB se generará con
 *  `supabase gen types` en types/database.types.ts cuando exista proyecto. */

export type UserRole = "super_admin" | "mentor" | "student";

export type ProgramType = "emotion" | "neuropsychic" | "custom";

export type ContentStatus = "draft" | "published" | "archived";

export type LessonContentType =
  | "video"
  | "audio"
  | "text"
  | "meditation"
  | "hypnosis"
  | "live_recording"
  | "exercise";

export type AssignmentKind =
  | "text"
  | "checklist"
  | "file"
  | "journal"
  | "dream_map"
  | "emotional_checkin";

export type EnrollmentState =
  | "active"
  | "paused"
  | "completed"
  | "cancelled"
  | "inactive";

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}
