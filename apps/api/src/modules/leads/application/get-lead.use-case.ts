import { Inject, Injectable } from "@nestjs/common";
import { ILeadRepository, LEAD_REPOSITORY } from "../domain/lead.repository.interface";
import { LeadResponse, toLeadResponse } from "./lead-response.dto";
import { NotFoundError } from "../../../shared/errors/domain-error";

@Injectable()
export class GetLeadUseCase {
  constructor(@Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository) {}

  async execute(tenantId: string, id: string): Promise<LeadResponse> {
    const lead = await this.leads.findById(tenantId, id);
    if (!lead) throw new NotFoundError("Lead no encontrado");
    return toLeadResponse(lead);
  }
}
