import { Inject, Injectable } from "@nestjs/common";
import { LeadScore } from "@prisma/client";
import { ILeadScoreRepository, LEAD_SCORE_REPOSITORY } from "../domain/lead-score.repository.interface";

export interface LeadScoreDetail {
  latest: LeadScore | null;
  history: LeadScore[];
}

@Injectable()
export class GetLeadScoreUseCase {
  constructor(@Inject(LEAD_SCORE_REPOSITORY) private readonly scores: ILeadScoreRepository) {}

  async execute(tenantId: string, leadId: string): Promise<LeadScoreDetail> {
    const [latest, history] = await Promise.all([
      this.scores.findLatest(tenantId, leadId),
      this.scores.history(tenantId, leadId),
    ]);
    return { latest, history };
  }
}
