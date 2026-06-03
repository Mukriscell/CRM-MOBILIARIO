import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import type { LeadRecovery } from "@prisma/client";
import { ILeadRecoveryRepository, LEAD_RECOVERY_REPOSITORY } from "../domain/lead-recovery.repository.interface";

@Injectable()
export class ArchiveLeadUseCase {
  constructor(
    @Inject(LEAD_RECOVERY_REPOSITORY)
    private readonly repo: ILeadRecoveryRepository,
  ) {}

  async execute(tenantId: string, leadId: string): Promise<LeadRecovery> {
    const candidate = await this.repo.findCandidateById(tenantId, leadId);
    if (!candidate) {
      throw new NotFoundException(`Lead ${leadId} no es candidato de recuperación o ya fue procesado.`);
    }

    const record = await this.repo.create({
      tenantId,
      leadId,
      inactivityThreshold: candidate.threshold,
      outcome: "LOST",
      recoveryAction: { type: "ARCHIVE", archivedAt: new Date().toISOString() },
    });

    await this.repo.updateLeadStatus(tenantId, leadId, "PERDIDO");

    return record;
  }
}
