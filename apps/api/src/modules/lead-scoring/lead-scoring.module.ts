import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { LeadsModule } from "../leads/leads.module";
import { SCORING_PROVIDER } from "./domain/scoring-provider.interface";
import { LEAD_SCORE_REPOSITORY } from "./domain/lead-score.repository.interface";
import { Logger } from "@nestjs/common";
import { HeuristicScoringProvider } from "./infrastructure/heuristic-scoring.provider";
import { AIScoringProvider } from "./infrastructure/ai-scoring.provider";
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
    HeuristicScoringProvider,
    // El proveedor se elige por entorno: IA real (Claude) si hay ANTHROPIC_API_KEY,
    // de lo contrario el heurístico determinista. La IA cae al heurístico ante errores.
    {
      provide: SCORING_PROVIDER,
      inject: [HeuristicScoringProvider],
      useFactory: (heuristic: HeuristicScoringProvider) => {
        const hasAi = !!process.env.ANTHROPIC_API_KEY;
        const provider = hasAi ? new AIScoringProvider(heuristic) : heuristic;
        new Logger("LeadScoringModule").log(
          `Proveedor de scoring: ${hasAi ? "IA (Claude)" : "Heurístico"}`,
        );
        return provider;
      },
    },
    { provide: LEAD_SCORE_REPOSITORY, useClass: PrismaLeadScoreRepository },
    CalculateLeadScoreUseCase,
    RecalculateLeadScoreUseCase,
    GetLeadScoreUseCase,
    LeadScoringListener,
  ],
})
export class LeadScoringModule {}
