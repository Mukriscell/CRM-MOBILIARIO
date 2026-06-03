import { Inject, Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { LeadCreatedEvent } from "../../../shared/events/domain-event";
import { ILeadRepository, LEAD_REPOSITORY } from "../../leads/domain/lead.repository.interface";
import { SendAutoResponseUseCase } from "../application/send-autoresponse.use-case";

/**
 * Speed-to-lead: al crear un lead, dispara la autorespuesta de WhatsApp.
 * Independiente del ruteo (lead-router) — ambos escuchan lead.created.
 */
@Injectable()
export class LeadCreatedAutoResponseListener {
  private readonly logger = new Logger(LeadCreatedAutoResponseListener.name);

  constructor(
    @Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository,
    private readonly autoResponse: SendAutoResponseUseCase,
  ) {}

  @OnEvent("lead.created")
  async handle(event: LeadCreatedEvent): Promise<void> {
    const lead = await this.leads.findById(event.tenantId, event.leadId);
    if (!lead || !lead.phone) {
      this.logger.debug(`Lead ${event.leadId} sin teléfono; sin autorespuesta`);
      return;
    }
    await this.autoResponse.execute({
      tenantId: event.tenantId,
      leadId: lead.id,
      phone: lead.phone,
      firstName: lead.firstName,
      assignedUserId: lead.assignedUserId,
    });
    this.logger.debug(`Autorespuesta enviada al lead ${lead.id}`);
  }
}
