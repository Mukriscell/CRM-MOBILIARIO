import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { UserRole } from "@clientra/shared-types";
import { AssignLeadUseCase } from "../../leads/application/assign-lead.use-case";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { RolesGuard } from "../../auth/infrastructure/roles.guard";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { ZodValidationPipe } from "../../../shared/pipes/zod-validation.pipe";

const AssignSchema = z.object({ leadId: z.string().uuid(), userId: z.string().uuid(), reason: z.string().optional() });
type AssignInput = z.infer<typeof AssignSchema>;

/** Override manual del ruteo automático (FASE 9: /lead-router/assign). */
@Controller("lead-router")
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeadRouterController {
  constructor(
    private readonly assignLead: AssignLeadUseCase,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Post("assign")
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async assign(@Body(new ZodValidationPipe(AssignSchema)) body: AssignInput) {
    const tenantId = this.tenantContext.requireTenantId();
    const lead = await this.assignLead.execute({
      tenantId,
      leadId: body.leadId,
      userId: body.userId,
      by: "MANUAL",
      reason: { note: body.reason },
    });
    return { data: { leadId: lead.id, assignedUserId: lead.assignedUserId, assignedBy: "MANUAL" } };
  }
}
