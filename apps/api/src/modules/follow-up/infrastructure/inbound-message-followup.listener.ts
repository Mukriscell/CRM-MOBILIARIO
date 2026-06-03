import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { InboundMessageReceivedEvent } from "../../../shared/events/domain-event";
import { CancelFollowUpUseCase } from "../application/cancel-follow-up.use-case";

@Injectable()
export class InboundMessageFollowUpListener {
  private readonly logger = new Logger(InboundMessageFollowUpListener.name);

  constructor(private readonly cancel: CancelFollowUpUseCase) {}

  @OnEvent("lead.message.received")
  async handle(event: InboundMessageReceivedEvent): Promise<void> {
    try {
      await this.cancel.executeAllForLead(
        event.tenantId,
        event.leadId,
        "lead respondió — cadencia cancelada automáticamente",
      );
    } catch (err) {
      this.logger.error(`Error al cancelar cadencia para lead ${event.leadId}: ${(err as Error).message}`);
    }
  }
}
