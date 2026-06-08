import type { LeadRecovery } from "@prisma/client";
import type { InactivityThresholdKey, RecoveryCandidate, RecoveryStats } from "./lead-recovery.entity";

export const LEAD_RECOVERY_REPOSITORY = Symbol("LEAD_RECOVERY_REPOSITORY");

export interface CreateRecoveryInput {
  tenantId: string;
  leadId: string;
  inactivityThreshold: InactivityThresholdKey;
  outcome: "PENDING" | "REACTIVATED" | "NO_RESPONSE" | "LOST";
  recoveryAction?: unknown;
}

export interface ILeadRecoveryRepository {
  /** Leads inactivos 30+ días sin recovery PENDING activo. */
  findCandidates(tenantId: string): Promise<RecoveryCandidate[]>;
  /** Un lead específico como candidato (null si no cumple criterios). */
  findCandidateById(tenantId: string, leadId: string): Promise<RecoveryCandidate | null>;
  create(input: CreateRecoveryInput): Promise<LeadRecovery>;
  findById(tenantId: string, id: string): Promise<LeadRecovery | null>;
  findByLead(tenantId: string, leadId: string): Promise<LeadRecovery[]>;
  /** Actualiza el status del lead (para archivar/reactivar). */
  updateLeadStatus(tenantId: string, leadId: string, status: "PERDIDO" | "CONTACTADO"): Promise<void>;
  stats(tenantId: string): Promise<RecoveryStats>;
}
