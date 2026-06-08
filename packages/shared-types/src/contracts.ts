/**
 * Contratos públicos (DTOs) compartidos entre frontend y backend, derivados de Zod.
 * Una sola fuente de verdad: el backend valida con estos schemas y el frontend
 * infiere los tipos. Solo entran contratos que AMBOS consumen (regla del doble consumidor).
 */
import { z } from "zod";
import { LeadSource } from "./enums";

/** Contacto mínimo: debe traer al menos teléfono o email (anti "lead vacío"). */
export const ContactSchema = z
  .object({
    firstName: z.string().min(1).max(100).optional(),
    lastName: z.string().min(1).max(100).optional(),
    email: z.string().email().max(254).optional(),
    phone: z.string().min(8).max(20).optional(),
  })
  .refine((c) => Boolean(c.phone || c.email), {
    message: "Se requiere al menos teléfono o email",
  });
export type Contact = z.infer<typeof ContactSchema>;

/** Payload de ingesta genérica (POST /lead-intake). Longitudes máximas para LLM04/DoS. */
export const LeadIntakeSchema = z.object({
  source: z.nativeEnum(LeadSource),
  contact: ContactSchema,
  interest: z
    .object({
      propertyCode: z.string().max(50).optional(),
      commune: z.string().max(100).optional(),
      budget: z.number().positive().max(1_000_000_000).optional(),
      currency: z.enum(["UF", "CLP"]).optional(),
    })
    .optional(),
  raw: z.record(z.unknown()).optional(),
});
export type LeadIntakeInput = z.infer<typeof LeadIntakeSchema>;

/** Credenciales de login (POST /auth/login). */
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginInput = z.infer<typeof LoginSchema>;

/** Paginación cursor-based (FASE 9 §7). */
export interface CursorPagination {
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: CursorPagination;
}
