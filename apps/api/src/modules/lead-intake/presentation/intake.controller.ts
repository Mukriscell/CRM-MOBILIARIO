import { Body, Controller, Headers, HttpCode, Inject, Post, UseGuards, UsePipes } from "@nestjs/common";
import { Throttle, ThrottlerGuard } from "@nestjs/throttler";
import { LeadIntakeSchema, LeadIntakeInput } from "@clientra/shared-types";
import { IngestLeadUseCase } from "../application/ingest-lead.use-case";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { ZodValidationPipe } from "../../../shared/pipes/zod-validation.pipe";
import { ITenantRepository, TENANT_REPOSITORY } from "../../tenant/domain/tenant.repository.interface";
import { UnauthorizedError } from "../../../shared/errors/domain-error";

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
   * Webhook genérico de formularios/landing. El tenant se resuelve por API key
   * (header X-Api-Key generado con POST /tenants/api-key). SEC-06.
   * Rate limit: 30 leads/min por IP para evitar flood (LLM04/SEC-06).
   */
  @Post("webhook/forms")
  @HttpCode(202)
  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UsePipes(new ZodValidationPipe(LeadIntakeSchema))
  async ingestFormsWebhook(
    @Headers("x-api-key") apiKey: string | undefined,
    @Body() body: LeadIntakeInput,
  ) {
    if (!apiKey) throw new UnauthorizedError("X-Api-Key header requerido");
    const tenant = await this.tenants.findByWebhookApiKey(apiKey);
    if (!tenant) throw new UnauthorizedError("API key inválida");
    const result = await this.ingest.execute(tenant.id, body);
    return { data: { ...result, status: "ACCEPTED" } };
  }
}
