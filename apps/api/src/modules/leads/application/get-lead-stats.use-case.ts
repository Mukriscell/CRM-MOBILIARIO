import { Inject, Injectable } from "@nestjs/common";
import { ILeadRepository, LEAD_REPOSITORY, LeadStats } from "../domain/lead.repository.interface";

@Injectable()
export class GetLeadStatsUseCase {
  constructor(@Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository) {}

  execute(tenantId: string): Promise<LeadStats> {
    return this.leads.stats(tenantId);
  }
}
