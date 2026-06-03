import { Body, Controller, HttpCode, Inject, Post, UseGuards, UsePipes } from "@nestjs/common";
import { LeadIntakeSchema, LeadIntakeInput } from "@clientra/shared-types";
import { IngestLeadUseCase } from "../application/ingest-lead.use-case";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { ZodValidationPipe } from "../../../shared/pipes/zod-validation.pipe";
import { ITenantRepository, TENANT_REPOSITORY } from "../../tenant/domain/tenant.repository.interface";
import { NotFoundError } from "../../../shared/errors/domain-error";

/**
 * Lead Intake (FASE 9): responde 202 (aceptado) para no bloquear el speed-to-lead.
 * En H1 el procesamiento es síncrono pero rápido; en H2+ se mueve a cola.
 */
@Controller("lead-intake")
export class IntakeController {
  constructor(
    private readonly ingest: IngestLeadUseCase,
    private readonly tenantContext: TenantContextService,
    @Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository,
  ) {}

  /** Ingesta autenticada (app / integraciones internas). Tenant del JWT. */
  @Post()
  @HttpCode(202)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ZodValidationPipe(LeadIntakeSchema))
  async ingestAuthenticated(@Body() body: LeadIntakeInput) {
    const tenantId = this.tenantContext.requireTenantId();
    const result = await this.ingest.execute(tenantId, body);
    return { data: { ...result, status: "ACCEPTED" } };
  }

  /**
   * Webhook genérico de formularios/landing. El tenant se resuelve por slug
   * (header X-Tenant-Slug). La verificación de firma HMAC se añade en H2.
   */
  @Post("webhook/forms")
  @HttpCode(202)
  @UsePipes(new ZodValidationPipe(LeadIntakeSchema))
  async ingestFormsWebhook(@Body() body: LeadIntakeInput) {
    const slug = (body.raw?.["tenantSlug"] as string) ?? null;
    if (!slug) throw new NotFoundError("tenantSlug requerido en el webhook");
    const tenant = await this.tenants.findBySlug(slug);
    if (!tenant) throw new NotFoundError("Tenant no encontrado");
    const result = await this.ingest.execute(tenant.id, body);
    return { data: { ...result, status: "ACCEPTED" } };
  }
}
