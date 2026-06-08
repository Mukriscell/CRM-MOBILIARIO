import { randomBytes } from "crypto";
import { Inject, Injectable } from "@nestjs/common";
import { ITenantRepository, TENANT_REPOSITORY } from "../domain/tenant.repository.interface";
import { NotFoundError } from "../../../shared/errors/domain-error";

export interface GenerateWebhookKeyResult {
  apiKey: string;
}

@Injectable()
export class GenerateWebhookKeyUseCase {
  constructor(@Inject(TENANT_REPOSITORY) private readonly tenants: ITenantRepository) {}

  async execute(tenantId: string): Promise<GenerateWebhookKeyResult> {
    const tenant = await this.tenants.findById(tenantId);
    if (!tenant) throw new NotFoundError("Tenant no encontrado");

    const apiKey = "clientra_wh_" + randomBytes(20).toString("hex");
    await this.tenants.setWebhookApiKey(tenantId, apiKey);
    return { apiKey };
  }
}
