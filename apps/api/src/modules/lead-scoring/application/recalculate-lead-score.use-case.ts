import { Injectable } from "@nestjs/common";
import { LeadScore } from "@prisma/client";
import { CalculateLeadScoreUseCase } from "./calculate-lead-score.use-case";

@Injectable()
export class RecalculateLeadScoreUseCase {
  constructor(private readonly calculate: CalculateLeadScoreUseCase) {}

  execute(tenantId: string, leadId: string): Promise<LeadScore> {
    return this.calculate.execute(tenantId, leadId);
  }
}
