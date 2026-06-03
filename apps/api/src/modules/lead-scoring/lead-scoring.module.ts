import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { LeadsModule } from "../leads/leads.module";
import { SCORING_PROVIDER } from "./domain/scoring-provider.interface";
import { LEAD_SCORE_REPOSITORY } from "./domain/lead-score.repository.interface";
import { HeuristicScoringProvider } from "./infrastructure/heuristic-scoring.provider";
import { PrismaLeadScoreRepository } from "./infrastructure/prisma-lead-score.repository";
import { LeadScoringListener } from "./infrastructure/lead-scoring.listener";
import { CalculateLeadScoreUseCase } from "./application/calculate-lead-score.use-case";
import { RecalculateLeadScoreUseCase } from "./application/recalculate-lead-score.use-case";
import { GetLeadScoreUseCase } from "./application/get-lead-score.use-case";
import { LeadScoreController } from "./presentation/lead-score.controller";

@Module({
  imports: [AuthModule, LeadsModule],
  controllers: [LeadScoreController],
  providers: [
    { provide: SCORING_PROVIDER, useClass: HeuristicScoringProvider },
    { provide: LEAD_SCORE_REPOSITORY, useClass: PrismaLeadScoreRepository },
    CalculateLeadScoreUseCase,
    RecalculateLeadScoreUseCase,
    GetLeadScoreUseCase,
    LeadScoringListener,
  ],
})
export class LeadScoringModule {}
