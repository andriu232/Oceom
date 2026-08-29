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
  /* --- Hermes (WhatsApp). Opcionales: los perfiles previos a la
     migración 0025 no los traen hasta que se aplique. --- */
  phone_e164?: string | null;
  phone_verified_at?: string | null;
  /** 'self' (verificado por la persona) | 'mentor' (puesto a mano). */
  phone_linked_by?: string | null;
  hermes_opt_in?: boolean;
  hermes_hour?: number;
  hermes_cadence?: string;
  hermes_tz?: string;
  hermes_last_reminder_at?: string | null;
  /* --- Correos de OCEOM (migración 0029). --- */
  mail_opt_in?: boolean;
  mail_hour?: number;
  mail_tz?: string;
  /** Credencial del enlace de baja. Nunca mandarla al cliente de otra persona. */
  mail_token?: string;
}
