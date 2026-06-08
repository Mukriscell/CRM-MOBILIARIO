import { Controller, HttpCode, Post, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/infrastructure/jwt-auth.guard";
import { RolesGuard } from "../../auth/infrastructure/roles.guard";
import { Roles } from "../../../shared/decorators/roles.decorator";
import { TenantContextService } from "../../../shared/context/tenant-context.service";
import { GenerateWebhookKeyUseCase } from "../application/generate-webhook-key.use-case";
import { UserRole } from "@clientra/shared-types";

@Controller("tenants")
@UseGuards(JwtAuthGuard, RolesGuard)
export class TenantController {
  constructor(
    private readonly generateKey: GenerateWebhookKeyUseCase,
    private readonly tenantContext: TenantContextService,
  ) {}

  /**
   * Genera (o rota) la API key del webhook de formularios del tenant.
   * Devuelve la clave completa UNA sola vez — el admin debe copiarla.
   * ADMIN only (SEC-06).
   */
  @Post("api-key")
  @HttpCode(200)
  @Roles(UserRole.ADMIN)
  async generateApiKey(): Promise<{ data: { apiKey: string } }> {
    const tenantId = this.tenantContext.requireTenantId();
    const result = await this.generateKey.execute(tenantId);
    return { data: result };
  }
}
