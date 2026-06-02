import { Inject, Injectable } from "@nestjs/common";
import { Lead } from "@prisma/client";
import { ILeadRepository, LEAD_REPOSITORY } from "../domain/lead.repository.interface";
import { DomainEventBus } from "../../../shared/events/domain-event-bus";
import { LeadAssignedEvent } from "../../../shared/events/domain-event";

export interface AssignLeadInput {
  tenantId: string;
  leadId: string;
  userId: string;
  by: "SYSTEM" | "MANUAL";
  reason?: unknown;
}

/** Asigna un lead a un corredor y emite LeadAssigned (gatilla speed-to-lead en H2). */
@Injectable()
export class AssignLeadUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository,
    private readonly events: DomainEventBus,
  ) {}

  async execute(input: AssignLeadInput): Promise<Lead> {
    const lead = await this.leads.assign(input.tenantId, input.leadId, input.userId, input.by, input.reason);
    this.events.publish(new LeadAssignedEvent(lead.tenantId, lead.id, input.userId, input.by));
    return lead;
  }
}
