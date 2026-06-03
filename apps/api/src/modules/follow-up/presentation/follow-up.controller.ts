import { Controller, Get, HttpCode, Param, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { ListFollowUpsUseCase, FollowUpFilter } from "../application/list-follow-ups.use-case";
import { ExecuteFollowUpUseCase } from "../application/execute-follow-up.use-case";
import { CancelFollowUpUseCase } from "../application/cancel-follow-up.use-case";
import { GetFollowUpStatsUseCase } from "../application/get-follow-up-stats.use-case";

@Controller("follow-ups")
@UseGuards(JwtAuthGuard)
export class FollowUpController {
  constructor(
    private readonly list: ListFollowUpsUseCase,
    private readonly execute: ExecuteFollowUpUseCase,
    private readonly cancel: CancelFollowUpUseCase,
    private readonly stats: GetFollowUpStatsUseCase,
    private readonly ctx: TenantContextService,
  ) {}

  /** GET /api/v1/follow-ups?filter=pending|executed|overdue|cancelled */
  @Get()
  async getAll(@Query("filter") filter?: FollowUpFilter) {
    const tenantId = this.ctx.requireTenantId();
    return { data: await this.list.execute(tenantId, filter ?? "all") };
  }

  /** GET /api/v1/follow-ups/stats */
  @Get("stats")
  async getStats() {
    const tenantId = this.ctx.requireTenantId();
    return { data: await this.stats.execute(tenantId) };
  }

  /** POST /api/v1/follow-ups/:id/execute */
  @Post(":id/execute")
  @HttpCode(200)
  async executeOne(@Param("id") id: string) {
    const tenantId = this.ctx.requireTenantId();
    return { data: await this.execute.execute(tenantId, id) };
  }

  /** POST /api/v1/follow-ups/:id/cancel */
  @Post(":id/cancel")
  @HttpCode(200)
  async cancelOne(@Param("id") id: string) {
    const tenantId = this.ctx.requireTenantId();
    await this.cancel.executeOne(tenantId, id);
    return { data: { cancelled: true } };
  }
}
