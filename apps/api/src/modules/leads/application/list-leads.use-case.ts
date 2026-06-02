import { Inject, Injectable } from "@nestjs/common";
import { Paginated } from "@clientra/shared-types";
import { ILeadRepository, LEAD_REPOSITORY, LeadListFilters } from "../domain/lead.repository.interface";
import { LeadResponse, toLeadResponse } from "./lead-response.dto";

@Injectable()
export class ListLeadsUseCase {
  constructor(@Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository) {}

  async execute(
    tenantId: string,
    filters: LeadListFilters,
    cursor: string | null,
    limit: number,
  ): Promise<Paginated<LeadResponse>> {
    const safeLimit = Math.min(Math.max(limit || 25, 1), 100);
    const result = await this.leads.listByCursor(tenantId, filters, cursor, safeLimit);
    return {
      data: result.items.map(toLeadResponse),
      pagination: { nextCursor: result.nextCursor, hasMore: result.hasMore, limit: safeLimit },
    };
  }
}
