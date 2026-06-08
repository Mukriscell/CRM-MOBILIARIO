import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { ListVisitsUseCase } from "../application/list-visits.use-case";
import { GetVisitUseCase } from "../application/get-visit.use-case";
import { ScheduleVisitUseCase } from "../application/schedule-visit.use-case";
import { UpdateVisitStatusUseCase } from "../application/update-visit-status.use-case";
import { ValidationError } from "../../../shared/errors/domain-error";

interface ScheduleVisitBody {
  leadId?: string;
  propertyId?: string;
  userId?: string;
  scheduledAt?: string;
  notes?: string;
}

@Controller("visits")
@UseGuards(JwtAuthGuard)
export class VisitController {
  constructor(
    private readonly listVisits: ListVisitsUseCase,
    private readonly getVisit: GetVisitUseCase,
    private readonly scheduleVisit: ScheduleVisitUseCase,
    private readonly updateVisitStatus: UpdateVisitStatusUseCase,
    private readonly ctx: TenantContextService,
  ) {}

  @Get()
  async list(
    @Query("status") status?: string,
    @Query("userId") userId?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    const tenantId = this.ctx.requireTenantId();
    return {
      data: await this.listVisits.execute(tenantId, {
        status,
        userId,
        from: from ? new Date(from) : undefined,
        to: to ? new Date(to) : undefined,
      }),
    };
  }

  @Get(":id")
  async detail(@Param("id") id: string) {
    return { data: await this.getVisit.execute(this.ctx.requireTenantId(), id) };
  }

  @Post()
  @HttpCode(201)
  async create(@Body() body: ScheduleVisitBody) {
    const tenantId = this.ctx.requireTenantId();
    if (!body?.leadId) throw new ValidationError("leadId es requerido");
    if (!body?.propertyId) throw new ValidationError("propertyId es requerido");
    if (!body?.scheduledAt) throw new ValidationError("scheduledAt es requerido");

    // Por defecto, el corredor es el usuario autenticado.
    const userId = body.userId ?? this.ctx.userId;
    if (!userId) throw new ValidationError("userId (corredor) es requerido");

    return {
      data: await this.scheduleVisit.execute(tenantId, {
        leadId: body.leadId,
        propertyId: body.propertyId,
        userId,
        scheduledAt: new Date(body.scheduledAt),
        notes: body.notes ?? null,
      }),
    };
  }

  /** PATCH /api/v1/visits/:id/status — confirma/completa/cancela una visita. */
  @Patch(":id/status")
  @HttpCode(200)
  async changeStatus(@Param("id") id: string, @Body() body: { status?: string }) {
    const tenantId = this.ctx.requireTenantId();
    if (!body?.status) throw new ValidationError("status es requerido");
    return { data: await this.updateVisitStatus.execute(tenantId, id, body.status) };
  }
}
