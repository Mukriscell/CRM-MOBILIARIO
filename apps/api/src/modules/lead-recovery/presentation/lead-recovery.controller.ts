import { Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { GetRecoveryCandidatesUseCase } from "../application/get-recovery-candidates.use-case";
import { ReactivateLeadUseCase } from "../application/reactivate-lead.use-case";
import { ArchiveLeadUseCase } from "../application/archive-lead.use-case";
import { GetRecoveryStatsUseCase } from "../application/get-recovery-stats.use-case";

@Controller("lead-recovery")
@UseGuards(JwtAuthGuard)
export class LeadRecoveryController {
  constructor(
    private readonly getCandidates: GetRecoveryCandidatesUseCase,
    private readonly reactivate: ReactivateLeadUseCase,
    private readonly archive: ArchiveLeadUseCase,
    private readonly getStats: GetRecoveryStatsUseCase,
    private readonly ctx: TenantContextService,
  ) {}

  /** GET /api/v1/lead-recovery/candidates */
  @Get("candidates")
  async candidates() {
    return { data: await this.getCandidates.execute(this.ctx.requireTenantId()) };
  }

  /** GET /api/v1/lead-recovery/stats */
  @Get("stats")
  async stats() {
    return { data: await this.getStats.execute(this.ctx.requireTenantId()) };
  }

  /** POST /api/v1/lead-recovery/:id/reactivate — id = leadId */
  @Post(":id/reactivate")
  @HttpCode(200)
  async reactivateLead(@Param("id") id: string) {
    return { data: await this.reactivate.execute(this.ctx.requireTenantId(), id) };
  }

  /** POST /api/v1/lead-recovery/:id/archive — id = leadId */
  @Post(":id/archive")
  @HttpCode(200)
  async archiveLead(@Param("id") id: string) {
    return { data: await this.archive.execute(this.ctx.requireTenantId(), id) };
  }
}
