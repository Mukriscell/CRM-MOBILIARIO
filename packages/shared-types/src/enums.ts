/**
 * Enums estables del dominio — contratos públicos compartidos entre frontend y backend.
 * Disciplina (FASE 6): aquí SOLO van enums de dominio estables, nunca entidades,
 * modelos Prisma ni lógica. Deben coincidir con los enums de schema.prisma.
 */

export const LeadStatus = {
  NUEVO: "NUEVO",
  CONTACTADO: "CONTACTADO",
  INTERESADO: "INTERESADO",
  VISITA_AGENDADA: "VISITA_AGENDADA",
  NEGOCIACION: "NEGOCIACION",
  RESERVA: "RESERVA",
  VENTA_CERRADA: "VENTA_CERRADA",
  PERDIDO: "PERDIDO",
} as const;
export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus];

/** Etiquetas de UI para el pipeline (FASE 10). La UI muestra esto; la base usa el enum. */
export const LeadStatusLabel: Record<LeadStatus, string> = {
  NUEVO: "Nuevo",
  CONTACTADO: "Contactado",
  INTERESADO: "Calificado",
  VISITA_AGENDADA: "Visita Agendada",
  NEGOCIACION: "Negociación",
  RESERVA: "Reserva",
  VENTA_CERRADA: "Cierre",
  PERDIDO: "Perdido",
};

export const LeadSource = {
  WHATSAPP: "WHATSAPP",
  META_ADS: "META_ADS",
  INSTAGRAM: "INSTAGRAM",
  LANDING: "LANDING",
  WEB_FORM: "WEB_FORM",
  PORTAL: "PORTAL",
  REFERIDO: "REFERIDO",
  OTRO: "OTRO",
} as const;
export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource];

export const ScoreTier = {
  HOT: "HOT",
  WARM: "WARM",
  COLD: "COLD",
} as const;
export type ScoreTier = (typeof ScoreTier)[keyof typeof ScoreTier];

export const CreditStatus = {
  NONE: "NONE",
  PRE_APPROVED: "PRE_APPROVED",
  APPROVED: "APPROVED",
} as const;
export type CreditStatus = (typeof CreditStatus)[keyof typeof CreditStatus];

export const UrgencyLevel = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
} as const;
export type UrgencyLevel = (typeof UrgencyLevel)[keyof typeof UrgencyLevel];

export const PriceCurrency = {
  UF: "UF",
  CLP: "CLP",
} as const;
export type PriceCurrency = (typeof PriceCurrency)[keyof typeof PriceCurrency];

export const UserRole = {
  SUPER_ADMIN: "SUPER_ADMIN",
  ADMIN: "ADMIN",
  CORREDOR: "CORREDOR",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const PropertyType = {
  DEPTO: "DEPTO",
  CASA: "CASA",
  OFICINA: "OFICINA",
  TERRENO: "TERRENO",
  LOCAL: "LOCAL",
  BODEGA: "BODEGA",
  ESTACIONAMIENTO: "ESTACIONAMIENTO",
} as const;
export type PropertyType = (typeof PropertyType)[keyof typeof PropertyType];
