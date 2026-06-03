import { Inject, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { FOLLOW_UP_REPOSITORY, IFollowUpRepository } from "../domain/follow-up.repository.interface";
import { FOLLOW_UP_QUEUE, FollowUpJobData } from "../domain/follow-up.entity";

@Injectable()
export class CancelFollowUpUseCase {
  private readonly logger = new Logger(CancelFollowUpUseCase.name);

  constructor(
    @Inject(FOLLOW_UP_REPOSITORY) private readonly repo: IFollowUpRepository,
    @InjectQueue(FOLLOW_UP_QUEUE) private readonly queue: Queue<FollowUpJobData>,
  ) {}

  /** Cancela un follow-up específico por ID. */
  async executeOne(tenantId: string, id: string, reason = "cancelado manualmente"): Promise<void> {
    const fu = await this.repo.findById(id);
    if (!fu || fu.tenantId !== tenantId) throw new NotFoundException("Follow-up no encontrado");
    if (fu.status !== "PENDING") return;

    await this.repo.markFailed(id, reason);
    const job = await this.queue.getJob(id);
    if (job) await job.remove();
  }

  /** Cancela todos los follow-ups PENDING de un lead (ej. cuando responde). */
  async executeAllForLead(tenantId: string, leadId: string, reason: string): Promise<void> {
    const pending = await this.repo.findByLead(tenantId, leadId);
    const toCancel = pending.filter((f) => f.status === "PENDING");

    await this.repo.cancelAllPendingForLead(tenantId, leadId, reason);

    for (const fu of toCancel) {
      const job = await this.queue.getJob(fu.id);
      if (job) await job.remove();
    }

    if (toCancel.length > 0) {
      this.logger.log(`${toCancel.length} follow-up(s) cancelados para lead ${leadId}: ${reason}`);
    }
  }
}
