import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { FOLLOW_UP_REPOSITORY, IFollowUpRepository } from "../domain/follow-up.repository.interface";
import { CADENCE_DAYS, FOLLOW_UP_JOB, FOLLOW_UP_QUEUE, FollowUpJobData } from "../domain/follow-up.entity";

@Injectable()
export class ScheduleFollowUpUseCase {
  private readonly logger = new Logger(ScheduleFollowUpUseCase.name);

  constructor(
    @Inject(FOLLOW_UP_REPOSITORY) private readonly repo: IFollowUpRepository,
    @InjectQueue(FOLLOW_UP_QUEUE) private readonly queue: Queue<FollowUpJobData>,
  ) {}

  async execute(tenantId: string, leadId: string): Promise<void> {
    const now = Date.now();
    const inputs = CADENCE_DAYS.map((days) => ({
      tenantId,
      leadId,
      sequenceStep: days,
      scheduledAt: new Date(now + days * 24 * 60 * 60 * 1000),
    }));

    const followUps = await this.repo.createMany(inputs);

    for (const fu of followUps) {
      const delay = Math.max(0, fu.scheduledAt.getTime() - Date.now());
      await this.queue.add(
        FOLLOW_UP_JOB,
        { tenantId, leadId, followUpId: fu.id },
        {
          jobId: fu.id,
          delay,
          attempts: 3,
          backoff: { type: "exponential", delay: 60_000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }

    this.logger.log(`Cadencia programada para lead ${leadId} (${CADENCE_DAYS.join("/")} días)`);
  }
}
