import { Inject, Injectable } from "@nestjs/common";
import { LeadStatus } from "@prisma/client";
import { ILeadRepository, LEAD_REPOSITORY } from "../domain/lead.repository.interface";
import { NotFoundError, ValidationError } from "../../../shared/errors/domain-error";

const VALID_STATUSES = Object.values(LeadStatus) as string[];

@Injectable()
export class UpdateLeadStatusUseCase {
  constructor(@Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository) {}

  async execute(tenantId: string, leadId: string, status: string): Promise<void> {
    if (!VALID_STATUSES.includes(status)) {
      throw new ValidationError(`Estado inválido: ${status}`);
    }
    try {
      await this.leads.updateStatus(tenantId, leadId, status as LeadStatus);
    } catch {
      throw new NotFoundError(`Lead ${leadId} no encontrado`);
    }
  }
}
