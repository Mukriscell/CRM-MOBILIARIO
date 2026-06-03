export const INACTIVITY_DAYS = { DAYS_30: 30, DAYS_60: 60, DAYS_90: 90 } as const;
export type InactivityThresholdKey = "DAYS_30" | "DAYS_60" | "DAYS_90";

export interface RecoveryCandidate {
  leadId: string;
  tenantId: string;
  firstName: string | null;
  lastName: string | null;
  phone: string | null;
  source: string;
  status: string;
  currentScoreTier: string | null;
  lastActivityAt: Date;
  inactivityDays: number;
  threshold: InactivityThresholdKey;
}

export interface RecoveryStats {
  candidates: number;
  pending: number;
  reactivated: number;
  lost: number;
  noResponse: number;
}
