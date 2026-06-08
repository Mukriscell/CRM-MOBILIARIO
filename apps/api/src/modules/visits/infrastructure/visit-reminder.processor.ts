import { Injectable, Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { VISIT_REMINDER_JOB, VISIT_REMINDER_QUEUE, VisitReminderJobData } from "../domain/visit.entity";
import { SendVisitReminderUseCase } from "../application/send-visit-reminder.use-case";

@Processor(VISIT_REMINDER_QUEUE)
@Injectable()
export class VisitReminderProcessor extends WorkerHost {
  private readonly logger = new Logger(VisitReminderProcessor.name);

  constructor(private readonly sendReminder: SendVisitReminderUseCase) {
    super();
  }

  async process(job: Job<VisitReminderJobData>): Promise<void> {
    if (job.name !== VISIT_REMINDER_JOB) return;

    const { tenantId, visitId, reminderId } = job.data;
    this.logger.log(`Procesando recordatorio ${reminderId} (intento ${job.attemptsMade + 1})`);

    await this.sendReminder.execute(tenantId, visitId, reminderId);
  }
}
