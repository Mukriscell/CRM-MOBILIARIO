import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { LEAD_RECOVERY_REPOSITORY } from "./domain/lead-recovery.repository.interface";
import { PrismaLeadRecoveryRepository } from "./infrastructure/prisma-lead-recovery.repository";
import { GetRecoveryCandidatesUseCase } from "./application/get-recovery-candidates.use-case";
import { ReactivateLeadUseCase } from "./application/reactivate-lead.use-case";
import { ArchiveLeadUseCase } from "./application/archive-lead.use-case";
import { GetRecoveryStatsUseCase } from "./application/get-recovery-stats.use-case";
import { LeadRecoveryController } from "./presentation/lead-recovery.controller";

@Module({
  imports: [AuthModule],
  controllers: [LeadRecoveryController],
  providers: [
    { provide: LEAD_RECOVERY_REPOSITORY, useClass: PrismaLeadRecoveryRepository },
    GetRecoveryCandidatesUseCase,
    ReactivateLeadUseCase,
    ArchiveLeadUseCase,
    GetRecoveryStatsUseCase,
  ],
})
export class LeadRecoveryModule {}
