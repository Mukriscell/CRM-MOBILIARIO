import { LeadFollowUp } from "@prisma/client";
import { FollowUpStats } from "./follow-up.entity";

export const FOLLOW_UP_REPOSITORY = Symbol("FOLLOW_UP_REPOSITORY");

export interface CreateFollowUpInput {
  tenantId: string;
  leadId: string;
  sequenceStep: number;
  scheduledAt: Date;
}

export interface IFollowUpRepository {
  createMany(inputs: CreateFollowUpInput[]): Promise<LeadFollowUp[]>;
  findById(tenantId: string, id: string): Promise<LeadFollowUp | null>;
  findByLead(tenantId: string, leadId: string): Promise<LeadFollowUp[]>;
  findPendingForTenant(tenantId: string): Promise<LeadFollowUp[]>;
  findAllForTenant(tenantId: string, status?: string): Promise<LeadFollowUp[]>;
  cancelAllPendingForLead(tenantId: string, leadId: string, reason: string): Promise<number>;
  markExecuted(tenantId: string, id: string): Promise<LeadFollowUp>;
  markFailed(tenantId: string, id: string, reason: string): Promise<LeadFollowUp>;
  markCancelled(tenantId: string, id: string, reason: string): Promise<void>;
  stats(tenantId: string): Promise<FollowUpStats>;
}
