import { Inject, Injectable } from "@nestjs/common";
import { LeadScore } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/domain-error";
import { DomainEventBus } from "../../../shared/events/domain-event-bus";
import { LeadScoredEvent } from "../../../shared/events/domain-event";
import { ILeadRepository, LEAD_REPOSITORY } from "../../leads/domain/lead.repository.interface";
import { IScoringProvider, SCORING_PROVIDER } from "../domain/scoring-provider.interface";
import { ILeadScoreRepository, LEAD_SCORE_REPOSITORY } from "../domain/lead-score.repository.interface";

@Injectable()
export class CalculateLeadScoreUseCase {
  constructor(
    @Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository,
    @Inject(SCORING_PROVIDER) private readonly provider: IScoringProvider,
    @Inject(LEAD_SCORE_REPOSITORY) private readonly scores: ILeadScoreRepository,
    private readonly events: DomainEventBus,
  ) {}

  async execute(tenantId: string, leadId: string): Promise<LeadScore> {
    const lead = await this.leads.findById(tenantId, leadId);
    if (!lead) throw new NotFoundError(`Lead ${leadId} no encontrado`);

    const result = await this.provider.score(lead);
    // El proveedor IA marca result.source = "AI"; el heurístico (o un fallback) deja "HEURISTIC".
    const saved = await this.scores.save(tenantId, leadId, result, result.source ?? "HEURISTIC");
    await this.scores.updateLeadTier(tenantId, leadId, result.tier);
    this.events.publish(new LeadScoredEvent(tenantId, leadId, result.scoreValue, result.tier));
    return saved;
  }
}
