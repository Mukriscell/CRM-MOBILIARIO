import { Injectable, Inject, NotFoundException } from "@nestjs/common";
import type { LeadRecovery } from "@prisma/client";
import { ILeadRecoveryRepository, LEAD_RECOVERY_REPOSITORY } from "../domain/lead-recovery.repository.interface";
import { DomainEventBus } from "../../../shared/events/domain-event-bus";
import { LeadRecoveredEvent } from "../../../shared/events/domain-event";

@Injectable()
export class ReactivateLeadUseCase {
  constructor(
    @Inject(LEAD_RECOVERY_REPOSITORY)
    private readonly repo: ILeadRecoveryRepository,
    private readonly events: DomainEventBus,
  ) {}

  async execute(tenantId: string, leadId: string): Promise<LeadRecovery> {
    const candidate = await this.repo.findCandidateById(tenantId, leadId);
    if (!candidate) {
      throw new NotFoundException(`Lead ${leadId} no es candidato de recuperación o no está inactivo.`);
    }

    const record = await this.repo.create({
      tenantId,
      leadId,
      inactivityThreshold: candidate.threshold,
      outcome: "REACTIVATED",
      recoveryAction: { type: "MANUAL", initiatedAt: new Date().toISOString() },
    });

    await this.repo.updateLeadStatus(tenantId, leadId, "CONTACTADO");
    this.events.publish(new LeadRecoveredEvent(tenantId, leadId));

    return record;
  }
}
