import { Lead } from "@prisma/client";

/** Proyección de salida del Lead para la API (no expone el modelo Prisma crudo). */
export interface LeadResponse {
  id: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  source: string;
  status: string;
  scoreTier: string | null;
  assignedUserId: string | null;
  firstResponseAt: string | null;
  lastActivityAt: string;
  minutesWaiting: number | null; // tiempo sin primera respuesta (señal de urgencia, FASE 10)
  createdAt: string;
}

export function toLeadResponse(lead: Lead): LeadResponse {
  const minutesWaiting =
    lead.firstResponseAt === null
      ? Math.floor((Date.now() - lead.createdAt.getTime()) / 60000)
      : null;
  return {
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phone,
    email: lead.email,
    source: lead.source,
    status: lead.status,
    scoreTier: lead.currentScoreTier,
    assignedUserId: lead.assignedUserId,
    firstResponseAt: lead.firstResponseAt?.toISOString() ?? null,
    lastActivityAt: lead.lastActivityAt.toISOString(),
    minutesWaiting,
    createdAt: lead.createdAt.toISOString(),
  };
}
