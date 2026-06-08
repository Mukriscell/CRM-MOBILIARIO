import { Inject, Injectable, Logger } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { IVisitRepository, VISIT_REPOSITORY } from "../domain/visit.repository.interface";
import {
  REMINDER_OFFSETS_HOURS,
  ScheduleVisitInput,
  VISIT_REMINDER_JOB,
  VISIT_REMINDER_QUEUE,
  VisitReminderJobData,
  VisitView,
} from "../domain/visit.entity";
import { ILeadRepository, LEAD_REPOSITORY } from "../../leads/domain/lead.repository.interface";
import { IPropertyRepository, PROPERTY_REPOSITORY } from "../../properties/domain/property.repository.interface";
import { DomainEventBus } from "../../../shared/events/domain-event-bus";
import { VisitScheduledEvent } from "../../../shared/events/domain-event";
import { NotFoundError, ValidationError } from "../../../shared/errors/domain-error";

@Injectable()
export class ScheduleVisitUseCase {
  private readonly logger = new Logger(ScheduleVisitUseCase.name);

  constructor(
    @Inject(VISIT_REPOSITORY) private readonly visits: IVisitRepository,
    @Inject(LEAD_REPOSITORY) private readonly leads: ILeadRepository,
    @Inject(PROPERTY_REPOSITORY) private readonly properties: IPropertyRepository,
    @InjectQueue(VISIT_REMINDER_QUEUE) private readonly queue: Queue<VisitReminderJobData>,
    private readonly events: DomainEventBus,
  ) {}

  async execute(tenantId: string, input: ScheduleVisitInput): Promise<VisitView> {
    if (!input.leadId) throw new ValidationError("leadId es requerido");
    if (!input.propertyId) throw new ValidationError("propertyId es requerido");
    if (!input.userId) throw new ValidationError("userId (corredor) es requerido");
    if (!(input.scheduledAt instanceof Date) || isNaN(input.scheduledAt.getTime())) {
      throw new ValidationError("scheduledAt inválido");
    }
    if (input.scheduledAt.getTime() <= Date.now()) {
      throw new ValidationError("La visita debe agendarse en el futuro");
    }

    // Barreras de aislamiento por tenant.
    const lead = await this.leads.findById(tenantId, input.leadId);
    if (!lead) throw new NotFoundError(`Lead ${input.leadId} no encontrado`);
    const property = await this.properties.findById(tenantId, input.propertyId);
    if (!property) throw new NotFoundError(`Propiedad ${input.propertyId} no encontrada`);

    const visit = await this.visits.create(tenantId, input);

    // Mueve el lead a la etapa VISITA_AGENDADA del pipeline.
    try {
      await this.leads.updateStatus(tenantId, input.leadId, "VISITA_AGENDADA");
    } catch (err) {
      this.logger.warn(`No se pudo mover el lead ${input.leadId} a VISITA_AGENDADA: ${(err as Error).message}`);
    }

    await this.scheduleReminders(tenantId, visit);

    this.events.publish(new VisitScheduledEvent(tenantId, visit.id, input.leadId));
    this.logger.log(`Visita ${visit.id} agendada para ${input.scheduledAt.toISOString()}`);

    return visit;
  }

  /** Crea recordatorios (T-24h, T-2h) sólo para los offsets que aún caen en el futuro. */
  private async scheduleReminders(tenantId: string, visit: VisitView): Promise<void> {
    const now = Date.now();
    const sendAts = REMINDER_OFFSETS_HOURS.map(
      (h) => new Date(visit.scheduledAt.getTime() - h * 60 * 60 * 1000),
    ).filter((d) => d.getTime() > now);

    if (sendAts.length === 0) return;

    const reminders = await this.visits.createReminders(
      tenantId,
      sendAts.map((sendAt) => ({ visitId: visit.id, sendAt })),
    );

    for (const r of reminders) {
      const delay = Math.max(0, r.sendAt.getTime() - Date.now());
      await this.queue.add(
        VISIT_REMINDER_JOB,
        { tenantId, visitId: visit.id, reminderId: r.id },
        {
          jobId: r.id,
          delay,
          attempts: 3,
          backoff: { type: "exponential", delay: 60_000 },
          removeOnComplete: true,
          removeOnFail: false,
        },
      );
    }
  }
}
