import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { LeadCreatedEvent } from "../../../shared/events/domain-event";
import { ScheduleFollowUpUseCase } from "../application/schedule-follow-up.use-case";

@Injectable()
export class LeadCreatedFollowUpListener {
  private readonly logger = new Logger(LeadCreatedFollowUpListener.name);

  constructor(private readonly schedule: ScheduleFollowUpUseCase) {}

  @OnEvent("lead.created")
  async handle(event: LeadCreatedEvent): Promise<void> {
    try {
      await this.schedule.execute(event.tenantId, event.leadId);
    } catch (err) {
      this.logger.error(`Error al programar cadencia para lead ${event.leadId}: ${(err as Error).message}`);
    }
  }
}
