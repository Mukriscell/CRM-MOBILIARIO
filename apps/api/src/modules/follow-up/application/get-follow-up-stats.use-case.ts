import { Inject, Injectable } from "@nestjs/common";
import { FOLLOW_UP_REPOSITORY, IFollowUpRepository } from "../domain/follow-up.repository.interface";
import { FollowUpStats } from "../domain/follow-up.entity";

@Injectable()
export class GetFollowUpStatsUseCase {
  constructor(
    @Inject(FOLLOW_UP_REPOSITORY) private readonly repo: IFollowUpRepository,
  ) {}

  async execute(tenantId: string): Promise<FollowUpStats> {
    return this.repo.stats(tenantId);
  }
}
