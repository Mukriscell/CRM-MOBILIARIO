import { VisitStatus } from "@prisma/client";

/** Vista de una visita con datos desnormalizados para la lista (lead/propiedad/corredor). */
export interface VisitView {
  id: string;
  tenantId: string;
  leadId: string;
  propertyId: string;
  userId: string;
  scheduledAt: Date;
  status: VisitStatus;
  notes: string | null;
  createdAt: Date;
  // Desnormalizados (joins) — pueden ser null si la relación fue removida.
  leadName: string | null;
  leadPhone: string | null;
  propertyCode: string | null;
  propertyAddress: string | null;
  userName: string | null;
}

export interface ScheduleVisitInput {
  leadId: string;
  propertyId: string;
  userId: string;
  scheduledAt: Date;
  notes?: string | null;
}

export interface VisitListFilters {
  status?: string;
  userId?: string;
  from?: Date;
  to?: Date;
}

// ── BullMQ (Fase 3: recordatorios automáticos) ──────────────────────────────
export const VISIT_REMINDER_QUEUE = "visit-reminders";
export const VISIT_REMINDER_JOB = "send-visit-reminder";

export interface VisitReminderJobData {
  tenantId: string;
  visitId: string;
  reminderId: string;
}

/** Offsets de los recordatorios respecto a scheduledAt (en horas antes de la visita). */
export const REMINDER_OFFSETS_HOURS = [24, 2];
