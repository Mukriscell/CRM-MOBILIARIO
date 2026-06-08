import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { TENANT_REPOSITORY } from "./domain/tenant.repository.interface";
import { PrismaTenantRepository } from "./infrastructure/prisma-tenant.repository";
import { GenerateWebhookKeyUseCase } from "./application/generate-webhook-key.use-case";
import { TenantController } from "./presentation/tenant.controller";

@Module({
  imports: [AuthModule],
  controllers: [TenantController],
  providers: [
    { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
    GenerateWebhookKeyUseCase,
  ],
  exports: [TENANT_REPOSITORY],
})
export class TenantModule {}
