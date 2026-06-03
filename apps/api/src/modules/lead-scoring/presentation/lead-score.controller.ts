import { Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { GetLeadScoreUseCase } from "../application/get-lead-score.use-case";
import { RecalculateLeadScoreUseCase } from "../application/recalculate-lead-score.use-case";

@Controller("leads")
@UseGuards(JwtAuthGuard)
export class LeadScoreController {
  constructor(
    private readonly getScore: GetLeadScoreUseCase,
    private readonly recalculate: RecalculateLeadScoreUseCase,
    private readonly ctx: TenantContextService,
  ) {}

  /** GET /api/v1/leads/:id/score — score actual e histórico. */
  @Get(":id/score")
  async score(@Param("id") id: string) {
    const tenantId = this.ctx.requireTenantId();
    return { data: await this.getScore.execute(tenantId, id) };
  }

  /** POST /api/v1/leads/:id/recalculate — dispara recálculo y devuelve nuevo score. */
  @Post(":id/recalculate")
  @HttpCode(200)
  async recalculateScore(@Param("id") id: string) {
    const tenantId = this.ctx.requireTenantId();
    return { data: await this.recalculate.execute(tenantId, id) };
  }
}
