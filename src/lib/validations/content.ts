import { z } from "zod";

export const LESSON_TYPES = [
  "video",
  "audio",
  "text",
  "meditation",
  "hypnosis",
  "live_recording",
  "exercise",
] as const;

export const PROGRAM_TYPES = ["emotion", "neuropsychic", "custom"] as const;
export const STATUSES = ["draft", "published", "archived"] as const;

const emptyToNull = (v: unknown) =>
  v === "" || v === undefined || v === null ? null : v;

export const programSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres"),
  slug: z
    .string()
    .min(2)
    .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
  subtitle: z.preprocess(emptyToNull, z.string().nullable()),
  description: z.preprocess(emptyToNull, z.string().nullable()),
  type: z.enum(PROGRAM_TYPES),
  level: z.preprocess(emptyToNull, z.string().nullable()),
  duration_label: z.preprocess(emptyToNull, z.string().nullable()),
  price_cop: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().nonnegative().nullable(),
  ),
  cover_image_url: z.preprocess(emptyToNull, z.string().nullable()),
  status: z.enum(STATUSES),
});

export const lessonSchema = z.object({
  title: z.string().min(2, "Mínimo 2 caracteres"),
  subtitle: z.preprocess(emptyToNull, z.string().nullable()),
  objective: z.preprocess(emptyToNull, z.string().nullable()),
  content_type: z.enum(LESSON_TYPES),
  video_url: z.preprocess(emptyToNull, z.string().nullable()),
  audio_url: z.preprocess(emptyToNull, z.string().nullable()),
  body_content: z.preprocess(emptyToNull, z.string().nullable()),
  duration_seconds: z.preprocess(
    (v) => (v === "" || v == null ? null : Number(v)),
    z.number().int().nonnegative().nullable(),
  ),
  status: z.enum(STATUSES),
});

export const titleSchema = z.object({
  title: z.string().min(1, "Escribe un título"),
  description: z.preprocess(emptyToNull, z.string().nullable()).optional(),
});
