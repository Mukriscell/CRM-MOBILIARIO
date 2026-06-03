import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { Paginated } from "@clientra/shared-types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { ListLeadsUseCase } from "../application/list-leads.use-case";
import { GetLeadUseCase } from "../application/get-lead.use-case";
import { GetLeadStatsUseCase } from "../application/get-lead-stats.use-case";
import { LeadResponse } from "../application/lead-response.dto";

/**
 * Bandeja de Leads (FASE 10): la pantalla más importante.
 * GET /api/v1/leads — lista con filtros + paginación cursor.
 */
@Controller("leads")
@UseGuards(JwtAuthGuard)
export class LeadController {
  constructor(
    private readonly listLeads: ListLeadsUseCase,
    private readonly getLead: GetLeadUseCase,
    private readonly getStats: GetLeadStatsUseCase,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  async list(
    @Query("status") status?: string,
    @Query("source") source?: string,
    @Query("assignedUserId") assignedUserId?: string,
    @Query("unresponded") unresponded?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ): Promise<Paginated<LeadResponse>> {
    const tenantId = this.tenantContext.requireTenantId();
    return this.listLeads.execute(
      tenantId,
      { status, source, assignedUserId, unresponded: unresponded === "true" },
      cursor ?? null,
      limit ? Number(limit) : 25,
    );
  }

  @Get("stats")
  async stats() {
    const tenantId = this.tenantContext.requireTenantId();
    return { data: await this.getStats.execute(tenantId) };
  }

  @Get(":id")
  async detail(@Param("id") id: string): Promise<{ data: LeadResponse }> {
    const tenantId = this.tenantContext.requireTenantId();
    return { data: await this.getLead.execute(tenantId, id) };
  }
}
