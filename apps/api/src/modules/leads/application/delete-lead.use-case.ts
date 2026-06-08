import { Inject, Injectable } from "@nestjs/common";
import { ILeadRepository, LEAD_REPOSITORY } from "../domain/lead.repository.interface";
import { NotFoundError } from "../../../shared/errors/domain-error";

@Injectable()
export class DeleteLeadUseCase {
  constructor(@Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository) {}

  async execute(tenantId: string, leadId: string): Promise<void> {
    try {
      await this.leads.softDelete(tenantId, leadId);
    } catch {
      throw new NotFoundError(`Lead ${leadId} no encontrado o ya fue eliminado`);
    }
  }
}
