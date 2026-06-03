import { Inject, Injectable } from "@nestjs/common";
import { LeadFollowUp } from "@prisma/client";
import { FOLLOW_UP_REPOSITORY, IFollowUpRepository } from "../domain/follow-up.repository.interface";

export type FollowUpFilter = "all" | "pending" | "executed" | "overdue" | "cancelled";

@Injectable()
export class ListFollowUpsUseCase {
  constructor(
    @Inject(FOLLOW_UP_REPOSITORY) private readonly repo: IFollowUpRepository,
  ) {}

  async execute(tenantId: string, filter: FollowUpFilter = "all"): Promise<LeadFollowUp[]> {
    const all = await this.repo.findAllForTenant(tenantId);
    const now = new Date();

    switch (filter) {
      case "pending":
        return all.filter((f) => f.status === "PENDING" && f.scheduledAt > now);
      case "overdue":
        return all.filter((f) => f.status === "PENDING" && f.scheduledAt <= now);
      case "executed":
        return all.filter((f) => f.status === "SENT");
      case "cancelled":
        return all.filter((f) => f.status === "CANCELLED" || f.status === "FAILED");
      default:
        return all;
    }
  }
}
