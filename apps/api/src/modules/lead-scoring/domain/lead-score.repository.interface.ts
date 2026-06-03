import { LeadScore } from "@prisma/client";
import { ScoreResult, ScoreTier } from "./lead-score.entity";

export const LEAD_SCORE_REPOSITORY = Symbol("LEAD_SCORE_REPOSITORY");

export interface ILeadScoreRepository {
  save(tenantId: string, leadId: string, result: ScoreResult, source: "HEURISTIC" | "AI"): Promise<LeadScore>;
  findLatest(tenantId: string, leadId: string): Promise<LeadScore | null>;
  history(tenantId: string, leadId: string): Promise<LeadScore[]>;
  updateLeadTier(tenantId: string, leadId: string, tier: ScoreTier): Promise<void>;
}
