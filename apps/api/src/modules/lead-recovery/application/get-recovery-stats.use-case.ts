import { Injectable, Inject } from "@nestjs/common";
import { ILeadRecoveryRepository, LEAD_RECOVERY_REPOSITORY } from "../domain/lead-recovery.repository.interface";
import type { RecoveryStats } from "../domain/lead-recovery.entity";

@Injectable()
export class GetRecoveryStatsUseCase {
  constructor(
    @Inject(LEAD_RECOVERY_REPOSITORY)
    private readonly repo: ILeadRecoveryRepository,
  ) {}

  execute(tenantId: string): Promise<RecoveryStats> {
    return this.repo.stats(tenantId);
  }
}
