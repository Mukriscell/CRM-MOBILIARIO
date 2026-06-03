import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { LEAD_REPOSITORY } from "./domain/lead.repository.interface";
import { PrismaLeadRepository } from "./infrastructure/prisma-lead.repository";
import { CreateLeadUseCase } from "./application/create-lead.use-case";
import { AssignLeadUseCase } from "./application/assign-lead.use-case";
import { ListLeadsUseCase } from "./application/list-leads.use-case";
import { GetLeadUseCase } from "./application/get-lead.use-case";
import { GetLeadStatsUseCase } from "./application/get-lead-stats.use-case";
import { LeadController } from "./presentation/lead.controller";

/**
 * Módulo Lead: dueño de la entidad central. Expone CreateLeadUseCase y
 * AssignLeadUseCase como API pública para que lead-intake y lead-router
 * los usen SIN importar el repositorio (regla de FASE 5).
 */
@Module({
  imports: [AuthModule],
  controllers: [LeadController],
  providers: [
    { provide: LEAD_REPOSITORY, useClass: PrismaLeadRepository },
    CreateLeadUseCase,
    AssignLeadUseCase,
    ListLeadsUseCase,
    GetLeadUseCase,
    GetLeadStatsUseCase,
  ],
  exports: [CreateLeadUseCase, AssignLeadUseCase, GetLeadUseCase, LEAD_REPOSITORY],
})
export class LeadsModule {}
