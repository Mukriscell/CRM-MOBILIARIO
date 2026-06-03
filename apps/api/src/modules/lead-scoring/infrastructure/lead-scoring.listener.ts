import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { LeadCreatedEvent } from "../../../shared/events/domain-event";
import { CalculateLeadScoreUseCase } from "../application/calculate-lead-score.use-case";

@Injectable()
export class LeadScoringListener {
  private readonly logger = new Logger(LeadScoringListener.name);

  constructor(private readonly calculateScore: CalculateLeadScoreUseCase) {}

  @OnEvent("lead.created")
  async handle(event: LeadCreatedEvent): Promise<void> {
    try {
      await this.calculateScore.execute(event.tenantId, event.leadId);
    } catch (err) {
      this.logger.error(`Score fallido para lead ${event.leadId}: ${(err as Error).message}`);
    }
  }
}
