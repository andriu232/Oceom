import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Correo no válido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

export const registerSchema = z.object({
  fullName: z.string().min(2, "Cuéntanos tu nombre"),
  email: z.string().email("Correo no válido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
