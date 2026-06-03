export const CADENCE_DAYS = [1, 3, 7, 14] as const;
export type CadenceStep = (typeof CADENCE_DAYS)[number];

export const FOLLOW_UP_QUEUE = "follow-up";
export const FOLLOW_UP_JOB = "send-follow-up";

export interface FollowUpJobData {
  tenantId: string;
  leadId: string;
  followUpId: string;
}

export interface FollowUpStats {
  pending: number;
  overdue: number;
  executed: number;
  compliancePct: number;
}
