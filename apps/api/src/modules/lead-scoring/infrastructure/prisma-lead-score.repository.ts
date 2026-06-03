import { Injectable } from "@nestjs/common";
import { LeadScore, Prisma } from "@prisma/client";
import { PrismaService } from "../../../infrastructure/database/prisma.service";
import { ILeadScoreRepository } from "../domain/lead-score.repository.interface";
import { ScoreResult, ScoreTier } from "../domain/lead-score.entity";

@Injectable()
export class PrismaLeadScoreRepository implements ILeadScoreRepository {
  constructor(private readonly prisma: PrismaService) {}

  save(tenantId: string, leadId: string, result: ScoreResult, source: "HEURISTIC" | "AI"): Promise<LeadScore> {
    return this.prisma.leadScore.create({
      data: {
        tenantId,
        leadId,
        scoreValue: result.scoreValue,
        tier: result.tier as "HOT" | "WARM" | "COLD",
        reasons: result.reasons as unknown as Prisma.InputJsonValue,
        source,
      },
    });
  }

  findLatest(tenantId: string, leadId: string): Promise<LeadScore | null> {
    return this.prisma.leadScore.findFirst({
      where: { tenantId, leadId },
      orderBy: { scoredAt: "desc" },
    });
  }

  history(tenantId: string, leadId: string): Promise<LeadScore[]> {
    return this.prisma.leadScore.findMany({
      where: { tenantId, leadId },
      orderBy: { scoredAt: "desc" },
      take: 20,
    });
  }

  async updateLeadTier(tenantId: string, leadId: string, tier: ScoreTier): Promise<void> {
    await this.prisma.lead.updateMany({
      where: { id: leadId, tenantId },
      data: { currentScoreTier: tier as "HOT" | "WARM" | "COLD" },
    });
  }
}
