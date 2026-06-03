import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { LeadFollowUp } from "@prisma/client";
import { FOLLOW_UP_REPOSITORY, IFollowUpRepository } from "../domain/follow-up.repository.interface";

@Injectable()
export class ExecuteFollowUpUseCase {
  private readonly logger = new Logger(ExecuteFollowUpUseCase.name);

  constructor(
    @Inject(FOLLOW_UP_REPOSITORY) private readonly repo: IFollowUpRepository,
  ) {}

  async execute(tenantId: string, id: string): Promise<LeadFollowUp> {
    const fu = await this.repo.findById(id);
    if (!fu || fu.tenantId !== tenantId) throw new NotFoundException("Follow-up no encontrado");
    if (fu.status !== "PENDING") {
      this.logger.warn(`Follow-up ${id} ya está en estado ${fu.status}, saltando`);
      return fu;
    }

    const executed = await this.repo.markExecuted(id);
    this.logger.log(`Follow-up ${id} ejecutado (lead ${fu.leadId}, paso día ${fu.sequenceStep})`);
    return executed;
  }
}
