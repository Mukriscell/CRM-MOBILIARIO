import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { VisitStatus } from "@prisma/client";
import { IVisitRepository, VISIT_REPOSITORY } from "../domain/visit.repository.interface";
import { VISIT_REMINDER_QUEUE, VisitReminderJobData, VisitView } from "../domain/visit.entity";
import { ValidationError } from "../../../shared/errors/domain-error";

const VALID_STATUSES = Object.values(VisitStatus) as string[];
const CANCELLING: VisitStatus[] = ["CANCELLED", "NO_SHOW"];

@Injectable()
export class UpdateVisitStatusUseCase {
  private readonly logger = new Logger(UpdateVisitStatusUseCase.name);

  constructor(
    @Inject(VISIT_REPOSITORY) private readonly visits: IVisitRepository,
    @InjectQueue(VISIT_REMINDER_QUEUE) private readonly queue: Queue<VisitReminderJobData>,
  ) {}

  async execute(tenantId: string, visitId: string, status: string): Promise<VisitView> {
    if (!VALID_STATUSES.includes(status)) {
      throw new ValidationError(`Estado de visita inválido: ${status}`);
    }

    const visit = await this.visits.updateStatus(tenantId, visitId, status as VisitStatus);

    // Al cancelar o marcar no-show, cancela los recordatorios pendientes y sus jobs.
    if (CANCELLING.includes(status as VisitStatus)) {
      const cancelledIds = await this.visits.cancelPendingReminders(tenantId, visitId);
      for (const id of cancelledIds) {
        const job = await this.queue.getJob(id);
        await job?.remove().catch((err) => {
          this.logger.warn(`No se pudo remover el job de recordatorio ${id}: ${(err as Error).message}`);
        });
      }
    }

    return visit;
  }
}
