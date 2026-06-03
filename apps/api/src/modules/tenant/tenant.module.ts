import { Module } from "@nestjs/common";
import { TENANT_REPOSITORY } from "./domain/tenant.repository.interface";
import { PrismaTenantRepository } from "./infrastructure/prisma-tenant.repository";

@Module({
  providers: [{ provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository }],
  exports: [TENANT_REPOSITORY],
})
export class TenantModule {}
