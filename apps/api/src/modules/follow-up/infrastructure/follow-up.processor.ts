import { Injectable, Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { FOLLOW_UP_JOB, FOLLOW_UP_QUEUE, FollowUpJobData } from "../domain/follow-up.entity";
import { ExecuteFollowUpUseCase } from "../application/execute-follow-up.use-case";

@Processor(FOLLOW_UP_QUEUE)
@Injectable()
export class FollowUpProcessor extends WorkerHost {
  private readonly logger = new Logger(FollowUpProcessor.name);

  constructor(private readonly executeFollowUp: ExecuteFollowUpUseCase) {
    super();
  }

  async process(job: Job<FollowUpJobData>): Promise<void> {
    if (job.name !== FOLLOW_UP_JOB) return;

    const { tenantId, followUpId } = job.data;
    this.logger.log(`Procesando follow-up ${followUpId} (intento ${job.attemptsMade + 1})`);

    await this.executeFollowUp.execute(tenantId, followUpId);
  }
}
