import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { Paginated, UserRole } from "@clientra/shared-types";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { RolesGuard } from "../../auth/infrastructure/roles.guard";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { ListLeadsUseCase } from "../application/list-leads.use-case";
import { GetLeadUseCase } from "../application/get-lead.use-case";
import { GetLeadStatsUseCase } from "../application/get-lead-stats.use-case";
import { DeleteLeadUseCase } from "../application/delete-lead.use-case";
import { UpdateLeadStatusUseCase } from "../application/update-lead-status.use-case";
import { ValidationError } from "../../../shared/errors/domain-error";
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
    private readonly deleteLead: DeleteLeadUseCase,
    private readonly updateLeadStatus: UpdateLeadStatusUseCase,
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

  /** PATCH /api/v1/leads/:id/status — mueve el lead de etapa en el pipeline. */
  @Patch(":id/status")
  @HttpCode(200)
  async changeStatus(
    @Param("id") id: string,
    @Body() body: { status?: string },
  ): Promise<{ ok: boolean }> {
    const tenantId = this.tenantContext.requireTenantId();
    if (!body?.status) throw new ValidationError("status es requerido");
    await this.updateLeadStatus.execute(tenantId, id, body.status);
    return { ok: true };
  }

  /** DELETE /api/v1/leads/:id — soft delete. Solo ADMIN. */
  @Delete(":id")
  @HttpCode(200)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param("id") id: string): Promise<{ ok: boolean }> {
    const tenantId = this.tenantContext.requireTenantId();
    await this.deleteLead.execute(tenantId, id);
    return { ok: true };
  }
}
