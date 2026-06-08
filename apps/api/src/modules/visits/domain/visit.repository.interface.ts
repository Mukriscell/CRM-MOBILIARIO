import { VisitStatus } from "@prisma/client";
import { ScheduleVisitInput, VisitListFilters, VisitView } from "./visit.entity";

export const VISIT_REPOSITORY = Symbol("VISIT_REPOSITORY");

export interface CreateReminderInput {
  visitId: string;
  sendAt: Date;
}

export interface ReminderView {
  id: string;
  tenantId: string;
  visitId: string;
  sendAt: Date;
  status: "PENDING" | "SENT" | "FAILED";
}

export interface IVisitRepository {
  list(tenantId: string, filters?: VisitListFilters): Promise<VisitView[]>;
  findById(tenantId: string, id: string): Promise<VisitView | null>;
  /**
   * Crea la visita y registra el LeadTimelineEvent (VISIT_SCHEDULED) en una transacción.
   * No cambia el status del lead: eso lo orquesta el use case vía ILeadRepository.
   */
  create(tenantId: string, input: ScheduleVisitInput): Promise<VisitView>;
  updateStatus(tenantId: string, id: string, status: VisitStatus): Promise<VisitView>;

  // ── Recordatorios (Fase 3) ──
  createReminders(tenantId: string, inputs: CreateReminderInput[]): Promise<ReminderView[]>;
  findReminderById(tenantId: string, reminderId: string): Promise<ReminderView | null>;
  markReminder(tenantId: string, reminderId: string, status: "SENT" | "FAILED"): Promise<void>;
  /** Marca como FAILED (cancelados) los recordatorios PENDING de una visita. Devuelve sus ids. */
  cancelPendingReminders(tenantId: string, visitId: string): Promise<string[]>;
}
