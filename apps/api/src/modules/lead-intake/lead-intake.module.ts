import { Module } from "@nestjs/common";
import { LeadsModule } from "../leads/leads.module";
import { TenantModule } from "../tenant/tenant.module";
import { AuthModule } from "../auth/auth.module";
import { IngestLeadUseCase } from "./application/ingest-lead.use-case";
import { IntakeController } from "./presentation/intake.controller";

@Module({
  imports: [LeadsModule, TenantModule, AuthModule],
  controllers: [IntakeController],
  providers: [IngestLeadUseCase],
})
export class LeadIntakeModule {}
