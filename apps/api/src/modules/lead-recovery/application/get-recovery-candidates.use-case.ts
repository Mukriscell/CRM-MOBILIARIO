import { Injectable, Inject } from "@nestjs/common";
import { ILeadRecoveryRepository, LEAD_RECOVERY_REPOSITORY } from "../domain/lead-recovery.repository.interface";
import type { RecoveryCandidate } from "../domain/lead-recovery.entity";

@Injectable()
export class GetRecoveryCandidatesUseCase {
  constructor(
    @Inject(LEAD_RECOVERY_REPOSITORY)
    private readonly repo: ILeadRecoveryRepository,
  ) {}

  execute(tenantId: string): Promise<RecoveryCandidate[]> {
    return this.repo.findCandidates(tenantId);
  }
}
